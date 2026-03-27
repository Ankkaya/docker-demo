import { ApiPropertyOptional } from '@nestjs/swagger';
import { BalanceLogType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional } from 'class-validator';

export class QueryMallBalanceLogDto {
  @ApiPropertyOptional({ description: '流水类型', enum: BalanceLogType })
  @IsEnum(BalanceLogType)
  @IsOptional()
  type?: BalanceLogType;

  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsInt()
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页条数', default: 20 })
  @IsInt()
  @Type(() => Number)
  @IsOptional()
  pageSize?: number = 20;
}
