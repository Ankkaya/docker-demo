import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateProductMallDto } from './dto/update-product-mall.dto';
import { UpdateSkuDto } from './dto/update-sku.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { SkuStatus, Prisma } from '@prisma/client';
import { ProductVo, ProductWithRelationsVo, ProductSkuVo, ProductSkuWithProductVo } from '@/products/vo';
import { MinioService } from '@/infrastructure/minio/minio.service';

// 生成SPU编码
function generateSpuCode(): string {
  const date = new Date();
  const prefix = 'SPU';
  const dateStr = date.getFullYear().toString().slice(2) +
    String(date.getMonth() + 1).padStart(2, '0') +
    String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}${dateStr}${random}`;
}

// 生成SKU编码
function generateSkuCode(): string {
  const date = new Date();
  const prefix = 'SKU';
  const dateStr = date.getFullYear().toString().slice(2) +
    String(date.getMonth() + 1).padStart(2, '0') +
    String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}${dateStr}${random}`;
}

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private minioService: MinioService,
  ) {}

  // 创建商品
  async create(createProductDto: CreateProductDto) {
    const {
      skus,
      initialInventories,
      spuCode,
      ...productData
    } = createProductDto;

    // 检查分类是否存在
    const category = await this.prisma.category.findUnique({
      where: { id: productData.categoryId },
    });
    if (!category) {
      throw new NotFoundException('分类不存在');
    }

    // 检查品牌是否存在（如果提供了品牌ID）
    if (productData.brandId) {
      const brand = await this.prisma.brand.findUnique({
        where: { id: productData.brandId },
      });
      if (!brand) {
        throw new NotFoundException('品牌不存在');
      }
    }

    // 检查单位是否存在
    const unit = await this.prisma.unit.findUnique({
      where: { id: productData.unitId },
    });
    if (!unit) {
      throw new NotFoundException('单位不存在');
    }

    // 检查SPU编码是否已存在（如果提供了）
    if (spuCode) {
      const existing = await this.prisma.product.findUnique({
        where: { spuCode },
      });
      if (existing) {
        throw new ConflictException('SPU编码已存在');
      }
    }

    // 验证SKU数据
    if (!skus || skus.length === 0) {
      throw new BadRequestException('至少需要创建一个SKU');
    }

    // 检查SKU编码是否重复
    const skuCodes = skus.map(s => s.skuCode).filter(Boolean);
    if (skuCodes.length !== new Set(skuCodes).size) {
      throw new BadRequestException('SKU编码不能重复');
    }

    // 检查SKU编码是否已存在
    for (const code of skuCodes) {
      const existing = await this.prisma.productSku.findUnique({
        where: { skuCode: code },
      });
      if (existing) {
        throw new ConflictException(`SKU编码 ${code} 已存在`);
      }
    }

    // 检查条码是否重复
    const barcodes = skus.map(s => s.barcode).filter(Boolean);
    if (barcodes.length !== new Set(barcodes).size) {
      throw new BadRequestException('条码不能重复');
    }

    // 检查条码是否已存在
    for (const barcode of barcodes) {
      const existing = await this.prisma.productSku.findUnique({
        where: { barcode: barcode as string },
      });
      if (existing) {
        throw new ConflictException(`条码 ${barcode} 已存在`);
      }
    }

    // 验证初始库存（如果提供了）
    if (initialInventories && initialInventories.length > 0) {
      if (skus.length > 1) {
        throw new BadRequestException('多SKU商品不能直接在创建时设置库存，请在SKU创建后单独设置');
      }
      for (const inv of initialInventories) {
        const warehouse = await this.prisma.warehouse.findUnique({
          where: { id: inv.warehouseId },
        });
        if (!warehouse) {
          throw new NotFoundException(`仓库ID ${inv.warehouseId} 不存在`);
        }
      }
    }

    // 使用事务创建商品
    return this.prisma.$transaction(async (tx) => {
      // 1. 创建商品SPU
      const product: any = await tx.product.create({
        data: {
          ...this.normalizeProductData(productData),
          spuCode: spuCode || generateSpuCode(),
          specTemplate: productData.specTemplate as unknown as Prisma.InputJsonValue,
        },
      } as any);

      // 2. 创建SKU
      const createdSkus: any[] = [];
      for (const skuData of skus) {
        const sku = await tx.productSku.create({
        data: {
          skuCode: skuData.skuCode || generateSkuCode(),
          productId: product.id,
          specs: skuData.specs as unknown as Prisma.InputJsonValue,
          costPrice: skuData.costPrice,
          salePrice: skuData.salePrice,
          marketPrice: skuData.marketPrice,
          image: this.minioService.normalizeStoredFileReference(skuData.image),
          barcode: skuData.barcode || null,
          weight: skuData.weight,
          volume: skuData.volume,
          isDefault: skuData.isDefault ?? false,
          sort: skuData.sort ?? 0,
          status: SkuStatus.ACTIVE,
        },
      });
        createdSkus.push(sku);

        // 3. 创建初始库存（仅对单SKU商品）
        if (initialInventories && initialInventories.length > 0 && skus.length === 1) {
          for (const inv of initialInventories) {
            await tx.inventory.create({
              data: {
                skuId: sku.id,
                warehouseId: inv.warehouseId,
                quantity: inv.quantity,
                available: inv.quantity,
                locked: 0,
                minStock: inv.minStock ?? 0,
                maxStock: inv.maxStock ?? 999999,
              },
            });
          }
        }
      }

      if (product.mallEnabled) {
        await this.seedMallSnapshot(tx, product.id);
      }

      return this.toProductWithRelationsVo({
        ...product,
        skus: createdSkus,
      });
    });
  }

  // 查询商品列表
  async findAll(query: QueryProductDto) {
    const { keyword, categoryId, brandId, isEnabled, mallEnabled, hasStock, page = 1, pageSize = 10 } = query;

    const where: any = {
      // 默认过滤已删除的商品
      deletedAt: null,
    };

    if (keyword) {
      where.name = { contains: keyword, mode: 'insensitive' };
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (brandId) {
      where.brandId = brandId;
    }

    if (isEnabled !== undefined) {
      where.isEnabled = isEnabled;
    }

    if (mallEnabled !== undefined) {
      where.mallEnabled = mallEnabled;
    }

    if (hasStock) {
      where.skus = {
        some: {
          deletedAt: null,
          inventories: {
            some: {
              available: { gt: 0 },
            },
          },
        },
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          category: {
            select: { id: true, name: true },
          },
          brand: {
            select: { id: true, name: true },
          },
          unit: {
            select: { id: true, name: true },
          },
          mallInfo: true,
          skus: {
            where: { deletedAt: null },
            select: {
              id: true,
              skuCode: true,
              salePrice: true,
              costPrice: true,
              status: true,
              isDefault: true,
              image: true,
              mallInfo: true,
              inventories: {
                select: {
                  available: true,
                },
              },
            },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      } as any),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: await Promise.all((data as any[]).map(async (item: any) => {
        const totalAvailable = (item.skus ?? []).reduce(
          (sum: number, sku: any) => sum + (sku.inventories ?? []).reduce((skuSum: number, inv: any) => skuSum + inv.available, 0),
          0,
        );

        return this.toProductWithRelationsVo({
          ...item,
          totalAvailable,
          hasStock: totalAvailable > 0,
        });
      })),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  // 查询单个商品详情
  async findOne(id: number) {
    const product = await this.prisma.product.findFirst({
      where: { 
        id,
        deletedAt: null, // 过滤已删除的商品
      },
      include: {
        category: {
          select: { id: true, name: true, code: true },
        },
        brand: {
          select: { id: true, name: true },
        },
        unit: {
          select: { id: true, name: true, code: true },
        },
        mallInfo: true,
        skus: {
          where: { deletedAt: null },
          include: {
            mallInfo: true,
            inventories: {
              include: {
                warehouse: {
                  select: { id: true, name: true, code: true },
                },
              },
            },
          },
          orderBy: { sort: 'asc' },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('商品不存在');
    }

    return this.toProductWithRelationsVo(product);
  }

  // 更新商品
  async update(id: number, updateProductDto: UpdateProductDto) {
    const existing = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('商品不存在');
    }

    const { skus, initialInventories, ...productData } = updateProductDto;

    // 验证条码唯一性
    if (skus && skus.length > 0) {
      const barcodes = skus.map(s => s.barcode).filter(Boolean);
      if (barcodes.length !== new Set(barcodes).size) {
        throw new BadRequestException('条码不能重复');
      }

      for (const skuData of skus) {
        if (skuData.barcode) {
          const existingBarcode = await this.prisma.productSku.findFirst({
            where: {
              barcode: skuData.barcode,
              NOT: skuData.skuCode ? { skuCode: skuData.skuCode } : undefined,
            },
          });
          if (existingBarcode) {
            throw new ConflictException(`条码 ${skuData.barcode} 已存在`);
          }
        }
      }
    }

    // 使用事务更新
    return this.prisma.$transaction(async (tx) => {
      // 更新商品基础信息
      const updated = await tx.product.update({
        where: { id },
        data: {
          ...this.normalizeProductData(productData),
          specTemplate: productData.specTemplate as unknown as Prisma.InputJsonValue,
        },
        include: {
          category: { select: { id: true, name: true } },
          brand: { select: { id: true, name: true } },
          unit: { select: { id: true, name: true } },
          mallInfo: true,
        },
      } as any);

      // 如果提供了新的SKU列表，则更新SKU
      if (skus && skus.length > 0) {
        // 这里简化处理，实际业务可能需要更复杂的SKU更新逻辑
        // 目前只更新现有SKU或添加新SKU
        for (const skuData of skus) {
          if (skuData.skuCode) {
            // 尝试更新现有SKU
            const existingSku = await tx.productSku.findUnique({
              where: { skuCode: skuData.skuCode },
            });

            if (existingSku && existingSku.productId === id) {
              await tx.productSku.update({
                where: { id: existingSku.id },
                data: {
                  specs: skuData.specs as unknown as Prisma.InputJsonValue,
                  costPrice: skuData.costPrice,
                  salePrice: skuData.salePrice,
                  marketPrice: skuData.marketPrice,
                  image: this.minioService.normalizeStoredFileReference(skuData.image),
                  barcode: skuData.barcode || null,
                  weight: skuData.weight,
                  volume: skuData.volume,
                  isDefault: skuData.isDefault,
                  sort: skuData.sort,
                },
              });
            } else if (!existingSku) {
              // 创建新SKU
              await tx.productSku.create({
                data: {
                  skuCode: skuData.skuCode || generateSkuCode(),
                  productId: id,
                  specs: skuData.specs as unknown as Prisma.InputJsonValue,
                  costPrice: skuData.costPrice,
                  salePrice: skuData.salePrice,
                  marketPrice: skuData.marketPrice,
                  image: this.minioService.normalizeStoredFileReference(skuData.image),
                  barcode: skuData.barcode || null,
                  weight: skuData.weight,
                  volume: skuData.volume,
                  isDefault: skuData.isDefault ?? false,
                  sort: skuData.sort ?? 0,
                  status: SkuStatus.ACTIVE,
                },
              });
            }
          }
        }
      }

      if (productData.mallEnabled === true && !existing.mallEnabled) {
        await this.seedMallSnapshot(tx, id);
      }

      return this.toProductWithRelationsVo(updated);
    });
  }

  // 删除商品
  async remove(id: number) {
    const existing = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: {
        skus: {
          where: { deletedAt: null },
          select: { id: true },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('商品不存在');
    }

    const skuIds = existing.skus.map((sku) => sku.id);
    if (skuIds.length > 0) {
      const [
        purchaseItemCount,
        receiptItemCount,
        purchaseReturnItemCount,
        orderItemCount,
        shipmentItemCount,
        saleReturnItemCount,
        inventoryCount,
        inventoryLogCount,
        transferItemCount,
        adjustmentItemCount,
      ] = await Promise.all([
        this.prisma.purchaseItem.count({ where: { skuId: { in: skuIds } } }),
        this.prisma.purchaseReceiptItem.count({ where: { skuId: { in: skuIds } } }),
        this.prisma.purchaseReturnItem.count({ where: { skuId: { in: skuIds } } }),
        this.prisma.orderItem.count({ where: { skuId: { in: skuIds } } }),
        this.prisma.shipmentItem.count({ where: { skuId: { in: skuIds } } }),
        this.prisma.saleReturnItem.count({ where: { skuId: { in: skuIds } } }),
        this.prisma.inventory.count({ where: { skuId: { in: skuIds } } }),
        this.prisma.inventoryLog.count({ where: { skuId: { in: skuIds } } }),
        this.prisma.transferItem.count({ where: { skuId: { in: skuIds } } }),
        this.prisma.adjustmentItem.count({ where: { skuId: { in: skuIds } } }),
      ]);

      const relatedCount = [
        purchaseItemCount,
        receiptItemCount,
        purchaseReturnItemCount,
        orderItemCount,
        shipmentItemCount,
        saleReturnItemCount,
        inventoryCount,
        inventoryLogCount,
        transferItemCount,
        adjustmentItemCount,
      ].reduce((sum, count) => sum + count, 0);

      if (relatedCount > 0) {
        throw new BadRequestException('商品已关联业务单据或库存记录，不允许删除，请改为停用');
      }
    }

    // 软删除：将所有SKU标记为已删除
    await this.prisma.$transaction([
      this.prisma.productSku.updateMany({
        where: { productId: id, deletedAt: null },
        data: { deletedAt: new Date() },
      }),
      this.prisma.product.update({
        where: { id },
        data: { isEnabled: false, deletedAt: new Date() },
      }),
    ]);

    return { success: true };
  }

  // 获取商品的SKU列表
  async findSkus(productId: number) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, deletedAt: null },
    });

    if (!product) {
      throw new NotFoundException('商品不存在');
    }

    const skus = await this.prisma.productSku.findMany({
      where: {
        productId,
        deletedAt: null,
      },
      include: {
        mallInfo: true,
        inventories: {
          include: {
            warehouse: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { sort: 'asc' },
    });

    return Promise.all(skus.map(sku => this.toProductSkuVo(sku)));
  }

  // 更新SKU
  async updateSku(skuId: number, dto: UpdateSkuDto) {
    const existing = await this.prisma.productSku.findFirst({
      where: { id: skuId, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('SKU不存在');
    }

    // 验证条码唯一性
    if (dto.barcode) {
      const existingBarcode = await this.prisma.productSku.findFirst({
        where: {
          barcode: dto.barcode,
          NOT: { id: skuId },
        },
      });
      if (existingBarcode) {
        throw new ConflictException(`条码 ${dto.barcode} 已存在`);
      }
    }

    const updated = await this.prisma.productSku.update({
      where: { id: skuId },
      data: {
        ...dto,
        image: dto.image === undefined
          ? undefined
          : this.minioService.normalizeStoredFileReference(dto.image),
        barcode: dto.barcode || (dto.barcode === '' ? null : undefined),
      },
      include: {
        mallInfo: true,
      },
    } as any);

    return this.toProductSkuVo(updated);
  }

  // 更新SKU价格
  async updateSkuPrice(skuId: number, costPrice?: number, salePrice?: number, marketPrice?: number) {
    const existing = await this.prisma.productSku.findFirst({
      where: { id: skuId, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('SKU不存在');
    }

    const updated = await this.prisma.productSku.update({
      where: { id: skuId },
      data: {
        costPrice,
        salePrice,
        marketPrice,
      },
      include: {
        mallInfo: true,
      },
    } as any);

    return this.toProductSkuVo(updated);
  }

  async getMallInfo(productId: number) {
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        deletedAt: null,
      },
      include: {
        mallInfo: true,
        skus: {
          where: { deletedAt: null },
          include: {
            mallInfo: true,
          },
          orderBy: { sort: 'asc' },
        },
      },
    } as any);

    if (!product) {
      throw new NotFoundException('商品不存在');
    }

    return this.toProductWithRelationsVo(product);
  }

  async updateMallInfo(productId: number, dto: UpdateProductMallDto) {
    const existing: any = await this.prisma.product.findFirst({
      where: { id: productId, deletedAt: null },
      include: {
        skus: {
          where: { deletedAt: null },
          select: { id: true },
        },
      },
    } as any);

    if (!existing) {
      throw new NotFoundException('商品不存在');
    }

    const validSkuIds = new Set(existing.skus.map((sku) => sku.id));
    if (dto.skuMallInfos?.some((item) => !validSkuIds.has(item.skuId))) {
      throw new BadRequestException('存在不属于当前商品的SKU');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: productId },
        data: {
          mallEnabled: dto.mallEnabled,
        },
      } as any);

      const mallInfoData = this.normalizeMallInfoData(dto);
      await (tx as any).productMallInfo.upsert({
        where: { productId },
        create: {
          productId,
          ...mallInfoData,
        },
        update: mallInfoData,
      } as any);

      for (const skuInfo of dto.skuMallInfos ?? []) {
        await (tx as any).productSkuMallInfo.upsert({
          where: { skuId: skuInfo.skuId },
          create: {
            skuId: skuInfo.skuId,
            salePrice: skuInfo.salePrice,
            marketPrice: skuInfo.marketPrice,
            image: this.minioService.normalizeStoredFileReference(skuInfo.image),
          },
          update: {
            salePrice: skuInfo.salePrice,
            marketPrice: skuInfo.marketPrice,
            image: skuInfo.image === undefined
              ? undefined
              : this.minioService.normalizeStoredFileReference(skuInfo.image),
          },
        } as any);
      }

      const updated = await tx.product.findFirst({
        where: { id: productId },
        include: {
          category: {
            select: { id: true, name: true, code: true },
          },
          brand: {
            select: { id: true, name: true, logo: true },
          },
          unit: {
            select: { id: true, name: true, code: true },
          },
          mallInfo: true,
          skus: {
            where: { deletedAt: null },
            include: {
              mallInfo: true,
            },
            orderBy: { sort: 'asc' },
          },
        },
      } as any);

      return this.toProductWithRelationsVo(updated);
    });
  }

  private normalizeProductData<T extends { mainImage?: string | null; images?: string[] | null }>(productData: T): T {
    return {
      ...productData,
      mainImage: productData.mainImage === undefined
        ? undefined
        : this.minioService.normalizeStoredFileReference(productData.mainImage),
      images: productData.images === undefined
        ? undefined
        : (productData.images ?? [])
            .map(image => this.minioService.normalizeStoredFileReference(image))
            .filter((image): image is string => Boolean(image)),
    };
  }

  private normalizeMallInfoData(dto: UpdateProductMallDto) {
    return {
      name: dto.name,
      description: dto.description,
      detail: dto.detail,
      isHot: dto.isHot,
      hotSort: dto.hotSort,
      hotLabel: dto.hotLabel === undefined ? undefined : (dto.hotLabel || null),
      mainImage: dto.mainImage === undefined
        ? undefined
        : this.minioService.normalizeStoredFileReference(dto.mainImage),
      images: dto.images === undefined
        ? undefined
        : dto.images
            .map(image => this.minioService.normalizeStoredFileReference(image))
            .filter((image): image is string => Boolean(image)) as unknown as Prisma.InputJsonValue,
    };
  }

  private async seedMallSnapshot(tx: Prisma.TransactionClient, productId: number) {
    const product: any = await tx.product.findUnique({
      where: { id: productId },
      include: {
        skus: {
          where: { deletedAt: null },
        },
      },
    } as any);

    if (!product) {
      return;
    }

    await (tx as any).productMallInfo.upsert({
      where: { productId },
      create: {
        productId,
        name: product.name,
        description: product.description,
        detail: product.detail,
        mainImage: product.mainImage,
        images: product.images as unknown as Prisma.InputJsonValue,
      },
      update: {},
    } as any);

    for (const sku of product.skus) {
      await (tx as any).productSkuMallInfo.upsert({
        where: { skuId: sku.id },
        create: {
          skuId: sku.id,
          salePrice: sku.salePrice,
          marketPrice: sku.marketPrice,
          image: sku.image,
        },
        update: {},
      } as any);
    }
  }

  private async toProductVo(entity: any) {
    const mallInfo = entity.mallInfo
      ? {
          ...entity.mallInfo,
          mainImage: await this.minioService.resolveStoredFileUrl(entity.mallInfo.mainImage),
          images: await this.minioService.resolveStoredFileUrls(
            Array.isArray(entity.mallInfo.images) ? entity.mallInfo.images : [],
          ),
        }
      : null;

    return ProductVo.fromEntity({
      ...entity,
      mainImage: await this.minioService.resolveStoredFileUrl(entity.mainImage),
      images: await this.minioService.resolveStoredFileUrls(entity.images),
      mallInfo,
    });
  }

  private async toProductWithRelationsVo(entity: any) {
    const product = await this.toProductVo(entity);
    const skus = entity.skus
      ? await Promise.all(entity.skus.map((sku: any) => this.toProductSkuVo(sku)))
      : undefined;

    return ProductWithRelationsVo.fromEntity({
      ...product,
      category: entity.category,
      brand: entity.brand
        ? {
            ...entity.brand,
            logo: await this.minioService.resolveStoredFileUrl(entity.brand.logo),
          }
        : null,
      unit: entity.unit,
      skus,
    });
  }

  private async toProductSkuVo(entity: any) {
    const product = entity.product
      ? await this.toProductVo(entity.product)
      : null;

    return ProductSkuWithProductVo.fromEntity({
      ...entity,
      image: await this.minioService.resolveStoredFileUrl(entity.image),
      mallInfo: entity.mallInfo
        ? {
            ...entity.mallInfo,
            image: await this.minioService.resolveStoredFileUrl(entity.mallInfo.image),
          }
        : null,
      product,
    });
  }
}
