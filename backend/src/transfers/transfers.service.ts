import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateTransferDto, QueryTransferDto } from './dto';
import { TransferVo } from './vo';
import { TransferStatus, Prisma } from '@prisma/client';

@Injectable()
export class TransfersService {
  constructor(private prisma: PrismaService) {}

  // 生成调拨单号
  private generateTransferNo(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 9000) + 1000;
    return `DB${dateStr}${random}`;
  }

  // 查询调拨单列表
  async findAll(query: QueryTransferDto) {
    const { transferNo, fromId, toId, status, page = 1, pageSize = 10 } = query;

    const where: Prisma.TransferWhereInput = {
      deletedAt: null,
    };

    if (transferNo) {
      where.transferNo = { contains: transferNo, mode: 'insensitive' };
    }

    if (fromId) {
      where.fromId = fromId;
    }

    if (toId) {
      where.toId = toId;
    }

    if (status) {
      where.status = status;
    }

    const [data, total] = await Promise.all([
      this.prisma.transfer.findMany({
        where,
        include: {
          from: { select: { id: true, name: true } },
          to: { select: { id: true, name: true } },
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
      this.prisma.transfer.count({ where }),
    ]);

    return {
      data: TransferVo.fromEntities(data),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  // 查询单个调拨单
  async findOne(id: number) {
    const transfer = await this.prisma.transfer.findFirst({
      where: { id, deletedAt: null },
      include: {
        from: { select: { id: true, name: true } },
        to: { select: { id: true, name: true } },
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

    if (!transfer) {
      throw new NotFoundException('调拨单不存在');
    }

    return TransferVo.fromEntity(transfer);
  }

  // 创建调拨单
  async create(dto: CreateTransferDto, userId: number) {
    const { fromId, toId, remark, items } = dto;

    // 检查仓库
    if (fromId === toId) {
      throw new BadRequestException('出库仓库和入库仓库不能相同');
    }

    const fromWarehouse = await this.prisma.warehouse.findFirst({
      where: { id: fromId, deletedAt: null },
    });
    if (!fromWarehouse) {
      throw new NotFoundException('出库仓库不存在');
    }

    const toWarehouse = await this.prisma.warehouse.findFirst({
      where: { id: toId, deletedAt: null },
    });
    if (!toWarehouse) {
      throw new NotFoundException('入库仓库不存在');
    }

    // 检查SKU并验证库存
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

      // 检查库存是否充足
      const inventory = await this.prisma.inventory.findUnique({
        where: {
          skuId_warehouseId: {
            skuId: item.skuId,
            warehouseId: fromId,
          },
        },
      });

      if (!inventory || inventory.available < item.quantity) {
        throw new BadRequestException(
          `SKU ${sku.skuCode} 在仓库 ${fromWarehouse.name} 的可用库存不足，当前可用: ${inventory?.available || 0}`
        );
      }
    }

    // 创建调拨单
    const transferNo = this.generateTransferNo();
    const transfer = await this.prisma.transfer.create({
      data: {
        transferNo,
        fromId,
        toId,
        remark,
        createdBy: userId,
        items: {
          create: items.map(item => ({
            skuId: item.skuId,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        from: { select: { name: true } },
        to: { select: { name: true } },
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

    return TransferVo.fromEntity(transfer);
  }

  // 确认出库
  async confirmOut(id: number, userId: number) {
    const transfer = await this.prisma.transfer.findFirst({
      where: { id, deletedAt: null },
      include: { items: true },
    });

    if (!transfer) {
      throw new NotFoundException('调拨单不存在');
    }

    if (transfer.status !== TransferStatus.PENDING) {
      throw new BadRequestException('调拨单状态不正确，只能对待出库状态的调拨单进行出库操作');
    }

    // 事务处理：出库扣减库存，创建库存流水
    await this.prisma.$transaction(async (tx) => {
      for (const item of transfer.items) {
        // 检查并扣减库存
        const inventory = await tx.inventory.findUnique({
          where: {
            skuId_warehouseId: {
              skuId: item.skuId,
              warehouseId: transfer.fromId,
            },
          },
        });

        if (!inventory || inventory.available < item.quantity) {
          throw new BadRequestException('库存不足，无法出库');
        }

        // 扣减库存
        await tx.inventory.update({
          where: { id: inventory.id },
          data: {
            quantity: { decrement: item.quantity },
            available: { decrement: item.quantity },
          },
        });

        // 创建出库流水
        await tx.inventoryLog.create({
          data: {
            type: 'OUT_TRANSFER',
            skuId: item.skuId,
            warehouseId: transfer.fromId,
            quantity: -item.quantity,
            before: inventory.quantity,
            after: inventory.quantity - item.quantity,
            bizType: 'TRANSFER',
            bizId: transfer.id,
            bizNo: transfer.transferNo,
            remark: `调拨出库到: ${transfer.toId}`,
            createdBy: userId,
          },
        });
      }

      // 更新调拨单状态
      await tx.transfer.update({
        where: { id },
        data: { status: TransferStatus.OUT },
      });
    });

    return this.findOne(id);
  }

  // 确认入库
  async confirmIn(id: number, userId: number) {
    const transfer = await this.prisma.transfer.findFirst({
      where: { id, deletedAt: null },
      include: { items: true },
    });

    if (!transfer) {
      throw new NotFoundException('调拨单不存在');
    }

    if (transfer.status !== TransferStatus.OUT) {
      throw new BadRequestException('调拨单状态不正确，只能对已出库状态的调拨单进行入库操作');
    }

    // 事务处理：入库增加库存，创建库存流水
    await this.prisma.$transaction(async (tx) => {
      for (const item of transfer.items) {
        // 查询或创建库存记录
        let inventory = await tx.inventory.findUnique({
          where: {
            skuId_warehouseId: {
              skuId: item.skuId,
              warehouseId: transfer.toId,
            },
          },
        });

        const beforeQty = inventory?.quantity || 0;

        if (inventory) {
          await tx.inventory.update({
            where: { id: inventory.id },
            data: {
              quantity: { increment: item.quantity },
              available: { increment: item.quantity },
            },
          });
        } else {
          await tx.inventory.create({
            data: {
              skuId: item.skuId,
              warehouseId: transfer.toId,
              quantity: item.quantity,
              available: item.quantity,
              locked: 0,
            },
          });
        }

        // 创建入库流水
        await tx.inventoryLog.create({
          data: {
            type: 'IN_TRANSFER',
            skuId: item.skuId,
            warehouseId: transfer.toId,
            quantity: item.quantity,
            before: beforeQty,
            after: beforeQty + item.quantity,
            bizType: 'TRANSFER',
            bizId: transfer.id,
            bizNo: transfer.transferNo,
            remark: `调拨入库来自: ${transfer.fromId}`,
            createdBy: userId,
          },
        });
      }

      // 更新调拨单状态
      await tx.transfer.update({
        where: { id },
        data: { status: TransferStatus.COMPLETED },
      });
    });

    return this.findOne(id);
  }

  // 取消调拨单
  async cancel(id: number, userId: number) {
    const transfer = await this.prisma.transfer.findFirst({
      where: { id, deletedAt: null },
    });

    if (!transfer) {
      throw new NotFoundException('调拨单不存在');
    }

    if (transfer.status === TransferStatus.COMPLETED) {
      throw new BadRequestException('已完成的调拨单不能取消');
    }

    // 如果已经出库，需要回滚库存
    if (transfer.status === TransferStatus.OUT) {
      await this.prisma.$transaction(async (tx) => {
        const items = await tx.transferItem.findMany({
          where: { transferId: id },
        });

        for (const item of items) {
          // 恢复出库仓库库存
          const inventory = await tx.inventory.findUnique({
            where: {
              skuId_warehouseId: {
                skuId: item.skuId,
                warehouseId: transfer.fromId,
              },
            },
          });

          if (inventory) {
            await tx.inventory.update({
              where: { id: inventory.id },
              data: {
                quantity: { increment: item.quantity },
                available: { increment: item.quantity },
              },
            });

            // 创建回滚流水
            await tx.inventoryLog.create({
              data: {
                type: 'IN_ADJUST',
                skuId: item.skuId,
                warehouseId: transfer.fromId,
                quantity: item.quantity,
                before: inventory.quantity,
                after: inventory.quantity + item.quantity,
                bizType: 'TRANSFER_CANCEL',
                bizId: transfer.id,
                bizNo: transfer.transferNo,
                remark: '调拨单取消回滚',
                createdBy: userId,
              },
            });
          }
        }

        await tx.transfer.update({
          where: { id },
          data: { status: TransferStatus.CANCELLED },
        });
      });
    } else {
      await this.prisma.transfer.update({
        where: { id },
        data: { status: TransferStatus.CANCELLED },
      });
    }

    return this.findOne(id);
  }
}
