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
  Prisma,
} from '@prisma/client';
import { ShipmentVo, ShipmentDetailVo } from './vo/shipment.vo';

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
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateShipmentDto, userId: number) {
    const { orderId, items, logisticsCompany, trackingNo, remark } = createDto;

    const order = await this.prisma.order.findFirst({
      where: { id: orderId, deletedAt: null },
      include: {
        items: true,
        customer: { select: { id: true, name: true } },
      },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    if (order.status !== OrderStatus.CONFIRMED || order.shipStatus !== ShipStatus.UNSHIPPED) {
      throw new ForbiddenException('只能对待发货订单创建发货单');
    }

    if (!items || items.length === 0) {
      throw new BadRequestException('发货商品不能为空');
    }

    const existingShipment = await this.prisma.shipment.findFirst({
      where: {
        orderId,
        deletedAt: null,
      },
    });

    if (existingShipment) {
      throw new BadRequestException('该订单已创建发货单');
    }

    const pendingItems = order.items.filter(item => item.quantity - item.shipped > 0);
    if (pendingItems.length === 0) {
      throw new BadRequestException('订单中没有可发货商品');
    }

    if (items.length !== pendingItems.length) {
      throw new BadRequestException('发货商品必须与订单待发货商品一致');
    }

    for (const orderItem of pendingItems) {
      const shipmentItem = items.find(item => item.skuId === orderItem.skuId);
      if (!shipmentItem) {
        throw new BadRequestException(`商品SKU(ID:${orderItem.skuId})缺少发货仓库`);
      }

      const pendingQty = orderItem.quantity - orderItem.shipped;
      if (shipmentItem.quantity !== pendingQty) {
        throw new BadRequestException(
          `商品SKU(ID:${orderItem.skuId})发货数量必须等于待发货数量(待发货:${pendingQty})`,
        );
      }

      const warehouse = await this.prisma.warehouse.findFirst({
        where: {
          id: shipmentItem.warehouseId,
          deletedAt: null,
          isEnabled: true,
        },
      });
      if (!warehouse) {
        throw new NotFoundException(`仓库(ID:${shipmentItem.warehouseId})不存在或已禁用`);
      }

      const inventory = await this.prisma.inventory.findUnique({
        where: {
          skuId_warehouseId: {
            skuId: shipmentItem.skuId,
            warehouseId: shipmentItem.warehouseId,
          },
        },
      });

      if (!inventory || inventory.available < shipmentItem.quantity) {
        throw new BadRequestException(
          `商品SKU(ID:${shipmentItem.skuId})在仓库[${warehouse.name}]库存不足(可用:${inventory?.available || 0})`,
        );
      }
    }

    const shipment = await this.prisma.shipment.create({
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

      if (!inventory || inventory.available < item.quantity) {
        throw new BadRequestException(
          `商品SKU(ID:${item.skuId})在仓库[${warehouse.name}]库存不足(可用:${inventory?.available || 0})`,
        );
      }
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedShipment = await tx.shipment.update({
        where: { id },
        data: {
          status: ShipmentStatus.SHIPPED,
          warehouseId: shipment.items[0].warehouseId,
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

      for (const item of shipment.items) {
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

        await tx.inventory.updateMany({
          where: {
            skuId: item.skuId,
            warehouseId: item.warehouseId,
          },
          data: {
            quantity: { decrement: item.quantity },
            available: { decrement: item.quantity },
          },
        });

        await tx.inventoryLog.create({
          data: {
            type: 'OUT_SALE',
            skuId: item.skuId,
            warehouseId: item.warehouseId,
            quantity: -item.quantity,
            before: beforeQty,
            after: afterQty,
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

      await tx.order.update({
        where: { id: shipment.orderId },
        data: {
          shipStatus: ShipStatus.SHIPPED,
          status: OrderStatus.SHIPPED,
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

    const updated = await this.prisma.shipment.update({
      where: { id },
      data: { status: ShipmentStatus.RECEIVED },
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

    await this.prisma.order.update({
      where: { id: shipment.orderId },
      data: {
        status: OrderStatus.COMPLETED,
        receiveDate: new Date(),
      },
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
