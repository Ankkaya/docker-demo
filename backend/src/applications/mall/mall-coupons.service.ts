import { BadRequestException, Injectable } from '@nestjs/common';
import { CouponReceiveStatus, Prisma } from '@prisma/client';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { QueryMallCouponDto } from './dto/query-mall-coupon.dto';

@Injectable()
export class MallCouponsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummaryByUserId(userId: number) {
    const customer = await this.getCustomerByUserId(userId);
    const [walletCounts, claimableCount] = await Promise.all([
      this.countWalletSummary(customer.id),
      this.countClaimableCoupons(customer.id),
    ]);

    return {
      ...walletCounts,
      claimableCount,
    };
  }

  async findWalletByUserId(userId: number, query: QueryMallCouponDto) {
    const customer = await this.getCustomerByUserId(userId);
    const { page = 1, pageSize = 20, status = 'UNUSED' } = query;
    const now = new Date();
    const where = this.buildWalletWhere(customer.id, status, now);

    const [records, total] = await Promise.all([
      this.prisma.couponReceive.findMany({
        where,
        include: {
          coupon: true,
        },
        orderBy: status === 'UNUSED'
          ? [{ validTo: 'asc' }, { receivedAt: 'desc' }]
          : [{ updatedAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.couponReceive.count({ where }),
    ]);

    return {
      data: records.map(record => this.toWalletItem(record)),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findCenterCouponsByUserId(userId: number, query: QueryMallCouponDto) {
    const customer = await this.getCustomerByUserId(userId);
    const { page = 1, pageSize = 20 } = query;
    const now = new Date();

    const where: Prisma.CouponWhereInput = {
      deletedAt: null,
      isEnabled: true,
      startTime: { lte: now },
      endTime: { gte: now },
    };

    const [coupons, total, receives] = await Promise.all([
      this.prisma.coupon.findMany({
        where,
        orderBy: [{ sort: 'asc' }, { endTime: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.coupon.count({ where }),
      this.prisma.couponReceive.findMany({
        where: {
          customerId: customer.id,
          deletedAt: null,
        },
        select: {
          couponId: true,
        },
      }),
    ]);

    const claimedMap = receives.reduce((map, item) => {
      map.set(item.couponId, (map.get(item.couponId) || 0) + 1);
      return map;
    }, new Map<number, number>());

    return {
      data: coupons.map(coupon => this.toCenterItem(coupon, claimedMap.get(coupon.id) || 0)),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async claimByUserId(userId: number, couponId: number) {
    const customer = await this.getCustomerByUserId(userId);

    await this.prisma.$transaction(async (tx) => {
      const now = new Date();
      const coupon = await tx.coupon.findFirst({
        where: {
          id: couponId,
          deletedAt: null,
        },
      });

      if (!coupon) {
        throw new BadRequestException('优惠券不存在');
      }
      if (!coupon.isEnabled) {
        throw new BadRequestException('优惠券已停用');
      }
      if (coupon.startTime > now) {
        throw new BadRequestException('优惠券尚未开始领取');
      }
      if (coupon.endTime < now) {
        throw new BadRequestException('优惠券已过期');
      }

      const claimedCount = await tx.couponReceive.count({
        where: {
          couponId,
          customerId: customer.id,
          deletedAt: null,
        },
      });

      if (claimedCount >= coupon.perLimit) {
        throw new BadRequestException('已达到该券领取上限');
      }

      if (coupon.totalCount !== null && coupon.receivedCount >= coupon.totalCount) {
        throw new BadRequestException('优惠券已领完');
      }

      await tx.couponReceive.create({
        data: {
          couponId,
          customerId: customer.id,
          status: CouponReceiveStatus.UNUSED,
          source: 'USER_CLAIM',
          validFrom: coupon.startTime,
          validTo: coupon.endTime,
          remark: '用户主动领取',
        },
      });

      await tx.coupon.update({
        where: { id: couponId },
        data: {
          receivedCount: {
            increment: 1,
          },
        },
      });
    });

    return {
      success: true,
      message: '领取成功',
    };
  }

  private async getCustomerByUserId(userId: number) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
      select: {
        customer: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!user?.customer) {
      throw new BadRequestException('当前用户尚未绑定客户信息');
    }

    return user.customer;
  }

  private buildWalletWhere(customerId: number, status: 'UNUSED' | 'USED' | 'EXPIRED', now: Date): Prisma.CouponReceiveWhereInput {
    const where: Prisma.CouponReceiveWhereInput = {
      customerId,
      deletedAt: null,
    };

    if (status === 'USED') {
      where.status = CouponReceiveStatus.USED;
      return where;
    }

    if (status === 'EXPIRED') {
      where.status = CouponReceiveStatus.UNUSED;
      where.validTo = { lt: now };
      return where;
    }

    where.status = CouponReceiveStatus.UNUSED;
    where.validTo = { gte: now };
    return where;
  }

  private async countWalletSummary(customerId: number) {
    const now = new Date();
    const [unusedCount, usedCount, expiredCount] = await Promise.all([
      this.prisma.couponReceive.count({
        where: {
          customerId,
          deletedAt: null,
          status: CouponReceiveStatus.UNUSED,
          validTo: { gte: now },
        },
      }),
      this.prisma.couponReceive.count({
        where: {
          customerId,
          deletedAt: null,
          status: CouponReceiveStatus.USED,
        },
      }),
      this.prisma.couponReceive.count({
        where: {
          customerId,
          deletedAt: null,
          status: CouponReceiveStatus.UNUSED,
          validTo: { lt: now },
        },
      }),
    ]);

    return {
      unusedCount,
      usedCount,
      expiredCount,
    };
  }

  private async countClaimableCoupons(customerId: number) {
    const center = await this.findCenterCouponsByCustomerId(customerId);
    return center.filter(item => item.canClaim).length;
  }

  private async findCenterCouponsByCustomerId(customerId: number) {
    const now = new Date();
    const [coupons, receives] = await Promise.all([
      this.prisma.coupon.findMany({
        where: {
          deletedAt: null,
          isEnabled: true,
          startTime: { lte: now },
          endTime: { gte: now },
        },
        orderBy: [{ sort: 'asc' }, { endTime: 'asc' }],
      }),
      this.prisma.couponReceive.findMany({
        where: {
          customerId,
          deletedAt: null,
        },
        select: {
          couponId: true,
        },
      }),
    ]);

    const claimedMap = receives.reduce((map, item) => {
      map.set(item.couponId, (map.get(item.couponId) || 0) + 1);
      return map;
    }, new Map<number, number>());

    return coupons.map(coupon => this.toCenterItem(coupon, claimedMap.get(coupon.id) || 0));
  }

  private toWalletItem(record: any) {
    const currentStatus = this.resolveWalletStatus(record);
    const discountAmount = Number(record.coupon.discountAmount || 0);
    const thresholdAmount = Number(record.coupon.thresholdAmount || 0);
    const validTo = new Date(record.validTo);
    const diffMs = validTo.getTime() - Date.now();

    return {
      id: record.id,
      couponId: record.couponId,
      name: record.coupon.name,
      code: record.coupon.code,
      discountAmount,
      thresholdAmount,
      discountLabel: thresholdAmount > 0 ? `满${thresholdAmount.toFixed(0)}减${discountAmount.toFixed(0)}` : `直减${discountAmount.toFixed(0)}元`,
      thresholdLabel: thresholdAmount > 0 ? `订单满${thresholdAmount.toFixed(2)}元可用` : '无门槛使用',
      status: currentStatus,
      statusText: this.getWalletStatusText(currentStatus),
      sourceText: record.source === 'USER_CLAIM' ? '自行领取' : '系统发放',
      validFrom: record.validFrom,
      validTo: record.validTo,
      validPeriodText: `${this.formatDate(record.validFrom)} - ${this.formatDate(record.validTo)}`,
      description: record.coupon.description || null,
      isExpiringSoon: currentStatus === CouponReceiveStatus.UNUSED && diffMs > 0 && diffMs <= 3 * 24 * 60 * 60 * 1000,
    };
  }

  private toCenterItem(coupon: any, claimedCount: number) {
    const discountAmount = Number(coupon.discountAmount || 0);
    const thresholdAmount = Number(coupon.thresholdAmount || 0);
    const remainingCount = coupon.totalCount === null ? null : Math.max(coupon.totalCount - coupon.receivedCount, 0);
    const canClaim = remainingCount !== 0 && claimedCount < coupon.perLimit;

    return {
      id: coupon.id,
      name: coupon.name,
      code: coupon.code,
      discountAmount,
      thresholdAmount,
      discountLabel: thresholdAmount > 0 ? `满${thresholdAmount.toFixed(0)}减${discountAmount.toFixed(0)}` : `直减${discountAmount.toFixed(0)}元`,
      thresholdLabel: thresholdAmount > 0 ? `订单满${thresholdAmount.toFixed(2)}元可用` : '无门槛使用',
      remainingCount,
      claimedCount,
      canClaim,
      actionText: canClaim ? '立即领取' : claimedCount >= coupon.perLimit ? '已达上限' : '已领完',
      tagText: claimedCount > 0 ? '已入券包' : remainingCount !== null && remainingCount <= 20 ? '即将抢光' : '限时可领',
      startTime: coupon.startTime,
      endTime: coupon.endTime,
      validPeriodText: `${this.formatDate(coupon.startTime)} - ${this.formatDate(coupon.endTime)}`,
      description: coupon.description || null,
    };
  }

  private resolveWalletStatus(record: any) {
    if (record.status === CouponReceiveStatus.USED) {
      return CouponReceiveStatus.USED;
    }
    if (new Date(record.validTo).getTime() < Date.now()) {
      return CouponReceiveStatus.EXPIRED;
    }
    return CouponReceiveStatus.UNUSED;
  }

  private getWalletStatusText(status: CouponReceiveStatus) {
    const map: Record<CouponReceiveStatus, string> = {
      UNUSED: '待使用',
      USED: '已使用',
      EXPIRED: '已过期',
      INVALID: '已作废',
    };
    return map[status];
  }

  private formatDate(input: Date | string) {
    const date = new Date(input);
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${month}.${day}`;
  }
}
