import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateSaleReturnDto } from './dto/create-sale-return.dto';
import { UpdateSaleReturnDto } from './dto/update-sale-return.dto';
import { QuerySaleReturnDto } from './dto/query-sale-return.dto';
import { AuditSaleReturnDto, AuditAction } from './dto/audit-sale-return.dto';
import { ReturnStatus, ShipmentStatus, Prisma } from '@prisma/client';
import { SaleReturnVo, SaleReturnDetailVo } from './vo/sale-return.vo';

// 生成退货单号
function generateReturnNo(): string {
  const date = new Date();
  const prefix = 'XSTH';
  const dateStr =
    date.getFullYear().toString() +
    String(date.getMonth() + 1).padStart(2, '0') +
    String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}${dateStr}${random}`;
}

@Injectable()
export class SaleReturnsService {
  constructor(private prisma: PrismaService) {}

  // 创建销售退货单
  async create(createDto: CreateSaleReturnDto, userId: number) {
    const { shipmentId, customerId, items, remark } = createDto;

    // 验证发货单
    const shipment = await this.prisma.shipment.findFirst({
      where: { id: shipmentId, deletedAt: null },
      include: {
        items: true,
        order: {
          select: {
            customerId: true,
          },
        },
      },
    });

    if (!shipment) {
      throw new NotFoundException('发货单不存在');
    }

    if (shipment.status !== ShipmentStatus.RECEIVED) {
      throw new ForbiddenException('只能对已收货的发货单创建退货单');
    }

    // 验证客户是否匹配
    if (shipment.order.customerId !== customerId) {
      throw new BadRequestException('客户与发货单不匹配');
    }

    if (!items || items.length === 0) {
      throw new BadRequestException('退货商品不能为空');
    }

    // 验证退货数量是否超过可退数量（已发货数量 - 已退货数量）
    for (const item of items) {
      const shipmentItem = shipment.items.find((si) => si.skuId === item.skuId);
      if (!shipmentItem) {
        throw new BadRequestException(`商品SKU(ID:${item.skuId})不在发货单中`);
      }

      // 查询该发货单已退货数量
      const returnedQty = await this.getReturnedQuantity(shipmentId, item.skuId);
      const availableQty = shipmentItem.quantity - returnedQty;

      if (item.quantity > availableQty) {
        throw new BadRequestException(
          `商品SKU(ID:${item.skuId})退货数量超过可退数量(可退:${availableQty})`,
        );
      }
    }

    // 计算总金额
    const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.price, 0);

    // 创建退货单
    const returnOrder = await this.prisma.saleReturn.create({
      data: {
        returnNo: generateReturnNo(),
        shipmentId,
        customerId,
        warehouseId: shipment.warehouseId,
        totalAmount,
        status: ReturnStatus.PENDING,
        remark,
        createdBy: userId,
        items: {
          create: items.map((item) => ({
            skuId: item.skuId,
            quantity: item.quantity,
            price: item.price,
            amount: item.quantity * item.price,
          })),
        },
      },
      include: {
        shipment: {
          select: {
            shipmentNo: true,
          },
        },
        customer: { select: { id: true, name: true } },
        warehouse: { select: { id: true, name: true } },
        items: {
          include: {
            sku: {
              include: {
                product: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });

    return SaleReturnDetailVo.fromEntity(returnOrder);
  }

  // 查询已退货数量
  private async getReturnedQuantity(shipmentId: number, skuId: number): Promise<number> {
    const result = await this.prisma.saleReturnItem.aggregate({
      where: {
        return: {
          shipmentId,
          status: { in: [ReturnStatus.APPROVED, ReturnStatus.COMPLETED] },
          deletedAt: null,
        },
        skuId,
      },
      _sum: {
        quantity: true,
      },
    });
    return result._sum.quantity || 0;
  }

  // 查询退货单列表
  async findAll(query: QuerySaleReturnDto) {
    const { keyword, customerId, status, page = 1, pageSize = 10 } = query;

    const where: Prisma.SaleReturnWhereInput = {
      deletedAt: null,
    };

    if (keyword) {
      where.returnNo = { contains: keyword };
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (status) {
      where.status = status as ReturnStatus;
    }

    const [data, total] = await Promise.all([
      this.prisma.saleReturn.findMany({
        where,
        include: {
          shipment: {
            select: {
              shipmentNo: true,
            },
          },
          customer: { select: { id: true, name: true } },
          warehouse: { select: { id: true, name: true } },
          _count: {
            select: { items: true },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.saleReturn.count({ where }),
    ]);

    return {
      data: SaleReturnVo.fromEntities(data),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  // 查询退货单详情
  async findOne(id: number) {
    const returnOrder = await this.prisma.saleReturn.findFirst({
      where: { id, deletedAt: null },
      include: {
        shipment: {
          select: {
            shipmentNo: true,
            order: {
              select: {
                orderNo: true,
              },
            },
          },
        },
        customer: { select: { id: true, name: true } },
        warehouse: { select: { id: true, name: true } },
        items: {
          include: {
            sku: {
              include: {
                product: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });

    if (!returnOrder) {
      throw new NotFoundException('退货单不存在');
    }

    return SaleReturnDetailVo.fromEntity(returnOrder);
  }

  // 更新退货单（仅在待审核状态可更新）
  async update(id: number, updateDto: UpdateSaleReturnDto) {
    const existing = await this.prisma.saleReturn.findFirst({
      where: { id, deletedAt: null },
      include: { items: true },
    });

    if (!existing) {
      throw new NotFoundException('退货单不存在');
    }

    if (existing.status !== ReturnStatus.PENDING) {
      throw new ForbiddenException('只有待审核的退货单可以修改');
    }

    const { items, ...otherData } = updateDto;

    // 使用事务更新
    const updated = await this.prisma.$transaction(async (tx) => {
      // 如果更新了明细，重新计算金额
      let totalAmount = Number(existing.totalAmount);

      if (items && items.length > 0) {
        totalAmount = 0;
        for (const item of items) {
          totalAmount += item.quantity * item.price;
        }

        // 删除旧明细
        await tx.saleReturnItem.deleteMany({
          where: { returnId: id },
        });

        // 创建新明细
        await tx.saleReturnItem.createMany({
          data: items.map((item) => ({
            returnId: id,
            skuId: item.skuId,
            quantity: item.quantity,
            price: item.price,
            amount: item.quantity * item.price,
          })),
        });
      }

      // 更新退货单
      const updatedReturn = await tx.saleReturn.update({
        where: { id },
        data: {
          ...otherData,
          totalAmount,
        },
        include: {
          shipment: {
            select: {
              shipmentNo: true,
            },
          },
          customer: { select: { id: true, name: true } },
          warehouse: { select: { id: true, name: true } },
          items: {
            include: {
              sku: {
                include: {
                  product: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
      });

      return updatedReturn;
    });

    return SaleReturnDetailVo.fromEntity(updated);
  }

  // 审核退货单
  async audit(id: number, auditDto: AuditSaleReturnDto, userId: number) {
    const existing = await this.prisma.saleReturn.findFirst({
      where: { id, deletedAt: null },
      include: {
        items: true,
        shipment: {
          include: {
            order: true,
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('退货单不存在');
    }

    if (existing.status !== ReturnStatus.PENDING) {
      throw new ForbiddenException('只有待审核的退货单可以进行审核操作');
    }

    const newStatus =
      auditDto.action === AuditAction.APPROVE
        ? ReturnStatus.APPROVED
        : ReturnStatus.CANCELLED;

    // 使用事务执行审核
    const result = await this.prisma.$transaction(async (tx) => {
      // 更新退货单状态
      const updated = await tx.saleReturn.update({
        where: { id },
        data: { status: newStatus },
        include: {
          shipment: {
            select: {
              shipmentNo: true,
            },
          },
          customer: { select: { id: true, name: true } },
          warehouse: { select: { id: true, name: true } },
          items: {
            include: {
              sku: {
                include: {
                  product: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
      });

      // 如果审核通过，增加库存和扣减应收金额
      if (newStatus === ReturnStatus.APPROVED) {
        // 1. 增加库存
        for (const item of existing.items) {
          const inventory = await tx.inventory.findUnique({
            where: {
              skuId_warehouseId: {
                skuId: item.skuId,
                warehouseId: existing.warehouseId,
              },
            },
          });

          const beforeQty = inventory?.quantity || 0;
          const afterQty = beforeQty + item.quantity;

          if (inventory) {
            await tx.inventory.update({
              where: { id: inventory.id },
              data: {
                quantity: { increment: item.quantity },
                available: { increment: item.quantity },
              },
            });
          } else {
            // 如果不存在库存记录，创建新的
            await tx.inventory.create({
              data: {
                skuId: item.skuId,
                warehouseId: existing.warehouseId,
                quantity: item.quantity,
                available: item.quantity,
                locked: 0,
              },
            });
          }

          // 创建入库流水
          await tx.inventoryLog.create({
            data: {
              type: 'IN_SALE_RETURN',
              skuId: item.skuId,
              warehouseId: existing.warehouseId,
              quantity: item.quantity,
              before: beforeQty,
              after: afterQty,
              bizType: 'SALE_RETURN',
              bizId: existing.id,
              bizNo: existing.returnNo,
              remark: `销售退货入库: ${existing.shipment.order.orderNo}`,
              createdBy: userId,
            },
          });
        }

        // 2. 扣减销售订单的应收金额（因为退款给客户）
        const order = existing.shipment.order;
        const newPayable = Math.max(0, Number(order.payable) - Number(existing.totalAmount));
        await tx.order.update({
          where: { id: order.id },
          data: { payable: newPayable },
        });
      }

      return updated;
    });

    return SaleReturnDetailVo.fromEntity(result);
  }

  // 完成退货单（审核后的确认）
  async complete(id: number, userId: number) {
    const existing = await this.prisma.saleReturn.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('退货单不存在');
    }

    if (existing.status !== ReturnStatus.APPROVED) {
      throw new ForbiddenException('只有已审核的退货单可以完成');
    }

    const updated = await this.prisma.saleReturn.update({
      where: { id },
      data: { status: ReturnStatus.COMPLETED },
      include: {
        shipment: {
          select: {
            shipmentNo: true,
          },
        },
        customer: { select: { id: true, name: true } },
        warehouse: { select: { id: true, name: true } },
        items: {
          include: {
            sku: {
              include: {
                product: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });

    return SaleReturnDetailVo.fromEntity(updated);
  }

  // 取消退货单
  async cancel(id: number, userId: number) {
    const existing = await this.prisma.saleReturn.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('退货单不存在');
    }

    if (existing.status === ReturnStatus.COMPLETED) {
      throw new ForbiddenException('已完成的退货单不能取消');
    }

    if (existing.status === ReturnStatus.CANCELLED) {
      throw new BadRequestException('退货单已取消');
    }

    const updated = await this.prisma.saleReturn.update({
      where: { id },
      data: { status: ReturnStatus.CANCELLED },
      include: {
        shipment: {
          select: {
            shipmentNo: true,
          },
        },
        customer: { select: { id: true, name: true } },
        warehouse: { select: { id: true, name: true } },
        items: {
          include: {
            sku: {
              include: {
                product: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });

    return SaleReturnDetailVo.fromEntity(updated);
  }

  // 删除退货单（软删除）
  async remove(id: number) {
    const existing = await this.prisma.saleReturn.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('退货单不存在');
    }

    if (existing.status === ReturnStatus.COMPLETED) {
      throw new ForbiddenException('已完成的退货单不能删除');
    }

    await this.prisma.saleReturn.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { success: true };
  }

  // 获取可退货的发货单列表（用于创建退货单时选择）
  async getReturnableShipments(customerId?: number) {
    const where: Prisma.ShipmentWhereInput = {
      deletedAt: null,
      status: ShipmentStatus.RECEIVED,
    };

    if (customerId) {
      where.order = {
        customerId,
      };
    }

    const shipments = await this.prisma.shipment.findMany({
      where,
      include: {
        order: {
          select: {
            orderNo: true,
            customer: { select: { id: true, name: true } },
          },
        },
        warehouse: { select: { id: true, name: true } },
        items: {
          include: {
            sku: {
              include: {
                product: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 过滤掉已完全退货的发货单
    const returnableShipments: any[] = [];
    for (const shipment of shipments) {
      const items: any[] = [];
      for (const item of shipment.items) {
        const returnedQty = await this.getReturnedQuantity(shipment.id, item.skuId);
        const availableQty = item.quantity - returnedQty;
        if (availableQty > 0) {
          items.push({
            ...item,
            availableQty,
            returnedQty,
          });
        }
      }
      if (items.length > 0) {
        returnableShipments.push({
          ...shipment,
          items,
        });
      }
    }

    return returnableShipments;
  }
}
