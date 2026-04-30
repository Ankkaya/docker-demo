import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, Max, Min } from 'class-validator';

export class QueryMallRechargeActivityDto {
  @ApiPropertyOptional({ description: '关键词' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: '启用状态' })
  @IsOptional()
  @Transform(({ value }) => (value === undefined || value === null || value === '' ? undefined : value === true || value === 'true'))
  @IsBoolean()
  isEnabled?: boolean;

  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  pageSize?: number = 10;
}
