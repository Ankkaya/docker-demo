import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  IsEnum,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// SKU规格DTO
class SkuSpecDto {
  @ApiProperty({ example: '颜色', description: '规格名称' })
  @IsString()
  name: string;

  @ApiProperty({ example: '红色', description: '规格值' })
  @IsString()
  value: string;
}

// 创建SKU的DTO
class CreateSkuDto {
  @ApiPropertyOptional({ example: 'SKU001', description: 'SKU编码，不传则自动生成' })
  @IsString()
  @IsOptional()
  skuCode?: string;

  @ApiProperty({
    example: [{ name: '颜色', value: '红色' }],
    description: '规格组合',
    type: [SkuSpecDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkuSpecDto)
  specs: SkuSpecDto[];

  @ApiProperty({ example: 100.00, description: '成本价' })
  @IsNumber()
  @Type(() => Number)
  costPrice: number;

  @ApiProperty({ example: 199.99, description: '销售价' })
  @IsNumber()
  @Type(() => Number)
  salePrice: number;

  @ApiPropertyOptional({ example: 299.99, description: '市场价' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  marketPrice?: number;

  @ApiPropertyOptional({ example: 'https://example.com/sku1.jpg', description: 'SKU图片' })
  @IsString()
  @IsOptional()
  image?: string;

  @ApiPropertyOptional({ example: '6901234567890', description: '条形码' })
  @IsString()
  @IsOptional()
  barcode?: string;

  @ApiPropertyOptional({ example: 0.5, description: '重量(kg)' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  weight?: number;

  @ApiPropertyOptional({ example: 0.001, description: '体积(m³)' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  volume?: number;

  @ApiPropertyOptional({ example: true, description: '是否默认SKU' })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional({ example: 0, description: '排序号' })
  @IsNumber()
  @IsOptional()
  sort?: number;
}

// 初始库存DTO
class InitialInventoryDto {
  @ApiProperty({ example: 1, description: '仓库ID' })
  @IsNumber()
  @Type(() => Number)
  warehouseId: number;

  @ApiProperty({ example: 100, description: '初始库存数量' })
  @IsNumber()
  @Type(() => Number)
  quantity: number;

  @ApiPropertyOptional({ example: 10, description: '安全库存下限' })
  @IsNumber()
  @IsOptional()
  minStock?: number;

  @ApiPropertyOptional({ example: 1000, description: '库存上限' })
  @IsNumber()
  @IsOptional()
  maxStock?: number;
}

// 规格模板项DTO
class SpecTemplateItemDto {
  @ApiProperty({ example: '颜色', description: '规格名称' })
  @IsString()
  name: string;

  @ApiProperty({ example: ['红', '蓝', '黑'], description: '规格可选值列表' })
  @IsArray()
  @IsString({ each: true })
  values: string[];
}

export class CreateProductDto {
  @ApiProperty({ example: 'iPhone 15 Pro', description: '商品名称' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiPropertyOptional({ example: 'SPU001', description: 'SPU编码，不传则自动生成' })
  @IsString()
  @IsOptional()
  spuCode?: string;

  @ApiProperty({ example: 1, description: '分类ID' })
  @IsNumber()
  @Type(() => Number)
  categoryId: number;

  @ApiPropertyOptional({ example: 1, description: '品牌ID' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  brandId?: number;

  @ApiPropertyOptional({ example: '苹果最新款手机', description: '商品描述' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: '<p>详细介绍...</p>', description: '商品详情（富文本HTML）' })
  @IsString()
  @IsOptional()
  detail?: string;

  @ApiPropertyOptional({ example: 'https://example.com/main.jpg', description: '商品主图' })
  @IsString()
  @IsOptional()
  mainImage?: string;

  @ApiPropertyOptional({
    example: ['https://example.com/1.jpg', 'https://example.com/2.jpg'],
    description: '商品图片列表',
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @ApiProperty({ example: 1, description: '单位ID' })
  @IsNumber()
  @Type(() => Number)
  unitId: number;

  @ApiPropertyOptional({
    example: [{ name: '颜色', values: ['红', '蓝', '黑'] }],
    description: '规格模板',
    type: [SpecTemplateItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SpecTemplateItemDto)
  @IsOptional()
  specTemplate?: SpecTemplateItemDto[];

  @ApiPropertyOptional({ example: true, description: '是否启用' })
  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;

  @ApiPropertyOptional({ example: false, description: '是否在商城上架' })
  @IsBoolean()
  @IsOptional()
  mallEnabled?: boolean;

  @ApiProperty({
    example: [{ skuCode: 'SKU001', specs: [{ name: '颜色', value: '红色' }], costPrice: 100, salePrice: 199.99 }],
    description: 'SKU列表',
    type: [CreateSkuDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSkuDto)
  skus: CreateSkuDto[];

  @ApiPropertyOptional({
    example: [{ warehouseId: 1, quantity: 100, minStock: 10 }],
    description: '初始库存（仅对单SKU商品有效，多SKU商品需要在SKU创建后再设置库存）',
    type: [InitialInventoryDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InitialInventoryDto)
  @IsOptional()
  initialInventories?: InitialInventoryDto[];
}
