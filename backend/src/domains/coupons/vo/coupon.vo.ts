import { ApiProperty } from '@nestjs/swagger';
import { CouponType } from '@prisma/client';
import {
  COUPON_ISSUE_SCOPE_TYPE,
  COUPON_ISSUE_TYPE,
  COUPON_REFUND_RETURN_MODE,
  COUPON_SCENE_TYPE,
  COUPON_USE_SCOPE_TYPE,
  COUPON_VALID_TYPE,
  CouponIssueScopeTypeValue,
  CouponIssueTypeValue,
  CouponRefundReturnModeValue,
  CouponSceneTypeValue,
  CouponUseScopeTypeValue,
  CouponValidTypeValue,
} from '../coupon.constants';

export class CouponVo {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  code: string;

  @ApiProperty({ enum: CouponType })
  type: CouponType;

  @ApiProperty()
  typeText: string;

  @ApiProperty({ enum: COUPON_SCENE_TYPE })
  sceneType: CouponSceneTypeValue;

  @ApiProperty()
  sceneTypeText: string;

  @ApiProperty({ enum: COUPON_ISSUE_TYPE })
  issueType: CouponIssueTypeValue;

  @ApiProperty()
  issueTypeText: string;

  @ApiProperty()
  thresholdAmount: number;

  @ApiProperty()
  discountAmount: number;

  @ApiProperty({ nullable: true })
  discountRate: number | null;

  @ApiProperty({ nullable: true })
  maxDiscountAmount: number | null;

  @ApiProperty({ nullable: true })
  totalCount: number | null;

  @ApiProperty()
  perLimit: number;

  @ApiProperty({ nullable: true })
  dailyLimit: number | null;

  @ApiProperty()
  receivedCount: number;

  @ApiProperty()
  usedCount: number;

  @ApiProperty()
  expiredCount: number;

  @ApiProperty({ nullable: true })
  claimStartTime: Date | null;

  @ApiProperty({ nullable: true })
  claimEndTime: Date | null;

  @ApiProperty()
  startTime: Date;

  @ApiProperty()
  endTime: Date;

  @ApiProperty({ enum: COUPON_VALID_TYPE })
  validType: CouponValidTypeValue;

  @ApiProperty()
  validTypeText: string;

  @ApiProperty({ nullable: true })
  validDays: number | null;

  @ApiProperty()
  validDelayDays: number;

  @ApiProperty({ enum: COUPON_ISSUE_SCOPE_TYPE })
  issueScopeType: CouponIssueScopeTypeValue;

  @ApiProperty()
  issueScopeTypeText: string;

  @ApiProperty({ nullable: true })
  issueRuleJson: unknown;

  @ApiProperty({ enum: COUPON_USE_SCOPE_TYPE })
  useScopeType: CouponUseScopeTypeValue;

  @ApiProperty()
  useScopeTypeText: string;

  @ApiProperty({ nullable: true })
  useRuleJson: unknown;

  @ApiProperty({ type: [String] })
  channelScope: string[];

  @ApiProperty()
  stackable: boolean;

  @ApiProperty()
  canUseWithPromotion: boolean;

  @ApiProperty()
  canUseWithMemberPrice: boolean;

  @ApiProperty()
  canUseWithPoint: boolean;

  @ApiProperty()
  canUseWithBalance: boolean;

  @ApiProperty()
  isPublic: boolean;

  @ApiProperty({ enum: COUPON_REFUND_RETURN_MODE })
  refundReturnMode: CouponRefundReturnModeValue;

  @ApiProperty()
  refundReturnModeText: string;

  @ApiProperty({ nullable: true })
  description: string | null;

  @ApiProperty()
  sort: number;

  @ApiProperty()
  isEnabled: boolean;

  @ApiProperty()
  statusText: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromEntity(entity: any): CouponVo {
    return {
      id: entity.id,
      name: entity.name,
      code: entity.code,
      type: entity.type,
      typeText: CouponVo.resolveTypeText(entity.type),
      sceneType: entity.sceneType,
      sceneTypeText: CouponVo.resolveSceneTypeText(entity.sceneType),
      issueType: entity.issueType,
      issueTypeText: CouponVo.resolveIssueTypeText(entity.issueType),
      thresholdAmount: Number(entity.thresholdAmount || 0),
      discountAmount: Number(entity.discountAmount || 0),
      discountRate: entity.discountRate ?? null,
      maxDiscountAmount: entity.maxDiscountAmount === null || entity.maxDiscountAmount === undefined
        ? null
        : Number(entity.maxDiscountAmount),
      totalCount: entity.totalCount ?? null,
      perLimit: entity.perLimit,
      dailyLimit: entity.dailyLimit ?? null,
      receivedCount: entity.receivedCount,
      usedCount: entity.usedCount,
      expiredCount: entity.expiredCount ?? 0,
      claimStartTime: entity.claimStartTime ?? null,
      claimEndTime: entity.claimEndTime ?? null,
      startTime: entity.startTime,
      endTime: entity.endTime,
      validType: entity.validType,
      validTypeText: CouponVo.resolveValidTypeText(entity.validType),
      validDays: entity.validDays ?? null,
      validDelayDays: entity.validDelayDays ?? 0,
      issueScopeType: entity.issueScopeType,
      issueScopeTypeText: CouponVo.resolveIssueScopeTypeText(entity.issueScopeType),
      issueRuleJson: entity.issueRuleJson ?? null,
      useScopeType: entity.useScopeType,
      useScopeTypeText: CouponVo.resolveUseScopeTypeText(entity.useScopeType),
      useRuleJson: entity.useRuleJson ?? null,
      channelScope: Array.isArray(entity.channelScope) ? entity.channelScope : [],
      stackable: !!entity.stackable,
      canUseWithPromotion: entity.canUseWithPromotion !== false,
      canUseWithMemberPrice: entity.canUseWithMemberPrice !== false,
      canUseWithPoint: entity.canUseWithPoint !== false,
      canUseWithBalance: entity.canUseWithBalance !== false,
      isPublic: entity.isPublic !== false,
      refundReturnMode: entity.refundReturnMode,
      refundReturnModeText: CouponVo.resolveRefundReturnModeText(entity.refundReturnMode),
      description: entity.description ?? null,
      sort: entity.sort,
      isEnabled: entity.isEnabled,
      statusText: CouponVo.resolveStatusText(entity),
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  private static resolveTypeText(type: CouponType) {
    const map: Record<string, string> = {
      CASH: '满减券',
      DISCOUNT: '折扣券',
      INSTANT_REDUCTION: '立减券',
    };
    return map[type];
  }

  private static resolveSceneTypeText(type: CouponSceneTypeValue) {
    const map: Record<CouponSceneTypeValue, string> = {
      COMMON: '通用活动',
      NEW_USER: '新客专享',
      FIRST_ORDER: '首单专享',
      RECHARGE_GIFT: '充值赠送',
      ORDER_GIFT: '下单赠送',
      MANUAL: '后台补发',
    };
    return map[type];
  }

  private static resolveIssueTypeText(type: CouponIssueTypeValue) {
    const map: Record<CouponIssueTypeValue, string> = {
      USER_CLAIM: '用户领取',
      ADMIN_ASSIGN: '后台发放',
      AUTO_GRANT: '系统自动发放',
      EXCHANGE_CODE: '券码兑换',
    };
    return map[type];
  }

  private static resolveValidTypeText(type: CouponValidTypeValue) {
    const map: Record<CouponValidTypeValue, string> = {
      FIXED: '固定时间',
      RELATIVE: '领后生效',
    };
    return map[type];
  }

  private static resolveIssueScopeTypeText(type: CouponIssueScopeTypeValue) {
    const map: Record<CouponIssueScopeTypeValue, string> = {
      ALL: '全部用户',
      CUSTOMERS: '指定客户',
      NEW_USERS: '新客',
      FIRST_ORDER_USERS: '首单用户',
      RECHARGED_USERS: '已充值用户',
    };
    return map[type];
  }

  private static resolveUseScopeTypeText(type: CouponUseScopeTypeValue) {
    const map: Record<CouponUseScopeTypeValue, string> = {
      ALL: '全场通用',
      CATEGORY: '指定分类',
      BRAND: '指定品牌',
      PRODUCT: '指定商品',
      SKU: '指定规格',
    };
    return map[type];
  }

  private static resolveRefundReturnModeText(type: CouponRefundReturnModeValue) {
    const map: Record<CouponRefundReturnModeValue, string> = {
      RETURN_ORIGINAL: '退回原券',
      GRANT_NEW: '补发新券',
      NOT_RETURN: '不退券',
    };
    return map[type];
  }

  static fromEntities(entities: any[]): CouponVo[] {
    return entities.map(entity => CouponVo.fromEntity(entity));
  }

  private static resolveStatusText(entity: any) {
    if (!entity.isEnabled) {
      return '已停用';
    }
    const now = Date.now();
    if (new Date(entity.startTime).getTime() > now) {
      return '未开始';
    }
    if (new Date(entity.endTime).getTime() < now) {
      return '已过期';
    }
    return '进行中';
  }
}
