import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import {
  OrderStatus,
  PayStatus,
  PaymentStatus,
  PaymentType,
  ShipStatus,
} from '@prisma/client';
import { CustomerAddressesService } from '@/domains/customer-addresses/customer-addresses.service';
import { CartsService } from '@/domains/carts/carts.service';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { MinioService } from '@/infrastructure/minio/minio.service';
import { CreateMallOrderDto, MallOrderSource } from './dto/create-mall-order.dto';
import {
  MallCreateOrderVo,
  MallOrderDetailVo,
  MallOrderItemVo,
  MallOrderListItemVo,
  MallPayOrderVo,
} from './vo/mall-order.vo';
import { PayMallOrderDto } from './dto/pay-mall-order.dto';
import { QueryMallOrderDto } from './dto/query-mall-order.dto';

function generateMallOrderNo(): string {
  const date = new Date();
  const prefix = 'MO';
  const dateStr =
    date.getFullYear().toString() +
    String(date.getMonth() + 1).padStart(2, '0') +
    String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}${dateStr}${random}`;
}

const MALL_ORDER_EXPIRE_MINUTES = 30;
const EXPIRED_ORDER_SYNC_INTERVAL_MS = 60 * 1000;

@Injectable()
export class MallOrdersService {
  private readonly logger = new Logger(MallOrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly customerAddressesService: CustomerAddressesService,
    private readonly cartsService: CartsService,
    private readonly minioService: MinioService,
  ) {}

  private normalizeSpecs(specs: unknown): Record<string, string> {
    if (Array.isArray(specs)) {
      return specs.reduce((result: Record<string, string>, item: any) => {
        if (item?.name && item?.value) {
          result[item.name] = item.value;
        }
        return result;
      }, {});
    }

    if (specs && typeof specs === 'object') {
      return Object.entries(specs as Record<string, unknown>).reduce((result: Record<string, string>, [key, value]) => {
        if (typeof value === 'string' || typeof value === 'number') {
          result[key] = String(value);
        }
        return result;
      }, {});
    }

    return {};
  }

  private buildExpireAt() {
    return new Date(Date.now() + MALL_ORDER_EXPIRE_MINUTES * 60 * 1000);
  }

  private async getCustomerByUserId(userId: number) {
    const customer = await this.prisma.customer.findFirst({
      where: {
        userId,
        deletedAt: null,
        isEnabled: true,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!customer) {
      throw new NotFoundException('当前用户未绑定客户信息');
    }

    return customer;
  }

  private async releaseOrderInventory(tx: any, orderId: number) {
    const items = await tx.orderItem.findMany({
      where: { orderId },
      select: {
        skuId: true,
        quantity: true,
      },
    });

    for (const item of items) {
      await this.cartsService.releaseSkuInventoryForOrder(tx, item.skuId, item.quantity);
    }
  }

  private async cancelExpiredOrder(tx: any, orderId: number) {
    await this.releaseOrderInventory(tx, orderId);
    await tx.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CANCELLED,
        cancelDate: new Date(),
      },
    });
  }

  private async syncExpiredOrdersByCustomerId(tx: any, customerId: number) {
    const expiredOrders = await tx.order.findMany({
      where: {
        customerId,
        type: 'MALL',
        deletedAt: null,
        status: OrderStatus.PENDING,
        payStatus: PayStatus.UNPAID,
        expireAt: {
          lte: new Date(),
        },
      },
      select: {
        id: true,
      },
    });

    for (const order of expiredOrders) {
      await this.cancelExpiredOrder(tx, order.id);
    }
  }

  async syncExpiredOrders(): Promise<number> {
    return this.prisma.$transaction(async (tx) => {
      const expiredOrders = await tx.order.findMany({
        where: {
          type: 'MALL',
          deletedAt: null,
          status: OrderStatus.PENDING,
          payStatus: PayStatus.UNPAID,
          expireAt: {
            lte: new Date(),
          },
        },
        select: {
          id: true,
        },
      });

      for (const order of expiredOrders) {
        await this.cancelExpiredOrder(tx, order.id);
      }

      return expiredOrders.length;
    });
  }

  @Interval(EXPIRED_ORDER_SYNC_INTERVAL_MS)
  async handleExpiredOrders() {
    try {
      await this.syncExpiredOrders();
    } catch (error) {
      this.logger.error(`同步超时商城订单失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private buildStatusWhere(status?: string) {
    if (!status || status === 'all') {
      return {};
    }

    if (status === 'pending') {
      return {
        status: OrderStatus.PENDING,
        payStatus: PayStatus.UNPAID,
      };
    }

    if (status === 'shipping') {
      return {
        payStatus: PayStatus.PAID,
        shipStatus: ShipStatus.UNSHIPPED,
        status: {
          in: [OrderStatus.CONFIRMED, OrderStatus.PROCESSING],
        },
      };
    }

    if (status === 'receiving') {
      return {
        shipStatus: ShipStatus.SHIPPED,
      };
    }

    if (status === 'completed') {
      return {
        status: OrderStatus.COMPLETED,
      };
    }

    if (status === 'cancelled') {
      return {
        status: OrderStatus.CANCELLED,
      };
    }

    return {};
  }

  private getOrderBaseInclude() {
    return {
      items: {
        include: {
          sku: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  mainImage: true,
                },
              },
            },
          },
        },
      },
      payments: {
        where: {
          deletedAt: null,
          status: PaymentStatus.COMPLETED,
        },
        orderBy: {
          createdAt: 'desc' as const,
        },
        take: 1,
        select: {
          method: true,
        },
      },
    };
  }

  private async toMallOrderItemVo(entity: any): Promise<MallOrderItemVo> {
    return {
      productId: entity.sku?.product?.id || 0,
      skuId: entity.skuId,
      productName: entity.sku?.product?.name || '',
      skuCode: entity.sku?.skuCode || '',
      specs: this.normalizeSpecs(entity.sku?.specs),
      image: await this.minioService.resolveStoredFileUrl(
        entity.sku?.image || entity.sku?.product?.mainImage || null,
      ),
      price: Number(entity.price),
      quantity: entity.quantity,
      amount: Number(entity.amount),
    };
  }

  private async toMallOrderListItemVo(entity: any): Promise<MallOrderListItemVo> {
    const items = await Promise.all(entity.items.map((item: any) => this.toMallOrderItemVo(item)));
    return {
      id: entity.id,
      orderNo: entity.orderNo,
      status: entity.status,
      payStatus: entity.payStatus,
      shipStatus: entity.shipStatus,
      orderDate: entity.orderDate,
      expireAt: entity.expireAt || null,
      totalAmount: Number(entity.totalAmount),
      payable: Number(entity.payable),
      paid: Number(entity.paid),
      itemCount: entity.items.reduce((sum: number, item: any) => sum + item.quantity, 0),
      items,
    };
  }

  private async toMallOrderDetailVo(entity: any): Promise<MallOrderDetailVo> {
    const base = await this.toMallOrderListItemVo(entity);
    return {
      ...base,
      receiverName: entity.receiverName || null,
      receiverPhone: entity.receiverPhone || null,
      receiverAddress: entity.receiverAddress || null,
      discount: Number(entity.discount),
      freight: Number(entity.freight),
      payDate: entity.payDate || null,
      cancelDate: entity.cancelDate || null,
      shipDate: entity.shipDate || null,
      receiveDate: entity.receiveDate || null,
      paymentMethod: entity.payments?.[0]?.method || null,
    };
  }

  async create(userId: number, dto: CreateMallOrderDto): Promise<MallCreateOrderVo> {
    const customer = await this.getCustomerByUserId(userId);

    const selectedAddress = await this.customerAddressesService.findAddressForOrder(
      customer.id,
      dto.addressId,
    );

    if (!selectedAddress) {
      throw new BadRequestException('请选择收货地址');
    }

    const createdOrder = await this.prisma.$transaction(async (tx) => {
      const orderItems: Array<{
        skuId: number;
        quantity: number;
        price: number;
        amount: number;
      }> = [];
      const selectedCartIds: number[] = [];

      if (dto.source === MallOrderSource.CART) {
        const carts = await tx.cart.findMany({
          where: {
            userId,
            selected: true,
          },
          include: {
            sku: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    isEnabled: true,
                    deletedAt: true,
                  },
                },
              },
            },
          },
          orderBy: [{ createdAt: 'desc' }],
        });

        if (!carts.length) {
          throw new BadRequestException('请先选择商品');
        }

        for (const cart of carts) {
          if (
            cart.sku.deletedAt
            || cart.sku.status !== 'ACTIVE'
            || !cart.sku.product?.isEnabled
            || cart.sku.product?.deletedAt
          ) {
            throw new BadRequestException(`商品“${cart.sku.product?.name || cart.sku.skuCode}”已失效`);
          }

          orderItems.push({
            skuId: cart.skuId,
            quantity: cart.quantity,
            price: Number(cart.sku.salePrice),
            amount: Number(cart.sku.salePrice) * cart.quantity,
          });
          selectedCartIds.push(cart.id);
        }
      } else {
        if (!dto.items?.length) {
          throw new BadRequestException('订单商品不能为空');
        }

        for (const item of dto.items) {
          const sku = await tx.productSku.findFirst({
            where: {
              id: item.skuId,
              deletedAt: null,
              status: 'ACTIVE',
              product: {
                isEnabled: true,
                deletedAt: null,
              },
            },
            include: {
              product: {
                select: {
                  name: true,
                },
              },
            },
          });

          if (!sku) {
            throw new NotFoundException(`商品SKU(ID:${item.skuId})不存在或已下架`);
          }

          await this.cartsService.lockSkuInventoryForOrder(tx, item.skuId, item.quantity);

          orderItems.push({
            skuId: item.skuId,
            quantity: item.quantity,
            price: Number(sku.salePrice),
            amount: Number(sku.salePrice) * item.quantity,
          });
        }
      }

      const totalAmount = orderItems.reduce((sum, item) => sum + item.amount, 0);
      const itemCount = orderItems.reduce((sum, item) => sum + item.quantity, 0);

      const order = await tx.order.create({
        data: {
          orderNo: generateMallOrderNo(),
          type: 'MALL',
          customerId: customer.id,
          addressId: selectedAddress.id,
          receiverName: selectedAddress.receiverName,
          receiverPhone: selectedAddress.receiverPhone,
          receiverAddress: [
            selectedAddress.province,
            selectedAddress.city,
            selectedAddress.district,
            selectedAddress.address,
          ]
            .filter(Boolean)
            .join(''),
          totalAmount,
          discount: 0,
          freight: 0,
          payable: totalAmount,
          paid: 0,
          status: OrderStatus.PENDING,
          payStatus: PayStatus.UNPAID,
          shipStatus: ShipStatus.UNSHIPPED,
          orderDate: new Date(),
          expireAt: this.buildExpireAt(),
          createdBy: userId,
          items: {
            create: orderItems.map(item => ({
              skuId: item.skuId,
              quantity: item.quantity,
              price: item.price,
              amount: item.amount,
              shipped: 0,
            })),
          },
        },
      });

      if (selectedCartIds.length) {
        await tx.cart.deleteMany({
          where: {
            id: { in: selectedCartIds },
            userId,
          },
        });
      }

      return {
        id: order.id,
        orderNo: order.orderNo,
        source: dto.source,
        totalAmount: Number(order.totalAmount),
        payable: Number(order.payable),
        itemCount,
        status: order.status,
        payStatus: order.payStatus,
        expireAt: order.expireAt,
      };
    });

    return createdOrder;
  }

  async pay(userId: number, id: number, dto: PayMallOrderDto): Promise<MallPayOrderVo> {
    const customer = await this.getCustomerByUserId(userId);

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: {
          id,
          customerId: customer.id,
          type: 'MALL',
          deletedAt: null,
        },
        include: {
          payments: {
            where: {
              deletedAt: null,
            },
          },
        },
      });

      if (!order) {
        throw new NotFoundException('订单不存在');
      }

      if (order.payStatus === PayStatus.PAID) {
        throw new BadRequestException('订单已支付');
      }

      if (order.status === OrderStatus.CANCELLED) {
        throw new BadRequestException('订单已取消');
      }

      if (order.expireAt && order.expireAt.getTime() <= Date.now()) {
        await this.cancelExpiredOrder(tx, order.id);
        throw new BadRequestException('订单已超时取消');
      }

      const remainingAmount = Math.max(0, Number(order.payable) - Number(order.paid));
      if (remainingAmount <= 0) {
        throw new BadRequestException('订单无需支付');
      }

      await tx.payment.create({
        data: {
          type: PaymentType.RECEIPT,
          bizType: 'SALE',
          orderId: order.id,
          amount: remainingAmount,
          method: dto.method,
          status: PaymentStatus.COMPLETED,
          remark: '商城订单支付',
          createdBy: userId,
        },
      });

      const paidAt = new Date();
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          paid: Number(order.paid) + remainingAmount,
          payStatus: PayStatus.PAID,
          status: OrderStatus.CONFIRMED,
          payDate: paidAt,
        },
      });

      return {
        id: updatedOrder.id,
        orderNo: updatedOrder.orderNo,
        payStatus: updatedOrder.payStatus,
        status: updatedOrder.status,
        paid: Number(updatedOrder.paid),
        payDate: paidAt,
      };
    });
  }

  async findAllByUser(userId: number, query: QueryMallOrderDto): Promise<MallOrderListItemVo[]> {
    const customer = await this.getCustomerByUserId(userId);

    const orders = await this.prisma.$transaction(async (tx) => {
      await this.syncExpiredOrdersByCustomerId(tx, customer.id);

      return tx.order.findMany({
        where: {
          customerId: customer.id,
          type: 'MALL',
          deletedAt: null,
          ...this.buildStatusWhere(query.status),
        },
        include: this.getOrderBaseInclude(),
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    return Promise.all(orders.map(order => this.toMallOrderListItemVo(order)));
  }

  async findOneByUser(userId: number, id: number): Promise<MallOrderDetailVo> {
    const customer = await this.getCustomerByUserId(userId);

    const order = await this.prisma.$transaction(async (tx) => {
      await this.syncExpiredOrdersByCustomerId(tx, customer.id);

      return tx.order.findFirst({
        where: {
          id,
          customerId: customer.id,
          type: 'MALL',
          deletedAt: null,
        },
        include: this.getOrderBaseInclude(),
      });
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    return this.toMallOrderDetailVo(order);
  }

  async cancel(userId: number, id: number): Promise<MallOrderDetailVo> {
    const customer = await this.getCustomerByUserId(userId);

    const order = await this.prisma.$transaction(async (tx) => {
      await this.syncExpiredOrdersByCustomerId(tx, customer.id);

      const existing = await tx.order.findFirst({
        where: {
          id,
          customerId: customer.id,
          type: 'MALL',
          deletedAt: null,
        },
        include: this.getOrderBaseInclude(),
      });

      if (!existing) {
        throw new NotFoundException('订单不存在');
      }

      if (existing.status === OrderStatus.CANCELLED) {
        throw new BadRequestException('订单已取消');
      }

      if (existing.payStatus === PayStatus.PAID) {
        throw new ForbiddenException('已支付订单暂不支持直接取消');
      }

      if (existing.shipStatus !== ShipStatus.UNSHIPPED) {
        throw new ForbiddenException('已发货订单不能取消');
      }

      await this.releaseOrderInventory(tx, existing.id);
      const updated = await tx.order.update({
        where: { id: existing.id },
        data: {
          status: OrderStatus.CANCELLED,
          ...( { cancelDate: new Date() } as any ),
        },
        include: this.getOrderBaseInclude(),
      });

      return updated;
    });

    return this.toMallOrderDetailVo(order);
  }

  async receive(userId: number, id: number): Promise<MallOrderDetailVo> {
    const customer = await this.getCustomerByUserId(userId);

    const updated = await this.prisma.order.updateMany({
      where: {
        id,
        customerId: customer.id,
        type: 'MALL',
        deletedAt: null,
        status: {
          not: OrderStatus.CANCELLED,
        },
        shipStatus: ShipStatus.SHIPPED,
      },
      data: {
        shipStatus: ShipStatus.RECEIVED,
        status: OrderStatus.COMPLETED,
        receiveDate: new Date(),
      },
    });

    if (!updated.count) {
      throw new BadRequestException('当前订单暂不可确认收货');
    }

    return this.findOneByUser(userId, id);
  }
}
