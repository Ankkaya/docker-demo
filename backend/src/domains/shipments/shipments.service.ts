import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { QueryShipmentDto } from './dto/query-shipment.dto';
import {
  OrderStatus,
  ShipStatus,
  ShipmentStatus,
  OrderType,
  Prisma,
} from '@prisma/client';
import { ShipmentVo, ShipmentDetailVo } from './vo/shipment.vo';
import { CartsService } from '@/domains/carts/carts.service';

function generateShipmentNo(): string {
  const date = new Date();
  const prefix = 'FH';
  const dateStr =
    date.getFullYear().toString() +
    String(date.getMonth() + 1).padStart(2, '0') +
    String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}${dateStr}${random}`;
}

@Injectable()
export class ShipmentsService {
  constructor(
    private prisma: PrismaService,
    private cartsService: CartsService,
  ) {}

  async create(createDto: CreateShipmentDto, userId: number) {
    const { orderId, items, logisticsCompany, trackingNo, remark } = createDto;
    if (!items || items.length === 0) {
      throw new BadRequestException('发货商品不能为空');
    }
    if (new Set(items.map((item) => item.skuId)).size !== items.length) {
      throw new BadRequestException('同一SKU不能在一张发货单中重复');
    }

    const shipment = await this.prisma.serializableTransaction(async (tx) => {
      const order = await tx.order.findFirst({ where: { id: orderId, deletedAt: null }, include: { items: true } });
      if (!order) throw new NotFoundException('订单不存在');
      const canShipStatus = order.status === OrderStatus.CONFIRMED || order.status === OrderStatus.PROCESSING;
      const canShipProgress = order.shipStatus === ShipStatus.UNSHIPPED || order.shipStatus === ShipStatus.PARTIAL;
      if (!canShipStatus || !canShipProgress) throw new ForbiddenException('只能对待发货或部分发货订单创建发货单');
      if (order.type === OrderType.MALL && order.payStatus !== 'PAID') {
        throw new ForbiddenException('商城订单必须支付完成后才能发货');
      }

      const allocated = await tx.shipmentItem.groupBy({
        by: ['skuId'],
        where: { shipment: { orderId, deletedAt: null, status: ShipmentStatus.PENDING } },
        _sum: { quantity: true },
      });
      const allocatedBySku = new Map(allocated.map((row) => [row.skuId, row._sum.quantity ?? 0]));
      const isMallOrder = order.type === OrderType.MALL;
      for (const shipmentItem of items) {
        const orderItem = order.items.find((item) => item.skuId === shipmentItem.skuId);
        if (!orderItem) throw new BadRequestException(`商品SKU(ID:${shipmentItem.skuId})不在订单中`);
        const remaining = orderItem.quantity - orderItem.shipped - (allocatedBySku.get(shipmentItem.skuId) ?? 0);
        if (shipmentItem.quantity > remaining) {
          throw new BadRequestException(`商品SKU(ID:${shipmentItem.skuId})发货数量超过可分配数量(可分配:${remaining})`);
        }
        const warehouse = await tx.warehouse.findFirst({ where: { id: shipmentItem.warehouseId, deletedAt: null, isEnabled: true } });
        if (!warehouse) throw new NotFoundException(`仓库(ID:${shipmentItem.warehouseId})不存在或已禁用`);
        const inventory = await tx.inventory.findUnique({ where: { skuId_warehouseId: { skuId: shipmentItem.skuId, warehouseId: shipmentItem.warehouseId } } });
        const stockOnHand = isMallOrder ? (inventory?.quantity ?? 0) : (inventory?.available ?? 0);
        if (!inventory || stockOnHand < shipmentItem.quantity) {
          const label = isMallOrder ? '物理库存' : '可用库存';
          throw new BadRequestException(`商品SKU(ID:${shipmentItem.skuId})在仓库[${warehouse.name}]${label}不足(${label}:${stockOnHand})`);
        }
      }

      return tx.shipment.create({
      data: {
        shipmentNo: generateShipmentNo(),
        orderId,
        warehouseId: items[0].warehouseId,
        logisticsCompany,
        trackingNo,
        status: ShipmentStatus.PENDING,
        remark,
        createdBy: userId,
        items: {
          create: items.map(item => ({
            skuId: item.skuId,
            warehouseId: item.warehouseId,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        warehouse: true,
        order: {
          select: {
            orderNo: true,
            customer: { select: { name: true } },
          },
        },
        items: {
          include: {
            warehouse: true,
            sku: {
              include: {
                product: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
      });
    });

    return ShipmentDetailVo.fromEntity(shipment);
  }

  async findAll(query: QueryShipmentDto) {
    const { keyword, orderId, status, page = 1, pageSize = 10 } = query;

    const where: Prisma.ShipmentWhereInput = {
      deletedAt: null,
    };

    if (keyword) {
      where.shipmentNo = { contains: keyword };
    }

    if (orderId) {
      where.orderId = orderId;
    }

    if (status) {
      where.status = status as ShipmentStatus;
    }

    const [data, total] = await Promise.all([
      this.prisma.shipment.findMany({
        where,
        include: {
          warehouse: true,
          order: {
            select: {
              orderNo: true,
              customer: { select: { name: true } },
            },
          },
          items: {
            include: {
              warehouse: {
                select: { name: true },
              },
            },
          },
          _count: {
            select: { items: true },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.shipment.count({ where }),
    ]);

    return {
      data: ShipmentVo.fromEntities(data),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findOne(id: number) {
    const shipment = await this.prisma.shipment.findFirst({
      where: { id, deletedAt: null },
      include: {
        warehouse: true,
        order: {
          select: {
            orderNo: true,
            customer: { select: { id: true, name: true } },
          },
        },
        items: {
          include: {
            warehouse: true,
            sku: {
              include: {
                product: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });

    if (!shipment) {
      throw new NotFoundException('发货单不存在');
    }

    return ShipmentDetailVo.fromEntity(shipment);
  }

  async ship(id: number, userId: number) {
    const shipment = await this.prisma.shipment.findFirst({
      where: { id, deletedAt: null },
      include: {
        items: {
          include: {
            warehouse: true,
          },
        },
        order: {
          include: {
            items: true,
            customer: { select: { name: true } },
          },
        },
      },
    });

    if (!shipment) {
      throw new NotFoundException('发货单不存在');
    }

    if (shipment.status !== ShipmentStatus.PENDING) {
      throw new ForbiddenException('只有待发货的发货单可以确认发货');
    }

    if (!shipment.items.length) {
      throw new BadRequestException('发货单没有可发货商品');
    }

    const isMallOrder = shipment.order.type === OrderType.MALL;

    for (const item of shipment.items) {
      const warehouse = await this.prisma.warehouse.findFirst({
        where: { id: item.warehouseId, deletedAt: null },
      });
      if (!warehouse) {
        throw new NotFoundException(`仓库(ID:${item.warehouseId})不存在`);
      }

      const inventory = await this.prisma.inventory.findUnique({
        where: {
          skuId_warehouseId: {
            skuId: item.skuId,
            warehouseId: item.warehouseId,
          },
        },
      });

      // MALL 订单已锁定 locked，本仓物理库存(quantity)足够即可
      // SALE 订单未锁定，需要本仓 available 足够
      const stockOnHand = isMallOrder
        ? (inventory?.quantity || 0)
        : (inventory?.available || 0);
      if (!inventory || stockOnHand < item.quantity) {
        const label = isMallOrder ? '物理库存' : '可用库存';
        throw new BadRequestException(
          `商品SKU(ID:${item.skuId})在仓库[${warehouse.name}]${label}不足(${label}:${stockOnHand})`,
        );
      }
    }

    const result = await this.prisma.serializableTransaction(async (tx) => {
      const claimed = await tx.shipment.updateMany({
        where: { id, deletedAt: null, status: ShipmentStatus.PENDING },
        data: {
          status: ShipmentStatus.SHIPPED,
          warehouseId: shipment.items[0].warehouseId,
        },
      });
      if (claimed.count !== 1) throw new ForbiddenException('只有待发货的发货单可以确认发货');
      const updatedShipment = await tx.shipment.findUniqueOrThrow({
        where: { id },
        include: {
          warehouse: true,
          order: {
            select: {
              orderNo: true,
              customer: { select: { name: true } },
            },
          },
          items: {
            include: {
              warehouse: true,
              sku: {
                include: {
                  product: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
      });

      for (const item of shipment.items) {
        // MALL 订单：先释放该 SKU 的 locked（跨仓贪心），把可用度还原后再走标准扣减
        // 这样可以避免「lock 已扣 available」与「ship 再扣 available」叠加导致 available 跑负
        if (isMallOrder) {
          await this.cartsService.releaseSkuInventoryForOrder(tx, item.skuId, item.quantity);
        }

        const inventory = await tx.inventory.findUnique({
          where: {
            skuId_warehouseId: {
              skuId: item.skuId,
              warehouseId: item.warehouseId,
            },
          },
        });

        const beforeQty = inventory?.quantity || 0;
        const afterQty = beforeQty - item.quantity;

        // 原子条件扣减：仅当 quantity & available 同时充足才生效，杜绝 oversell
        const decResult = await tx.inventory.updateMany({
          where: {
            skuId: item.skuId,
            warehouseId: item.warehouseId,
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
            `商品SKU(ID:${item.skuId})在仓库(ID:${item.warehouseId})库存不足，并发扣减失败`,
          );
        }

        // 抓取出库时的成本快照（用于销售退货回入库时按原成本加权重算）
        const sku = await tx.productSku.findUnique({
          where: { id: item.skuId },
          select: { costPrice: true },
        });
        const unitCost = Number(sku?.costPrice || 0);
        const costAmount = -unitCost * item.quantity;

        await tx.shipmentItem.update({
          where: { id: item.id },
          data: { costSnapshot: unitCost },
        });

        await tx.inventoryLog.create({
          data: {
            type: 'OUT_SALE',
            skuId: item.skuId,
            warehouseId: item.warehouseId,
            quantity: -item.quantity,
            before: beforeQty,
            after: afterQty,
            unitCost,
            costAmount,
            bizType: 'SALE',
            bizId: shipment.id,
            bizNo: shipment.shipmentNo,
            remark: `销售出库: ${shipment.order.customer.name}`,
            createdBy: userId,
          },
        });

        const orderItem = shipment.order.items.find(oi => oi.skuId === item.skuId);
        if (orderItem) {
          await tx.orderItem.update({
            where: { id: orderItem.id },
            data: { shipped: { increment: item.quantity } },
          });
        }
      }

      const currentItems = await tx.orderItem.findMany({ where: { orderId: shipment.orderId } });
      const allShipped = currentItems.every((item) => item.shipped >= item.quantity);
      const anyShipped = currentItems.some((item) => item.shipped > 0);
      await tx.order.update({
        where: { id: shipment.orderId },
        data: {
          shipStatus: allShipped ? ShipStatus.SHIPPED : anyShipped ? ShipStatus.PARTIAL : ShipStatus.UNSHIPPED,
          status: allShipped ? OrderStatus.SHIPPED : OrderStatus.PROCESSING,
          shipDate: new Date(),
        },
      });

      return updatedShipment;
    });

    return ShipmentDetailVo.fromEntity(result);
  }

  async receive(id: number, userId: number) {
    const shipment = await this.prisma.shipment.findFirst({
      where: { id, deletedAt: null },
    });

    if (!shipment) {
      throw new NotFoundException('发货单不存在');
    }

    if (shipment.status !== ShipmentStatus.SHIPPED) {
      throw new ForbiddenException('只有已发货的发货单可以确认收货');
    }

    const updated = await this.prisma.serializableTransaction(async (tx) => {
      const claimed = await tx.shipment.updateMany({
        where: { id, deletedAt: null, status: ShipmentStatus.SHIPPED },
        data: { status: ShipmentStatus.RECEIVED },
      });
      if (claimed.count !== 1) throw new ForbiddenException('只有已发货的发货单可以确认收货');

      const activeShipments = await tx.shipment.findMany({
        where: { orderId: shipment.orderId, deletedAt: null, status: { not: ShipmentStatus.CANCELLED } },
        select: { status: true },
      });
      const order = await tx.order.findUniqueOrThrow({ where: { id: shipment.orderId } });
      if (order.shipStatus === ShipStatus.SHIPPED && activeShipments.every((row) => row.status === ShipmentStatus.RECEIVED)) {
        await tx.order.update({
          where: { id: shipment.orderId },
          data: { status: OrderStatus.COMPLETED, shipStatus: ShipStatus.RECEIVED, receiveDate: new Date() },
        });
      }

      return tx.shipment.findUniqueOrThrow({
        where: { id },
        include: {
          warehouse: true,
          order: { select: { orderNo: true, customer: { select: { name: true } } } },
          items: { include: { warehouse: true, sku: { include: { product: { select: { id: true, name: true } } } } } },
        },
      });
    });

    return ShipmentDetailVo.fromEntity(updated);
  }

  async remove(id: number) {
    const shipment = await this.prisma.shipment.findFirst({
      where: { id, deletedAt: null },
    });

    if (!shipment) {
      throw new NotFoundException('发货单不存在');
    }

    if (shipment.status === ShipmentStatus.SHIPPED || shipment.status === ShipmentStatus.RECEIVED) {
      throw new ForbiddenException('已发货或已收货的发货单不能删除');
    }

    await this.prisma.shipment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { success: true };
  }
}
