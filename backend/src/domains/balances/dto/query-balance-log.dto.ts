import { ApiPropertyOptional } from '@nestjs/swagger';
import { BalanceLogType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

export class QueryBalanceLogDto {
  @ApiPropertyOptional({ description: '关键词，支持客户名称/编码/手机号/单号' })
  @IsString()
  @IsOptional()
  keyword?: string;

  @ApiPropertyOptional({ description: '流水类型', enum: BalanceLogType })
  @IsEnum(BalanceLogType)
  @IsOptional()
  type?: BalanceLogType;

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
