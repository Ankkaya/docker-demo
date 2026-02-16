import { IsString, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryMallProductDto {
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

  @ApiPropertyOptional({ example: 'new', description: '排序: price_asc-价格升序, price_desc-价格降序, new-最新, sales-销量' })
  @IsString()
  @IsOptional()
  sort?: string;

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
