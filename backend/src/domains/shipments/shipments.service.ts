import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { ShipmentItemWithWarehouseDto } from './dto/create-shipment.dto';
import { QueryShipmentDto } from './dto/query-shipment.dto';
import {
  OrderStatus,
  ShipStatus,
  ShipmentStatus,
  Prisma,
} from '@prisma/client';
import { ShipmentVo, ShipmentDetailVo } from './vo/shipment.vo';

// 生成发货单号
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

  // 创建发货单 - 只记录发货计划，不指定仓库
  async create(createDto: CreateShipmentDto, userId: number) {
    const {
      orderId,
      items,
      logisticsCompany,
      trackingNo,
      remark,
    } = createDto;

    // 验证订单
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

    if (order.status !== OrderStatus.CONFIRMED && order.status !== OrderStatus.PROCESSING) {
      throw new ForbiddenException('只能对已确认或处理中的订单创建发货单');
    }

    if (!items || items.length === 0) {
      throw new BadRequestException('发货商品不能为空');
    }

    // 验证每个商品的数量是否超过待发货数量
    for (const item of items) {
      const orderItem = order.items.find((oi) => oi.skuId === item.skuId);
      if (!orderItem) {
        throw new BadRequestException(`商品SKU(ID:${item.skuId})不在订单中`);
      }
      
      const pendingQty = orderItem.quantity - orderItem.shipped;
      if (item.quantity > pendingQty) {
        throw new BadRequestException(
          `商品SKU(ID:${item.skuId})发货数量超过待发货数量(待发货:${pendingQty})`,
        );
      }
    }

    // 创建发货单 - 不绑定仓库
    const shipment = await this.prisma.shipment.create({
      data: {
        shipmentNo: generateShipmentNo(),
        orderId,
        warehouseId: 0, // 暂时设为0，表示未指定仓库
        logisticsCompany,
        trackingNo,
        status: ShipmentStatus.PENDING,
        remark,
        createdBy: userId,
        items: {
          create: items.map((item) => ({
            skuId: item.skuId,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        order: {
          select: {
            orderNo: true,
            customer: { select: { name: true } },
          },
        },
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

    return ShipmentDetailVo.fromEntity(shipment);
  }

  // 查询发货单列表
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
          order: {
            select: {
              orderNo: true,
              customer: { select: { name: true } },
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

  // 查询发货单详情
  async findOne(id: number) {
    const shipment = await this.prisma.shipment.findFirst({
      where: { id, deletedAt: null },
      include: {
        order: {
          select: {
            orderNo: true,
            customer: { select: { id: true, name: true } },
          },
        },
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

    if (!shipment) {
      throw new NotFoundException('发货单不存在');
    }

    return ShipmentDetailVo.fromEntity(shipment);
  }

  // 确认发货 - 此时才指定仓库并扣减库存
  async ship(id: number, itemsWithWarehouse: ShipmentItemWithWarehouseDto[], userId: number) {
    const shipment = await this.prisma.shipment.findFirst({
      where: { id, deletedAt: null },
      include: {
        items: true,
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

    if (!itemsWithWarehouse || itemsWithWarehouse.length === 0) {
      throw new BadRequestException('请指定每个商品的出库仓库');
    }

    // 验证每个商品的仓库和库存
    for (const item of itemsWithWarehouse) {
      // 验证仓库是否存在
      const warehouse = await this.prisma.warehouse.findUnique({
        where: { id: item.warehouseId },
      });
      if (!warehouse) {
        throw new NotFoundException(`仓库(ID:${item.warehouseId})不存在`);
      }

      // 验证该仓库的库存
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

    // 使用事务执行发货操作
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. 更新发货单状态（使用第一个仓库作为主仓库，或者保持为0）
      const mainWarehouseId = itemsWithWarehouse[0]?.warehouseId || 0;
      const updatedShipment = await tx.shipment.update({
        where: { id },
        data: { 
          status: ShipmentStatus.SHIPPED,
          warehouseId: mainWarehouseId, // 记录主仓库
        },
        include: {
          order: {
            select: {
              orderNo: true,
              customer: { select: { name: true } },
            },
          },
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

      // 2. 从各自仓库扣减库存，并更新订单明细的已发货数量
      for (const item of itemsWithWarehouse) {
        // 获取当前库存
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

        // 扣减指定仓库的库存
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

        // 创建出库流水
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

        // 更新订单明细的已发货数量
        const shipmentItem = shipment.items.find(si => si.skuId === item.skuId);
        if (shipmentItem) {
          const orderItem = shipment.order.items.find(
            (oi) => oi.skuId === item.skuId,
          );
          if (orderItem) {
            await tx.orderItem.update({
              where: { id: orderItem.id },
              data: { shipped: { increment: item.quantity } },
            });
          }
        }
      }

      // 3. 更新订单状态和发货状态
      const allItems = await tx.orderItem.findMany({
        where: { orderId: shipment.orderId },
      });
      const allShipped = allItems.every((item) => item.shipped >= item.quantity);
      const partialShipped = allItems.some((item) => item.shipped > 0);

      let newShipStatus = shipment.order.shipStatus;
      let newOrderStatus = shipment.order.status;

      if (allShipped) {
        newShipStatus = ShipStatus.SHIPPED;
        newOrderStatus = OrderStatus.SHIPPED;
      } else if (partialShipped) {
        newShipStatus = ShipStatus.PARTIAL;
        newOrderStatus = OrderStatus.PROCESSING;
      }

      if (
        newShipStatus !== shipment.order.shipStatus ||
        newOrderStatus !== shipment.order.status
      ) {
        await tx.order.update({
          where: { id: shipment.orderId },
          data: {
            shipStatus: newShipStatus,
            status: newOrderStatus,
            shipDate: newShipStatus === ShipStatus.SHIPPED ? new Date() : undefined,
          },
        });
      }

      return updatedShipment;
    });

    return ShipmentDetailVo.fromEntity(result);
  }

  // 确认收货
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
        order: {
          select: {
            orderNo: true,
            customer: { select: { name: true } },
          },
        },
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

    // 更新订单状态为已完成
    await this.prisma.order.update({
      where: { id: shipment.orderId },
      data: {
        status: OrderStatus.COMPLETED,
        receiveDate: new Date(),
      },
    });

    return ShipmentDetailVo.fromEntity(updated);
  }

  // 删除发货单（软删除）
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
