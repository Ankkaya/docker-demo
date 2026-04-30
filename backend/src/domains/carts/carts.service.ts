import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
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

  private resolveMallSkuSalePrice(sku: { salePrice?: unknown, mallInfo?: { salePrice?: unknown } | null }) {
    return Number(sku.mallInfo?.salePrice ?? sku.salePrice ?? 0);
  }

  private normalizeSpecs(specs: unknown): Record<string, string> {
    if (Array.isArray(specs)) {
      return specs.reduce((result: Record<string, string>, item: any) => {
        if (item?.name && item?.value) {
          result[item.name] = item.value;
        }
        return result;
      }, {});
    }

    if (specs && typeof specs === 'object') {
      return Object.entries(specs as Record<string, unknown>).reduce((result: Record<string, string>, [key, value]) => {
        if (typeof value === 'string' || typeof value === 'number') {
          result[key] = String(value);
        }
        return result;
      }, {});
    }

    return {};
  }

  private async lockSkuInventory(tx: any, skuId: number, quantity: number): Promise<void> {
    if (quantity <= 0) {
      return;
    }

    // 多轮尝试以避免并发下的「读到的可用量已被他人扣减」假阴性失败
    let remaining = quantity;
    const maxAttempts = 5;
    for (let attempt = 0; attempt < maxAttempts && remaining > 0; attempt++) {
      const inventories = await tx.inventory.findMany({
        where: {
          skuId,
          available: { gt: 0 },
        },
        select: {
          id: true,
          available: true,
        },
        orderBy: [
          { available: 'desc' },
          { id: 'asc' },
        ],
      });

      const totalAvailable = inventories.reduce((sum: number, item: { available: number }) => sum + item.available, 0);
      if (totalAvailable < remaining) {
        throw new BadRequestException('商品库存不足');
      }

      for (const inventory of inventories) {
        if (remaining <= 0) {
          break;
        }
        const lockCount = Math.min(inventory.available, remaining);
        // 原子条件扣减：仅当当前 available >= lockCount 时才生效
        const result = await tx.inventory.updateMany({
          where: { id: inventory.id, available: { gte: lockCount } },
          data: {
            available: { decrement: lockCount },
            locked: { increment: lockCount },
          },
        });
        if (result.count === 1) {
          remaining -= lockCount;
        }
        // count===0 表示并发被抢占，本轮跳过该行，外层会重新读取 inventories
      }
    }

    if (remaining > 0) {
      throw new BadRequestException('商品库存竞争激烈，锁定失败，请重试');
    }
  }

  async lockSkuInventoryForOrder(tx: any, skuId: number, quantity: number): Promise<void> {
    await this.lockSkuInventory(tx, skuId, quantity);
  }

  async releaseSkuInventoryForOrder(tx: any, skuId: number, quantity: number): Promise<void> {
    await this.releaseSkuInventory(tx, skuId, quantity);
  }

  private async releaseSkuInventory(tx: any, skuId: number, quantity: number): Promise<void> {
    if (quantity <= 0) {
      return;
    }

    const inventories = await tx.inventory.findMany({
      where: {
        skuId,
        locked: { gt: 0 },
      },
      select: {
        id: true,
        locked: true,
      },
      orderBy: [
        { locked: 'desc' },
        { id: 'asc' },
      ],
    });

    let remaining = Math.min(
      quantity,
      inventories.reduce((sum: number, item: { locked: number }) => sum + item.locked, 0),
    );
    for (const inventory of inventories) {
      if (remaining <= 0) {
        break;
      }

      const releaseCount = Math.min(inventory.locked, remaining);
      await tx.inventory.update({
        where: { id: inventory.id },
        data: {
          available: { increment: releaseCount },
          locked: { decrement: releaseCount },
        },
      });
      remaining -= releaseCount;
    }
  }

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
              mallInfo: true,
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
      const salePrice = this.resolveMallSkuSalePrice(item.sku);
      return {
        id: item.id,
        userId: item.userId,
        username: item.user.username,
        skuId: item.skuId,
        skuCode: item.sku.skuCode,
        specs: this.normalizeSpecs(item.sku.specs),
        productId: item.sku.product.id,
        productName: item.sku.product.name,
        mainImage: await this.minioService.resolveStoredFileUrl(item.sku.product.mainImage),
        skuImage: await this.minioService.resolveStoredFileUrl(item.sku.image),
        salePrice,
        quantity: item.quantity,
        selected: item.selected,
        subtotal: salePrice * item.quantity,
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
            mallInfo: true,
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
    const salePrice = this.resolveMallSkuSalePrice(cart.sku);

    return {
      id: cart.id,
      userId: cart.userId,
      username: cart.user.username,
      skuId: cart.skuId,
      skuCode: cart.sku.skuCode,
      specs: this.normalizeSpecs(cart.sku.specs),
      productId: cart.sku.product.id,
      productName: cart.sku.product.name,
      mainImage: await this.minioService.resolveStoredFileUrl(cart.sku.product.mainImage),
      skuImage: await this.minioService.resolveStoredFileUrl(cart.sku.image),
      salePrice,
      quantity: cart.quantity,
      selected: cart.selected,
      subtotal: salePrice * cart.quantity,
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
            mallInfo: true,
            product: {
              select: { id: true, name: true, mainImage: true },
            },
            inventories: {
              select: { available: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    let selectedCount = 0;
    let selectedAmount = 0;

    const list: CartItemVo[] = await Promise.all(carts.map(async (item) => {
      const totalStock = item.sku.inventories.reduce((sum, inv) => sum + inv.available, 0);
      const salePrice = this.resolveMallSkuSalePrice(item.sku);
      const subtotal = salePrice * item.quantity;
      
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
        specs: this.normalizeSpecs(item.sku.specs),
        productId: item.sku.product.id,
        productName: item.sku.product.name,
        mainImage: await this.minioService.resolveStoredFileUrl(item.sku.product.mainImage),
        skuImage: await this.minioService.resolveStoredFileUrl(item.sku.image),
        salePrice,
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

    const cartId = await this.prisma.$transaction(async (tx) => {
      const sku = await tx.productSku.findFirst({
        where: {
          id: skuId,
          status: 'ACTIVE',
          deletedAt: null,
          product: {
            isEnabled: true,
            deletedAt: null,
          },
        },
        select: { id: true },
      });

      if (!sku) {
        throw new NotFoundException('商品不存在或已下架');
      }

      const existingCart = await tx.cart.findUnique({
        where: {
          userId_skuId: {
            userId,
            skuId,
          },
        },
      });

      await this.lockSkuInventory(tx, skuId, quantity);

      if (existingCart) {
        const updated = await tx.cart.update({
          where: { id: existingCart.id },
          data: { quantity: existingCart.quantity + quantity },
          select: { id: true },
        });
        return updated.id;
      }

      const cart = await tx.cart.create({
        data: {
          userId,
          skuId,
          quantity,
          selected: false,
        },
        select: { id: true },
      });

      return cart.id;
    });

    return this.findOne(cartId);
  }

  // 创建购物车项（管理后台用）
  async create(dto: CreateCartDto): Promise<CartItemVo> {
    const cartId = await this.prisma.$transaction(async (tx) => {
      const sku = await tx.productSku.findFirst({
        where: {
          id: dto.skuId,
          status: 'ACTIVE',
          deletedAt: null,
        },
        select: { id: true },
      });

      if (!sku) {
        throw new NotFoundException('SKU不存在');
      }

      await this.lockSkuInventory(tx, dto.skuId, dto.quantity);

      const cart = await tx.cart.create({
        data: {
          userId: dto.userId || 1,
          skuId: dto.skuId,
          quantity: dto.quantity,
          selected: dto.selected ?? false,
        },
        select: { id: true },
      });

      return cart.id;
    });

    return this.findOne(cartId);
  }

  // 更新购物车项
  async update(id: number, dto: UpdateCartDto): Promise<CartItemVo> {
    await this.prisma.$transaction(async (tx) => {
      const cart = await tx.cart.findUnique({
        where: { id },
        select: {
          id: true,
          skuId: true,
          quantity: true,
        },
      });

      if (!cart) {
        throw new NotFoundException('购物车项不存在');
      }

      if (dto.quantity !== undefined) {
        const diff = dto.quantity - cart.quantity;
        if (diff > 0) {
          await this.lockSkuInventory(tx, cart.skuId, diff);
        } else if (diff < 0) {
          await this.releaseSkuInventory(tx, cart.skuId, Math.abs(diff));
        }
      }

      await tx.cart.update({
        where: { id },
        data: {
          quantity: dto.quantity,
          selected: dto.selected,
        },
      });
    });

    return this.findOne(id);
  }

  async updateForUser(userId: number, id: number, dto: UpdateCartDto): Promise<CartItemVo> {
    const cart = await this.prisma.cart.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!cart) {
      throw new NotFoundException('购物车项不存在');
    }

    if (cart.userId !== userId) {
      throw new ForbiddenException('无权操作该购物车项');
    }

    return this.update(id, dto);
  }

  // 删除购物车项
  async remove(id: number): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const cart = await tx.cart.findUnique({
        where: { id },
        select: {
          id: true,
          skuId: true,
          quantity: true,
        },
      });

      if (!cart) {
        throw new NotFoundException('购物车项不存在');
      }

      await this.releaseSkuInventory(tx, cart.skuId, cart.quantity);
      await tx.cart.delete({
        where: { id },
      });
    });
  }

  async removeForUser(userId: number, id: number): Promise<void> {
    const cart = await this.prisma.cart.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!cart) {
      throw new NotFoundException('购物车项不存在');
    }

    if (cart.userId !== userId) {
      throw new ForbiddenException('无权操作该购物车项');
    }

    await this.remove(id);
  }

  // 清空用户购物车
  async clearByUserId(userId: number): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const carts = await tx.cart.findMany({
        where: { userId },
        select: {
          skuId: true,
          quantity: true,
        },
      });

      const quantityBySku = new Map<number, number>();
      for (const cart of carts) {
        quantityBySku.set(cart.skuId, (quantityBySku.get(cart.skuId) || 0) + cart.quantity);
      }

      for (const [skuId, quantity] of quantityBySku) {
        await this.releaseSkuInventory(tx, skuId, quantity);
      }

      await tx.cart.deleteMany({
        where: { userId },
      });
    });
  }

  async selectAllByUserId(userId: number, selected: boolean): Promise<CartListVo> {
    await this.prisma.cart.updateMany({
      where: { userId },
      data: { selected },
    });

    return this.findByUserId(userId);
  }

  // 批量删除购物车项
  async removeBatch(ids: number[]): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const carts = await tx.cart.findMany({
        where: {
          id: { in: ids },
        },
        select: {
          id: true,
          skuId: true,
          quantity: true,
        },
      });

      const quantityBySku = new Map<number, number>();
      for (const cart of carts) {
        quantityBySku.set(cart.skuId, (quantityBySku.get(cart.skuId) || 0) + cart.quantity);
      }

      for (const [skuId, quantity] of quantityBySku) {
        await this.releaseSkuInventory(tx, skuId, quantity);
      }

      await tx.cart.deleteMany({
        where: {
          id: { in: ids },
        },
      });
    });
  }

  // 辅助方法：转换为 CartItemVo
  private async toCartItemVo(cart: any): Promise<CartItemVo> {
    const totalStock = cart.sku.inventories.reduce((sum: number, inv: any) => sum + inv.available, 0);
    const salePrice = this.resolveMallSkuSalePrice(cart.sku);
    
    return {
      id: cart.id,
      userId: cart.userId,
      username: cart.user?.username || '',
      skuId: cart.skuId,
      skuCode: cart.sku.skuCode,
      specs: this.normalizeSpecs(cart.sku.specs),
      productId: cart.sku.product.id,
      productName: cart.sku.product.name,
      mainImage: await this.minioService.resolveStoredFileUrl(cart.sku.product.mainImage),
      skuImage: await this.minioService.resolveStoredFileUrl(cart.sku.image),
      salePrice,
      quantity: cart.quantity,
      selected: cart.selected,
      subtotal: salePrice * cart.quantity,
      stock: totalStock,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };
  }
}
