import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

export class QueryCartDto {
  @ApiPropertyOptional({ description: '用户ID' })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  userId?: number;

  @ApiPropertyOptional({ description: '关键词（商品名称/SKU编码）' })
  @IsString()
  @IsOptional()
  keyword?: string;

  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', default: 10 })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  pageSize?: number = 10;
}

export class AddToCartDto {
  @ApiPropertyOptional({ description: 'SKU ID' })
  @IsInt()
  skuId: number;

  @ApiPropertyOptional({ description: '数量', default: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  quantity?: number = 1;
}
