import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';
import { IsEnum, IsIn, IsNumber, Min } from 'class-validator';

export class CreateMallBalanceRechargeDto {
  @ApiProperty({ description: '充值金额' })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: '充值方式', enum: [PaymentMethod.WECHAT] })
  @IsEnum(PaymentMethod)
  @IsIn([PaymentMethod.WECHAT])
  method: PaymentMethod;
}
