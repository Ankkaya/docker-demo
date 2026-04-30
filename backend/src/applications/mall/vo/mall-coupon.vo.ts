import { ApiProperty } from '@nestjs/swagger';
import { CouponReceiveStatus } from '@prisma/client';
import { MallProductListMetaVo } from './mall.vo';

export class MallCouponSummaryVo {
  @ApiProperty({ description: '未使用优惠券数量' })
  unusedCount: number;

  @ApiProperty({ description: '已使用优惠券数量' })
  usedCount: number;

  @ApiProperty({ description: '已过期优惠券数量' })
  expiredCount: number;

  @ApiProperty({ description: '可领取优惠券数量' })
  claimableCount: number;
}

export class MallCouponWalletItemVo {
  @ApiProperty({ description: '领取记录 ID' })
  id: number;

  @ApiProperty({ description: '优惠券 ID' })
  couponId: number;

  @ApiProperty({ description: '优惠券名称' })
  name: string;

  @ApiProperty({ description: '优惠券模板编码' })
  code: string;

  @ApiProperty({ description: '优惠券金额' })
  discountAmount: number;

  @ApiProperty({ description: '使用门槛金额' })
  thresholdAmount: number;

  @ApiProperty({ description: '优惠文案' })
  discountLabel: string;

  @ApiProperty({ description: '使用门槛文案' })
  thresholdLabel: string;

  @ApiProperty({ description: '状态', enum: CouponReceiveStatus })
  status: CouponReceiveStatus;

  @ApiProperty({ description: '状态文案' })
  statusText: string;

  @ApiProperty({ description: '来源文案' })
  sourceText: string;

  @ApiProperty({ description: '有效期开始时间' })
  validFrom: Date;

  @ApiProperty({ description: '有效期结束时间' })
  validTo: Date;

  @ApiProperty({ description: '有效期文案' })
  validPeriodText: string;

  @ApiProperty({ description: '使用说明', nullable: true })
  description: string | null;

  @ApiProperty({ description: '是否临近到期' })
  isExpiringSoon: boolean;

  @ApiProperty({ description: '适用范围摘要' })
  scopeText: string;

  @ApiProperty({ description: '渠道范围', type: [String] })
  channelScope: string[];
}

export class MallCouponWalletListVo {
  @ApiProperty({ type: [MallCouponWalletItemVo] })
  data: MallCouponWalletItemVo[];

  @ApiProperty({ type: MallProductListMetaVo })
  meta: MallProductListMetaVo;
}

export class MallCouponCenterItemVo {
  @ApiProperty({ description: '优惠券 ID' })
  id: number;

  @ApiProperty({ description: '优惠券名称' })
  name: string;

  @ApiProperty({ description: '场景类型' })
  sceneType: string;

  @ApiProperty({ description: '场景类型文案' })
  sceneTypeText: string;

  @ApiProperty({ description: '优惠券模板编码' })
  code: string;

  @ApiProperty({ description: '优惠券金额' })
  discountAmount: number;

  @ApiProperty({ description: '使用门槛金额' })
  thresholdAmount: number;

  @ApiProperty({ description: '优惠文案' })
  discountLabel: string;

  @ApiProperty({ description: '使用门槛文案' })
  thresholdLabel: string;

  @ApiProperty({ description: '剩余数量', nullable: true })
  remainingCount: number | null;

  @ApiProperty({ description: '个人已领取次数' })
  claimedCount: number;

  @ApiProperty({ description: '是否可领取' })
  canClaim: boolean;

  @ApiProperty({ description: '按钮文案' })
  actionText: string;

  @ApiProperty({ description: '标签文案', nullable: true })
  tagText: string | null;

  @ApiProperty({ description: '有效期开始时间' })
  startTime: Date;

  @ApiProperty({ description: '有效期结束时间' })
  endTime: Date;

  @ApiProperty({ description: '有效期文案' })
  validPeriodText: string;

  @ApiProperty({ description: '使用说明', nullable: true })
  description: string | null;

  @ApiProperty({ description: '使用范围类型' })
  useScopeType: string;

  @ApiProperty({ description: '使用范围类型文案' })
  useScopeTypeText: string;

  @ApiProperty({ description: '适用范围摘要' })
  scopeText: string;

  @ApiProperty({ description: '领取范围摘要' })
  issueScopeText: string;

  @ApiProperty({ description: '渠道范围', type: [String] })
  channelScope: string[];
}

export class MallCouponCenterListVo {
  @ApiProperty({ type: [MallCouponCenterItemVo] })
  data: MallCouponCenterItemVo[];

  @ApiProperty({ type: MallProductListMetaVo })
  meta: MallProductListMetaVo;
}

export class MallCouponClaimResultVo {
  @ApiProperty({ description: '是否成功' })
  success: boolean;

  @ApiProperty({ description: '提示信息' })
  message: string;
}

export class MallCouponDetailVo {
  @ApiProperty({ description: '详情来源', enum: ['center', 'wallet'] })
  source: 'center' | 'wallet';

  @ApiProperty({ description: '记录 ID 或 优惠券 ID' })
  id: number;

  @ApiProperty({ description: '优惠券 ID', nullable: true })
  couponId?: number | null;

  @ApiProperty({ description: '优惠券名称' })
  name: string;

  @ApiProperty({ description: '场景类型', nullable: true })
  sceneType?: string | null;

  @ApiProperty({ description: '场景类型文案', nullable: true })
  sceneTypeText?: string | null;

  @ApiProperty({ description: '优惠券模板编码' })
  code: string;

  @ApiProperty({ description: '优惠券金额' })
  discountAmount: number;

  @ApiProperty({ description: '使用门槛金额' })
  thresholdAmount: number;

  @ApiProperty({ description: '优惠文案' })
  discountLabel: string;

  @ApiProperty({ description: '使用门槛文案' })
  thresholdLabel: string;

  @ApiProperty({ description: '状态', nullable: true })
  status?: string | null;

  @ApiProperty({ description: '状态文案', nullable: true })
  statusText?: string | null;

  @ApiProperty({ description: '来源文案', nullable: true })
  sourceText?: string | null;

  @ApiProperty({ description: '剩余数量', nullable: true })
  remainingCount?: number | null;

  @ApiProperty({ description: '个人已领取次数', nullable: true })
  claimedCount?: number | null;

  @ApiProperty({ description: '是否可领取' })
  canClaim: boolean;

  @ApiProperty({ description: '按钮文案' })
  actionText: string;

  @ApiProperty({ description: '标签文案', nullable: true })
  tagText?: string | null;

  @ApiProperty({ description: '有效期开始时间', nullable: true })
  startTime?: Date | null;

  @ApiProperty({ description: '有效期结束时间', nullable: true })
  endTime?: Date | null;

  @ApiProperty({ description: '领取后有效期开始时间', nullable: true })
  validFrom?: Date | null;

  @ApiProperty({ description: '领取后有效期结束时间', nullable: true })
  validTo?: Date | null;

  @ApiProperty({ description: '有效期文案' })
  validPeriodText: string;

  @ApiProperty({ description: '使用说明', nullable: true })
  description: string | null;

  @ApiProperty({ description: '使用范围类型', nullable: true })
  useScopeType?: string | null;

  @ApiProperty({ description: '使用范围类型文案', nullable: true })
  useScopeTypeText?: string | null;

  @ApiProperty({ description: '适用范围摘要', nullable: true })
  scopeText?: string | null;

  @ApiProperty({ description: '适用范围明细', nullable: true })
  scopeDetailText?: string | null;

  @ApiProperty({ description: '领取范围摘要', nullable: true })
  issueScopeText?: string | null;

  @ApiProperty({ description: '渠道范围', type: [String] })
  channelScope: string[];

  @ApiProperty({ description: '是否临近到期', nullable: true })
  isExpiringSoon?: boolean | null;
}
