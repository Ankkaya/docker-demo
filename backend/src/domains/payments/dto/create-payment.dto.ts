import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { PaymentType, PaymentMethod } from '@prisma/client';

export class CreatePaymentDto {
  @IsEnum(PaymentType)
  type: PaymentType;

  @IsString()
  bizType: string; // PURCHASE / SALE

  @IsInt()
  @IsNotEmpty()
  bizId: number; // 采购订单ID或销售订单ID

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsString()
  @IsOptional()
  remark?: string;
}
