import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { CreateReturnDto } from './dto/create-return.dto';
import { UpdateReturnDto } from './dto/update-return.dto';
import { QueryReturnDto } from './dto/query-return.dto';
import { AuditReturnDto, AuditAction } from './dto/audit-return.dto';
import { ReturnStatus, ReceiptStatus, Prisma } from '@prisma/client';
import { ReturnVo, ReturnDetailVo } from './vo/return.vo';
import { sumMoney, mulMoney, subMoneyClampZero } from '@/common/utils/money';

// 生成退货单号
function generateReturnNo(): string {
  const date = new Date();
  const prefix = 'TH';
  const dateStr =
    date.getFullYear().toString() +
    String(date.getMonth() + 1).padStart(2, '0') +
    String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}${dateStr}${random}`;
}

@Injectable()
export class PurchaseReturnsService {
  constructor(private prisma: PrismaService) {}

  // 创建退货单
  async create(createDto: CreateReturnDto, userId: number) {
    const { receiptId, supplierId, items, remark } = createDto;

    // 验证入库单
    const receipt = await this.prisma.purchaseReceipt.findFirst({
      where: { id: receiptId, deletedAt: null },
      include: {
        items: true,
        purchase: {
          select: {
            supplierId: true,
            warehouseId: true,
          },
        },
      },
    });

    if (!receipt) {
      throw new NotFoundException('入库单不存在');
    }

    if (receipt.status !== ReceiptStatus.RECEIVED) {
      throw new ForbiddenException('只能对已入库的入库单创建退货单');
    }

    // 验证供应商是否匹配
    if (receipt.purchase.supplierId !== supplierId) {
      throw new BadRequestException('供应商与入库单不匹配');
    }

    if (!items || items.length === 0) {
      throw new BadRequestException('退货商品不能为空');
    }

    // 验证退货数量是否超过可退数量（已入库数量 - 已退货数量）
    for (const item of items) {
      const receiptItem = receipt.items.find((ri) => ri.skuId === item.skuId);
      if (!receiptItem) {
        throw new BadRequestException(`商品SKU(ID:${item.skuId})不在入库单中`);
      }

      // 查询该入库单已退货数量
      const returnedQty = await this.getReturnedQuantity(receiptId, item.skuId);
      const availableQty = receiptItem.quantity - returnedQty;

      if (item.quantity > availableQty) {
        throw new BadRequestException(
          `商品SKU(ID:${item.skuId})退货数量超过可退数量(可退:${availableQty})`,
        );
      }
    }

    // 计算总金额
    const totalAmount = sumMoney(items, (item) => mulMoney(item.price, item.quantity));

    // 创建退货单
    const returnOrder = await this.prisma.purchaseReturn.create({
      data: {
        returnNo: generateReturnNo(),
        receiptId,
        supplierId,
        warehouseId: receipt.purchase.warehouseId,
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
        receipt: {
          select: {
            receiptNo: true,
          },
        },
        supplier: { select: { id: true, name: true } },
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

    return ReturnDetailVo.fromEntity(returnOrder);
  }

  // 查询已退货数量
  private async getReturnedQuantity(receiptId: number, skuId: number): Promise<number> {
    const result = await this.prisma.purchaseReturnItem.aggregate({
      where: {
        return: {
          receiptId,
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
  async findAll(query: QueryReturnDto) {
    const { keyword, supplierId, status, page = 1, pageSize = 10 } = query;

    const where: Prisma.PurchaseReturnWhereInput = {
      deletedAt: null,
    };

    if (keyword) {
      where.returnNo = { contains: keyword };
    }

    if (supplierId) {
      where.supplierId = supplierId;
    }

    if (status) {
      where.status = status as ReturnStatus;
    }

    const [data, total] = await Promise.all([
      this.prisma.purchaseReturn.findMany({
        where,
        include: {
          receipt: {
            select: {
              receiptNo: true,
            },
          },
          supplier: { select: { id: true, name: true } },
          warehouse: { select: { id: true, name: true } },
          _count: {
            select: { items: true },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.purchaseReturn.count({ where }),
    ]);

    return {
      data: ReturnVo.fromEntities(data),
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
    const returnOrder = await this.prisma.purchaseReturn.findFirst({
      where: { id, deletedAt: null },
      include: {
        receipt: {
          select: {
            receiptNo: true,
            purchase: {
              select: {
                orderNo: true,
              },
            },
          },
        },
        supplier: { select: { id: true, name: true } },
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

    return ReturnDetailVo.fromEntity(returnOrder);
  }

  // 更新退货单（仅在待审核状态可更新）
  async update(id: number, updateDto: UpdateReturnDto) {
    const existing = await this.prisma.purchaseReturn.findFirst({
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
        await tx.purchaseReturnItem.deleteMany({
          where: { returnId: id },
        });

        // 创建新明细
        await tx.purchaseReturnItem.createMany({
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
      const updatedReturn = await tx.purchaseReturn.update({
        where: { id },
        data: {
          ...otherData,
          totalAmount,
        },
        include: {
          receipt: {
            select: {
              receiptNo: true,
            },
          },
          supplier: { select: { id: true, name: true } },
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

    return ReturnDetailVo.fromEntity(updated);
  }

  // 审核退货单
  async audit(id: number, auditDto: AuditReturnDto, userId: number) {
    const existing = await this.prisma.purchaseReturn.findFirst({
      where: { id, deletedAt: null },
      include: {
        items: true,
        receipt: {
          include: {
            purchase: true,
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
      const updated = await tx.purchaseReturn.update({
        where: { id },
        data: { status: newStatus },
        include: {
          receipt: {
            select: {
              receiptNo: true,
            },
          },
          supplier: { select: { id: true, name: true } },
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

      // 如果审核通过，扣减库存和应付金额
      if (newStatus === ReturnStatus.APPROVED) {
        // 1. 扣减库存（同时反向加权重算 SKU.costPrice，避免账面均价漂移）
        // 取关联入库单明细，作为退出的"原成本基准"
        const receiptItems = await tx.purchaseReceiptItem.findMany({
          where: { receiptId: existing.receiptId },
          select: { skuId: true, price: true },
        });
        const receiptCostMap = new Map<number, number>();
        for (const ri of receiptItems) {
          receiptCostMap.set(ri.skuId, Number(ri.price));
        }

        for (const item of existing.items) {
          const inventory = await tx.inventory.findUnique({
            where: {
              skuId_warehouseId: {
                skuId: item.skuId,
                warehouseId: existing.warehouseId,
              },
            },
          });

          if (inventory) {
            // 确保库存充足
            if (inventory.quantity < item.quantity) {
              throw new BadRequestException(
                `商品SKU(ID:${item.skuId})库存不足，无法退货`,
              );
            }

            const beforeQty = inventory.quantity;
            const afterQty = beforeQty - item.quantity;

            // 原子条件扣减：杜绝并发 oversell
            const decResult = await tx.inventory.updateMany({
              where: {
                id: inventory.id,
                quantity: { gte: item.quantity },
                available: { gte: item.quantity },
              },
              data: {
                quantity: { decrement: item.quantity },
                available: { decrement: item.quantity },
              },
            });
            if (decResult.count !== 1) {
              throw new BadRequestException(
                `商品SKU(ID:${item.skuId})库存不足，并发扣减失败`,
              );
            }

            // 反向加权重算 SKU.costPrice：
            //   newAvg = (oldQty * oldAvg - returnQty * receiptUnitCost) / (oldQty - returnQty)
            // 用关联入库单的入库单价作为成本基准，缺失时回退到当前 SKU.costPrice（不再变化）
            const sku = await tx.productSku.findUnique({
              where: { id: item.skuId },
              select: { costPrice: true },
            });
            const oldAvg = Number(sku?.costPrice || 0);
            const receiptUnitCost = receiptCostMap.get(item.skuId) ?? oldAvg;
            const remainingQty = beforeQty - item.quantity;
            const numerator = beforeQty * oldAvg - item.quantity * receiptUnitCost;
            const newAvg = remainingQty > 0
              ? Math.max(0, numerator / remainingQty)
              : 0;
            await tx.productSku.update({
              where: { id: item.skuId },
              data: { costPrice: newAvg },
            });

            // 创建出库流水（带成本，按入库单价回退）
            await tx.inventoryLog.create({
              data: {
                type: 'OUT_PURCHASE_RETURN',
                skuId: item.skuId,
                warehouseId: existing.warehouseId,
                quantity: -item.quantity,
                before: beforeQty,
                after: afterQty,
                unitCost: receiptUnitCost,
                costAmount: -receiptUnitCost * item.quantity,
                bizType: 'PURCHASE_RETURN',
                bizId: existing.id,
                bizNo: existing.returnNo,
                remark: `采购退货出库: ${existing.receipt.purchase.orderNo}`,
                createdBy: userId,
              },
            });
          }
        }

        // 2. 扣减采购订单的应付金额
        const purchase = existing.receipt.purchase;
        const newPayable = subMoneyClampZero(purchase.payable, existing.totalAmount);
        await tx.purchase.update({
          where: { id: purchase.id },
          data: { payable: newPayable },
        });
      }

      return updated;
    });

    return ReturnDetailVo.fromEntity(result);
  }

  // 完成退货单（审核后的确认）
  async complete(id: number, userId: number) {
    const existing = await this.prisma.purchaseReturn.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('退货单不存在');
    }

    if (existing.status !== ReturnStatus.APPROVED) {
      throw new ForbiddenException('只有已审核的退货单可以完成');
    }

    const updated = await this.prisma.purchaseReturn.update({
      where: { id },
      data: { status: ReturnStatus.COMPLETED },
      include: {
        receipt: {
          select: {
            receiptNo: true,
          },
        },
        supplier: { select: { id: true, name: true } },
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

    return ReturnDetailVo.fromEntity(updated);
  }

  // 取消退货单
  async cancel(id: number, userId: number) {
    const existing = await this.prisma.purchaseReturn.findFirst({
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

    const updated = await this.prisma.purchaseReturn.update({
      where: { id },
      data: { status: ReturnStatus.CANCELLED },
      include: {
        receipt: {
          select: {
            receiptNo: true,
          },
        },
        supplier: { select: { id: true, name: true } },
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

    return ReturnDetailVo.fromEntity(updated);
  }

  // 删除退货单（软删除）
  async remove(id: number) {
    const existing = await this.prisma.purchaseReturn.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('退货单不存在');
    }

    if (existing.status === ReturnStatus.COMPLETED) {
      throw new ForbiddenException('已完成的退货单不能删除');
    }

    await this.prisma.purchaseReturn.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { success: true };
  }

  // 获取可退货的入库单列表（用于创建退货单时选择）
  async getReturnableReceipts(supplierId?: number) {
    const where: Prisma.PurchaseReceiptWhereInput = {
      deletedAt: null,
      status: ReceiptStatus.RECEIVED,
    };

    if (supplierId) {
      where.purchase = {
        supplierId,
      };
    }

    const receipts = await this.prisma.purchaseReceipt.findMany({
      where,
      include: {
        purchase: {
          select: {
            orderNo: true,
            supplier: { select: { id: true, name: true } },
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

    // 过滤掉已完全退货的入库单
    const returnableReceipts: any[] = [];
    for (const receipt of receipts) {
      const items: any[] = [];
      for (const item of receipt.items) {
        const returnedQty = await this.getReturnedQuantity(receipt.id, item.skuId);
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
        returnableReceipts.push({
          ...receipt,
          items,
        });
      }
    }

    return returnableReceipts;
  }
}
