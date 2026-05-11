import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { WechatPayService, WechatRefundNotifyResource } from '@/applications/mall/wechat-pay.service';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreatePaymentRefundDto } from './dto/create-payment-refund.dto';
import { QueryPaymentDto } from './dto/query-payment.dto';
import { QueryPaymentRefundDto } from './dto/query-payment-refund.dto';
import { BalanceLogType, OrderStatus, PaymentMethod, PaymentRefundStatus, PaymentStatus, PaymentType, PayStatus, Prisma, PurchaseStatus } from '@prisma/client';
import { PaymentRefundVo } from './vo/payment-refund.vo';
import { PaymentVo } from './vo/payment.vo';
import {
  D,
  addMoney,
  subMoney,
  subMoneyClampZero,
  sumMoney,
  toYuan,
  yuanToFen,
  moneyGt,
  moneyLt,
} from '@/common/utils/money';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private wechatPayService: WechatPayService,
  ) {}

  // 创建收付款记录
  async create(createDto: CreatePaymentDto, userId: number) {
    const { type, bizType, bizId, amount, method, remark } = createDto;

    // 验证业务单据
    let orderNo = '';
    if (bizType === 'PURCHASE') {
      const purchase = await this.prisma.purchase.findFirst({
        where: { id: bizId, deletedAt: null },
      });
      if (!purchase) {
        throw new NotFoundException('采购订单不存在');
      }
      orderNo = purchase.orderNo;

      // 验证付款金额
      if (type === PaymentType.PAYMENT) {
        const remaining = subMoney(purchase.payable, purchase.paid);
        if (moneyGt(amount, remaining)) {
          throw new BadRequestException(`付款金额超过未付金额(未付:${remaining.toFixed(2)})`);
        }
      }
    } else if (bizType === 'SALE') {
      const order = await this.prisma.order.findFirst({
        where: { id: bizId, deletedAt: null },
      });
      if (!order) {
        throw new NotFoundException('销售订单不存在');
      }
      orderNo = order.orderNo;

      // 验证收款金额
      if (type === PaymentType.RECEIPT) {
        const remaining = subMoney(order.payable, order.paid);
        if (moneyGt(amount, remaining)) {
          throw new BadRequestException(`收款金额超过未收金额(未收:${remaining.toFixed(2)})`);
        }
      }
    } else {
      throw new BadRequestException('无效的业务类型');
    }

    // 创建收付款记录
    const data: any = {
      type,
      bizType,
      amount,
      method,
      status: PaymentStatus.COMPLETED, // 直接完成
      remark,
      createdBy: userId,
    };
    
    if (bizType === 'PURCHASE') {
      data.purchaseId = bizId;
    } else if (bizType === 'SALE') {
      data.orderId = bizId;
    }
    
    const payment = await this.prisma.payment.create({
      data,
      include: {
        purchase: { select: { orderNo: true } },
      },
    });

    // 更新采购订单的已付金额
    if (bizType === 'PURCHASE' && type === PaymentType.PAYMENT) {
      await this.prisma.purchase.update({
        where: { id: bizId },
        data: { paid: { increment: amount } },
      });
    }

    return PaymentVo.fromEntity(payment);
  }

  // 查询收付款列表
  async findAll(query: QueryPaymentDto) {
    const { type, bizType, status, method, keyword, orderSource, page = 1, pageSize = 10 } = query;

    const paymentWhere: Prisma.PaymentWhereInput = {
      deletedAt: null,
      order: {
        is: {
          type: 'MALL',
          deletedAt: null,
        },
      },
    };

    if (type) {
      paymentWhere.type = type;
    }

    if (bizType) {
      paymentWhere.bizType = bizType;
    }

    if (status) {
      paymentWhere.status = status;
    }

    if (method) {
      paymentWhere.method = method;
    }

    if (keyword) {
      paymentWhere.OR = [
        { outTradeNo: { contains: keyword, mode: 'insensitive' } },
        { thirdTradeNo: { contains: keyword, mode: 'insensitive' } },
        { order: { is: { orderNo: { contains: keyword, mode: 'insensitive' } } } },
      ];
    }

    const rechargeWhere: Prisma.BalanceRechargeOrderWhereInput = {
      deletedAt: null,
    };

    if (status) {
      rechargeWhere.status = status;
    }

    if (method) {
      rechargeWhere.method = method;
    }

    if (keyword) {
      rechargeWhere.OR = [
        { rechargeNo: { contains: keyword, mode: 'insensitive' } },
        { outTradeNo: { contains: keyword, mode: 'insensitive' } },
        { thirdTradeNo: { contains: keyword, mode: 'insensitive' } },
        { customer: { is: { name: { contains: keyword, mode: 'insensitive' } } } },
        { customer: { is: { code: { contains: keyword, mode: 'insensitive' } } } },
        { customer: { is: { phone: { contains: keyword, mode: 'insensitive' } } } },
      ];
    }

    const shouldLoadShopping = (!orderSource || orderSource === 'SHOPPING');
    const shouldLoadRecharge = (!orderSource || orderSource === 'RECHARGE') && (!type || type === PaymentType.RECEIPT);

    const [paymentData, rechargeData] = await Promise.all([
      shouldLoadShopping
        ? this.prisma.payment.findMany({
            where: paymentWhere,
            include: {
              purchase: { select: { orderNo: true } },
              order: { select: { orderNo: true, type: true } },
            },
            orderBy: { createdAt: 'desc' },
          })
        : Promise.resolve([]),
      shouldLoadRecharge
        ? this.prisma.balanceRechargeOrder.findMany({
            where: rechargeWhere,
            include: {
              customer: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                  phone: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          })
        : Promise.resolve([]),
    ]);

    const rechargeRefundMap = await this.getRechargeRefundMap(
      rechargeData
        .map(item => item.outTradeNo)
        .filter((value): value is string => !!value),
    );

    const merged = [
      ...paymentData.map(item => ({
        ...PaymentVo.fromEntity(item),
        orderSource: 'SHOPPING' as const,
        orderSourceText: '购物',
      })),
      ...rechargeData.map(item => this.toRechargePaymentRow(
        item,
        item.outTradeNo ? rechargeRefundMap.get(item.outTradeNo) : [],
      )),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = merged.length;
    const data = merged.slice((page - 1) * pageSize, page * pageSize);

    return {
      data,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findRefunds(query: QueryPaymentRefundDto) {
    const { keyword, orderSource, status, page = 1, pageSize = 10 } = query;
    const where: Prisma.PaymentRefundWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (orderSource === 'SHOPPING') {
      where.payment = {
        is: {
          order: {
            is: {
              deletedAt: null,
              type: 'MALL',
            },
          },
        },
      };
    } else if (orderSource === 'RECHARGE') {
      where.payment = {
        is: {
          bizType: 'RECHARGE',
          deletedAt: null,
        },
      };
    }

    if (keyword) {
      where.OR = [
        { refundNo: { contains: keyword, mode: 'insensitive' } },
        { thirdRefundNo: { contains: keyword, mode: 'insensitive' } },
        { payment: { is: { outTradeNo: { contains: keyword, mode: 'insensitive' } } } },
        { payment: { is: { remark: { contains: keyword, mode: 'insensitive' } } } },
        { payment: { is: { order: { is: { orderNo: { contains: keyword, mode: 'insensitive' } } } } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.paymentRefund.findMany({
        where,
        include: {
          payment: {
            include: {
              order: {
                select: {
                  orderNo: true,
                  type: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.paymentRefund.count({ where }),
    ]);

    return {
      data: data.map(item => PaymentRefundVo.fromEntity({
        ...item,
        orderNo: item.payment?.order?.orderNo ?? item.payment?.remark ?? null,
        outTradeNo: item.payment?.outTradeNo ?? null,
        orderSource: item.payment?.bizType === 'RECHARGE' ? 'RECHARGE' : 'SHOPPING',
      })),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findRefundOne(refundId: number) {
    const refund = await this.prisma.paymentRefund.findUnique({
      where: { id: refundId },
      include: {
        payment: {
          include: {
            order: {
              select: {
                orderNo: true,
                type: true,
              },
            },
          },
        },
      },
    });

    if (!refund) {
      throw new NotFoundException('退款记录不存在');
    }

    return PaymentRefundVo.fromEntity({
      ...refund,
      orderNo: refund.payment?.order?.orderNo ?? refund.payment?.remark ?? null,
      outTradeNo: refund.payment?.outTradeNo ?? null,
      orderSource: refund.payment?.bizType === 'RECHARGE' ? 'RECHARGE' : 'SHOPPING',
    });
  }

  // 查询收付款详情
  async findOne(id: number, orderSource?: 'SHOPPING' | 'RECHARGE') {
    if (orderSource === 'RECHARGE') {
      const recharge = await this.prisma.balanceRechargeOrder.findFirst({
        where: { id, deletedAt: null },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              code: true,
              phone: true,
            },
          },
        },
      });

      if (!recharge) {
        throw new NotFoundException('充值单不存在');
      }

      const mirrorPayment = recharge.outTradeNo
        ? await this.prisma.payment.findFirst({
            where: {
              outTradeNo: recharge.outTradeNo,
              bizType: 'RECHARGE',
              deletedAt: null,
            },
            include: {
              refunds: {
                orderBy: { createdAt: 'desc' },
              },
            },
          })
        : null;

      return this.toRechargePaymentRow(
        recharge,
        mirrorPayment
          ? PaymentRefundVo.fromEntities(mirrorPayment.refunds.map(refund => ({
              ...refund,
              orderNo: recharge.rechargeNo,
              outTradeNo: recharge.outTradeNo,
              orderSource: 'RECHARGE',
            })))
          : [],
      );
    }

    const payment = await this.prisma.payment.findFirst({
      where: { id, deletedAt: null },
      include: {
        purchase: { select: { orderNo: true } },
        order: { select: { orderNo: true, type: true } },
        refunds: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('收付款记录不存在');
    }

    return PaymentVo.fromEntity(payment);
  }

  // 发起微信退款（当前仅支持整单退款）
  async createRefund(id: number, createDto: CreatePaymentRefundDto, userId: number, orderSource?: 'SHOPPING' | 'RECHARGE') {
    if (orderSource === 'RECHARGE') {
      return this.createRechargeRefund(id, createDto, userId);
    }

    const payment = await this.prisma.payment.findFirst({
      where: { id, deletedAt: null },
      include: {
        order: true,
        refunds: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('收付款记录不存在');
    }

    if (payment.type !== PaymentType.RECEIPT || payment.method !== PaymentMethod.WECHAT) {
      throw new BadRequestException('当前仅支持对微信收款记录发起退款');
    }

    if (payment.status !== PaymentStatus.COMPLETED || !payment.outTradeNo || !payment.thirdTradeNo) {
      throw new BadRequestException('仅已完成的微信支付记录支持退款');
    }

    if (!payment.orderId || !payment.order) {
      throw new BadRequestException('当前仅支持订单支付退款');
    }

    const processingRefund = payment.refunds.find(item => item.status === PaymentRefundStatus.PROCESSING);
    if (processingRefund) {
      throw new BadRequestException('已有退款处理中，请先等待结果');
    }

    const successRefund = payment.refunds.find(item => item.status === PaymentRefundStatus.SUCCESS);
    if (successRefund) {
      throw new BadRequestException('该支付单已退款成功，暂不支持重复退款');
    }

    const refundNo = await this.generateRefundNo();
    const reason = createDto.reason?.trim() || '后台发起退款';
    const remote = await this.wechatPayService.createRefund({
      outTradeNo: payment.outTradeNo,
      outRefundNo: refundNo,
      amount: Number(payment.amount),
      refundAmount: Number(payment.amount),
      reason,
    });

    const nextStatus = this.toRefundStatus(remote.status);
    const refund = await this.prisma.$transaction(async (tx) => {
      const created = await tx.paymentRefund.create({
        data: {
          refundNo,
          paymentId: payment.id,
          orderId: payment.orderId,
          amount: payment.amount,
          reason,
          status: nextStatus,
          thirdRefundNo: remote.refund_id || null,
          thirdStatus: remote.status || null,
          successAt: nextStatus === PaymentRefundStatus.SUCCESS && remote.success_time ? new Date(remote.success_time) : null,
          createdBy: userId,
        },
      });

      if (nextStatus === PaymentRefundStatus.SUCCESS) {
        await this.applyRefundSuccess(tx, payment, Number(payment.amount), remote.success_time ? new Date(remote.success_time) : new Date());
      } else if (payment.orderId) {
        await tx.order.update({
          where: { id: payment.orderId },
          data: {
            payStatus: PayStatus.REFUNDING,
            status: OrderStatus.REFUNDING,
          },
        });
      }

      return created;
    });

    return PaymentRefundVo.fromEntity(refund);
  }

  // 主动查询微信退款状态
  async queryRefund(refundId: number) {
    const refund = await this.prisma.paymentRefund.findUnique({
      where: { id: refundId },
      include: {
        payment: {
          include: {
            order: true,
          },
        },
      },
    });

    if (!refund) {
      throw new NotFoundException('退款记录不存在');
    }

    const remote = await this.wechatPayService.queryRefund(refund.refundNo);
    const nextStatus = this.toRefundStatus(remote.status);
    const successAt = remote.success_time ? new Date(remote.success_time) : refund.successAt;

    const nextRefund = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.paymentRefund.update({
        where: { id: refund.id },
        data: {
          status: nextStatus,
          thirdRefundNo: remote.refund_id || refund.thirdRefundNo,
          thirdStatus: remote.status || refund.thirdStatus,
          successAt,
          failReason: nextStatus === PaymentRefundStatus.ABNORMAL ? remote.status || '退款异常' : null,
        },
      });

      if (nextStatus === PaymentRefundStatus.SUCCESS && refund.status !== PaymentRefundStatus.SUCCESS) {
        await this.applyRefundSuccess(tx, refund.payment, Number(refund.amount), successAt || new Date());
      }

      if (refund.payment.orderId && nextStatus !== PaymentRefundStatus.SUCCESS) {
        await tx.order.update({
          where: { id: refund.payment.orderId },
          data: {
            payStatus: nextStatus === PaymentRefundStatus.CLOSED ? PayStatus.PAID : PayStatus.REFUNDING,
            status: nextStatus === PaymentRefundStatus.CLOSED ? OrderStatus.CONFIRMED : OrderStatus.REFUNDING,
          },
        });
      }

      return updated;
    });

    return PaymentRefundVo.fromEntity(nextRefund);
  }

  // 微信退款异步回调
  async handleWechatRefundNotify(rawBody: string, headers: { serial?: string; nonce?: string; signature?: string; timestamp?: string }) {
    const resource = await this.wechatPayService.verifyAndDecryptNotifyResource<WechatRefundNotifyResource>(rawBody, headers);
    if (!resource.out_refund_no) {
      throw new BadRequestException('微信退款回调缺少退款单号');
    }

    const refund = await this.prisma.paymentRefund.findFirst({
      where: {
        refundNo: resource.out_refund_no,
      },
      include: {
        payment: {
          include: {
            order: true,
          },
        },
      },
    });

    if (!refund) {
      throw new NotFoundException('退款单不存在');
    }

    // 安全校验：回调退款金额（分）与本地退款单金额一致，防止串单/篡改
    if (this.toRefundStatus(resource.refund_status) === PaymentRefundStatus.SUCCESS) {
      const expectedRefundFen = yuanToFen(refund.amount);
      const actualRefundFen = resource.amount?.refund;
      if (actualRefundFen !== expectedRefundFen) {
        this.logger.error(
          `微信退款回调金额不一致 outRefundNo=${resource.out_refund_no} 本地=${expectedRefundFen}分 回调=${actualRefundFen}分`,
        );
        throw new BadRequestException('回调退款金额与退款单金额不一致');
      }
    }

    const nextStatus = this.toRefundStatus(resource.refund_status);
    const successAt = resource.success_time ? new Date(resource.success_time) : refund.successAt;

    await this.prisma.$transaction(async (tx) => {
      await tx.paymentRefund.update({
        where: { id: refund.id },
        data: {
          status: nextStatus,
          thirdRefundNo: resource.refund_id || refund.thirdRefundNo,
          thirdStatus: resource.refund_status || refund.thirdStatus,
          successAt,
          notifyAt: new Date(),
          notifyPayload: JSON.parse(rawBody || '{}'),
          failReason: nextStatus === PaymentRefundStatus.ABNORMAL
            ? refund.failReason || resource.refund_status || '退款异常'
            : null,
        },
      });

      if (nextStatus === PaymentRefundStatus.SUCCESS && refund.status !== PaymentRefundStatus.SUCCESS) {
        await this.applyRefundSuccess(tx, refund.payment, Number(refund.amount), successAt || new Date());
      }

      if (refund.payment.orderId && nextStatus !== PaymentRefundStatus.SUCCESS) {
        await tx.order.update({
          where: { id: refund.payment.orderId },
          data: {
            payStatus: nextStatus === PaymentRefundStatus.CLOSED ? PayStatus.PAID : PayStatus.REFUNDING,
            status: nextStatus === PaymentRefundStatus.CLOSED ? OrderStatus.CONFIRMED : OrderStatus.REFUNDING,
          },
        });
      }
    });

    return true;
  }

  // 主动查询微信支付状态
  async queryWechatPayment(id: number) {
    const payment = await this.prisma.payment.findFirst({
      where: { id, deletedAt: null },
      include: {
        purchase: { select: { orderNo: true } },
        order: {
          select: {
            id: true,
            orderNo: true,
            type: true,
            payStatus: true,
            status: true,
            paid: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('收付款记录不存在');
    }

    if (payment.method !== PaymentMethod.WECHAT || !payment.outTradeNo) {
      throw new BadRequestException('该收付款记录不支持微信主动查单');
    }

    if (payment.status === PaymentStatus.CANCELLED) {
      throw new BadRequestException('已取消的收付款记录不能查单');
    }

    const remote = await this.wechatPayService.queryOrder(payment.outTradeNo);
    const queriedAt = new Date();
    const paidAt = remote.success_time ? new Date(remote.success_time) : queriedAt;

    const updated = await this.prisma.$transaction(async (tx) => {
      const nextPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          thirdStatus: remote.trade_state || payment.thirdStatus,
          thirdTradeNo: remote.transaction_id || payment.thirdTradeNo,
          tradeType: payment.tradeType,
          lastQueryAt: queriedAt,
          queryCount: {
            increment: 1,
          },
          status: remote.trade_state === 'SUCCESS' ? PaymentStatus.COMPLETED : payment.status,
          paidAt: remote.trade_state === 'SUCCESS' ? paidAt : payment.paidAt,
          failReason: remote.trade_state === 'SUCCESS'
            ? null
            : payment.failReason || remote.trade_state_desc || null,
        },
        include: {
          purchase: { select: { orderNo: true } },
          order: { select: { id: true, orderNo: true, type: true } },
        },
      });

      if (remote.trade_state === 'SUCCESS' && payment.order && payment.order.payStatus !== PayStatus.PAID) {
        await tx.order.update({
          where: { id: payment.order.id },
          data: {
            paid: { increment: payment.amount },
            payStatus: PayStatus.PAID,
            status: payment.order.status === OrderStatus.CANCELLED ? payment.order.status : OrderStatus.CONFIRMED,
            payDate: paidAt,
          },
        });
      }

      return nextPayment;
    });

    return PaymentVo.fromEntity(updated);
  }

  // 确认收付款
  async confirm(id: number, userId: number) {
    const payment = await this.prisma.payment.findFirst({
      where: { id, deletedAt: null },
    });

    if (!payment) {
      throw new NotFoundException('收付款记录不存在');
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw new ForbiddenException('只有待确认的收付款记录可以确认');
    }

    const updated = await this.prisma.payment.update({
      where: { id },
      data: { status: PaymentStatus.COMPLETED },
      include: {
        purchase: { select: { orderNo: true } },
      },
    });

    // 更新业务单据的已付/已收金额
    if (payment.bizType === 'PURCHASE' && payment.type === PaymentType.PAYMENT && payment.purchaseId) {
      await this.prisma.purchase.update({
        where: { id: payment.purchaseId },
        data: { paid: { increment: payment.amount } },
      });
    } else if (payment.bizType === 'SALE' && payment.type === PaymentType.RECEIPT && payment.orderId) {
      await this.prisma.order.update({
        where: { id: payment.orderId },
        data: { paid: { increment: payment.amount } },
      });
    }

    return PaymentVo.fromEntity(updated);
  }

  // 取消收付款
  async cancel(id: number, userId: number) {
    const payment = await this.prisma.payment.findFirst({
      where: { id, deletedAt: null },
    });

    if (!payment) {
      throw new NotFoundException('收付款记录不存在');
    }

    if (payment.status === PaymentStatus.CANCELLED) {
      throw new BadRequestException('收付款记录已取消');
    }

    // 如果已确认，需要回滚金额
    if (payment.status === PaymentStatus.COMPLETED) {
      if (payment.bizType === 'PURCHASE' && payment.type === PaymentType.PAYMENT && payment.purchaseId) {
        const purchase = await this.prisma.purchase.findUnique({
          where: { id: payment.purchaseId },
        });
        if (purchase) {
          const newPaid = subMoneyClampZero(purchase.paid, payment.amount);
          await this.prisma.purchase.update({
            where: { id: payment.purchaseId },
            data: { paid: newPaid },
          });
        }
      } else if (payment.bizType === 'SALE' && payment.type === PaymentType.RECEIPT && payment.orderId) {
        const order = await this.prisma.order.findUnique({
          where: { id: payment.orderId },
        });
        if (order) {
          const newPaid = subMoneyClampZero(order.paid, payment.amount);
          await this.prisma.order.update({
            where: { id: payment.orderId },
            data: { paid: newPaid },
          });
        }
      }
    }

    const updated = await this.prisma.payment.update({
      where: { id },
      data: { status: PaymentStatus.CANCELLED },
      include: {
        purchase: { select: { orderNo: true } },
      },
    });

    return PaymentVo.fromEntity(updated);
  }

  // 删除收付款记录（软删除）
  async remove(id: number) {
    const payment = await this.prisma.payment.findFirst({
      where: { id, deletedAt: null },
    });

    if (!payment) {
      throw new NotFoundException('收付款记录不存在');
    }

    if (payment.status === PaymentStatus.COMPLETED) {
      throw new ForbiddenException('已完成的收付款记录不能删除');
    }

    await this.prisma.payment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { success: true };
  }

  // 获取供应商应付款统计
  async getPayableStats(supplierId?: number) {
    const where: Prisma.PurchaseWhereInput = {
      deletedAt: null,
      status: { in: [PurchaseStatus.APPROVED, PurchaseStatus.PARTIAL, PurchaseStatus.COMPLETED] },
    };

    if (supplierId) {
      where.supplierId = supplierId;
    }

    const purchases = await this.prisma.purchase.findMany({
      where,
      select: {
        id: true,
        orderNo: true,
        payable: true,
        paid: true,
        supplier: { select: { id: true, name: true } },
      },
    });

    const stats = purchases.map((p) => ({
      purchaseId: p.id,
      orderNo: p.orderNo,
      supplierId: p.supplier.id,
      supplierName: p.supplier.name,
      payable: toYuan(p.payable),
      paid: toYuan(p.paid),
      unpaid: toYuan(subMoney(p.payable, p.paid)),
    }));

    const totalPayable = toYuan(sumMoney(purchases, (p) => p.payable));
    const totalPaid = toYuan(sumMoney(purchases, (p) => p.paid));
    const totalUnpaid = toYuan(
      sumMoney(purchases, (p) => subMoney(p.payable, p.paid)),
    );

    return {
      list: stats,
      summary: {
        totalPayable,
        totalPaid,
        totalUnpaid,
      },
    };
  }

  private async createRechargeRefund(id: number, createDto: CreatePaymentRefundDto, userId: number) {
    const recharge = await this.prisma.balanceRechargeOrder.findFirst({
      where: { id, deletedAt: null },
      include: {
        account: true,
      },
    });

    if (!recharge) {
      throw new NotFoundException('充值单不存在');
    }

    if (recharge.method !== PaymentMethod.WECHAT) {
      throw new BadRequestException('当前仅支持对微信充值单发起退款');
    }

    if (recharge.status !== PaymentStatus.COMPLETED || !recharge.outTradeNo || !recharge.thirdTradeNo) {
      throw new BadRequestException('仅已完成的微信充值单支持退款');
    }

    const arrivalAmount = addMoney(recharge.amount, recharge.bonusAmount);
    if (moneyLt(recharge.account.availableBalance, arrivalAmount)) {
      throw new BadRequestException(`当前余额不足以回退该充值单，至少需要保留${arrivalAmount.toFixed(2)}元可用余额`);
    }

    const payment = await this.prisma.$transaction(async (tx) => {
      return this.getOrCreateRechargePayment(tx, recharge, userId);
    });

    const processingRefund = payment.refunds.find(item => item.status === PaymentRefundStatus.PROCESSING);
    if (processingRefund) {
      throw new BadRequestException('已有退款处理中，请先等待结果');
    }

    const successRefund = payment.refunds.find(item => item.status === PaymentRefundStatus.SUCCESS);
    if (successRefund) {
      throw new BadRequestException('该充值单已退款成功，暂不支持重复退款');
    }

    const refundNo = await this.generateRefundNo();
    const reason = createDto.reason?.trim() || '后台发起充值退款';
    const remote = await this.wechatPayService.createRefund({
      outTradeNo: payment.outTradeNo!,
      outRefundNo: refundNo,
      amount: Number(payment.amount),
      refundAmount: Number(payment.amount),
      reason,
    });

    const nextStatus = this.toRefundStatus(remote.status);
    const refund = await this.prisma.$transaction(async (tx) => {
      const created = await tx.paymentRefund.create({
        data: {
          refundNo,
          paymentId: payment.id,
          amount: payment.amount,
          reason,
          status: nextStatus,
          thirdRefundNo: remote.refund_id || null,
          thirdStatus: remote.status || null,
          successAt: nextStatus === PaymentRefundStatus.SUCCESS && remote.success_time ? new Date(remote.success_time) : null,
          createdBy: userId,
        },
      });

      if (nextStatus === PaymentRefundStatus.SUCCESS) {
        await this.applyRefundSuccess(tx, payment, Number(payment.amount), remote.success_time ? new Date(remote.success_time) : new Date());
      }

      return created;
    });

    return PaymentRefundVo.fromEntity({
      ...refund,
      orderNo: recharge.rechargeNo,
      outTradeNo: recharge.outTradeNo,
      orderSource: 'RECHARGE',
    });
  }

  /**
   * 商城订单部分/全额退款（用于售后退货等场景，事务内调用）
   * - 自动从订单关联支付单按支付方式分支：BALANCE 即时回退 + 流水；WECHAT 调微信原路退（PROCESSING 时 order 进入 REFUNDING）
   * - 校验累计退款 + 单笔不超出可退余额
   * - 退款 SUCCESS 时通过 applyRefundSuccess 同步 order.paid 与 payStatus（部分退款保留 PAID）
   */
  async createMallOrderRefundInTx(
    tx: Prisma.TransactionClient,
    orderId: number,
    refundAmount: number,
    options: {
      reason: string;
      bizType: string;
      bizId: number;
      bizNo: string;
      userId: number;
    },
  ): Promise<void> {
    if (!(refundAmount > 0)) {
      throw new BadRequestException('退款金额必须大于 0');
    }

    const order = await tx.order.findFirst({
      where: { id: orderId, deletedAt: null },
    });
    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    if (moneyGt(refundAmount, order.paid)) {
      throw new BadRequestException(`退款金额超过订单已付金额(已付:${Number(order.paid).toFixed(2)})`);
    }

    const payment = await tx.payment.findFirst({
      where: {
        orderId,
        deletedAt: null,
        status: PaymentStatus.COMPLETED,
      },
      include: {
        refunds: { orderBy: { createdAt: 'desc' } },
        order: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!payment) {
      throw new BadRequestException('未找到可退款的支付记录');
    }

    // 累计已退/在途退款，避免超额退款
    const refundedSum = (payment.refunds || [])
      .filter((r: any) => r.status === PaymentRefundStatus.SUCCESS || r.status === PaymentRefundStatus.PROCESSING)
      .reduce((acc: any, r: any) => addMoney(acc, r.amount), D(0));
    const remainingRefundable = subMoneyClampZero(payment.amount, refundedSum);
    if (moneyGt(refundAmount, remainingRefundable)) {
      throw new BadRequestException(
        `退款金额超过支付单可退余额(可退:${Number(remainingRefundable).toFixed(2)})`,
      );
    }

    if (payment.method === PaymentMethod.BALANCE) {
      await this.refundOrderByBalanceInTx(tx, order, payment, refundAmount, options);
      return;
    }
    if (payment.method === PaymentMethod.WECHAT) {
      await this.refundOrderByWechatInTx(tx, order, payment, refundAmount, options);
      return;
    }
    throw new BadRequestException('当前支付方式暂不支持退款');
  }

  private async refundOrderByBalanceInTx(
    tx: Prisma.TransactionClient,
    order: any,
    payment: any,
    refundAmount: number,
    options: { reason: string; bizType: string; bizId: number; bizNo: string; userId: number },
  ) {
    const account = await tx.balanceAccount.findUnique({
      where: { customerId: order.customerId },
    });
    if (!account) {
      throw new BadRequestException('未找到客户余额账户，无法退款');
    }

    const refundNo = await this.generateRefundNo();
    const refundedAt = new Date();
    const balanceBefore = D(account.availableBalance);
    const balanceAfter = balanceBefore.add(refundAmount);

    await tx.balanceAccount.update({
      where: { id: account.id },
      data: {
        availableBalance: balanceAfter,
        totalRefunded: addMoney(account.totalRefunded, refundAmount),
      },
    });

    await tx.balanceLog.create({
      data: {
        accountId: account.id,
        customerId: order.customerId,
        type: BalanceLogType.REFUND,
        changeAmount: refundAmount,
        balanceBefore,
        balanceAfter,
        bizType: options.bizType,
        bizId: options.bizId,
        bizNo: options.bizNo,
        remark: options.reason,
        createdBy: options.userId,
      },
    });

    await tx.paymentRefund.create({
      data: {
        refundNo,
        paymentId: payment.id,
        orderId: order.id,
        amount: refundAmount,
        reason: options.reason,
        status: PaymentRefundStatus.SUCCESS,
        successAt: refundedAt,
        createdBy: options.userId,
      },
    });

    await this.applyRefundSuccess(tx, { ...payment, order }, refundAmount, refundedAt);
  }

  private async refundOrderByWechatInTx(
    tx: Prisma.TransactionClient,
    order: any,
    payment: any,
    refundAmount: number,
    options: { reason: string; bizType: string; bizId: number; bizNo: string; userId: number },
  ) {
    if (!payment.outTradeNo || !payment.thirdTradeNo) {
      throw new BadRequestException('当前支付记录缺少微信交易号，无法发起原路退');
    }

    const refundNo = await this.generateRefundNo();
    const remote = await this.wechatPayService.createRefund({
      outTradeNo: payment.outTradeNo,
      outRefundNo: refundNo,
      amount: Number(payment.amount),
      refundAmount,
      reason: options.reason,
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
        amount: refundAmount,
        reason: options.reason,
        status: nextStatus,
        thirdRefundNo: remote.refund_id || null,
        thirdStatus: remote.status || null,
        successAt: nextStatus === PaymentRefundStatus.SUCCESS ? refundedAt : null,
        createdBy: options.userId,
      },
    });

    if (nextStatus === PaymentRefundStatus.SUCCESS) {
      await this.applyRefundSuccess(tx, { ...payment, order }, refundAmount, refundedAt);
      return;
    }

    // 异步处理中：仅标记订单进入 REFUNDING；最终成败由微信退款回调/主动查询触发 applyRefundSuccess
    await tx.order.update({
      where: { id: order.id },
      data: {
        payStatus: PayStatus.REFUNDING,
        status: OrderStatus.REFUNDING,
      },
    });
  }

  private async applyRefundSuccess(tx: Prisma.TransactionClient, payment: any, refundAmount: number, refundedAt: Date) {
    if (payment.bizType === 'RECHARGE') {
      await this.applyRechargeRefundSuccess(tx, payment, refundAmount);
      return;
    }

    if (!payment.orderId || !payment.order) {
      return;
    }

    const nextPaid = subMoneyClampZero(payment.order.paid, refundAmount);
    const isFullyRefunded = D(nextPaid).isZero();
    await tx.order.update({
      where: { id: payment.orderId },
      data: {
        paid: nextPaid,
        // 部分退款下保留 PAID/状态不变；全额退款才置为 REFUNDED
        payStatus: isFullyRefunded ? PayStatus.REFUNDED : PayStatus.PAID,
        ...(isFullyRefunded ? { status: OrderStatus.REFUNDED } : {}),
      },
    });
  }

  private async applyRechargeRefundSuccess(tx: Prisma.TransactionClient, payment: any, refundAmount: number) {
    const recharge = await tx.balanceRechargeOrder.findFirst({
      where: {
        outTradeNo: payment.outTradeNo || '',
        deletedAt: null,
      },
      include: {
        account: true,
      },
    });

    if (!recharge?.account) {
      throw new NotFoundException('充值单不存在');
    }

    const arrivalAmount = addMoney(recharge.amount, recharge.bonusAmount);
    const before = D(recharge.account.availableBalance);
    const after = before.sub(arrivalAmount);
    if (after.isNegative()) {
      throw new BadRequestException('当前余额不足，无法完成充值退款回退');
    }

    await tx.balanceAccount.update({
      where: { id: recharge.accountId },
      data: {
        availableBalance: after,
        totalRecharged: subMoneyClampZero(recharge.account.totalRecharged, refundAmount),
        totalPresented: subMoneyClampZero((recharge.account as any).totalPresented, recharge.bonusAmount),
      } as any,
    });

    await tx.balanceLog.create({
      data: {
        accountId: recharge.accountId,
        customerId: recharge.customerId,
        type: BalanceLogType.REFUND,
        changeAmount: arrivalAmount.neg(),
        bonusAmount: D(recharge.bonusAmount).neg(),
        balanceBefore: before,
        balanceAfter: after,
        bizType: 'MALL_RECHARGE_REFUND',
        bizId: recharge.id,
        bizNo: recharge.rechargeNo,
        remark: '后台发起充值退款',
        createdBy: payment.createdBy,
      } as any,
    });

    await tx.balanceRechargeOrder.update({
      where: { id: recharge.id },
      data: {
        thirdStatus: 'REFUND_SUCCESS',
        failReason: null,
      },
    });
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

  private async getRechargeRefundMap(outTradeNos: string[]) {
    if (!outTradeNos.length) {
      return new Map<string, PaymentRefundVo[]>();
    }

    const payments = await this.prisma.payment.findMany({
      where: {
        outTradeNo: {
          in: outTradeNos,
        },
        bizType: 'RECHARGE',
        deletedAt: null,
      },
      include: {
        refunds: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return new Map(
      payments.map(item => [
        item.outTradeNo!,
        PaymentRefundVo.fromEntities(item.refunds.map(refund => ({
          ...refund,
          orderNo: item.remark,
          outTradeNo: item.outTradeNo,
          orderSource: 'RECHARGE',
        }))),
      ]),
    );
  }

  private async getOrCreateRechargePayment(tx: Prisma.TransactionClient, recharge: any, userId: number) {
    const existing = await tx.payment.findFirst({
      where: {
        outTradeNo: recharge.outTradeNo,
        bizType: 'RECHARGE',
        deletedAt: null,
      },
      include: {
        refunds: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (existing) {
      return existing;
    }

    return tx.payment.create({
      data: {
        type: PaymentType.RECEIPT,
        bizType: 'RECHARGE',
        amount: recharge.amount,
        method: recharge.method,
        status: recharge.status,
        outTradeNo: recharge.outTradeNo,
        thirdTradeNo: recharge.thirdTradeNo,
        tradeType: 'JSAPI',
        prepayId: recharge.prepayId,
        thirdStatus: recharge.thirdStatus,
        queryCount: recharge.queryCount || 0,
        lastQueryAt: recharge.lastQueryAt,
        notifyAt: recharge.notifyAt,
        paidAt: recharge.paidAt,
        failReason: recharge.failReason,
        notifyPayload: recharge.notifyPayload ?? undefined,
        remark: recharge.rechargeNo,
        createdBy: recharge.createdBy || userId,
        createdAt: recharge.createdAt,
      } as any,
      include: {
        refunds: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  private toRechargePaymentRow(entity: any, refunds: PaymentRefundVo[] = []) {
    const methodTextMap: Record<string, string> = {
      CASH: '现金',
      BANK: '银行转账',
      ALIPAY: '支付宝',
      WECHAT: '微信支付',
      CREDIT: '挂账/赊销',
      BALANCE: '余额支付',
    };

    return {
      id: entity.id,
      type: 'RECEIPT' as PaymentType,
      typeText: '收款',
      bizType: 'RECHARGE',
      orderSource: 'RECHARGE' as const,
      orderSourceText: '充值',
      bizId: entity.id,
      orderNo: entity.rechargeNo,
      orderType: 'RECHARGE',
      amount: Number(entity.amount),
      method: entity.method,
      methodText: methodTextMap[entity.method] || entity.method,
      status: entity.status,
      statusText: entity.status === PaymentStatus.PENDING ? '待支付' : entity.status === PaymentStatus.COMPLETED ? '已完成' : '已取消',
      outTradeNo: entity.outTradeNo || null,
      thirdTradeNo: entity.thirdTradeNo || null,
      tradeType: null,
      prepayId: entity.prepayId || null,
      thirdStatus: entity.thirdStatus || null,
      queryCount: entity.queryCount || 0,
      lastQueryAt: entity.lastQueryAt || null,
      notifyAt: entity.notifyAt || null,
      paidAt: entity.paidAt || null,
      failReason: entity.failReason || null,
      notifyPayload: entity.notifyPayload ?? null,
      confirmSource: entity.notifyAt ? 'NOTIFY' : entity.queryCount > 0 ? 'QUERY' : entity.status === PaymentStatus.COMPLETED ? 'MANUAL' : 'UNKNOWN',
      confirmSourceText: entity.notifyAt ? '微信回调' : entity.queryCount > 0 ? '主动查单' : entity.status === PaymentStatus.COMPLETED ? '手工确认' : '未确认',
      refunds,
      remark: null,
      createdBy: entity.createdBy || 0,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt || entity.createdAt,
    };
  }
}
