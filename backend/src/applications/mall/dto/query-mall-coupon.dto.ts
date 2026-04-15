import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class QueryMallCouponDto {
  @ApiPropertyOptional({ description: '状态筛选', enum: ['UNUSED', 'USED', 'EXPIRED'] })
  @IsOptional()
  @IsIn(['UNUSED', 'USED', 'EXPIRED'])
  status?: 'UNUSED' | 'USED' | 'EXPIRED';

  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页条数', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number = 20;
}
