import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { CreateCartDto, UpdateCartDto, QueryCartDto, AddToCartDto } from './dto';
import { CartItemVo, CartStatsVo, CartListVo } from './vo';
import { MinioService } from '@/infrastructure/minio/minio.service';

@Injectable()
export class CartsService {
  constructor(
    private prisma: PrismaService,
    private minioService: MinioService,
  ) {}

  // 获取购物车列表（管理后台用）
  async findAll(query: QueryCartDto): Promise<{ data: CartItemVo[]; meta: any }> {
    const { userId, keyword, page = 1, pageSize = 10 } = query;

    const where: any = {};
    
    if (userId) {
      where.userId = userId;
    }

    if (keyword) {
      where.OR = [
        {
          sku: {
            skuCode: { contains: keyword, mode: 'insensitive' },
          },
        },
        {
          sku: {
            product: {
              name: { contains: keyword, mode: 'insensitive' },
            },
          },
        },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.cart.findMany({
        where,
        include: {
          user: {
            select: { id: true, username: true, name: true },
          },
          sku: {
            include: {
              product: {
                select: { id: true, name: true, mainImage: true },
              },
              inventories: {
                select: { available: true },
              },
            },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.cart.count({ where }),
    ]);

    const list: CartItemVo[] = await Promise.all(data.map(async (item) => {
      const totalStock = item.sku.inventories.reduce((sum, inv) => sum + inv.available, 0);
      return {
        id: item.id,
        userId: item.userId,
        username: item.user.username,
        skuId: item.skuId,
        skuCode: item.sku.skuCode,
        specs: item.sku.specs as Record<string, string>,
        productId: item.sku.product.id,
        productName: item.sku.product.name,
        mainImage: await this.minioService.resolveStoredFileUrl(item.sku.product.mainImage),
        skuImage: await this.minioService.resolveStoredFileUrl(item.sku.image),
        salePrice: Number(item.sku.salePrice),
        quantity: item.quantity,
        selected: item.selected,
        subtotal: Number(item.sku.salePrice) * item.quantity,
        stock: totalStock,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      };
    }));

    return {
      data: list,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  // 获取单个购物车项详情
  async findOne(id: number): Promise<CartItemVo> {
    const cart = await this.prisma.cart.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, username: true, name: true },
        },
        sku: {
          include: {
            product: {
              select: { id: true, name: true, mainImage: true },
            },
            inventories: {
              select: { available: true },
            },
          },
        },
      },
    });

    if (!cart) {
      throw new NotFoundException('购物车项不存在');
    }

    const totalStock = cart.sku.inventories.reduce((sum, inv) => sum + inv.available, 0);

    return {
      id: cart.id,
      userId: cart.userId,
      username: cart.user.username,
      skuId: cart.skuId,
      skuCode: cart.sku.skuCode,
      specs: cart.sku.specs as Record<string, string>,
      productId: cart.sku.product.id,
      productName: cart.sku.product.name,
      mainImage: await this.minioService.resolveStoredFileUrl(cart.sku.product.mainImage),
      skuImage: await this.minioService.resolveStoredFileUrl(cart.sku.image),
      salePrice: Number(cart.sku.salePrice),
      quantity: cart.quantity,
      selected: cart.selected,
      subtotal: Number(cart.sku.salePrice) * cart.quantity,
      stock: totalStock,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };
  }

  // 获取用户的购物车列表（商城前台用）
  async findByUserId(userId: number): Promise<CartListVo> {
    const carts = await this.prisma.cart.findMany({
      where: { userId },
      include: {
        sku: {
          include: {
            product: {
              select: { id: true, name: true, mainImage: true },
            },
            inventories: {
              select: { available: true },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    let selectedCount = 0;
    let selectedAmount = 0;

    const list: CartItemVo[] = await Promise.all(carts.map(async (item) => {
      const totalStock = item.sku.inventories.reduce((sum, inv) => sum + inv.available, 0);
      const subtotal = Number(item.sku.salePrice) * item.quantity;
      
      if (item.selected) {
        selectedCount += item.quantity;
        selectedAmount += subtotal;
      }

      return {
        id: item.id,
        userId: item.userId,
        username: '',
        skuId: item.skuId,
        skuCode: item.sku.skuCode,
        specs: item.sku.specs as Record<string, string>,
        productId: item.sku.product.id,
        productName: item.sku.product.name,
        mainImage: await this.minioService.resolveStoredFileUrl(item.sku.product.mainImage),
        skuImage: await this.minioService.resolveStoredFileUrl(item.sku.image),
        salePrice: Number(item.sku.salePrice),
        quantity: item.quantity,
        selected: item.selected,
        subtotal,
        stock: totalStock,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      };
    }));

    const stats: CartStatsVo = {
      totalCount: carts.reduce((sum, item) => sum + item.quantity, 0),
      selectedCount,
      selectedAmount,
    };

    return { list, stats };
  }

  // 添加商品到购物车（商城前台用）
  async addToCart(userId: number, dto: AddToCartDto): Promise<CartItemVo> {
    const { skuId, quantity = 1 } = dto;

    // 检查SKU是否存在且有效
    const sku = await this.prisma.productSku.findFirst({
      where: {
        id: skuId,
        status: 'ACTIVE',
        deletedAt: null,
        product: {
          isEnabled: true,
          deletedAt: null,
        },
      },
      include: {
        product: {
          select: { id: true, name: true, mainImage: true },
        },
        inventories: {
          select: { available: true },
        },
      },
    });

    if (!sku) {
      throw new NotFoundException('商品不存在或已下架');
    }

    // 检查库存
    const totalStock = sku.inventories.reduce((sum, inv) => sum + inv.available, 0);
    if (totalStock < quantity) {
      throw new BadRequestException('商品库存不足');
    }

    // 检查购物车是否已有该商品
    const existingCart = await this.prisma.cart.findUnique({
      where: {
        userId_skuId: {
          userId,
          skuId,
        },
      },
    });

    if (existingCart) {
      // 更新数量
      const newQuantity = existingCart.quantity + quantity;
      if (totalStock < newQuantity) {
        throw new BadRequestException('商品库存不足');
      }

      const updated = await this.prisma.cart.update({
        where: { id: existingCart.id },
        data: { quantity: newQuantity },
        include: {
          user: {
            select: { id: true, username: true, name: true },
          },
          sku: {
            include: {
              product: {
                select: { id: true, name: true, mainImage: true },
              },
              inventories: {
                select: { available: true },
              },
            },
          },
        },
      });

      return this.toCartItemVo(updated);
    }

    // 创建新的购物车项
    const cart = await this.prisma.cart.create({
      data: {
        userId,
        skuId,
        quantity,
        selected: true,
      },
      include: {
        user: {
          select: { id: true, username: true, name: true },
        },
        sku: {
          include: {
            product: {
              select: { id: true, name: true, mainImage: true },
            },
            inventories: {
              select: { available: true },
            },
          },
        },
      },
    });

    return this.toCartItemVo(cart);
  }

  // 创建购物车项（管理后台用）
  async create(dto: CreateCartDto): Promise<CartItemVo> {
    // 检查SKU是否存在
    const sku = await this.prisma.productSku.findFirst({
      where: {
        id: dto.skuId,
        status: 'ACTIVE',
        deletedAt: null,
      },
      include: {
        product: {
          select: { id: true, name: true, mainImage: true },
        },
        inventories: {
          select: { available: true },
        },
      },
    });

    if (!sku) {
      throw new NotFoundException('SKU不存在');
    }

    // 检查库存
    const totalStock = sku.inventories.reduce((sum, inv) => sum + inv.available, 0);
    if (totalStock < dto.quantity) {
      throw new BadRequestException('商品库存不足');
    }

    const cart = await this.prisma.cart.create({
      data: {
        userId: dto.userId || 1, // 默认用户ID，实际应该传入
        skuId: dto.skuId,
        quantity: dto.quantity,
        selected: dto.selected ?? true,
      },
      include: {
        user: {
          select: { id: true, username: true, name: true },
        },
        sku: {
          include: {
            product: {
              select: { id: true, name: true, mainImage: true },
            },
            inventories: {
              select: { available: true },
            },
          },
        },
      },
    });

    return this.toCartItemVo(cart);
  }

  // 更新购物车项
  async update(id: number, dto: UpdateCartDto): Promise<CartItemVo> {
    const cart = await this.prisma.cart.findUnique({
      where: { id },
      include: {
        sku: {
          include: {
            inventories: {
              select: { available: true },
            },
          },
        },
      },
    });

    if (!cart) {
      throw new NotFoundException('购物车项不存在');
    }

    // 如果更新数量，检查库存
    if (dto.quantity !== undefined) {
      const totalStock = cart.sku.inventories.reduce((sum, inv) => sum + inv.available, 0);
      if (totalStock < dto.quantity) {
        throw new BadRequestException('商品库存不足');
      }
    }

    const updated = await this.prisma.cart.update({
      where: { id },
      data: {
        quantity: dto.quantity,
        selected: dto.selected,
      },
      include: {
        user: {
          select: { id: true, username: true, name: true },
        },
        sku: {
          include: {
            product: {
              select: { id: true, name: true, mainImage: true },
            },
            inventories: {
              select: { available: true },
            },
          },
        },
      },
    });

    return this.toCartItemVo(updated);
  }

  // 删除购物车项
  async remove(id: number): Promise<void> {
    const cart = await this.prisma.cart.findUnique({
      where: { id },
    });

    if (!cart) {
      throw new NotFoundException('购物车项不存在');
    }

    await this.prisma.cart.delete({
      where: { id },
    });
  }

  // 清空用户购物车
  async clearByUserId(userId: number): Promise<void> {
    await this.prisma.cart.deleteMany({
      where: { userId },
    });
  }

  // 批量删除购物车项
  async removeBatch(ids: number[]): Promise<void> {
    await this.prisma.cart.deleteMany({
      where: {
        id: { in: ids },
      },
    });
  }

  // 辅助方法：转换为 CartItemVo
  private async toCartItemVo(cart: any): Promise<CartItemVo> {
    const totalStock = cart.sku.inventories.reduce((sum: number, inv: any) => sum + inv.available, 0);
    
    return {
      id: cart.id,
      userId: cart.userId,
      username: cart.user?.username || '',
      skuId: cart.skuId,
      skuCode: cart.sku.skuCode,
      specs: cart.sku.specs as Record<string, string>,
      productId: cart.sku.product.id,
      productName: cart.sku.product.name,
      mainImage: await this.minioService.resolveStoredFileUrl(cart.sku.product.mainImage),
      skuImage: await this.minioService.resolveStoredFileUrl(cart.sku.image),
      salePrice: Number(cart.sku.salePrice),
      quantity: cart.quantity,
      selected: cart.selected,
      subtotal: Number(cart.sku.salePrice) * cart.quantity,
      stock: totalStock,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };
  }
}
