import { IsInt, IsOptional, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { InventoryType } from '@prisma/client';

export class QueryInventoryLogDto {
  @IsInt({ message: 'SKU ID必须是整数' })
  @IsOptional()
  @Type(() => Number)
  skuId?: number;

  @IsInt({ message: '仓库ID必须是整数' })
  @IsOptional()
  @Type(() => Number)
  warehouseId?: number;

  @IsEnum(InventoryType, { message: '流水类型参数不正确' })
  @IsOptional()
  type?: InventoryType;

  @IsString({ message: '业务单号必须是字符串' })
  @IsOptional()
  bizNo?: string;

  @IsInt({ message: '页码必须是整数' })
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsInt({ message: '每页数量必须是整数' })
  @IsOptional()
  @Type(() => Number)
  pageSize?: number = 10;
}
