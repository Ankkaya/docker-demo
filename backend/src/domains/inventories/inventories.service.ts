import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { QueryInventoryDto, QueryInventoryWarningDto } from './dto/query-inventory.dto';
import { QueryInventoryLogDto } from './dto/query-inventory-log.dto';
import { Prisma } from '@prisma/client';
import { InventoryVo, InventoryFullVo, InventoryLogVo } from '@/inventories/vo';

@Injectable()
export class InventoriesService {
  constructor(private prisma: PrismaService) {}

  // 查询库存列表
  async findAll(query: QueryInventoryDto) {
    const {
      skuId,
      warehouseId,
      spuCode,
      skuCode,
      productName,
      page = 1,
      pageSize = 10,
    } = query;

    // 构建关联查询条件
    const skuWhere: Prisma.ProductSkuWhereInput = {
      deletedAt: null,
      product: { deletedAt: null },
    };
    if (skuCode) {
      skuWhere.skuCode = { contains: skuCode, mode: 'insensitive' };
    }

    const productWhere: Prisma.ProductWhereInput = {};
    if (spuCode) {
      productWhere.spuCode = { contains: spuCode, mode: 'insensitive' };
    }
    if (productName) {
      productWhere.name = { contains: productName, mode: 'insensitive' };
    }

    // 如有商品查询条件，合并到 skuWhere.product
    if (Object.keys(productWhere).length > 0) {
      skuWhere.product = { ...productWhere, deletedAt: null };
    }

    const where: Prisma.InventoryWhereInput = {
      // 过滤已删除的仓库和SKU
      warehouse: { deletedAt: null },
      sku: skuWhere,
    };

    if (skuId) {
      where.skuId = skuId;
    }

    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    const [data, total] = await Promise.all([
      this.prisma.inventory.findMany({
        where,
        include: {
          sku: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  spuCode: true,
                  mainImage: true,
                  unit: {
                    select: { id: true, name: true },
                  },
                },
              },
            },
          },
          warehouse: {
            select: { id: true, name: true, code: true },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.inventory.count({ where }),
    ]);

    return {
      data: InventoryFullVo.fromEntities(data),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  // 查询单个库存
  async findOne(id: number) {
    const inventory = await this.prisma.inventory.findFirst({
      where: { 
        id,
        warehouse: { deletedAt: null },
        sku: { 
          deletedAt: null,
          product: { deletedAt: null }
        },
      },
      include: {
        sku: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                spuCode: true,
                mainImage: true,
              },
            },
          },
        },
        warehouse: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    if (!inventory) {
      throw new NotFoundException('库存记录不存在');
    }

    return InventoryFullVo.fromEntity(inventory);
  }

  // 查询SKU的库存明细
  async findBySkuId(skuId: number) {
    const inventories = await this.prisma.inventory.findMany({
      where: { 
        skuId,
        warehouse: { deletedAt: null },
      },
      include: {
        warehouse: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    // 获取SKU信息（过滤已删除的）
    const sku = await this.prisma.productSku.findFirst({
      where: { 
        id: skuId,
        deletedAt: null,
        product: { deletedAt: null },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            spuCode: true,
            mainImage: true,
          },
        },
      },
    });

    if (!sku) {
      throw new NotFoundException('SKU不存在');
    }

    return {
      sku,
      inventories: InventoryVo.fromEntities(inventories),
    };
  }

  // 更新库存（修改安全库存等）
  async update(id: number, dto: UpdateInventoryDto) {
    const existing = await this.prisma.inventory.findFirst({
      where: { 
        id,
        warehouse: { deletedAt: null },
        sku: { 
          deletedAt: null,
          product: { deletedAt: null }
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('库存记录不存在');
    }

    const data: Prisma.InventoryUpdateInput = {};

    // 如果修改了库存数量
    if (dto.quantity !== undefined) {
      if (dto.quantity < 0) {
        throw new BadRequestException('库存数量不能为负数');
      }
      if (dto.quantity < existing.locked) {
        throw new BadRequestException('库存数量不能小于锁定数量');
      }
      data.quantity = dto.quantity;
      data.available = dto.quantity - existing.locked;
    }

    if (dto.minStock !== undefined) {
      data.minStock = dto.minStock;
    }

    if (dto.maxStock !== undefined) {
      data.maxStock = dto.maxStock;
    }

    if (dto.location !== undefined) {
      data.location = dto.location;
    }

    return this.prisma.inventory.update({
      where: { id },
      data,
      include: {
        sku: {
          select: {
            id: true,
            skuCode: true,
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        warehouse: {
          select: { id: true, name: true },
        },
      },
    });
  }

  // 初始化库存（用于新增SKU时创建库存记录）
  async initializeInventory(
    skuId: number,
    warehouseId: number,
    quantity: number,
    minStock?: number,
    maxStock?: number,
  ) {
    // 检查SKU是否存在（过滤已删除的）
    const sku = await this.prisma.productSku.findFirst({
      where: { 
        id: skuId,
        deletedAt: null,
        product: { deletedAt: null },
      },
    });
    if (!sku) {
      throw new NotFoundException('SKU不存在');
    }

    // 检查仓库是否存在（过滤已删除的）
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: warehouseId, deletedAt: null },
    });
    if (!warehouse) {
      throw new NotFoundException('仓库不存在');
    }

    // 检查是否已存在库存记录（过滤已删除的仓库/SKU）
    const existing = await this.prisma.inventory.findFirst({
      where: {
        skuId,
        warehouseId,
        warehouse: { deletedAt: null },
        sku: { deletedAt: null },
      },
    });

    if (existing) {
      // 更新现有库存
      const updated = await this.prisma.inventory.update({
        where: { id: existing.id },
        data: {
          quantity: { increment: quantity },
          available: { increment: quantity },
        },
      });
      return InventoryVo.fromEntity(updated);
    }

    // 创建新库存记录
    const created = await this.prisma.inventory.create({
      data: {
        skuId,
        warehouseId,
        quantity,
        available: quantity,
        locked: 0,
        minStock: minStock ?? 0,
        maxStock: maxStock ?? 999999,
      },
    });
    return InventoryVo.fromEntity(created);
  }

  // 库存预警查询
  async findWarnings(query: QueryInventoryWarningDto) {
    const { warehouseId, type, page = 1, pageSize = 10 } = query;

    const where: Prisma.InventoryWhereInput = {
      // 过滤已删除的仓库和SKU
      warehouse: { deletedAt: null },
      sku: { 
        deletedAt: null,
        product: { deletedAt: null }
      },
    };

    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    // 低库存或高库存筛选
    if (type === 'low') {
      where.OR = [
        { available: { lte: this.prisma.inventory.fields.minStock } },
      ];
    } else if (type === 'high') {
      where.OR = [
        { quantity: { gte: this.prisma.inventory.fields.maxStock } },
      ];
    } else {
      // 默认显示所有预警（低库存或高库存）
      where.OR = [
        { available: { lte: this.prisma.inventory.fields.minStock } },
        { quantity: { gte: this.prisma.inventory.fields.maxStock } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.inventory.findMany({
        where,
        include: {
          sku: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  spuCode: true,
                  mainImage: true,
                },
              },
            },
          },
          warehouse: {
            select: { id: true, name: true, code: true },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { available: 'asc' },
      }),
      this.prisma.inventory.count({ where }),
    ]);

    // 添加预警类型标记
    const dataWithWarningType = data.map((item) => ({
      ...item,
      warningType: item.available <= item.minStock ? 'low' : 'high',
    }));

    return {
      data: dataWithWarningType,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  // 获取库存汇总统计
  async getInventoryStats(warehouseId?: number) {
    const where: Prisma.InventoryWhereInput = {
      // 过滤已删除的仓库和SKU
      warehouse: { deletedAt: null },
      sku: { 
        deletedAt: null,
        product: { deletedAt: null }
      },
    };
    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    const [
      totalSkuCount,
      totalQuantity,
      totalAvailable,
      totalLocked,
      lowStockCount,
    ] = await Promise.all([
      // SKU种类数
      this.prisma.inventory.groupBy({
        by: ['skuId'],
        where,
        _count: { skuId: true },
      }).then((r) => r.length),

      // 总库存数量
      this.prisma.inventory.aggregate({
        where,
        _sum: { quantity: true },
      }).then((r) => r._sum.quantity || 0),

      // 总可用库存
      this.prisma.inventory.aggregate({
        where,
        _sum: { available: true },
      }).then((r) => r._sum.available || 0),

      // 总锁定库存
      this.prisma.inventory.aggregate({
        where,
        _sum: { locked: true },
      }).then((r) => r._sum.locked || 0),

      // 低库存数量
      this.prisma.inventory.count({
        where: {
          ...where,
          available: { lte: this.prisma.inventory.fields.minStock },
        },
      }),
    ]);

    return {
      totalSkuCount,
      totalQuantity,
      totalAvailable,
      totalLocked,
      lowStockCount,
    };
  }

  // 查询库存流水
  async findLogs(query: QueryInventoryLogDto) {
    const { skuId, warehouseId, type, bizNo, page = 1, pageSize = 10 } = query;

    const where: Prisma.InventoryLogWhereInput = {};

    if (skuId) {
      where.skuId = skuId;
    }

    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    if (type) {
      where.type = type;
    }

    if (bizNo) {
      where.bizNo = { contains: bizNo, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      this.prisma.inventoryLog.findMany({
        where,
        include: {
          sku: {
            select: {
              skuCode: true,
              product: { select: { name: true } },
              specs: true,
            },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.inventoryLog.count({ where }),
    ]);

    const warehouseIds = [...new Set(data.map((item) => item.warehouseId))];
    const warehouses = warehouseIds.length > 0
      ? await this.prisma.warehouse.findMany({
          where: {
            id: { in: warehouseIds },
            deletedAt: null,
          },
          select: {
            id: true,
            name: true,
          },
        })
      : [];
    const warehouseMap = new Map(warehouses.map((warehouse) => [warehouse.id, warehouse.name]));
    const dataWithWarehouse = data.map((item) => ({
      ...item,
      warehouse: {
        name: warehouseMap.get(item.warehouseId) || '',
      },
    }));

    return {
      data: InventoryLogVo.fromEntities(dataWithWarehouse),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }
}
