import { IsIn, IsInt, IsOptional, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentType, PaymentStatus, PaymentMethod } from '@prisma/client';

export class QueryPaymentDto {
  @IsEnum(PaymentType)
  @IsOptional()
  type?: PaymentType;

  @IsString()
  @IsOptional()
  bizType?: string;

  @IsEnum(PaymentStatus)
  @IsOptional()
  status?: PaymentStatus;

  @IsEnum(PaymentMethod)
  @IsOptional()
  method?: PaymentMethod;

  @IsString()
  @IsOptional()
  keyword?: string;

  @IsIn(['SHOPPING', 'RECHARGE'])
  @IsOptional()
  orderSource?: 'SHOPPING' | 'RECHARGE';

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  pageSize?: number = 10;
}
