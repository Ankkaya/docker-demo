import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CouponType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class CreateCouponDto {
  @ApiProperty({ description: '优惠券名称', example: '新客满100减10' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: '优惠券编码，不填自动生成', example: 'CP202604100001' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @ApiPropertyOptional({ description: '优惠券类型', enum: CouponType, example: CouponType.CASH })
  @IsOptional()
  @IsEnum(CouponType)
  type?: CouponType;

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

  @ApiProperty({ description: '生效开始时间', example: '2026-04-10T00:00:00.000Z' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ description: '生效结束时间', example: '2026-05-10T23:59:59.000Z' })
  @IsDateString()
  endTime: string;

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
