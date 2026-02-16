import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryInventoryDto {
  @ApiPropertyOptional({ example: 1, description: 'SKU ID' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  skuId?: number;

  @ApiPropertyOptional({ example: 1, description: '仓库ID' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  warehouseId?: number;

  @ApiPropertyOptional({ example: 'SPU001', description: 'SPU编码' })
  @IsString()
  @IsOptional()
  spuCode?: string;

  @ApiPropertyOptional({ example: 'SKU001', description: 'SKU编码' })
  @IsString()
  @IsOptional()
  skuCode?: string;

  @ApiPropertyOptional({ example: 'iPhone', description: '商品名称关键词' })
  @IsString()
  @IsOptional()
  productName?: string;

  @ApiPropertyOptional({ example: 1, description: '页码' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ example: 10, description: '每页数量' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  pageSize?: number;
}

export class QueryInventoryWarningDto {
  @ApiPropertyOptional({ example: 1, description: '仓库ID' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  warehouseId?: number;

  @ApiPropertyOptional({ example: 'low', description: '预警类型: low-低库存, high-高库存' })
  @IsString()
  @IsOptional()
  type?: 'low' | 'high';

  @ApiPropertyOptional({ example: 1, description: '页码' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ example: 10, description: '每页数量' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  pageSize?: number;
}
