import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CouponType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
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

export class CreateCouponDto {
  @ApiProperty({ description: '优惠券名称', example: '新客满100减10' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: '优惠券模板编码，不填自动生成', example: 'CP202604100001' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @ApiPropertyOptional({ description: '优惠券类型', enum: CouponType, example: CouponType.CASH })
  @IsOptional()
  @IsEnum(CouponType)
  type?: CouponType;

  @ApiPropertyOptional({ description: '优惠券场景', enum: COUPON_SCENE_TYPE, example: COUPON_SCENE_TYPE.COMMON })
  @IsOptional()
  @IsEnum(COUPON_SCENE_TYPE)
  sceneType?: CouponSceneTypeValue;

  @ApiPropertyOptional({ description: '发放方式', enum: COUPON_ISSUE_TYPE, example: COUPON_ISSUE_TYPE.USER_CLAIM })
  @IsOptional()
  @IsEnum(COUPON_ISSUE_TYPE)
  issueType?: CouponIssueTypeValue;

  @ApiPropertyOptional({ description: '使用门槛金额', example: 100 })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  thresholdAmount?: number;

  @ApiProperty({ description: '优惠金额', example: 10 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  discountAmount: number;

  @ApiPropertyOptional({ description: '折扣率，90 表示 9 折', example: 90, nullable: true })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  discountRate?: number | null;

  @ApiPropertyOptional({ description: '折扣券最高优惠金额', example: 50, nullable: true })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  maxDiscountAmount?: number | null;

  @ApiPropertyOptional({ description: '发放总量，为空表示不限量', example: 1000, nullable: true })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  totalCount?: number | null;

  @ApiPropertyOptional({ description: '每个客户限领张数', example: 1 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  perLimit?: number;

  @ApiPropertyOptional({ description: '每人每日限领张数，为空表示不限', example: 1, nullable: true })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  dailyLimit?: number | null;

  @ApiPropertyOptional({ description: '领取开始时间', example: '2026-04-10T00:00:00.000Z', nullable: true })
  @IsOptional()
  @IsDateString()
  claimStartTime?: string | null;

  @ApiPropertyOptional({ description: '领取结束时间', example: '2026-05-10T23:59:59.000Z', nullable: true })
  @IsOptional()
  @IsDateString()
  claimEndTime?: string | null;

  @ApiProperty({ description: '生效开始时间', example: '2026-04-10T00:00:00.000Z' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ description: '生效结束时间', example: '2026-05-10T23:59:59.000Z' })
  @IsDateString()
  endTime: string;

  @ApiPropertyOptional({ description: '有效期类型', enum: COUPON_VALID_TYPE, example: COUPON_VALID_TYPE.FIXED })
  @IsOptional()
  @IsEnum(COUPON_VALID_TYPE)
  validType?: CouponValidTypeValue;

  @ApiPropertyOptional({ description: '领券后有效天数，仅相对有效期使用', example: 7, nullable: true })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  validDays?: number | null;

  @ApiPropertyOptional({ description: '领券后延迟生效天数', example: 0 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  validDelayDays?: number;

  @ApiPropertyOptional({ description: '发放范围类型', enum: COUPON_ISSUE_SCOPE_TYPE, example: COUPON_ISSUE_SCOPE_TYPE.ALL })
  @IsOptional()
  @IsEnum(COUPON_ISSUE_SCOPE_TYPE)
  issueScopeType?: CouponIssueScopeTypeValue;

  @ApiPropertyOptional({
    description: '发放范围规则 JSON，如 { "customerIds": [1,2], "minOrderCount": 1 }',
    type: Object,
  })
  @IsOptional()
  @IsObject()
  issueRuleJson?: Record<string, any>;

  @ApiPropertyOptional({ description: '使用范围类型', enum: COUPON_USE_SCOPE_TYPE, example: COUPON_USE_SCOPE_TYPE.ALL })
  @IsOptional()
  @IsEnum(COUPON_USE_SCOPE_TYPE)
  useScopeType?: CouponUseScopeTypeValue;

  @ApiPropertyOptional({
    description: '使用范围规则 JSON，如 { "categoryIds": [1], "productIds": [2] }',
    type: Object,
  })
  @IsOptional()
  @IsObject()
  useRuleJson?: Record<string, any>;

  @ApiPropertyOptional({ description: '渠道范围', type: [String], example: ['MINI_PROGRAM'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  channelScope?: string[];

  @ApiPropertyOptional({ description: '是否允许与其他优惠券叠加', example: false })
  @IsOptional()
  @IsBoolean()
  stackable?: boolean;

  @ApiPropertyOptional({ description: '是否允许与营销活动叠加', example: true })
  @IsOptional()
  @IsBoolean()
  canUseWithPromotion?: boolean;

  @ApiPropertyOptional({ description: '是否允许与会员价叠加', example: true })
  @IsOptional()
  @IsBoolean()
  canUseWithMemberPrice?: boolean;

  @ApiPropertyOptional({ description: '是否允许与积分抵扣叠加', example: true })
  @IsOptional()
  @IsBoolean()
  canUseWithPoint?: boolean;

  @ApiPropertyOptional({ description: '是否允许与余额支付叠加', example: true })
  @IsOptional()
  @IsBoolean()
  canUseWithBalance?: boolean;

  @ApiPropertyOptional({ description: '是否在领券中心公开展示', example: true })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ description: '退款退券策略', enum: COUPON_REFUND_RETURN_MODE, example: COUPON_REFUND_RETURN_MODE.RETURN_ORIGINAL })
  @IsOptional()
  @IsEnum(COUPON_REFUND_RETURN_MODE)
  refundReturnMode?: CouponRefundReturnModeValue;

  @ApiPropertyOptional({ description: '描述', example: '后台手动发券活动' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: '排序号', example: 0 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  sort?: number;

  @ApiPropertyOptional({ description: '是否启用', example: true })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}
