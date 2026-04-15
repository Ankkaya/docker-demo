import { IsInt, IsOptional, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { AdjustmentStatus } from '@prisma/client';

export class QueryAdjustmentDto {
  @IsString({ message: '调整单号必须是字符串' })
  @IsOptional()
  adjustNo?: string;

  @IsInt({ message: '仓库ID必须是整数' })
  @IsOptional()
  @Type(() => Number)
  warehouseId?: number;

  @IsEnum(AdjustmentStatus, { message: '状态参数不正确' })
  @IsOptional()
  status?: AdjustmentStatus;

  @IsInt({ message: '页码必须是整数' })
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsInt({ message: '每页数量必须是整数' })
  @IsOptional()
  @Type(() => Number)
  pageSize?: number = 10;
}
