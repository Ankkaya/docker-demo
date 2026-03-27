import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BalanceAccountStatus,
  BalanceLogType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { AdjustBalanceDto, BalanceAdjustDirection } from './dto/adjust-balance.dto';
import { CreateBalanceAccountDto } from './dto/create-balance-account.dto';
import { QueryBalanceAccountDto } from './dto/query-balance-account.dto';
import { QueryBalanceLogDto } from './dto/query-balance-log.dto';
import { BalanceAccountVo } from './vo/balance-account.vo';
import { BalanceLogVo } from './vo/balance-log.vo';

@Injectable()
export class BalancesService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly accountInclude = {
    customer: {
      select: {
        id: true,
        name: true,
        code: true,
        phone: true,
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    },
  } satisfies Prisma.BalanceAccountInclude;

  async createAccount(dto: CreateBalanceAccountDto) {
    const customer = await this.prisma.customer.findFirst({
      where: {
        id: dto.customerId,
        deletedAt: null,
      },
    });

    if (!customer) {
      throw new NotFoundException('客户不存在');
    }

    const existing = await this.prisma.balanceAccount.findUnique({
      where: { customerId: dto.customerId },
      include: this.accountInclude,
    });

    if (existing) {
      return BalanceAccountVo.fromEntity(existing);
    }

    const created = await this.prisma.balanceAccount.create({
      data: {
        customerId: dto.customerId,
        remark: dto.remark,
      },
      include: this.accountInclude,
    });

    return BalanceAccountVo.fromEntity(created);
  }

  async findAccounts(query: QueryBalanceAccountDto) {
    const { keyword, status, customerId, page = 1, pageSize = 10 } = query;

    const where: Prisma.BalanceAccountWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (keyword) {
      where.customer = {
        is: {
          deletedAt: null,
          OR: [
            { name: { contains: keyword, mode: 'insensitive' } },
            { code: { contains: keyword, mode: 'insensitive' } },
            { phone: { contains: keyword, mode: 'insensitive' } },
          ],
        },
      };
    } else {
      where.customer = {
        is: {
          deletedAt: null,
        },
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.balanceAccount.findMany({
        where,
        include: this.accountInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.balanceAccount.count({ where }),
    ]);

    return {
      data: BalanceAccountVo.fromEntities(data),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findAccount(id: number) {
    const account = await this.prisma.balanceAccount.findUnique({
      where: { id },
      include: this.accountInclude,
    });

    if (!account) {
      throw new NotFoundException('余额账户不存在');
    }

    return BalanceAccountVo.fromEntity(account);
  }

  async adjustAccount(id: number, dto: AdjustBalanceDto, userId: number) {
    return this.prisma.$transaction(async (tx) => {
      const account = await tx.balanceAccount.findUnique({
        where: { id },
        include: this.accountInclude,
      });

      if (!account) {
        throw new NotFoundException('余额账户不存在');
      }

      if (account.status !== BalanceAccountStatus.ACTIVE) {
        throw new BadRequestException('余额账户已停用，不能调账');
      }

      const before = Number(account.availableBalance);
      const amount = Number(dto.amount);
      const changeAmount = dto.direction === BalanceAdjustDirection.INCREASE ? amount : -amount;
      const after = before + changeAmount;

      if (after < 0) {
        throw new BadRequestException('余额不足，不能扣减');
      }

      const data: Prisma.BalanceAccountUpdateInput = {
        availableBalance: after,
        totalAdjusted: Number(account.totalAdjusted) + changeAmount,
      };

      if (dto.direction === BalanceAdjustDirection.INCREASE) {
        data.totalRecharged = Number(account.totalRecharged) + amount;
      } else {
        data.totalConsumed = Number(account.totalConsumed) + amount;
      }

      const updated = await tx.balanceAccount.update({
        where: { id: account.id },
        data,
        include: this.accountInclude,
      });

      await tx.balanceLog.create({
        data: {
          accountId: account.id,
          customerId: account.customerId,
          type: dto.direction === BalanceAdjustDirection.INCREASE
            ? BalanceLogType.ADJUST_INCREASE
            : BalanceLogType.ADJUST_DECREASE,
          changeAmount,
          balanceBefore: before,
          balanceAfter: after,
          bizType: dto.bizType,
          bizId: dto.bizId,
          bizNo: dto.bizNo,
          remark: dto.remark,
          createdBy: userId,
        },
      });

      return BalanceAccountVo.fromEntity(updated);
    });
  }

  async findLogs(query: QueryBalanceLogDto) {
    const { keyword, type, accountId, customerId, page = 1, pageSize = 10 } = query;

    const where: Prisma.BalanceLogWhereInput = {};

    if (type) {
      where.type = type;
    }

    if (accountId) {
      where.accountId = accountId;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (keyword) {
      where.OR = [
        { bizNo: { contains: keyword, mode: 'insensitive' } },
        {
          customer: {
            is: {
              name: { contains: keyword, mode: 'insensitive' },
            },
          },
        },
        {
          customer: {
            is: {
              code: { contains: keyword, mode: 'insensitive' },
            },
          },
        },
        {
          customer: {
            is: {
              phone: { contains: keyword, mode: 'insensitive' },
            },
          },
        },
      ];
    }

    const include = {
      customer: {
        select: {
          id: true,
          name: true,
          code: true,
          phone: true,
        },
      },
    } satisfies Prisma.BalanceLogInclude;

    const [data, total] = await Promise.all([
      this.prisma.balanceLog.findMany({
        where,
        include,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.balanceLog.count({ where }),
    ]);

    return {
      data: BalanceLogVo.fromEntities(data),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }
}
