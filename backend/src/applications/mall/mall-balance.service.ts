import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BalanceAccountStatus,
  BalanceLogType,
  PaymentMethod,
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

@Injectable()
export class MallBalanceService {
  constructor(private readonly prisma: PrismaService) {}

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
    const amount = Number(dto.amount);
    const bizNo = generateRechargeBizNo();

    return this.prisma.$transaction(async (tx) => {
      const current = await tx.balanceAccount.findUnique({
        where: { id: account.id },
      });

      if (!current) {
        throw new NotFoundException('余额账户不存在');
      }

      const before = Number(current.availableBalance);
      const after = before + amount;
      const updated = await tx.balanceAccount.update({
        where: { id: current.id },
        data: {
          availableBalance: after,
          totalRecharged: Number(current.totalRecharged) + amount,
        },
      });

      const createdLog = await tx.balanceLog.create({
        data: {
          accountId: current.id,
          customerId: current.customerId,
          type: BalanceLogType.RECHARGE,
          changeAmount: amount,
          balanceBefore: before,
          balanceAfter: after,
          bizType: 'MALL_RECHARGE',
          bizNo,
          remark: `商城用户${this.getMethodText(dto.method)}充值`,
          createdBy: userId,
        },
      });

      return {
        accountId: updated.id,
        amount: amount.toFixed(2),
        method: dto.method,
        availableBalance: updated.availableBalance.toString(),
        bizNo,
        createdAt: createdLog.createdAt,
      } satisfies MallBalanceRechargeVo;
    });
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
}
