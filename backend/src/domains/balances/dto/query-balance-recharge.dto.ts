import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

export class QueryBalanceRechargeDto {
  @ApiPropertyOptional({ description: '关键词，支持充值单号/商户单号/微信单号/客户信息' })
  @IsString()
  @IsOptional()
  keyword?: string;

  @ApiPropertyOptional({ description: '状态', enum: PaymentStatus })
  @IsEnum(PaymentStatus)
  @IsOptional()
  status?: PaymentStatus;

  @ApiPropertyOptional({ description: '支付方式', enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  @IsOptional()
  method?: PaymentMethod;

  @ApiPropertyOptional({ description: '账户ID' })
  @IsInt()
  @Type(() => Number)
  @IsOptional()
  accountId?: number;

  @ApiPropertyOptional({ description: '客户ID' })
  @IsInt()
  @Type(() => Number)
  @IsOptional()
  customerId?: number;

  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsInt()
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页条数', default: 10 })
  @IsInt()
  @Type(() => Number)
  @IsOptional()
  pageSize?: number = 10;
}
