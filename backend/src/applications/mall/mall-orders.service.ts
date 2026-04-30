import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import {
  BalanceAccountStatus,
  BalanceLogType,
  CouponReceiveStatus,
  OrderStatus,
  OrderType,
  PaymentMethod,
  PaymentRefundStatus,
  PayStatus,
  PaymentStatus,
  PaymentType,
  ShipStatus,
} from '@prisma/client';
import { CustomerAddressesService } from '@/domains/customer-addresses/customer-addresses.service';
import { CartsService } from '@/domains/carts/carts.service';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { MinioService } from '@/infrastructure/minio/minio.service';
import { CouponAutoGrantService } from '@/domains/coupons/coupon-auto-grant.service';
import { CreateMallOrderDto, MallOrderSource } from './dto/create-mall-order.dto';
import {
  MallCreateOrderVo,
  MallOrderDetailVo,
  MallOrderItemVo,
  MallOrderListItemVo,
  MallOrderListResponseVo,
  MallPayOrderVo,
} from './vo/mall-order.vo';
import { PayMallOrderDto } from './dto/pay-mall-order.dto';
import { QueryMallOrderDto } from './dto/query-mall-order.dto';
import { WechatMiniProgramPayParams, WechatPayService, WechatTransactionResource } from './wechat-pay.service';
import { D, addMoney, subMoney, subMoneyClampZero, sumMoney, toYuan, yuanToFen } from '@/common/utils/money';

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
const MAX_AUTO_WECHAT_PAYMENT_QUERY_COUNT = 10;

@Injectable()
export class MallOrdersService {
  private readonly logger = new Logger(MallOrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly customerAddressesService: CustomerAddressesService,
    private readonly cartsService: CartsService,
    private readonly minioService: MinioService,
    private readonly wechatPayService: WechatPayService,
    private readonly couponAutoGrantService: CouponAutoGrantService,
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

  private toRefundStatus(status?: string | null) {
    switch (status) {
      case 'SUCCESS':
        return PaymentRefundStatus.SUCCESS;
      case 'CLOSED':
        return PaymentRefundStatus.CLOSED;
      case 'ABNORMAL':
        return PaymentRefundStatus.ABNORMAL;
      default:
        return PaymentRefundStatus.PROCESSING;
    }
  }

  private async generateRefundNo() {
    const now = new Date();
    const pad = (value: number, length = 2) => String(value).padStart(length, '0');
    const datePart = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const latest = await this.prisma.paymentRefund.findFirst({
      where: {
        refundNo: {
          startsWith: `TK${datePart}`,
        },
      },
      orderBy: {
        refundNo: 'desc',
      },
      select: {
        refundNo: true,
      },
    });

    const sequence = latest ? Number(latest.refundNo.slice(-3)) + 1 : 1;
    return `TK${datePart}${String(sequence).padStart(3, '0')}`;
  }

  private async applyMallOrderRefundSuccess(tx: any, order: any, refundAmount: number, refundedAt: Date) {
    const nextPaid = subMoneyClampZero(order.paid, refundAmount);
    await tx.order.update({
      where: { id: order.id },
      data: {
        paid: nextPaid,
        payStatus: PayStatus.REFUNDED,
        status: OrderStatus.REFUNDED,
        cancelDate: refundedAt,
      },
    });
  }

  private async refundMallBalancePayment(tx: any, order: any, payment: any, customerId: number, userId: number) {
    const amount = Number(payment.amount || 0);
    const account = await this.ensureBalanceAccount(tx, customerId);
    const refundNo = await this.generateRefundNo();
    const refundedAt = new Date();
    const balanceBefore = D(account.availableBalance);
    const balanceAfter = balanceBefore.add(amount);

    await tx.balanceAccount.update({
      where: { id: account.id },
      data: {
        availableBalance: balanceAfter,
        totalRefunded: addMoney(account.totalRefunded, amount),
      },
    });

    await tx.balanceLog.create({
      data: {
        accountId: account.id,
        customerId,
        type: BalanceLogType.REFUND,
        changeAmount: amount,
        balanceBefore,
        balanceAfter,
        bizType: 'MALL_ORDER_CANCEL',
        bizId: order.id,
        bizNo: order.orderNo,
        remark: '商城订单取消退款',
        createdBy: userId,
      },
    });

    await tx.paymentRefund.create({
      data: {
        refundNo,
        paymentId: payment.id,
        orderId: order.id,
        amount,
        reason: '用户取消已支付未发货订单',
        status: PaymentRefundStatus.SUCCESS,
        successAt: refundedAt,
        createdBy: userId,
      },
    });

    await this.applyMallOrderRefundSuccess(tx, order, amount, refundedAt);
  }

  private async refundMallWechatPayment(tx: any, order: any, payment: any, userId: number) {
    if (!payment.outTradeNo || !payment.thirdTradeNo || payment.status !== PaymentStatus.COMPLETED) {
      throw new BadRequestException('当前支付记录暂不支持取消退款');
    }

    const processingRefund = Array.isArray(payment.refunds)
      ? payment.refunds.find((item: any) => item.status === PaymentRefundStatus.PROCESSING)
      : null;
    if (processingRefund) {
      throw new BadRequestException('当前订单退款处理中，请稍后查看');
    }

    const successRefund = Array.isArray(payment.refunds)
      ? payment.refunds.find((item: any) => item.status === PaymentRefundStatus.SUCCESS)
      : null;
    if (successRefund) {
      throw new BadRequestException('当前订单已退款成功');
    }

    const refundNo = await this.generateRefundNo();
    const reason = '用户取消已支付未发货订单';
    const remote = await this.wechatPayService.createRefund({
      outTradeNo: payment.outTradeNo,
      outRefundNo: refundNo,
      amount: Number(payment.amount),
      refundAmount: Number(payment.amount),
      reason,
    });
    const nextStatus = this.toRefundStatus(remote.status);
    const refundedAt = nextStatus === PaymentRefundStatus.SUCCESS && remote.success_time
      ? new Date(remote.success_time)
      : new Date();

    await tx.paymentRefund.create({
      data: {
        refundNo,
        paymentId: payment.id,
        orderId: order.id,
        amount: payment.amount,
        reason,
        status: nextStatus,
        thirdRefundNo: remote.refund_id || null,
        thirdStatus: remote.status || null,
        successAt: nextStatus === PaymentRefundStatus.SUCCESS ? refundedAt : null,
        createdBy: userId,
      },
    });

    if (nextStatus === PaymentRefundStatus.SUCCESS) {
      await this.applyMallOrderRefundSuccess(tx, order, Number(payment.amount), refundedAt);
      return;
    }

    await tx.order.update({
      where: { id: order.id },
      data: {
        payStatus: PayStatus.REFUNDING,
        status: OrderStatus.REFUNDING,
        cancelDate: new Date(),
      },
    });
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

  private async markOrderPaymentCompleted(tx: any, order: any, payment: any, paidAt: Date) {
    const completedOrder = await tx.order.updateMany({
      where: {
        id: order.id,
        payStatus: {
          not: PayStatus.PAID,
        },
      },
      data: {
        paid: {
          increment: Number(payment.amount),
        },
        payStatus: PayStatus.PAID,
        status: OrderStatus.CONFIRMED,
        payDate: paidAt,
      },
    });

    if (completedOrder.count > 0 && order.couponReceiveId) {
      const couponReceive = await tx.couponReceive.findUnique({
        where: { id: order.couponReceiveId },
        select: {
          id: true,
          couponId: true,
        },
      });

      if (couponReceive) {
        const claimedCoupon = await tx.couponReceive.updateMany({
          where: {
            id: couponReceive.id,
            status: {
              not: CouponReceiveStatus.USED,
            },
          },
          data: {
            status: CouponReceiveStatus.USED,
            usedAt: paidAt,
          },
        });

        if (claimedCoupon.count > 0) {
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

    if (completedOrder.count > 0) {
      await this.couponAutoGrantService.grantOrderCoupons(tx, order.customerId, order.id, paidAt);
    }

    return tx.order.findUniqueOrThrow({
      where: { id: order.id },
    });
  }

  private async ensureBalanceAccount(tx: any, customerId: number) {
    const existing = await tx.balanceAccount.findUnique({
      where: { customerId },
    });

    if (existing) {
      return existing;
    }

    return tx.balanceAccount.create({
      data: {
        customerId,
        status: BalanceAccountStatus.ACTIVE,
      },
    });
  }

  private async payOrderByBalance(userId: number, customerId: number, order: any, amount: number) {
    return this.prisma.$transaction(async (tx) => {
      const latestOrder = await tx.order.findFirst({
        where: {
          id: order.id,
          customerId,
          type: 'MALL',
          deletedAt: null,
        },
      });

      if (!latestOrder) {
        throw new NotFoundException('订单不存在');
      }

      if (latestOrder.payStatus === PayStatus.PAID) {
        throw new BadRequestException('订单已支付');
      }

      if (latestOrder.status === OrderStatus.CANCELLED) {
        throw new BadRequestException('订单已取消');
      }

      if (latestOrder.expireAt && latestOrder.expireAt.getTime() <= Date.now()) {
        await this.cancelExpiredOrder(tx, latestOrder.id);
        throw new BadRequestException('订单已超时取消');
      }

      const account = await this.ensureBalanceAccount(tx, customerId);
      if (account.status !== BalanceAccountStatus.ACTIVE) {
        throw new BadRequestException('余额账户已停用');
      }

      const availableBalance = D(account.availableBalance);
      if (availableBalance.lt(amount)) {
        throw new BadRequestException(`余额不足，当前可用余额${availableBalance.toFixed(2)}元`);
      }

      await this.closeWechatPaymentIfPending(tx, latestOrder.id);

      const paidAt = new Date();
      const payment = await tx.payment.create({
        data: {
          type: PaymentType.RECEIPT,
          bizType: 'SALE',
          orderId: latestOrder.id,
          amount,
          method: PaymentMethod.BALANCE,
          status: PaymentStatus.COMPLETED,
          thirdStatus: 'SUCCESS',
          paidAt,
          remark: '商城订单余额支付',
          createdBy: userId,
        },
      });

      const afterBalance = subMoney(availableBalance, amount);
      await tx.balanceAccount.update({
        where: { id: account.id },
        data: {
          availableBalance: afterBalance,
          totalConsumed: addMoney(account.totalConsumed, amount),
        },
      });

      await tx.balanceLog.create({
        data: {
          accountId: account.id,
          customerId,
          type: BalanceLogType.CONSUME,
          changeAmount: amount,
          balanceBefore: availableBalance,
          balanceAfter: afterBalance,
          bizType: 'MALL_ORDER',
          bizId: latestOrder.id,
          bizNo: latestOrder.orderNo,
          remark: '商城订单余额支付',
          createdBy: userId,
        },
      });

      const nextOrder = await this.markOrderPaymentCompleted(tx, latestOrder, payment, paidAt);

      return {
        order: nextOrder,
        payment,
      };
    });
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
      const successPaymentData = {
        status: PaymentStatus.COMPLETED,
        thirdTradeNo: resource.transaction_id || payment.thirdTradeNo,
        tradeType: resource.trade_type || payment.tradeType,
        thirdStatus: resource.trade_state || 'SUCCESS',
        paidAt,
        failReason: null,
        ...(rawPayload !== undefined
          ? {
              notifyAt: new Date(),
              notifyPayload: rawPayload as any,
            }
          : {}),
      };

      const claimedPayment = await tx.payment.updateMany({
        where: {
          id: payment.id,
          status: {
            not: PaymentStatus.COMPLETED,
          },
        },
        data: successPaymentData,
      });

      const nextPayment = claimedPayment.count > 0
        ? await tx.payment.findUniqueOrThrow({
            where: { id: payment.id },
          })
        : await tx.payment.update({
            where: { id: payment.id },
            data: {
              thirdTradeNo: resource.transaction_id || payment.thirdTradeNo,
              tradeType: resource.trade_type || payment.tradeType,
              thirdStatus: resource.trade_state || 'SUCCESS',
              failReason: null,
              ...(rawPayload !== undefined
                ? {
                    notifyAt: new Date(),
                    notifyPayload: rawPayload as any,
                  }
                : {}),
            },
          });

      const nextOrder = await this.markOrderPaymentCompleted(tx, payment.order, nextPayment, paidAt);

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
    const payments = await tx.payment.findMany({
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

    if (!payments.length) {
      return;
    }

    for (const payment of payments) {
      if (!payment.outTradeNo) {
        continue;
      }

      try {
        await this.wechatPayService.closeOrder(payment.outTradeNo);
      } catch (error) {
        this.logger.warn(`关闭微信支付单失败[${payment.outTradeNo}]: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    await tx.payment.updateMany({
      where: {
        id: {
          in: payments.map(item => item.id),
        },
      },
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
        payStatus: PayStatus.UNPAID,
        status: {
          notIn: [OrderStatus.CANCELLED, OrderStatus.COMPLETED],
        },
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
          payStatus: PayStatus.UNPAID,
          status: {
            notIn: [OrderStatus.CANCELLED, OrderStatus.COMPLETED],
          },
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
          queryCount: {
            lt: MAX_AUTO_WECHAT_PAYMENT_QUERY_COUNT,
          },
          order: {
            is: {
              deletedAt: null,
              type: 'MALL',
              status: {
                not: OrderStatus.CANCELLED,
              },
              payStatus: {
                not: PayStatus.PAID,
              },
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

      await this.prisma.payment.updateMany({
        where: {
          deletedAt: null,
          method: PaymentMethod.WECHAT,
          status: PaymentStatus.PENDING,
          outTradeNo: {
            not: null,
          },
          queryCount: {
            gte: MAX_AUTO_WECHAT_PAYMENT_QUERY_COUNT,
          },
          failReason: null,
          order: {
            is: {
              deletedAt: null,
              type: 'MALL',
              status: {
                not: OrderStatus.CANCELLED,
              },
              payStatus: {
                not: PayStatus.PAID,
              },
            },
          },
        },
        data: {
          failReason: `待支付微信单自动补查已达${MAX_AUTO_WECHAT_PAYMENT_QUERY_COUNT}次，已停止自动查单`,
        },
      });
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
        status: {
          in: [OrderStatus.SHIPPED],
        },
      };
    }

    if (status === 'completed') {
      return {
        status: OrderStatus.COMPLETED,
      };
    }

    if (status === 'cancelled') {
      return {
        status: {
          in: [OrderStatus.CANCELLED, OrderStatus.REFUNDING, OrderStatus.REFUNDED],
        },
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
          reviews: {
            where: {
              deletedAt: null,
            },
            select: {
              id: true,
              userId: true,
            },
          },
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
      shipments: {
        where: { deletedAt: null },
        orderBy: {
          createdAt: 'desc' as const,
        },
        take: 1,
        select: {
          shipmentNo: true,
          logisticsCompany: true,
          trackingNo: true,
          status: true,
        },
      },
    };
  }

  private async toMallOrderItemVo(entity: any): Promise<MallOrderItemVo> {
    const reviewed = Array.isArray(entity.reviews) && entity.reviews.length > 0;
    const canReview =
      !reviewed
      && (
        entity.order?.status === OrderStatus.COMPLETED
        || entity.order?.shipStatus === ShipStatus.RECEIVED
      );

    return {
      orderItemId: entity.id,
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
      reviewed,
      canReview,
    };
  }

  private async toMallOrderListItemVo(entity: any): Promise<MallOrderListItemVo> {
    const items = await Promise.all(entity.items.map((item: any) => this.toMallOrderItemVo({
      ...item,
      order: {
        status: entity.status,
        shipStatus: entity.shipStatus,
      },
    })));
    const reviewedItemCount = items.filter(item => item.reviewed).length;
    const pendingReviewItemCount = items.filter(item => item.canReview).length;
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
      hasPendingReview: pendingReviewItemCount > 0,
      reviewedItemCount,
      pendingReviewItemCount,
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
      logisticsCompany: entity.shipments?.[0]?.logisticsCompany || null,
      trackingNo: entity.shipments?.[0]?.trackingNo || null,
      shipmentNo: entity.shipments?.[0]?.shipmentNo || null,
    };
  }

  private async resolveCouponDiscount(
    tx: any,
    customerId: number,
    couponReceiveId: number | undefined,
    totalAmount: number,
    orderItems: Array<{ skuId: number; quantity: number; price: number; amount: number }>,
  ) {
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
    const eligibleAmount = await this.resolveCouponEligibleAmount(tx, receive.coupon, orderItems);
    if (eligibleAmount <= 0) {
      throw new BadRequestException('当前订单中没有商品满足该优惠券使用范围');
    }
    if (eligibleAmount < thresholdAmount) {
      throw new BadRequestException(`订单金额未达到优惠券使用门槛：满${thresholdAmount.toFixed(2)}元可用`);
    }
    if (receive.usedOrder?.id && receive.usedOrder.status !== OrderStatus.CANCELLED && !receive.usedOrder.deletedAt) {
      throw new BadRequestException('该优惠券已被其他订单占用');
    }

    const discount = this.calculateCouponDiscount(receive.coupon, eligibleAmount);

    return {
      discount: Math.min(totalAmount, discount),
      couponReceiveId: receive.id,
      couponName: receive.coupon.name,
    };
  }

  private async resolveCouponEligibleAmount(
    tx: any,
    coupon: any,
    orderItems: Array<{ skuId: number; quantity: number; price: number; amount: number }>,
  ) {
    if (coupon.useScopeType === 'ALL') {
      return orderItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    }

    const skuIds = orderItems.map(item => item.skuId);
    const skus = await tx.productSku.findMany({
      where: {
        id: { in: skuIds },
      },
      select: {
        id: true,
        productId: true,
        product: {
          select: {
            categoryId: true,
            brandId: true,
          },
        },
      },
    });

    const skuMap = new Map<number, any>(skus.map((item: any) => [item.id, item] as [number, any]));
    const rule = coupon.useRuleJson && typeof coupon.useRuleJson === 'object'
      ? coupon.useRuleJson as Record<string, any>
      : {};
    const targetIds = new Set<number>(
      (Array.isArray(
        coupon.useScopeType === 'CATEGORY'
          ? rule.categoryIds
          : coupon.useScopeType === 'BRAND'
            ? rule.brandIds
            : coupon.useScopeType === 'PRODUCT'
              ? rule.productIds
              : rule.skuIds,
      )
        ? (
            coupon.useScopeType === 'CATEGORY'
              ? rule.categoryIds
              : coupon.useScopeType === 'BRAND'
                ? rule.brandIds
                : coupon.useScopeType === 'PRODUCT'
                  ? rule.productIds
                  : rule.skuIds
          )
        : []
      ).map((item: any) => Number(item)),
    );

    return orderItems.reduce((sum, item) => {
      const sku = skuMap.get(item.skuId);
      if (!sku) {
        return sum;
      }

      const matched = coupon.useScopeType === 'CATEGORY'
        ? targetIds.has(Number(sku.product?.categoryId))
        : coupon.useScopeType === 'BRAND'
          ? targetIds.has(Number(sku.product?.brandId))
          : coupon.useScopeType === 'PRODUCT'
            ? targetIds.has(Number(sku.productId))
            : targetIds.has(Number(sku.id));

      return matched ? sum + Number(item.amount || 0) : sum;
    }, 0);
  }

  private calculateCouponDiscount(coupon: any, eligibleAmount: number) {
    if (coupon.type === 'DISCOUNT') {
      const discountRate = Number(coupon.discountRate || 100);
      const discount = eligibleAmount * (100 - discountRate) / 100;
      const maxDiscountAmount = coupon.maxDiscountAmount === null || coupon.maxDiscountAmount === undefined
        ? null
        : Number(coupon.maxDiscountAmount);
      return Math.max(0, maxDiscountAmount === null ? discount : Math.min(discount, maxDiscountAmount));
    }

    if (coupon.type === 'INSTANT_REDUCTION') {
      return Math.min(eligibleAmount, Number(coupon.discountAmount || 0));
    }

    return Math.min(eligibleAmount, Number(coupon.discountAmount || 0));
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
                mallInfo: true,
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
            price: Number(cart.sku.mallInfo?.salePrice ?? cart.sku.salePrice),
            amount: Number(cart.sku.mallInfo?.salePrice ?? cart.sku.salePrice) * cart.quantity,
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
              mallInfo: true,
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
            price: Number(sku.mallInfo?.salePrice ?? sku.salePrice),
            amount: Number(sku.mallInfo?.salePrice ?? sku.salePrice) * item.quantity,
          });
        }
      }

      // 使用 Decimal 累加避免浮点误差，再转为 number 供优惠券 API 使用
      const totalAmount = toYuan(sumMoney(orderItems, (item) => item.amount));
      const itemCount = orderItems.reduce((sum, item) => sum + item.quantity, 0);
      const couponDiscount = await this.resolveCouponDiscount(
        tx,
        customer.id,
        dto.couponReceiveId,
        totalAmount,
        orderItems,
      );
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

    const remainingAmount = toYuan(subMoneyClampZero(order.payable, order.paid));
    if (remainingAmount <= 0) {
      throw new BadRequestException('订单无需支付');
    }

    if (dto.method === PaymentMethod.BALANCE) {
      const paid = await this.payOrderByBalance(userId, customer.id, order, remainingAmount);
      return this.buildMallPayOrderVo(paid.order, paid.payment);
    }

    if (dto.method !== PaymentMethod.WECHAT) {
      throw new BadRequestException('当前仅支持微信支付或余额支付');
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
        amount: true,
      },
    });

    if (!payment) {
      return false;
    }

    if (resource.trade_state === 'SUCCESS') {
      // 安全校验：回调金额（分）必须与本地支付单金额一致，防止串单/篡改
      const expectedFen = yuanToFen(payment.amount);
      const actualFen = resource.amount?.total;
      if (actualFen !== expectedFen) {
        this.logger.error(
          `微信支付回调金额不一致 outTradeNo=${resource.out_trade_no} 本地=${expectedFen}分 回调=${actualFen}分`,
        );
        throw new BadRequestException('回调金额与支付单金额不一致');
      }
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

  async findAllByUser(userId: number, query: QueryMallOrderDto): Promise<MallOrderListResponseVo> {
    const customer = await this.getCustomerByUserId(userId);
    const page = Number(query.page || 1);
    const pageSize = Number(query.pageSize || 10);

    const result = await this.prisma.$transaction(async (tx) => {
      await this.syncExpiredOrdersByCustomerId(tx, customer.id);

      const where = {
        customerId: customer.id,
        type: OrderType.MALL,
        deletedAt: null,
        ...this.buildStatusWhere(query.status),
      };

      const [total, orders] = await Promise.all([
        tx.order.count({ where }),
        tx.order.findMany({
          where,
          include: this.getOrderBaseInclude(),
          orderBy: {
            createdAt: 'desc',
          },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
      ]);

      return { total, orders };
    });

    const data = await Promise.all(result.orders.map(order => this.toMallOrderListItemVo(order)));

    return {
      data,
      meta: {
        page,
        pageSize,
        total: result.total,
        totalPages: Math.ceil(result.total / pageSize),
      },
    };
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

      if (existing.status === OrderStatus.REFUNDING || existing.payStatus === PayStatus.REFUNDING) {
        throw new BadRequestException('当前订单退款处理中');
      }

      if (existing.status === OrderStatus.REFUNDED || existing.payStatus === PayStatus.REFUNDED) {
        throw new BadRequestException('当前订单已退款');
      }

      if (existing.shipStatus !== ShipStatus.UNSHIPPED) {
        throw new ForbiddenException('已发货订单不能取消');
      }

      await this.closeWechatPaymentIfPending(tx, existing.id);
      await this.releaseOrderInventory(tx, existing.id);

      if (existing.payStatus === PayStatus.PAID) {
        const payment = await tx.payment.findFirst({
          where: {
            orderId: existing.id,
            deletedAt: null,
            status: PaymentStatus.COMPLETED,
          },
          include: {
            refunds: {
              orderBy: {
                createdAt: 'desc',
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        if (!payment) {
          throw new BadRequestException('未找到可退款的支付记录');
        }

        if (payment.method === PaymentMethod.BALANCE) {
          await this.refundMallBalancePayment(tx, existing, payment, customer.id, userId);
        } else if (payment.method === PaymentMethod.WECHAT) {
          await this.refundMallWechatPayment(tx, existing, payment, userId);
        } else {
          throw new BadRequestException('当前支付方式暂不支持取消退款');
        }

        return tx.order.findFirstOrThrow({
          where: {
            id: existing.id,
            customerId: customer.id,
            type: 'MALL',
            deletedAt: null,
          },
          include: this.getOrderBaseInclude(),
        });
      }

      await this.releaseOrderCoupon(tx, existing.id);
      return tx.order.update({
        where: { id: existing.id },
        data: {
          status: OrderStatus.CANCELLED,
          ...( { cancelDate: new Date() } as any ),
        },
        include: this.getOrderBaseInclude(),
      });
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

  async remove(userId: number, id: number) {
    const customer = await this.getCustomerByUserId(userId);

    await this.prisma.$transaction(async (tx) => {
      await this.syncExpiredOrdersByCustomerId(tx, customer.id);

      const existing = await tx.order.findFirst({
        where: {
          id,
          customerId: customer.id,
          type: 'MALL',
          deletedAt: null,
        },
      });

      if (!existing) {
        throw new NotFoundException('订单不存在');
      }

      if (
        existing.status !== OrderStatus.CANCELLED
        && existing.status !== OrderStatus.COMPLETED
        && existing.status !== OrderStatus.REFUNDED
      ) {
        throw new ForbiddenException('当前订单状态不支持删除');
      }

      await tx.order.update({
        where: { id: existing.id },
        data: { deletedAt: new Date() },
      });
    });

    return { success: true };
  }
}
