import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { CreateAdjustmentDto, QueryAdjustmentDto } from './dto';
import { AdjustmentVo } from './vo';
import { AdjustmentStatus, Prisma, InventoryType } from '@prisma/client';

@Injectable()
export class AdjustmentsService {
  constructor(private prisma: PrismaService) {}

  // 生成调整单号
  private generateAdjustNo(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 9000) + 1000;
    return `TZ${dateStr}${random}`;
  }

  // 查询调整单列表
  async findAll(query: QueryAdjustmentDto) {
    const { adjustNo, warehouseId, status, page = 1, pageSize = 10 } = query;

    const where: Prisma.AdjustmentWhereInput = {
      deletedAt: null,
    };

    if (adjustNo) {
      where.adjustNo = { contains: adjustNo, mode: 'insensitive' };
    }

    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    if (status) {
      where.status = status;
    }

    const [data, total] = await Promise.all([
      this.prisma.adjustment.findMany({
        where,
        include: {
          warehouse: { select: { id: true, name: true } },
          items: {
            include: {
              sku: {
                select: {
                  skuCode: true,
                  product: { select: { name: true } },
                  specs: true,
                },
              },
            },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.adjustment.count({ where }),
    ]);

    return {
      data: AdjustmentVo.fromEntities(data),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  // 查询单个调整单
  async findOne(id: number) {
    const adjustment = await this.prisma.adjustment.findFirst({
      where: { id, deletedAt: null },
      include: {
        warehouse: { select: { id: true, name: true } },
        items: {
          include: {
            sku: {
              select: {
                skuCode: true,
                product: { select: { name: true } },
                specs: true,
              },
            },
          },
        },
      },
    });

    if (!adjustment) {
      throw new NotFoundException('调整单不存在');
    }

    return AdjustmentVo.fromEntity(adjustment);
  }

  // 创建调整单
  async create(dto: CreateAdjustmentDto, userId: number) {
    const { warehouseId, remark, items } = dto;

    // 检查仓库
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: warehouseId, deletedAt: null },
    });
    if (!warehouse) {
      throw new NotFoundException('仓库不存在');
    }

    // 检查SKU并获取账面库存
    const adjustmentItems: { skuId: number; bookQty: number; actualQty: number; diffQty: number }[] = [];
    for (const item of items) {
      const sku = await this.prisma.productSku.findFirst({
        where: { 
          id: item.skuId,
          deletedAt: null,
          product: { deletedAt: null },
        },
      });
      if (!sku) {
        throw new NotFoundException(`SKU ID ${item.skuId} 不存在`);
      }

      // 获取账面库存
      const inventory = await this.prisma.inventory.findUnique({
        where: {
          skuId_warehouseId: {
            skuId: item.skuId,
            warehouseId: warehouseId,
          },
        },
      });

      const bookQty = inventory?.quantity || 0;
      const diffQty = item.actualQty - bookQty;

      adjustmentItems.push({
        skuId: item.skuId,
        bookQty,
        actualQty: item.actualQty,
        diffQty,
      });
    }

    // 创建调整单
    const adjustNo = this.generateAdjustNo();
    const adjustment = await this.prisma.adjustment.create({
      data: {
        adjustNo,
        warehouseId,
        remark,
        createdBy: userId,
        items: {
          create: adjustmentItems,
        },
      },
      include: {
        warehouse: { select: { name: true } },
        items: {
          include: {
            sku: {
              select: {
                skuCode: true,
                product: { select: { name: true } },
                specs: true,
              },
            },
          },
        },
      },
    });

    return AdjustmentVo.fromEntity(adjustment);
  }

  // 审核调整单
  async audit(id: number, userId: number) {
    const adjustment = await this.prisma.adjustment.findFirst({
      where: { id, deletedAt: null },
      include: { items: true },
    });

    if (!adjustment) {
      throw new NotFoundException('调整单不存在');
    }

    const claimed = await this.prisma.adjustment.updateMany({
      where: { id, deletedAt: null, status: AdjustmentStatus.PENDING },
      data: { status: AdjustmentStatus.APPROVED },
    });
    if (claimed.count !== 1) {
      throw new BadRequestException('调整单状态不正确，只能对待审核状态的调整单进行审核');
    }

    return this.findOne(id);
  }

  // 完成调整单（执行库存调整）
  async complete(id: number, userId: number) {
    await this.prisma.serializableTransaction(async (tx) => {
      const adjustment = await tx.adjustment.findFirst({
        where: { id, deletedAt: null },
        include: { items: true },
      });
      if (!adjustment) {
        throw new NotFoundException('调整单不存在');
      }
      const claimed = await tx.adjustment.updateMany({
        where: { id, deletedAt: null, status: AdjustmentStatus.APPROVED },
        data: { status: AdjustmentStatus.COMPLETED },
      });
      if (claimed.count !== 1) {
        throw new BadRequestException('调整单状态不正确，只能对已审核状态的调整单执行调整');
      }

      for (const item of adjustment.items) {
        const inventory = await tx.inventory.findUnique({
          where: {
            skuId_warehouseId: {
              skuId: item.skuId,
              warehouseId: adjustment.warehouseId,
            },
          },
        });

        const beforeQty = inventory?.quantity || 0;
        const afterQty = item.actualQty;
        const diffQty = afterQty - beforeQty;
        if (diffQty === 0) continue;

        if (inventory && item.actualQty < inventory.locked) {
          throw new BadRequestException(
            `SKU(ID:${item.skuId})实盘数量不能小于已锁定数量(${inventory.locked})`,
          );
        }

        if (inventory) {
          // 更新库存
          await tx.inventory.update({
            where: { id: inventory.id },
            data: {
              quantity: item.actualQty,
              available: item.actualQty - inventory.locked,
            },
          });
        } else if (item.actualQty > 0) {
          // 创建新库存记录
          await tx.inventory.create({
            data: {
              skuId: item.skuId,
              warehouseId: adjustment.warehouseId,
              quantity: item.actualQty,
              available: item.actualQty,
              locked: 0,
            },
          });
        }

        // 创建库存流水
        const logType: InventoryType = diffQty > 0 ? 'IN_ADJUST' : 'OUT_ADJUST';
        await tx.inventoryLog.create({
          data: {
            type: logType,
            skuId: item.skuId,
            warehouseId: adjustment.warehouseId,
            quantity: diffQty,
            before: beforeQty,
            after: afterQty,
            bizType: 'ADJUST',
            bizId: adjustment.id,
            bizNo: adjustment.adjustNo,
            remark: `盘点调整: 账面${beforeQty} -> 实盘${afterQty}`,
            createdBy: userId,
          },
        });
      }

    });

    return this.findOne(id);
  }

  // 取消调整单
  async cancel(id: number, userId: number) {
    const adjustment = await this.prisma.adjustment.findFirst({
      where: { id, deletedAt: null },
    });

    if (!adjustment) {
      throw new NotFoundException('调整单不存在');
    }

    const cancelled = await this.prisma.adjustment.updateMany({
      where: {
        id,
        deletedAt: null,
        status: { in: [AdjustmentStatus.PENDING, AdjustmentStatus.APPROVED] },
      },
      data: { status: AdjustmentStatus.CANCELLED },
    });
    if (cancelled.count !== 1) {
      throw new BadRequestException('只有待审核或已审核的调整单可以取消');
    }

    return this.findOne(id);
  }
}
