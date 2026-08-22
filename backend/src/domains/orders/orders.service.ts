import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { CustomerAddressesService } from '@/domains/customer-addresses/customer-addresses.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { QueryOrderDto } from './dto/query-order.dto';
import { OrderStatus, PayStatus, ShipStatus, Prisma } from '@prisma/client';
import { OrderVo, OrderDetailVo } from './vo/order.vo';

// 生成订单号
function generateOrderNo(): string {
  const date = new Date();
  const prefix = 'SO';
  const dateStr =
    date.getFullYear().toString() +
    String(date.getMonth() + 1).padStart(2, '0') +
    String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}${dateStr}${random}`;
}

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private customerAddressesService: CustomerAddressesService,
  ) {}

  // 创建销售订单
  async create(createDto: CreateOrderDto, userId: number) {
    const {
      customerId,
      addressId,
      items,
      discount = 0,
      freight = 0,
      receiverName,
      receiverPhone,
      receiverAddress,
      remark,
    } = createDto;

    // 验证客户
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) {
      throw new NotFoundException('客户不存在');
    }

    const selectedAddress = await this.customerAddressesService.findAddressForOrder(
      customerId,
      addressId,
    );

    const finalReceiverName = selectedAddress?.receiverName || receiverName;
    const finalReceiverPhone = selectedAddress?.receiverPhone || receiverPhone;
    const finalReceiverAddress = selectedAddress
      ? [selectedAddress.province, selectedAddress.city, selectedAddress.district, selectedAddress.address]
          .filter(Boolean)
          .join('')
      : receiverAddress;

    if (!items || items.length === 0) {
      throw new BadRequestException('订单商品不能为空');
    }

    // 计算总金额并验证库存
    let totalAmount = 0;
    for (const item of items) {
      const sku = await this.prisma.productSku.findFirst({
        where: { id: item.skuId, deletedAt: null },
        include: { product: true },
      });
      if (!sku) {
        throw new NotFoundException(`商品SKU(ID:${item.skuId})不存在`);
      }

      // 检查库存
      const inventories = await this.prisma.inventory.findMany({
        where: { skuId: item.skuId },
      });
      const totalAvailable = inventories.reduce((sum, inv) => sum + inv.available, 0);
      if (totalAvailable < item.quantity) {
        throw new BadRequestException(
          `商品SKU(ID:${item.skuId})库存不足(可用:${totalAvailable})`,
        );
      }

      totalAmount += item.quantity * item.price;
    }

    const payable = totalAmount + freight - discount;

    // 创建订单
    const order = await this.prisma.order.create({
      data: {
        orderNo: generateOrderNo(),
        type: 'SALE',
        customerId,
        addressId: selectedAddress?.id,
        receiverName: finalReceiverName,
        receiverPhone: finalReceiverPhone,
        receiverAddress: finalReceiverAddress,
        totalAmount,
        discount,
        freight,
        payable,
        paid: 0,
        status: OrderStatus.PENDING,
        payStatus: PayStatus.UNPAID,
        shipStatus: ShipStatus.UNSHIPPED,
        orderDate: new Date(),
        remark,
        createdBy: userId,
        items: {
          create: items.map((item) => ({
            skuId: item.skuId,
            quantity: item.quantity,
            price: item.price,
            amount: item.quantity * item.price,
            shipped: 0,
          })),
        },
      },
      include: {
        customer: { select: { id: true, name: true } },
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

    return OrderDetailVo.fromEntity(order);
  }

  // 查询订单列表
  async findAll(query: QueryOrderDto) {
    const {
      keyword,
      customerId,
      status,
      payStatus,
      shipStatus,
      page = 1,
      pageSize = 10,
    } = query;

    const where: Prisma.OrderWhereInput = {
      deletedAt: null,
    };

    if (keyword) {
      where.orderNo = { contains: keyword };
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (status) {
      where.status = status as OrderStatus;
    }

    if (payStatus) {
      where.payStatus = payStatus as PayStatus;
    }

    if (shipStatus) {
      where.shipStatus = shipStatus as ShipStatus;
    }

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true } },
          _count: {
            select: { items: true },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: OrderVo.fromEntities(data),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  // 查询订单详情
  async findOne(id: number) {
    const order = await this.prisma.order.findFirst({
      where: { id, deletedAt: null },
      include: {
        customer: { select: { id: true, name: true, phone: true, address: true } },
        items: {
          include: {
            sku: {
              include: {
                product: { select: { id: true, name: true } },
              },
            },
          },
        },
        shipments: {
          where: { deletedAt: null },
          select: {
            id: true,
            shipmentNo: true,
            status: true,
            logisticsCompany: true,
            trackingNo: true,
            createdAt: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    return OrderDetailVo.fromEntity(order);
  }

  // 更新订单（仅在待处理状态可更新）
  async update(id: number, updateDto: UpdateOrderDto) {
    const existing = await this.prisma.order.findFirst({
      where: { id, deletedAt: null },
      include: { items: true },
    });

    if (!existing) {
      throw new NotFoundException('订单不存在');
    }

    if (existing.type === 'MALL') {
      throw new ForbiddenException('商城订单不允许通过后台通用接口修改');
    }

    if (existing.status !== OrderStatus.PENDING) {
      throw new ForbiddenException('只有待处理的订单可以修改');
    }

    const { items, ...otherData } = updateDto;

    // 使用事务更新
    const updated = await this.prisma.$transaction(async (tx) => {
      // 计算新的金额
      let totalAmount = Number(existing.totalAmount);
      let discount = otherData.discount !== undefined ? otherData.discount : Number(existing.discount);
      let freight = otherData.freight !== undefined ? otherData.freight : Number(existing.freight);

      // 如果更新了明细，重新计算金额
      if (items && items.length > 0) {
        totalAmount = 0;
        for (const item of items) {
          totalAmount += item.quantity * item.price;
        }

        // 删除旧明细
        await tx.orderItem.deleteMany({
          where: { orderId: id },
        });

        // 创建新明细
        await tx.orderItem.createMany({
          data: items.map((item) => ({
            orderId: id,
            skuId: item.skuId,
            quantity: item.quantity,
            price: item.price,
            amount: item.quantity * item.price,
            shipped: 0,
          })),
        });
      }

      const payable = totalAmount + freight - discount;

      // 更新订单
      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          ...otherData,
          totalAmount,
          discount,
          freight,
          payable,
        },
        include: {
          customer: { select: { id: true, name: true } },
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

      return updatedOrder;
    });

    return OrderDetailVo.fromEntity(updated);
  }

  // 确认订单
  async confirm(id: number, userId: number) {
    const existing = await this.prisma.order.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('订单不存在');
    }

    if (existing.type === 'MALL') {
      throw new ForbiddenException('商城订单由支付流程自动确认');
    }

    const claimed = await this.prisma.order.updateMany({
      where: { id, deletedAt: null, status: OrderStatus.PENDING },
      data: { status: OrderStatus.CONFIRMED },
    });
    if (claimed.count !== 1) {
      throw new ForbiddenException('只有待处理的订单可以确认');
    }
    const updated = await this.prisma.order.findUniqueOrThrow({
      where: { id },
      include: {
        customer: { select: { id: true, name: true } },
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

    return OrderDetailVo.fromEntity(updated);
  }

  // 取消订单
  async cancel(id: number, userId: number) {
    const existing = await this.prisma.order.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('订单不存在');
    }

    if (existing.type === 'MALL') {
      throw new ForbiddenException('商城订单必须通过商城取消/退款流程处理');
    }

    const cancellable: OrderStatus[] = [OrderStatus.PENDING, OrderStatus.CONFIRMED];
    if (!cancellable.includes(existing.status) || existing.shipStatus !== 'UNSHIPPED') {
      throw new ForbiddenException('只有未发货的待处理或已确认订单可以取消');
    }
    const activeShipment = await this.prisma.shipment.findFirst({
      where: { orderId: id, deletedAt: null, status: { not: 'CANCELLED' } },
      select: { id: true },
    });
    if (activeShipment) throw new ForbiddenException('订单已有有效发货单，请先处理发货单');

    const claimed = await this.prisma.order.updateMany({
      where: { id, deletedAt: null, status: { in: cancellable }, shipStatus: 'UNSHIPPED' },
      data: {
        status: OrderStatus.CANCELLED,
        ...( { cancelDate: new Date() } as any ),
      },
    });
    if (claimed.count !== 1) throw new ForbiddenException('订单状态已变更，无法取消');
    const updated = await this.prisma.order.findUniqueOrThrow({
      where: { id },
      include: {
        customer: { select: { id: true, name: true } },
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

    return OrderDetailVo.fromEntity(updated);
  }

  // 删除订单（软删除）
  async remove(id: number) {
    const existing = await this.prisma.order.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('订单不存在');
    }

    if (existing.type === 'MALL') {
      throw new ForbiddenException('商城订单不允许通过后台通用接口删除');
    }

    if (existing.status !== OrderStatus.PENDING && existing.status !== OrderStatus.CANCELLED) {
      throw new ForbiddenException('只有待处理或已取消的订单可以删除');
    }
    const activeShipment = await this.prisma.shipment.findFirst({
      where: { orderId: id, deletedAt: null, status: { not: 'CANCELLED' } },
      select: { id: true },
    });
    if (activeShipment) throw new ForbiddenException('已创建发货单的订单不能删除');

    await this.prisma.order.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { success: true };
  }
}
