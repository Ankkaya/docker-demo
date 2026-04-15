import { ApiPropertyOptional } from '@nestjs/swagger';
import { BalanceAccountStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

export class QueryBalanceAccountDto {
  @ApiPropertyOptional({ description: '关键词，支持客户名称/编码/手机号' })
  @IsString()
  @IsOptional()
  keyword?: string;

  @ApiPropertyOptional({ description: '账户状态', enum: BalanceAccountStatus })
  @IsEnum(BalanceAccountStatus)
  @IsOptional()
  status?: BalanceAccountStatus;

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
