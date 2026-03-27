import { PaymentMethod } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class PayMallOrderDto {
  @IsEnum(PaymentMethod)
  method: PaymentMethod;
}
