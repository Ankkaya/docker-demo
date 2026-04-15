import { Type } from 'class-transformer';
import { CouponReceiveStatus } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

export class QueryCouponReceiveDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  couponId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  customerId?: number;

  @IsOptional()
  @IsEnum(CouponReceiveStatus)
  status?: CouponReceiveStatus;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  pageSize?: number = 10;
}
