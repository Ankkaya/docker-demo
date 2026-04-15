import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

class UpdateProductMallSkuDto {
  @ApiPropertyOptional({ example: 1, description: 'SKU ID' })
  @IsNumber()
  @Type(() => Number)
  skuId: number;

  @ApiPropertyOptional({ example: 199.99, description: '商城销售价' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  salePrice?: number;

  @ApiPropertyOptional({ example: 299.99, description: '商城市场价' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  marketPrice?: number;

  @ApiPropertyOptional({ example: 'products/mall/sku-1.jpg', description: '商城SKU图片' })
  @IsString()
  @IsOptional()
  image?: string;
}

export class UpdateProductMallDto {
  @ApiPropertyOptional({ example: '商城展示名称', description: '商城显示名称' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: '商城简述', description: '商城商品简述' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: '<p>商城详情</p>', description: '商城商品详情' })
  @IsString()
  @IsOptional()
  detail?: string;

  @ApiPropertyOptional({ example: 'products/mall/main.jpg', description: '商城主图' })
  @IsString()
  @IsOptional()
  mainImage?: string;

  @ApiPropertyOptional({ example: ['products/mall/1.jpg'], description: '商城图片列表', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @ApiPropertyOptional({ example: true, description: '是否上架到商城' })
  @IsBoolean()
  @IsOptional()
  mallEnabled?: boolean;

  @ApiPropertyOptional({ example: true, description: '是否手动设为热门商品' })
  @IsBoolean()
  @IsOptional()
  isHot?: boolean;

  @ApiPropertyOptional({ example: 1, description: '热门商品排序，越小越靠前' })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  hotSort?: number;

  @ApiPropertyOptional({ example: '爆款', description: '热门商品标签' })
  @IsString()
  @IsOptional()
  hotLabel?: string;

  @ApiPropertyOptional({ description: '商城SKU扩展信息', type: [UpdateProductMallSkuDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateProductMallSkuDto)
  @IsOptional()
  skuMallInfos?: UpdateProductMallSkuDto[];
}
