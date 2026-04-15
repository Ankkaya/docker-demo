import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import {
  CouponReceiveStatus,
  OrderStatus,
  PaymentMethod,
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
import { WechatMiniProgramPayParams, WechatPayService, WechatTransactionResource } from './wechat-pay.service';

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
const PENDING_WECHAT_PAYMENT_SYNC_INTERVAL_MS = 5 * 60 * 1000;

@Injectable()
export class MallOrdersService {
  private readonly logger = new Logger(MallOrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly customerAddressesService: CustomerAddressesService,
    private readonly cartsService: CartsService,
    private readonly minioService: MinioService,
    private readonly wechatPayService: WechatPayService,
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

  private generateOutTradeNo(orderNo: string) {
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `${orderNo}${random}`.slice(0, 32);
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

  private async getWechatPayerInfo(userId: number) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
      select: {
        id: true,
        wechatOpenId: true,
      },
    });

    if (!user?.wechatOpenId) {
      throw new BadRequestException('当前账号未绑定微信 OpenID，请先使用微信登录');
    }

    return {
      userId: user.id,
      openId: user.wechatOpenId,
    };
  }

  private getLatestPayment(order: any) {
    if (!Array.isArray(order.payments) || !order.payments.length) {
      return null;
    }

    return [...order.payments].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
  }

  private buildMallPayOrderVo(order: any, payment: any, paymentConfig?: WechatMiniProgramPayParams | null): MallPayOrderVo {
    return {
      paymentId: payment?.id || null,
      id: order.id,
      orderNo: order.orderNo,
      payStatus: order.payStatus,
      status: order.status,
      paid: Number(order.paid),
      paymentStatus: payment?.status || (order.payStatus === PayStatus.PAID ? PaymentStatus.COMPLETED : PaymentStatus.PENDING),
      method: payment?.method || null,
      outTradeNo: payment?.outTradeNo || null,
      payDate: order.payDate || payment?.paidAt || null,
      paymentConfig: paymentConfig || null,
    };
  }

  private async markWechatPaymentSuccessByOutTradeNo(
    outTradeNo: string,
    resource: Partial<WechatTransactionResource>,
    rawPayload?: unknown,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findFirst({
        where: {
          outTradeNo,
          deletedAt: null,
        },
        include: {
          order: true,
        },
      });

      if (!payment?.order) {
        throw new NotFoundException('支付单不存在');
      }

      const paidAt = resource.success_time ? new Date(resource.success_time) : new Date();
      const nextPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.COMPLETED,
          thirdTradeNo: resource.transaction_id || payment.thirdTradeNo,
          tradeType: resource.trade_type || payment.tradeType,
          thirdStatus: resource.trade_state || 'SUCCESS',
          notifyAt: rawPayload !== undefined ? new Date() : payment.notifyAt,
          paidAt,
          failReason: null,
          notifyPayload: rawPayload !== undefined ? (rawPayload as any) : payment.notifyPayload,
        },
      });

      const shouldUpdateOrder = payment.order.payStatus !== PayStatus.PAID;
      const nextOrder = shouldUpdateOrder
        ? await tx.order.update({
            where: { id: payment.order.id },
            data: {
              paid: Number(payment.order.paid) + Number(payment.amount),
              payStatus: PayStatus.PAID,
              status: OrderStatus.CONFIRMED,
              payDate: paidAt,
            },
          })
        : payment.order;

      if (shouldUpdateOrder && payment.order.couponReceiveId) {
        const couponReceive = await tx.couponReceive.findUnique({
          where: { id: payment.order.couponReceiveId },
          select: {
            id: true,
            couponId: true,
            status: true,
          },
        });

        if (couponReceive) {
          await tx.couponReceive.update({
            where: { id: couponReceive.id },
            data: {
              status: CouponReceiveStatus.USED,
              usedAt: paidAt,
            },
          });

          if (couponReceive.status !== CouponReceiveStatus.USED) {
            await tx.coupon.update({
              where: { id: couponReceive.couponId },
              data: {
                usedCount: {
                  increment: 1,
                },
              },
            });
          }
        }
      }

      return {
        order: nextOrder,
        payment: nextPayment,
      };
    });
  }

  private async syncWechatPaymentByOrder(order: any) {
    const latestPayment = this.getLatestPayment(order);
    if (!latestPayment || latestPayment.method !== PaymentMethod.WECHAT || latestPayment.status === PaymentStatus.COMPLETED || !latestPayment.outTradeNo) {
      return {
        order,
        payment: latestPayment,
      };
    }

    const remote = await this.wechatPayService.queryOrder(latestPayment.outTradeNo);
    await this.prisma.payment.update({
      where: { id: latestPayment.id },
      data: {
        thirdStatus: remote.trade_state || latestPayment.thirdStatus,
        thirdTradeNo: remote.transaction_id || latestPayment.thirdTradeNo,
        lastQueryAt: new Date(),
        queryCount: {
          increment: 1,
        },
      },
    });

    if (remote.trade_state === 'SUCCESS') {
      return this.markWechatPaymentSuccessByOutTradeNo(latestPayment.outTradeNo, {
        out_trade_no: latestPayment.outTradeNo,
        transaction_id: remote.transaction_id,
        trade_state: remote.trade_state,
      });
    }

    const refreshedPayment = await this.prisma.payment.findUnique({
      where: { id: latestPayment.id },
    });

    return {
      order,
      payment: refreshedPayment,
    };
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

  private async closeWechatPaymentIfPending(tx: any, orderId: number) {
    const payment = await tx.payment.findFirst({
      where: {
        orderId,
        deletedAt: null,
        method: PaymentMethod.WECHAT,
        status: PaymentStatus.PENDING,
        outTradeNo: {
          not: null,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!payment?.outTradeNo) {
      return;
    }

    try {
      await this.wechatPayService.closeOrder(payment.outTradeNo);
    } catch (error) {
      this.logger.warn(`关闭微信支付单失败[${payment.outTradeNo}]: ${error instanceof Error ? error.message : String(error)}`);
    }

    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.CANCELLED,
        thirdStatus: 'CLOSED',
        failReason: '订单取消或超时关闭',
      },
    });
  }

  private async cancelExpiredOrder(tx: any, orderId: number) {
    const existing = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        payments: {
          where: {
            deletedAt: null,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (existing) {
      const latestPayment = this.getLatestPayment(existing);
      if (latestPayment?.method === PaymentMethod.WECHAT && latestPayment.status === PaymentStatus.PENDING && latestPayment.outTradeNo) {
        const synced = await this.syncWechatPaymentByOrder(existing);
        if (synced.order.payStatus === PayStatus.PAID) {
          return;
        }
      }
    }

    await this.closeWechatPaymentIfPending(tx, orderId);
    await this.releaseOrderInventory(tx, orderId);
    await this.releaseOrderCoupon(tx, orderId);
    await tx.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CANCELLED,
        cancelDate: new Date(),
      },
    });
  }

  private async releaseOrderCoupon(tx: any, orderId: number) {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: {
        couponReceiveId: true,
        payStatus: true,
      },
    });

    if (!order?.couponReceiveId || order.payStatus === PayStatus.PAID) {
      return;
    }

    await tx.order.update({
      where: { id: orderId },
      data: {
        couponReceiveId: null,
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

  @Interval(PENDING_WECHAT_PAYMENT_SYNC_INTERVAL_MS)
  async handlePendingWechatPayments() {
    try {
      const pendingPayments = await this.prisma.payment.findMany({
        where: {
          deletedAt: null,
          method: PaymentMethod.WECHAT,
          status: PaymentStatus.PENDING,
          outTradeNo: {
            not: null,
          },
          order: {
            is: {
              deletedAt: null,
              type: 'MALL',
            },
          },
        },
        include: {
          order: {
            include: {
              payments: true,
            },
          },
        },
        take: 20,
        orderBy: {
          createdAt: 'asc',
        },
      });

      for (const payment of pendingPayments) {
        await this.syncWechatPaymentByOrder(payment.order);
      }
    } catch (error) {
      this.logger.error(`同步待确认微信支付失败: ${error instanceof Error ? error.message : String(error)}`);
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
      couponReceive: {
        include: {
          coupon: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
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
      couponReceiveId: entity.couponReceiveId || null,
      couponName: entity.couponReceive?.coupon?.name || null,
    };
  }

  private async resolveCouponDiscount(tx: any, customerId: number, couponReceiveId: number | undefined, totalAmount: number) {
    if (!couponReceiveId) {
      return {
        discount: 0,
        couponReceiveId: null,
        couponName: null,
      };
    }

    const receive = await tx.couponReceive.findFirst({
      where: {
        id: couponReceiveId,
        customerId,
        deletedAt: null,
      },
      include: {
        coupon: true,
        usedOrder: {
          select: {
            id: true,
            status: true,
            deletedAt: true,
          },
        },
      },
    });

    if (!receive?.coupon) {
      throw new BadRequestException('优惠券不存在');
    }

    const now = new Date();
    if (receive.status !== CouponReceiveStatus.UNUSED) {
      throw new BadRequestException('该优惠券当前不可使用');
    }
    if (receive.validFrom > now || receive.validTo < now) {
      throw new BadRequestException('优惠券不在可用时间内');
    }

    const thresholdAmount = Number(receive.coupon.thresholdAmount || 0);
    const discountAmount = Number(receive.coupon.discountAmount || 0);
    if (totalAmount < thresholdAmount) {
      throw new BadRequestException(`订单金额未达到优惠券使用门槛：满${thresholdAmount.toFixed(2)}元可用`);
    }
    if (receive.usedOrder?.id && receive.usedOrder.status !== OrderStatus.CANCELLED && !receive.usedOrder.deletedAt) {
      throw new BadRequestException('该优惠券已被其他订单占用');
    }

    return {
      discount: Math.min(totalAmount, discountAmount),
      couponReceiveId: receive.id,
      couponName: receive.coupon.name,
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
      const couponDiscount = await this.resolveCouponDiscount(tx, customer.id, dto.couponReceiveId, totalAmount);
      const payable = Math.max(0, totalAmount - couponDiscount.discount);

      const order = await tx.order.create({
        data: {
          orderNo: generateMallOrderNo(),
          type: 'MALL',
          customerId: customer.id,
          addressId: selectedAddress.id,
          couponReceiveId: couponDiscount.couponReceiveId,
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
          discount: couponDiscount.discount,
          freight: 0,
          payable,
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
        discount: Number(order.discount),
        payable: Number(order.payable),
        couponReceiveId: order.couponReceiveId || null,
        couponName: couponDiscount.couponName,
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

    const order = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.order.findFirst({
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
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

      if (!existing) {
        throw new NotFoundException('订单不存在');
      }

      if (existing.payStatus === PayStatus.PAID) {
        throw new BadRequestException('订单已支付');
      }

      if (existing.status === OrderStatus.CANCELLED) {
        throw new BadRequestException('订单已取消');
      }

      if (existing.expireAt && existing.expireAt.getTime() <= Date.now()) {
        await this.cancelExpiredOrder(tx, existing.id);
        throw new BadRequestException('订单已超时取消');
      }

      return existing;
    });

    const remainingAmount = Math.max(0, Number(order.payable) - Number(order.paid));
    if (remainingAmount <= 0) {
      throw new BadRequestException('订单无需支付');
    }

    if (dto.method !== PaymentMethod.WECHAT) {
      throw new BadRequestException('当前阶段仅支持微信支付');
    }

    const payer = await this.getWechatPayerInfo(userId);
    let payment = this.getLatestPayment(order);

    if (!payment || payment.status !== PaymentStatus.PENDING || payment.method !== PaymentMethod.WECHAT) {
      payment = await this.prisma.payment.create({
        data: {
          type: PaymentType.RECEIPT,
          bizType: 'SALE',
          orderId: order.id,
          amount: remainingAmount,
          method: PaymentMethod.WECHAT,
          status: PaymentStatus.PENDING,
          outTradeNo: this.generateOutTradeNo(order.orderNo),
          remark: '商城订单微信支付',
          createdBy: payer.userId,
        },
      });
    }

    let paymentConfig: WechatMiniProgramPayParams;
    if (payment.prepayId) {
      paymentConfig = await this.wechatPayService.buildClientPayParams(payment.prepayId);
    } else {
      const created = await this.wechatPayService.createMiniProgramOrder({
        description: `商城订单${order.orderNo}`,
        outTradeNo: payment.outTradeNo!,
        amount: remainingAmount,
        payerOpenId: payer.openId,
      });
      paymentConfig = created.payParams;
      payment = await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          prepayId: created.prepayId,
          tradeType: 'JSAPI',
          thirdStatus: 'NOTPAY',
          failReason: null,
        },
      });
    }

    return this.buildMallPayOrderVo(order, payment, paymentConfig);
  }

  async getPaymentStatusByUser(userId: number, id: number): Promise<MallPayOrderVo> {
    const customer = await this.getCustomerByUserId(userId);
    const order = await this.prisma.order.findFirst({
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
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    const synced = await this.syncWechatPaymentByOrder(order);
    return this.buildMallPayOrderVo(synced.order, synced.payment);
  }

  async handleWechatPayNotify(rawBody: string, headers: { serial?: string; nonce?: string; signature?: string; timestamp?: string }) {
    const resource = await this.wechatPayService.verifyAndDecryptNotify(rawBody, headers);
    if (!resource.out_trade_no) {
      throw new BadRequestException('微信支付回调缺少商户订单号');
    }

    const payment = await this.prisma.payment.findFirst({
      where: {
        outTradeNo: resource.out_trade_no,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!payment) {
      return false;
    }

    if (resource.trade_state === 'SUCCESS') {
      await this.markWechatPaymentSuccessByOutTradeNo(resource.out_trade_no, resource, JSON.parse(rawBody || '{}'));
      return true;
    }

    await this.prisma.payment.updateMany({
      where: {
        outTradeNo: resource.out_trade_no,
        deletedAt: null,
      },
      data: {
        thirdTradeNo: resource.transaction_id || null,
        thirdStatus: resource.trade_state || null,
        notifyAt: new Date(),
        notifyPayload: JSON.parse(rawBody || '{}'),
      },
    });
    return true;
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

      await this.closeWechatPaymentIfPending(tx, existing.id);
      await this.releaseOrderInventory(tx, existing.id);
      await this.releaseOrderCoupon(tx, existing.id);
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
