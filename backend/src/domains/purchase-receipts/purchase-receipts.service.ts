import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { CreateReceiptDto } from './dto/create-receipt.dto';
import { QueryReceiptDto } from './dto/query-receipt.dto';
import { PurchaseDetailVo } from '@/purchases/vo/purchase.vo';
import { PurchaseStatus, ReceiptStatus, Prisma } from '@prisma/client';
import { ReceiptVo, ReceiptDetailVo } from './vo/receipt.vo';
import { sumMoney, mulMoney } from '@/common/utils/money';

// 生成入库单号
function generateReceiptNo(): string {
  const date = new Date();
  const prefix = 'RK';
  const dateStr =
    date.getFullYear().toString() +
    String(date.getMonth() + 1).padStart(2, '0') +
    String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}${dateStr}${random}`;
}

@Injectable()
export class PurchaseReceiptsService {
  constructor(private prisma: PrismaService) {}

  // 查询可入库采购订单
  async getAvailablePurchases(keyword?: string) {
    const purchases = await this.prisma.purchase.findMany({
      where: {
        deletedAt: null,
        status: { in: [PurchaseStatus.APPROVED, PurchaseStatus.PARTIAL] },
        ...(keyword
          ? {
              orderNo: {
                contains: keyword,
              },
            }
          : {}),
      },
      include: {
        supplier: { select: { id: true, name: true } },
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

    const warehouseIds = [...new Set(purchases.map((purchase) => purchase.warehouseId))];
    const warehouses = warehouseIds.length
      ? await this.prisma.warehouse.findMany({
          where: { id: { in: warehouseIds } },
          select: { id: true, name: true },
        })
      : [];
    const warehouseMap = new Map(warehouses.map((warehouse) => [warehouse.id, warehouse]));

    return purchases
      .filter((purchase) =>
        purchase.items.some((item) => item.quantity > item.received),
      )
      .map((purchase) =>
        PurchaseDetailVo.fromEntity({
          ...purchase,
          warehouse:
            warehouseMap.get(purchase.warehouseId) || {
              id: purchase.warehouseId,
              name: '',
            },
          items: purchase.items.filter((item) => item.quantity > item.received),
        }),
      );
  }

  // 创建入库单
  async create(createDto: CreateReceiptDto, userId: number) {
    const { purchaseId, items, remark } = createDto;

    // 验证采购订单
    const purchase = await this.prisma.purchase.findFirst({
      where: { id: purchaseId, deletedAt: null },
      include: {
        items: true,
        supplier: { select: { id: true, name: true } },
      },
    });

    if (!purchase) {
      throw new NotFoundException('采购订单不存在');
    }

    if (purchase.status !== PurchaseStatus.APPROVED && purchase.status !== PurchaseStatus.PARTIAL) {
      throw new ForbiddenException('只能对已审核或部分入库的采购订单创建入库单');
    }

    if (!items || items.length === 0) {
      throw new BadRequestException('入库商品不能为空');
    }

    // 验证入库数量是否超过待入库数量
    for (const item of items) {
      const purchaseItem = purchase.items.find((pi) => pi.skuId === item.skuId);
      if (!purchaseItem) {
        throw new BadRequestException(`商品SKU(ID:${item.skuId})不在采购订单中`);
      }
      const pendingQty = purchaseItem.quantity - purchaseItem.received;
      if (item.quantity > pendingQty) {
        throw new BadRequestException(
          `商品SKU(ID:${item.skuId})入库数量超过待入库数量(待入库:${pendingQty})`,
        );
      }
    }

    // 计算总金额
    const totalAmount = sumMoney(items, (item) => mulMoney(item.price, item.quantity));

    // 创建入库单
    const receipt = await this.prisma.purchaseReceipt.create({
      data: {
        receiptNo: generateReceiptNo(),
        purchaseId,
        warehouseId: purchase.warehouseId,
        totalAmount,
        status: ReceiptStatus.PENDING,
        remark,
        createdBy: userId,
        items: {
          create: items.map((item) => ({
            skuId: item.skuId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: {
        purchase: {
          select: {
            orderNo: true,
            supplier: { select: { name: true } },
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
    });

    return ReceiptDetailVo.fromEntity(receipt);
  }

  // 查询入库单列表
  async findAll(query: QueryReceiptDto) {
    const { keyword, purchaseId, status, page = 1, pageSize = 10 } = query;

    const where: Prisma.PurchaseReceiptWhereInput = {
      deletedAt: null,
    };

    if (keyword) {
      where.receiptNo = { contains: keyword };
    }

    if (purchaseId) {
      where.purchaseId = purchaseId;
    }

    if (status) {
      where.status = status;
    }

    const [data, total] = await Promise.all([
      this.prisma.purchaseReceipt.findMany({
        where,
        include: {
          purchase: {
            select: {
              orderNo: true,
              supplier: { select: { name: true } },
            },
          },
          warehouse: { select: { id: true, name: true } },
          _count: {
            select: { items: true },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.purchaseReceipt.count({ where }),
    ]);

    return {
      data: ReceiptVo.fromEntities(data),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  // 查询入库单详情
  async findOne(id: number) {
    const receipt = await this.prisma.purchaseReceipt.findFirst({
      where: { id, deletedAt: null },
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
    });

    if (!receipt) {
      throw new NotFoundException('入库单不存在');
    }

    return ReceiptDetailVo.fromEntity(receipt);
  }

  // 确认入库
  async confirm(id: number, userId: number) {
    const receipt = await this.prisma.purchaseReceipt.findFirst({
      where: { id, deletedAt: null },
      include: {
        items: true,
        purchase: {
          include: {
            items: true,
            supplier: { select: { name: true } },
          },
        },
      },
    });

    if (!receipt) {
      throw new NotFoundException('入库单不存在');
    }

    if (receipt.status !== ReceiptStatus.PENDING) {
      throw new ForbiddenException('只有待入库的入库单可以确认入库');
    }

    // 使用事务执行入库操作
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. 更新入库单状态
      const updatedReceipt = await tx.purchaseReceipt.update({
        where: { id },
        data: { status: ReceiptStatus.RECEIVED },
        include: {
          purchase: {
            select: {
              orderNo: true,
              supplier: { select: { name: true } },
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
      });

      // 2. 更新库存和成本价
      for (const item of receipt.items) {
        // 获取当前SKU的成本价
        const sku = await tx.productSku.findUnique({
          where: { id: item.skuId },
          select: { costPrice: true },
        });
        
        const inventory = await tx.inventory.findUnique({
          where: {
            skuId_warehouseId: {
              skuId: item.skuId,
              warehouseId: receipt.warehouseId,
            },
          },
        });

        let beforeQty = 0;
        let afterQty = 0;

        if (inventory) {
          // 更新现有库存，使用加权平均计算新成本
          const oldQty = inventory.quantity;
          const oldCost = Number(sku?.costPrice || 0);
          const newQty = item.quantity;
          const newCost = Number(item.price);
          const totalQty = oldQty + newQty;
          const avgCost = totalQty > 0
            ? (oldQty * oldCost + newQty * newCost) / totalQty
            : newCost;

          beforeQty = inventory.quantity;
          afterQty = inventory.quantity + item.quantity;

          await tx.inventory.update({
            where: { id: inventory.id },
            data: {
              quantity: { increment: item.quantity },
              available: { increment: item.quantity },
            },
          });

          // 更新SKU成本价
          await tx.productSku.update({
            where: { id: item.skuId },
            data: { costPrice: avgCost },
          });
        } else {
          // 创建新库存记录
          beforeQty = 0;
          afterQty = item.quantity;

          await tx.inventory.create({
            data: {
              skuId: item.skuId,
              warehouseId: receipt.warehouseId,
              quantity: item.quantity,
              available: item.quantity,
              locked: 0,
            },
          });

          // 更新SKU成本价
          await tx.productSku.update({
            where: { id: item.skuId },
            data: { costPrice: item.price },
          });
        }

        // 创建入库流水（带成本，便于后续退货反向加权与毛利分析）
        const inUnitCost = Number(item.price);
        await tx.inventoryLog.create({
          data: {
            type: 'IN_PURCHASE',
            skuId: item.skuId,
            warehouseId: receipt.warehouseId,
            quantity: item.quantity,
            before: beforeQty,
            after: afterQty,
            unitCost: inUnitCost,
            costAmount: inUnitCost * item.quantity,
            bizType: 'PURCHASE',
            bizId: receipt.id,
            bizNo: receipt.receiptNo,
            remark: `采购入库: ${receipt.purchase.supplier.name}`,
            createdBy: userId,
          },
        });

        // 3. 更新采购订单明细的已入库数量
        const purchaseItem = receipt.purchase.items.find(
          (pi) => pi.skuId === item.skuId,
        );
        if (purchaseItem) {
          await tx.purchaseItem.update({
            where: { id: purchaseItem.id },
            data: { received: { increment: item.quantity } },
          });
        }
      }

      // 4. 更新采购订单状态
      const allItems = await tx.purchaseItem.findMany({
        where: { purchaseId: receipt.purchaseId },
      });
      const allReceived = allItems.every((item) => item.received >= item.quantity);
      const partialReceived = allItems.some((item) => item.received > 0);

      let newStatus = receipt.purchase.status;
      if (allReceived) {
        newStatus = PurchaseStatus.COMPLETED;
      } else if (partialReceived) {
        newStatus = PurchaseStatus.PARTIAL;
      }

      if (newStatus !== receipt.purchase.status) {
        await tx.purchase.update({
          where: { id: receipt.purchaseId },
          data: { status: newStatus },
        });
      }

      return updatedReceipt;
    });

    return ReceiptDetailVo.fromEntity(result);
  }

  // 取消入库单
  async cancel(id: number, userId: number) {
    const receipt = await this.prisma.purchaseReceipt.findFirst({
      where: { id, deletedAt: null },
    });

    if (!receipt) {
      throw new NotFoundException('入库单不存在');
    }

    if (receipt.status === ReceiptStatus.RECEIVED) {
      throw new ForbiddenException('已入库的入库单不能取消');
    }

    if (receipt.status === ReceiptStatus.CANCELLED) {
      throw new BadRequestException('入库单已取消');
    }

    await this.prisma.purchaseReceipt.update({
      where: { id },
      data: { status: ReceiptStatus.CANCELLED },
    });

    return { success: true };
  }

  // 删除入库单（软删除）
  async remove(id: number) {
    const receipt = await this.prisma.purchaseReceipt.findFirst({
      where: { id, deletedAt: null },
    });

    if (!receipt) {
      throw new NotFoundException('入库单不存在');
    }

    if (receipt.status === ReceiptStatus.RECEIVED) {
      throw new ForbiddenException('已入库的入库单不能删除');
    }

    await this.prisma.purchaseReceipt.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { success: true };
  }
}
