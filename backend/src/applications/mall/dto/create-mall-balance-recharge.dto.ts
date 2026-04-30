import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PaymentMethod } from '@prisma/client';
import { IsEnum, IsIn, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateMallBalanceRechargeDto {
  @ApiPropertyOptional({ description: '自定义充值金额' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @ApiProperty({ description: '充值方式', enum: [PaymentMethod.WECHAT] })
  @IsEnum(PaymentMethod)
  @IsIn([PaymentMethod.WECHAT])
  method: PaymentMethod;

  @ApiPropertyOptional({ description: '充值套餐ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  packageId?: number;

  @ApiPropertyOptional({ description: '充值活动ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  activityId?: number;
}
