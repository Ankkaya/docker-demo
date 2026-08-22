import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import {
  BalanceAccountStatus,
  BalanceLogType,
  PaymentMethod,
  PaymentStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { CreateMallBalanceRechargeDto } from './dto/create-mall-balance-recharge.dto';
import { QueryMallBalanceLogDto } from './dto/query-mall-balance-log.dto';
import {
  MallBalanceLogVo,
  MallBalanceRechargeVo,
  MallBalanceSummaryVo,
} from './vo/mall-balance.vo';
import { WechatMiniProgramPayParams, WechatPayService, WechatTransactionResource } from './wechat-pay.service';
import { MallRechargePackagesService } from '@/domains/mall-recharge-packages/mall-recharge-packages.service';
import { CouponAutoGrantService } from '@/domains/coupons/coupon-auto-grant.service';
import { D, addMoney, yuanToFen } from '@/common/utils/money';

function generateRechargeBizNo() {
  const now = new Date();
  const dateStr = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('');
  const timeStr = [
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
  ].join('');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `RC${dateStr}${timeStr}${random}`;
}

const PENDING_RECHARGE_SYNC_INTERVAL_MS = 5 * 60 * 1000;

@Injectable()
export class MallBalanceService {
  private readonly logger = new Logger(MallBalanceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly wechatPayService: WechatPayService,
    private readonly mallRechargePackagesService: MallRechargePackagesService,
    private readonly couponAutoGrantService: CouponAutoGrantService,
  ) {}

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

  async ensureAccountByUserId(userId: number) {
    const customer = await this.getCustomerByUserId(userId);
    const existing = await this.prisma.balanceAccount.findUnique({
      where: {
        customerId: customer.id,
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.balanceAccount.create({
      data: {
        customerId: customer.id,
        status: BalanceAccountStatus.ACTIVE,
      },
    });
  }

  async getSummaryByUserId(userId: number) {
    const account = await this.ensureAccountByUserId(userId);
    return MallBalanceSummaryVo.fromEntity(account);
  }

  async getRechargePackagesByUserId(userId: number) {
    const account = await this.ensureAccountByUserId(userId);
    return this.mallRechargePackagesService.findAvailableForCustomer(account.customerId);
  }

  async getLogsByUserId(userId: number, query: QueryMallBalanceLogDto) {
    const account = await this.ensureAccountByUserId(userId);
    const { page = 1, pageSize = 20, type } = query;

    const where: Prisma.BalanceLogWhereInput = {
      accountId: account.id,
    };

    if (type) {
      where.type = type;
    }

    const [data, total] = await Promise.all([
      this.prisma.balanceLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.balanceLog.count({ where }),
    ]);

    return {
      data: MallBalanceLogVo.fromEntities(data),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async rechargeByUserId(userId: number, dto: CreateMallBalanceRechargeDto) {
    const account = await this.ensureAccountByUserId(userId);
    const rechargePackage = await this.mallRechargePackagesService.resolvePackageForCustomer(account.customerId, dto.packageId);
    const amount = rechargePackage ? Number(rechargePackage.rechargeAmount) : Number(dto.amount);
    if (!amount || amount <= 0) {
      throw new BadRequestException('请输入正确的充值金额');
    }
    const activity = rechargePackage
      ? this.resolveSelectedActivity(rechargePackage.activities || [], dto.activityId)
      : null;
    const bonusAmount = Number(activity?.bonusAmount || 0);
    if (dto.method !== PaymentMethod.WECHAT) {
      throw new BadRequestException('当前阶段仅支持微信充值');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
      select: {
        wechatOpenId: true,
      },
    });

    if (!user?.wechatOpenId) {
      throw new BadRequestException('当前账号未绑定微信 OpenID，请先使用微信登录');
    }

    const rechargeNo = generateRechargeBizNo();
    let rechargeOrder = await this.prisma.balanceRechargeOrder.create({
      data: {
        rechargeNo,
        accountId: account.id,
        customerId: account.customerId,
        amount,
        bonusAmount,
        packageId: rechargePackage?.id ?? null,
        packageName: rechargePackage?.name ?? null,
        activityId: activity?.id ?? null,
        activityName: activity?.name ?? null,
        method: dto.method,
        outTradeNo: `${rechargeNo}${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`.slice(0, 32),
        remark: rechargePackage
          ? `${rechargePackage.name}${activity ? `，活动${activity.name}` : ''}，实充${amount.toFixed(2)}元${bonusAmount > 0 ? `赠送${bonusAmount.toFixed(2)}元` : ''}`
          : `商城用户${this.getMethodText(dto.method)}充值`,
        createdBy: userId,
      } as any,
    });

    const created = await this.wechatPayService.createMiniProgramOrder({
      description: `余额充值${rechargeOrder.rechargeNo}`,
      outTradeNo: rechargeOrder.outTradeNo!,
      amount,
      payerOpenId: user.wechatOpenId,
    });

    rechargeOrder = await this.prisma.balanceRechargeOrder.update({
      where: { id: rechargeOrder.id },
      data: {
        prepayId: created.prepayId,
        thirdStatus: 'NOTPAY',
        failReason: null,
      },
    });

    return this.toRechargeVo(rechargeOrder, account.availableBalance.toString(), created.payParams);
  }

  async getRechargeStatusByUserId(userId: number, id: number) {
    const account = await this.ensureAccountByUserId(userId);
    const rechargeOrder = await this.prisma.balanceRechargeOrder.findFirst({
      where: {
        id,
        accountId: account.id,
        deletedAt: null,
      },
    });

    if (!rechargeOrder) {
      throw new NotFoundException('充值单不存在');
    }

    const synced = await this.syncRechargeOrder(rechargeOrder);
    const latestAccount = await this.prisma.balanceAccount.findUnique({
      where: { id: account.id },
    });

    return this.toRechargeVo(synced, latestAccount?.availableBalance?.toString() || account.availableBalance.toString());
  }

  async handleWechatPayNotify(rawBody: string, headers: { serial?: string; nonce?: string; signature?: string; timestamp?: string }) {
    const resource = await this.wechatPayService.verifyAndDecryptNotify(rawBody, headers);
    if (!resource.out_trade_no) {
      throw new BadRequestException('微信支付回调缺少商户订单号');
    }

    const rechargeOrder = await this.prisma.balanceRechargeOrder.findFirst({
      where: {
        outTradeNo: resource.out_trade_no,
        deletedAt: null,
      },
    });

    if (!rechargeOrder) {
      return false;
    }

    if (resource.trade_state === 'SUCCESS') {
      // 安全校验：回调金额（分）必须与本地充值单金额一致，防止串单/篡改
      const expectedFen = yuanToFen(rechargeOrder.amount);
      const actualFen = resource.amount?.total;
      if (actualFen !== expectedFen) {
        this.logger.error(
          `微信充值回调金额不一致 outTradeNo=${resource.out_trade_no} 本地=${expectedFen}分 回调=${actualFen}分`,
        );
        throw new BadRequestException('回调金额与充值单金额不一致');
      }
      await this.markRechargeSuccess(resource.out_trade_no, resource, JSON.parse(rawBody || '{}'));
      return true;
    }

    await this.prisma.balanceRechargeOrder.update({
      where: { id: rechargeOrder.id },
      data: {
        thirdTradeNo: resource.transaction_id || null,
        thirdStatus: resource.trade_state || null,
        notifyAt: new Date(),
        notifyPayload: JSON.parse(rawBody || '{}'),
      },
    });

    return true;
  }

  @Interval(PENDING_RECHARGE_SYNC_INTERVAL_MS)
  async handlePendingRecharges() {
    const recharges = await this.prisma.balanceRechargeOrder.findMany({
      where: {
        deletedAt: null,
        method: PaymentMethod.WECHAT,
        status: PaymentStatus.PENDING,
        outTradeNo: {
          not: null,
        },
      },
      take: 20,
      orderBy: {
        createdAt: 'asc',
      },
    });

    for (const recharge of recharges) {
      await this.syncRechargeOrder(recharge);
    }
  }

  private async syncRechargeOrder(rechargeOrder: any) {
    if (!rechargeOrder.outTradeNo || rechargeOrder.status === PaymentStatus.COMPLETED) {
      return rechargeOrder;
    }

    const remote = await this.wechatPayService.queryOrder(rechargeOrder.outTradeNo);
    const updated = await this.prisma.balanceRechargeOrder.update({
      where: { id: rechargeOrder.id },
      data: {
        thirdStatus: remote.trade_state || rechargeOrder.thirdStatus,
        thirdTradeNo: remote.transaction_id || rechargeOrder.thirdTradeNo,
        lastQueryAt: new Date(),
        queryCount: {
          increment: 1,
        },
      },
    });

    if (remote.trade_state === 'SUCCESS') {
      return this.markRechargeSuccess(rechargeOrder.outTradeNo, {
        out_trade_no: rechargeOrder.outTradeNo,
        transaction_id: remote.transaction_id,
        trade_state: remote.trade_state,
      });
    }

    return updated;
  }

  private async markRechargeSuccess(
    outTradeNo: string,
    resource: Partial<WechatTransactionResource>,
    rawPayload?: unknown,
  ) {
    return this.prisma.serializableTransaction(async (tx) => {
      const rechargeOrder = await tx.balanceRechargeOrder.findFirst({
        where: {
          outTradeNo,
          deletedAt: null,
        },
      });

      if (!rechargeOrder) {
        throw new NotFoundException('充值单不存在');
      }

      if (rechargeOrder.status === PaymentStatus.COMPLETED) {
        return rechargeOrder;
      }

      const paidAt = resource.success_time ? new Date(resource.success_time) : new Date();
      const claimed = await tx.balanceRechargeOrder.updateMany({
        where: {
          id: rechargeOrder.id,
          status: PaymentStatus.PENDING,
        },
        data: {
          status: PaymentStatus.COMPLETED,
          thirdTradeNo: resource.transaction_id || rechargeOrder.thirdTradeNo,
          thirdStatus: resource.trade_state || 'SUCCESS',
          notifyAt: rawPayload !== undefined ? new Date() : rechargeOrder.notifyAt,
          paidAt,
          failReason: null,
          notifyPayload: rawPayload !== undefined ? (rawPayload as any) : rechargeOrder.notifyPayload,
        },
      });
      if (claimed.count !== 1) {
        return tx.balanceRechargeOrder.findUniqueOrThrow({ where: { id: rechargeOrder.id } });
      }

      const account = await tx.balanceAccount.findUnique({
        where: { id: rechargeOrder.accountId },
      });

      if (!account) {
        throw new NotFoundException('余额账户不存在');
      }

      const before = D(account.availableBalance);
      const amount = D(rechargeOrder.amount);
      const bonusAmount = D((rechargeOrder as any).bonusAmount);
      const changeAmount = amount.add(bonusAmount);
      await tx.balanceAccount.update({
        where: { id: account.id },
        data: {
          availableBalance: { increment: changeAmount },
          totalRecharged: { increment: amount },
          totalPresented: { increment: bonusAmount },
        } as any,
      });

      const updatedAccount = await tx.balanceAccount.findUniqueOrThrow({ where: { id: account.id } });

      await tx.balanceLog.create({
        data: {
          accountId: account.id,
          customerId: rechargeOrder.customerId,
          type: BalanceLogType.RECHARGE,
          changeAmount,
          bonusAmount,
          balanceBefore: before,
          balanceAfter: updatedAccount.availableBalance,
          bizType: 'MALL_RECHARGE',
          bizId: rechargeOrder.id,
          bizNo: rechargeOrder.rechargeNo,
          remark: rechargeOrder.remark,
          createdBy: rechargeOrder.createdBy,
        } as any,
      });

      await this.couponAutoGrantService.grantRechargeCoupons(tx, rechargeOrder.customerId, rechargeOrder.id, paidAt);

      return tx.balanceRechargeOrder.findUniqueOrThrow({ where: { id: rechargeOrder.id } });
    });
  }

  private toRechargeVo(entity: any, availableBalance: string, paymentConfig?: WechatMiniProgramPayParams | null): MallBalanceRechargeVo {
    const amount = Number(entity.amount || 0);
    const bonusAmount = Number(entity.bonusAmount || 0);
    return {
      id: entity.id,
      accountId: entity.accountId,
      amount: amount.toFixed(2),
      bonusAmount: bonusAmount.toFixed(2),
      arrivalAmount: (amount + bonusAmount).toFixed(2),
      packageName: entity.packageName || null,
      activityName: entity.activityName || null,
      method: entity.method,
      availableBalance,
      rechargeNo: entity.rechargeNo,
      status: entity.status,
      outTradeNo: entity.outTradeNo || null,
      paymentConfig: paymentConfig || null,
      createdAt: entity.createdAt,
      paidAt: entity.paidAt || null,
    };
  }

  private getMethodText(method: PaymentMethod) {
    const map: Record<PaymentMethod, string> = {
      WECHAT: '微信',
      ALIPAY: '支付宝',
      BANK: '银行卡',
      CASH: '现金',
      CREDIT: '挂账',
      BALANCE: '余额',
    };
    return map[method];
  }

  private resolveSelectedActivity(activities: any[], activityId?: number | null) {
    if (!Array.isArray(activities) || !activities.length) {
      return null;
    }

    if (activityId === undefined || activityId === null) {
      return activities[0] || null;
    }

    const matched = activities.find(item => Number(item.id) === Number(activityId));
    if (!matched) {
      throw new BadRequestException('当前充值活动不可用，请刷新后重试');
    }

    return matched;
  }
}
