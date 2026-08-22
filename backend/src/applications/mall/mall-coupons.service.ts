import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CouponReceiveStatus, Prisma } from '@prisma/client';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { QueryMallCouponDto } from './dto/query-mall-coupon.dto';
import {
  COUPON_ISSUE_SCOPE_TYPE,
  COUPON_ISSUE_TYPE,
  COUPON_VALID_TYPE,
} from '@/domains/coupons/coupon.constants';

@Injectable()
export class MallCouponsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummaryByUserId(userId: number) {
    const customer = await this.getCustomerProfileByUserId(userId);
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
    const customer = await this.getCustomerProfileByUserId(userId);
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
    const customer = await this.getCustomerProfileByUserId(userId);
    const { page = 1, pageSize = 20 } = query;
    const now = new Date();

    const where: Prisma.CouponWhereInput = {
      deletedAt: null,
      isEnabled: true,
      isPublic: true,
      issueType: COUPON_ISSUE_TYPE.USER_CLAIM,
      OR: [
        { claimStartTime: null },
        { claimStartTime: { lte: now } },
      ],
      AND: [
        {
          OR: [
            { claimEndTime: null },
            { claimEndTime: { gte: now } },
          ],
        },
      ],
    } as any;

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
      data: coupons
        .filter(coupon => this.canCustomerClaimCoupon(coupon, customer))
        .map(coupon => this.toCenterItem(coupon, claimedMap.get(coupon.id) || 0)),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async claimByUserId(userId: number, couponId: number) {
    const customer = await this.getCustomerProfileByUserId(userId);

    await this.prisma.serializableTransaction(async (tx) => {
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
      if (coupon.issueType !== COUPON_ISSUE_TYPE.USER_CLAIM || !coupon.isPublic) {
        throw new BadRequestException('该优惠券当前不支持主动领取');
      }
      if (coupon.claimStartTime && coupon.claimStartTime > now) {
        throw new BadRequestException('优惠券尚未开始领取');
      }
      if (coupon.claimEndTime && coupon.claimEndTime < now) {
        throw new BadRequestException('优惠券已过期');
      }
      if (!this.canCustomerClaimCoupon(coupon, customer)) {
        throw new BadRequestException('当前账号不满足该优惠券领取范围');
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

      if (coupon.dailyLimit) {
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(startOfDay);
        endOfDay.setDate(endOfDay.getDate() + 1);
        const todayClaimCount = await tx.couponReceive.count({
          where: {
            couponId,
            customerId: customer.id,
            deletedAt: null,
            receivedAt: {
              gte: startOfDay,
              lt: endOfDay,
            },
          },
        });
        if (todayClaimCount >= coupon.dailyLimit) {
          throw new BadRequestException('已达到该券今日领取上限');
        }
      }

      if (coupon.totalCount !== null && coupon.receivedCount >= coupon.totalCount) {
        throw new BadRequestException('优惠券已领完');
      }

      const validity = this.resolveReceiveValidity(coupon, now);

      await tx.couponReceive.create({
        data: {
          couponId,
          customerId: customer.id,
          status: CouponReceiveStatus.UNUSED,
          source: 'USER_CLAIM',
          validFrom: validity.validFrom,
          validTo: validity.validTo,
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

  async findDetailByUser(userId: number, id: number, source: 'center' | 'wallet') {
    const customer = await this.getCustomerProfileByUserId(userId);

    if (source === 'wallet') {
      const record = await this.prisma.couponReceive.findFirst({
        where: {
          id,
          customerId: customer.id,
          deletedAt: null,
        },
        include: {
          coupon: true,
        },
      });

      if (!record?.coupon) {
        throw new NotFoundException('优惠券不存在');
      }

      const claimedCount = await this.prisma.couponReceive.count({
        where: {
          couponId: record.couponId,
          customerId: customer.id,
          deletedAt: null,
        },
      });

      return this.toWalletDetail(record, claimedCount, await this.getScopeDetailText(record.coupon));
    }

    const coupon = await this.prisma.coupon.findFirst({
      where: {
        id,
        deletedAt: null,
        isEnabled: true,
        isPublic: true,
      },
    });

    if (!coupon) {
      throw new NotFoundException('优惠券不存在');
    }

    if (!this.canCustomerClaimCoupon(coupon, customer)) {
      throw new BadRequestException('当前账号不满足该优惠券领取范围');
    }

    const claimedCount = await this.prisma.couponReceive.count({
      where: {
        couponId: coupon.id,
        customerId: customer.id,
        deletedAt: null,
      },
    });

    return this.toCenterDetail(coupon, claimedCount, await this.getScopeDetailText(coupon));
  }

  async exchangeByUserId(userId: number, rawCode: string) {
    const customer = await this.getCustomerProfileByUserId(userId);
    const code = rawCode.trim().toUpperCase();
    if (!code) {
      throw new BadRequestException('兑换码不能为空');
    }

    await this.prisma.serializableTransaction(async (tx) => {
      const now = new Date();
      const exchangeCode = await (tx as any).couponExchangeCode.findFirst({
        where: {
          code,
          deletedAt: null,
        },
        include: {
          coupon: true,
        },
      });

      if (!exchangeCode?.coupon) {
        throw new NotFoundException('兑换码不存在');
      }
      if (exchangeCode.status === 'USED') {
        throw new BadRequestException('兑换码已使用');
      }
      if (exchangeCode.status === 'DISABLED') {
        throw new BadRequestException('兑换码已停用');
      }
      if (exchangeCode.expiresAt && new Date(exchangeCode.expiresAt).getTime() < now.getTime()) {
        await (tx as any).couponExchangeCode.update({
          where: { id: exchangeCode.id },
          data: { status: 'EXPIRED' },
        });
        throw new BadRequestException('兑换码已过期');
      }

      const coupon = exchangeCode.coupon;
      if (!coupon.isEnabled || coupon.deletedAt) {
        throw new BadRequestException('优惠券已停用或不存在');
      }
      if (coupon.issueType !== COUPON_ISSUE_TYPE.EXCHANGE_CODE) {
        throw new BadRequestException('当前优惠券不支持兑换码兑换');
      }
      if (new Date(coupon.endTime).getTime() < now.getTime()) {
        throw new BadRequestException('优惠券已过期');
      }
      if (!this.canCustomerClaimCoupon(coupon, customer)) {
        throw new BadRequestException('当前账号不满足该优惠券领取范围');
      }

      const claimedCount = await tx.couponReceive.count({
        where: {
          couponId: coupon.id,
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

      const validity = this.resolveReceiveValidity(coupon, now);

      await tx.couponReceive.create({
        data: {
          couponId: coupon.id,
          customerId: customer.id,
          status: CouponReceiveStatus.UNUSED,
          source: 'EXCHANGE_CODE',
          validFrom: validity.validFrom,
          validTo: validity.validTo,
          remark: `兑换码兑换：${exchangeCode.code}`,
        },
      });

      const claimed = await (tx as any).couponExchangeCode.updateMany({
        where: { id: exchangeCode.id, status: 'UNUSED', deletedAt: null },
        data: {
          status: 'USED',
          customerId: customer.id,
          usedAt: now,
        },
      });
      if (claimed.count !== 1) {
        throw new BadRequestException('兑换码已被使用或状态已变更');
      }

      await tx.coupon.update({
        where: { id: coupon.id },
        data: {
          receivedCount: {
            increment: 1,
          },
        },
      });
    });

    return {
      success: true,
      message: '兑换成功',
    };
  }

  private async getCustomerProfileByUserId(userId: number) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
      select: {
        customer: {
          select: {
            id: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user?.customer) {
      throw new BadRequestException('当前用户尚未绑定客户信息');
    }

    return this.buildCustomerCouponProfile(user.customer.id, user.customer.createdAt);
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
    const customer = await this.prisma.customer.findFirst({
      where: {
        id: customerId,
        deletedAt: null,
      },
      select: {
        id: true,
        createdAt: true,
      },
    });

    if (!customer) {
      return [];
    }

    const customerProfile = await this.buildCustomerCouponProfile(customer.id, customer.createdAt);

    const now = new Date();
    const [coupons, receives] = await Promise.all([
      this.prisma.coupon.findMany({
        where: {
          deletedAt: null,
          isEnabled: true,
          isPublic: true,
          issueType: COUPON_ISSUE_TYPE.USER_CLAIM,
          OR: [
            { claimStartTime: null },
            { claimStartTime: { lte: now } },
          ],
          AND: [
            {
              OR: [
                { claimEndTime: null },
                { claimEndTime: { gte: now } },
              ],
            },
          ],
        } as any,
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

    return coupons
      .filter(coupon => this.canCustomerClaimCoupon(coupon, customerProfile))
      .map(coupon => this.toCenterItem(coupon, claimedMap.get(coupon.id) || 0));
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
      scopeText: this.getScopeText(record.coupon),
      channelScope: Array.isArray(record.coupon.channelScope) ? record.coupon.channelScope : [],
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
      sceneType: coupon.sceneType,
      sceneTypeText: this.getSceneTypeText(coupon.sceneType),
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
      validPeriodText: this.getValidPeriodText(coupon),
      description: coupon.description || null,
      useScopeType: coupon.useScopeType,
      useScopeTypeText: this.getUseScopeTypeText(coupon.useScopeType),
      scopeText: this.getScopeText(coupon),
      issueScopeText: this.getIssueScopeText(coupon),
      channelScope: Array.isArray(coupon.channelScope) ? coupon.channelScope : [],
    };
  }

  private toWalletDetail(record: any, claimedCount: number, scopeDetailText: string | null) {
    const item = this.toWalletItem(record);
    const remainingCount = record.coupon.totalCount === null ? null : Math.max(Number(record.coupon.totalCount || 0) - Number(record.coupon.receivedCount || 0), 0);
    return {
      source: 'wallet' as const,
      id: item.id,
      couponId: item.couponId,
      name: item.name,
      sceneType: record.coupon.sceneType,
      sceneTypeText: this.getSceneTypeText(record.coupon.sceneType),
      code: item.code,
      discountAmount: item.discountAmount,
      thresholdAmount: item.thresholdAmount,
      discountLabel: item.discountLabel,
      thresholdLabel: item.thresholdLabel,
      status: item.status,
      statusText: item.statusText,
      sourceText: item.sourceText,
      remainingCount,
      claimedCount,
      canClaim: item.status === CouponReceiveStatus.UNUSED,
      actionText: item.status === CouponReceiveStatus.UNUSED ? '去使用' : item.statusText,
      tagText: item.statusText,
      startTime: record.coupon.startTime,
      endTime: record.coupon.endTime,
      validFrom: item.validFrom,
      validTo: item.validTo,
      validPeriodText: item.validPeriodText,
      description: item.description,
      useScopeType: record.coupon.useScopeType,
      useScopeTypeText: this.getUseScopeTypeText(record.coupon.useScopeType),
      scopeText: item.scopeText,
      scopeDetailText,
      issueScopeText: this.getIssueScopeText(record.coupon),
      channelScope: item.channelScope,
      isExpiringSoon: item.isExpiringSoon,
    };
  }

  private toCenterDetail(coupon: any, claimedCount: number, scopeDetailText: string | null) {
    const item = this.toCenterItem(coupon, claimedCount);
    return {
      source: 'center' as const,
      id: item.id,
      couponId: null,
      name: item.name,
      sceneType: item.sceneType,
      sceneTypeText: item.sceneTypeText,
      code: item.code,
      discountAmount: item.discountAmount,
      thresholdAmount: item.thresholdAmount,
      discountLabel: item.discountLabel,
      thresholdLabel: item.thresholdLabel,
      status: null,
      statusText: null,
      sourceText: null,
      remainingCount: item.remainingCount,
      claimedCount: item.claimedCount,
      canClaim: item.canClaim,
      actionText: item.actionText,
      tagText: item.tagText,
      startTime: item.startTime,
      endTime: item.endTime,
      validFrom: null,
      validTo: null,
      validPeriodText: item.validPeriodText,
      description: item.description,
      useScopeType: item.useScopeType,
      useScopeTypeText: item.useScopeTypeText,
      scopeText: item.scopeText,
      scopeDetailText,
      issueScopeText: item.issueScopeText,
      channelScope: item.channelScope,
      isExpiringSoon: null,
    };
  }

  private async getScopeDetailText(coupon: any) {
    const rule = coupon.useRuleJson && typeof coupon.useRuleJson === 'object'
      ? coupon.useRuleJson as Record<string, any>
      : {};
    const asIds = (key: string) =>
      Array.isArray(rule[key])
        ? rule[key].map((item: any) => Number(item)).filter((item: number) => Number.isFinite(item) && item > 0)
        : [];

    switch (coupon.useScopeType) {
      case 'CATEGORY': {
        const ids = asIds('categoryIds');
        if (!ids.length) {
          return null;
        }
        const list = await this.prisma.category.findMany({
          where: { id: { in: ids }, deletedAt: null },
          select: { name: true },
        });
        return list.length ? list.map(item => item.name).join('、') : null;
      }
      case 'BRAND': {
        const ids = asIds('brandIds');
        if (!ids.length) {
          return null;
        }
        const list = await this.prisma.brand.findMany({
          where: { id: { in: ids }, deletedAt: null },
          select: { name: true },
        });
        return list.length ? list.map(item => item.name).join('、') : null;
      }
      case 'PRODUCT': {
        const ids = asIds('productIds');
        if (!ids.length) {
          return null;
        }
        const list = await this.prisma.product.findMany({
          where: { id: { in: ids }, deletedAt: null },
          select: { name: true },
        });
        return list.length ? list.map(item => item.name).join('、') : null;
      }
      case 'SKU': {
        const ids = asIds('skuIds');
        if (!ids.length) {
          return null;
        }
        const list = await this.prisma.productSku.findMany({
          where: { id: { in: ids } },
          select: {
            skuCode: true,
            product: {
              select: { name: true },
            },
          },
        });
        return list.length
          ? list.map(item => item.product?.name ? `${item.product.name}/${item.skuCode}` : item.skuCode).join('、')
          : null;
      }
      default:
        return null;
    }
  }

  private canCustomerClaimCoupon(coupon: any, customer: { id: number; createdAt?: Date | null; completedMallOrderCount: number; completedRechargeCount: number }) {
    const rule = coupon.issueRuleJson && typeof coupon.issueRuleJson === 'object' ? coupon.issueRuleJson as Record<string, any> : {};

    switch (coupon.issueScopeType) {
      case COUPON_ISSUE_SCOPE_TYPE.CUSTOMERS:
        return Array.isArray(rule.customerIds) && rule.customerIds.map((item: any) => Number(item)).includes(Number(customer.id));
      case COUPON_ISSUE_SCOPE_TYPE.NEW_USERS: {
        const registerDaysWithin = Number(rule.registerDaysWithin || 30);
        if (!customer.createdAt) {
          return false;
        }
        const diff = Date.now() - new Date(customer.createdAt).getTime();
        return diff <= registerDaysWithin * 24 * 60 * 60 * 1000;
      }
      case COUPON_ISSUE_SCOPE_TYPE.FIRST_ORDER_USERS:
        return customer.completedMallOrderCount <= 0;
      case COUPON_ISSUE_SCOPE_TYPE.RECHARGED_USERS:
        return customer.completedRechargeCount > 0;
      default:
        return true;
    }
  }

  private async buildCustomerCouponProfile(id: number, createdAt?: Date | null) {
    const [completedMallOrderCount, completedRechargeCount] = await Promise.all([
      this.prisma.order.count({
        where: {
          customerId: id,
          type: 'MALL',
          deletedAt: null,
          payStatus: 'PAID',
        },
      }),
      this.prisma.balanceRechargeOrder.count({
        where: {
          customerId: id,
          deletedAt: null,
          status: 'COMPLETED',
        },
      }),
    ]);

    return {
      id,
      createdAt: createdAt || null,
      completedMallOrderCount,
      completedRechargeCount,
    };
  }

  private resolveReceiveValidity(coupon: any, baseTime: Date) {
    const validDelayDays = Number(coupon.validDelayDays || 0);
    const validFrom = coupon.validType === COUPON_VALID_TYPE.RELATIVE
      ? new Date(baseTime.getTime() + validDelayDays * 24 * 60 * 60 * 1000)
      : new Date(coupon.startTime);
    const validTo = coupon.validType === COUPON_VALID_TYPE.RELATIVE
      ? new Date(validFrom.getTime() + Number(coupon.validDays || 0) * 24 * 60 * 60 * 1000)
      : new Date(coupon.endTime);
    return { validFrom, validTo };
  }

  private getValidPeriodText(coupon: any) {
    if (coupon.validType === COUPON_VALID_TYPE.RELATIVE) {
      const delayDays = Number(coupon.validDelayDays || 0);
      const validDays = Number(coupon.validDays || 0);
      return `${delayDays > 0 ? `领券${delayDays}天后` : '领券后'}${validDays}天内有效`;
    }

    return `${this.formatDate(coupon.startTime)} - ${this.formatDate(coupon.endTime)}`;
  }

  private getScopeText(coupon: any) {
    const rule = coupon.useRuleJson && typeof coupon.useRuleJson === 'object' ? coupon.useRuleJson as Record<string, any> : {};
    const lengthOf = (key: string) => Array.isArray(rule[key]) ? rule[key].length : 0;

    switch (coupon.useScopeType) {
      case 'CATEGORY':
        return `限${lengthOf('categoryIds')}个分类可用`;
      case 'BRAND':
        return `限${lengthOf('brandIds')}个品牌可用`;
      case 'PRODUCT':
        return `限${lengthOf('productIds')}件商品可用`;
      case 'SKU':
        return `限${lengthOf('skuIds')}个规格可用`;
      default:
        return '全场通用';
    }
  }

  private getIssueScopeText(coupon: any) {
    const rule = coupon.issueRuleJson && typeof coupon.issueRuleJson === 'object' ? coupon.issueRuleJson as Record<string, any> : {};
    switch (coupon.issueScopeType) {
      case COUPON_ISSUE_SCOPE_TYPE.CUSTOMERS:
        return `限指定客户${Array.isArray(rule.customerIds) ? rule.customerIds.length : 0}人`;
      case COUPON_ISSUE_SCOPE_TYPE.NEW_USERS:
        return `限新客${Number(rule.registerDaysWithin || 30)}天内`;
      case COUPON_ISSUE_SCOPE_TYPE.FIRST_ORDER_USERS:
        return '限首单用户';
      case COUPON_ISSUE_SCOPE_TYPE.RECHARGED_USERS:
        return '限已充值用户';
      default:
        return '全部用户可领';
    }
  }

  private getSceneTypeText(sceneType: string) {
    const map: Record<string, string> = {
      COMMON: '通用活动',
      NEW_USER: '新客专享',
      FIRST_ORDER: '首单专享',
      RECHARGE_GIFT: '充值赠送',
      ORDER_GIFT: '下单赠送',
      MANUAL: '后台补发',
    };
    return map[sceneType] || '通用活动';
  }

  private getUseScopeTypeText(useScopeType: string) {
    const map: Record<string, string> = {
      ALL: '全场通用',
      CATEGORY: '指定分类',
      BRAND: '指定品牌',
      PRODUCT: '指定商品',
      SKU: '指定规格',
    };
    return map[useScopeType] || '全场通用';
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
