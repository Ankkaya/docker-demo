import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryProductDto {
  @ApiPropertyOptional({ example: 'iPhone', description: '商品名称关键词搜索' })
  @IsString()
  @IsOptional()
  keyword?: string;

  @ApiPropertyOptional({ example: 1, description: '分类ID' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  categoryId?: number;

  @ApiPropertyOptional({ example: 1, description: '品牌ID' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  brandId?: number;

  @ApiPropertyOptional({ example: true, description: '是否启用' })
  @IsOptional()
  @Type(() => Boolean)
  isEnabled?: boolean;

  @ApiPropertyOptional({ example: true, description: '是否在商城上架' })
  @IsOptional()
  @Type(() => Boolean)
  mallEnabled?: boolean;

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
