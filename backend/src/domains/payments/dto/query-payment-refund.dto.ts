import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentRefundStatus } from '@prisma/client';

export class QueryPaymentRefundDto {
  @IsString()
  @IsOptional()
  keyword?: string;

  @IsOptional()
  @IsIn(['SHOPPING', 'RECHARGE'])
  orderSource?: 'SHOPPING' | 'RECHARGE';

  @IsOptional()
  status?: PaymentRefundStatus;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  pageSize?: number = 10;
}
