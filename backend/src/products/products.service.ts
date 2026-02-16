import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateSkuDto } from './dto/update-sku.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { SkuStatus, Prisma } from '@prisma/client';
import { ProductVo, ProductWithRelationsVo, ProductSkuVo, ProductSkuWithProductVo } from '@/products/vo';

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
  constructor(private prisma: PrismaService) {}

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
      const product = await tx.product.create({
        data: {
          ...productData,
          spuCode: spuCode || generateSpuCode(),
          specTemplate: productData.specTemplate as unknown as Prisma.InputJsonValue,
        },
      });

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
          image: skuData.image,
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

      return ProductWithRelationsVo.fromEntity({
        ...product,
        skus: createdSkus,
      });
    });
  }

  // 查询商品列表
  async findAll(query: QueryProductDto) {
    const { keyword, categoryId, brandId, isEnabled, page = 1, pageSize = 10 } = query;

    const where: Prisma.ProductWhereInput = {
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
            },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: ProductWithRelationsVo.fromEntities(data),
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
        skus: {
          where: { deletedAt: null },
          include: {
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

    return ProductWithRelationsVo.fromEntity(product);
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
          ...productData,
          specTemplate: productData.specTemplate as unknown as Prisma.InputJsonValue,
        },
        include: {
          category: { select: { id: true, name: true } },
          brand: { select: { id: true, name: true } },
          unit: { select: { id: true, name: true } },
        },
      });

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
                  image: skuData.image,
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
                  image: skuData.image,
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

      return ProductWithRelationsVo.fromEntity(updated);
    });
  }

  // 删除商品
  async remove(id: number) {
    const existing = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('商品不存在');
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

    return ProductSkuVo.fromEntities(skus);
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
        barcode: dto.barcode || (dto.barcode === '' ? null : undefined),
      },
    });

    return ProductSkuVo.fromEntity(updated);
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
    });

    return ProductSkuVo.fromEntity(updated);
  }
}
