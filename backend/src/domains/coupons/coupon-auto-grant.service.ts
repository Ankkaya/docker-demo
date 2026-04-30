import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import {
  COUPON_ISSUE_SCOPE_TYPE,
  COUPON_ISSUE_TYPE,
  COUPON_SCENE_TYPE,
  COUPON_VALID_TYPE,
} from './coupon.constants';

type AutoGrantScene = 'RECHARGE_GIFT' | 'ORDER_GIFT';

type CouponTx = PrismaService | any;

@Injectable()
export class CouponAutoGrantService {
  constructor(private readonly prisma: PrismaService) {}

  async grantRechargeCoupons(
    tx: CouponTx,
    customerId: number,
    rechargeOrderId: number,
    paidAt: Date,
  ) {
    return this.grantByScene(tx, {
      customerId,
      sceneType: COUPON_SCENE_TYPE.RECHARGE_GIFT as AutoGrantScene,
      paidAt,
      currentRechargeOrderId: rechargeOrderId,
    });
  }

  async grantOrderCoupons(
    tx: CouponTx,
    customerId: number,
    orderId: number,
    paidAt: Date,
  ) {
    return this.grantByScene(tx, {
      customerId,
      sceneType: COUPON_SCENE_TYPE.ORDER_GIFT as AutoGrantScene,
      paidAt,
      currentOrderId: orderId,
    });
  }

  private async grantByScene(
    tx: CouponTx,
    payload: {
      customerId: number;
      sceneType: AutoGrantScene;
      paidAt: Date;
      currentOrderId?: number;
      currentRechargeOrderId?: number;
    },
  ) {
    const customer = await tx.customer.findFirst({
      where: {
        id: payload.customerId,
        deletedAt: null,
      },
      select: {
        id: true,
        createdAt: true,
      },
    });

    if (!customer) {
      return 0;
    }

    const [previousCompletedMallOrderCount, previousCompletedRechargeCount, coupons] = await Promise.all([
      tx.order.count({
        where: {
          customerId: payload.customerId,
          type: 'MALL',
          deletedAt: null,
          payStatus: 'PAID',
          ...(payload.currentOrderId ? { id: { not: payload.currentOrderId } } : {}),
        },
      }),
      tx.balanceRechargeOrder.count({
        where: {
          customerId: payload.customerId,
          deletedAt: null,
          status: 'COMPLETED',
          ...(payload.currentRechargeOrderId ? { id: { not: payload.currentRechargeOrderId } } : {}),
        },
      }),
      tx.coupon.findMany({
        where: {
          deletedAt: null,
          isEnabled: true,
          issueType: COUPON_ISSUE_TYPE.AUTO_GRANT,
          sceneType: payload.sceneType,
          startTime: { lte: payload.paidAt },
          endTime: { gte: payload.paidAt },
        },
        orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
      }),
    ]);

    const profile = {
      customerId: payload.customerId,
      createdAt: customer.createdAt,
      previousCompletedMallOrderCount,
      previousCompletedRechargeCount,
      currentCompletedMallOrderCount: previousCompletedMallOrderCount + (payload.currentOrderId ? 1 : 0),
      currentCompletedRechargeCount: previousCompletedRechargeCount + (payload.currentRechargeOrderId ? 1 : 0),
    };

    let grantedCount = 0;

    for (const coupon of coupons) {
      if (!this.canAutoGrantCoupon(coupon, profile, payload.sceneType)) {
        continue;
      }

      const currentReceivedCount = await tx.couponReceive.count({
        where: {
          couponId: coupon.id,
          customerId: payload.customerId,
          deletedAt: null,
        },
      });

      if (currentReceivedCount >= Number(coupon.perLimit || 1)) {
        continue;
      }

      if (coupon.totalCount !== null && Number(coupon.receivedCount || 0) >= Number(coupon.totalCount)) {
        continue;
      }

      const validity = this.resolveReceiveValidity(coupon, payload.paidAt);

      await tx.couponReceive.create({
        data: {
          couponId: coupon.id,
          customerId: payload.customerId,
          status: 'UNUSED',
          source: 'AUTO_GRANT',
          validFrom: validity.validFrom,
          validTo: validity.validTo,
          remark: payload.sceneType === COUPON_SCENE_TYPE.RECHARGE_GIFT ? '充值成功自动发券' : '订单支付成功自动发券',
        },
      });

      await tx.coupon.update({
        where: { id: coupon.id },
        data: {
          receivedCount: {
            increment: 1,
          },
        },
      });

      grantedCount += 1;
    }

    return grantedCount;
  }

  private canAutoGrantCoupon(
    coupon: any,
    profile: {
      customerId: number;
      createdAt?: Date | null;
      previousCompletedMallOrderCount: number;
      previousCompletedRechargeCount: number;
      currentCompletedMallOrderCount: number;
      currentCompletedRechargeCount: number;
    },
    sceneType: AutoGrantScene,
  ) {
    if (coupon.issueType !== COUPON_ISSUE_TYPE.AUTO_GRANT || coupon.sceneType !== sceneType) {
      return false;
    }

    const rule = coupon.issueRuleJson && typeof coupon.issueRuleJson === 'object'
      ? coupon.issueRuleJson as Record<string, any>
      : {};

    switch (coupon.issueScopeType) {
      case COUPON_ISSUE_SCOPE_TYPE.CUSTOMERS:
        return Array.isArray(rule.customerIds) && rule.customerIds.map((item: any) => Number(item)).includes(Number(profile.customerId));
      case COUPON_ISSUE_SCOPE_TYPE.NEW_USERS: {
        const registerDaysWithin = Number(rule.registerDaysWithin || 30);
        if (!profile.createdAt) {
          return false;
        }
        const diff = Date.now() - new Date(profile.createdAt).getTime();
        return diff <= registerDaysWithin * 24 * 60 * 60 * 1000;
      }
      case COUPON_ISSUE_SCOPE_TYPE.FIRST_ORDER_USERS:
        return sceneType === COUPON_SCENE_TYPE.ORDER_GIFT && profile.previousCompletedMallOrderCount <= 0;
      case COUPON_ISSUE_SCOPE_TYPE.RECHARGED_USERS:
        return sceneType === COUPON_SCENE_TYPE.RECHARGE_GIFT && profile.currentCompletedRechargeCount > 0;
      default:
        return true;
    }
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
}
