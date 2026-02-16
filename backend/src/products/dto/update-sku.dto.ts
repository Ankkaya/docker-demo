import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SkuStatus } from '@prisma/client';

export class UpdateSkuDto {
  @ApiPropertyOptional({ example: 199.99, description: '成本价' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  costPrice?: number;

  @ApiPropertyOptional({ example: 299.99, description: '销售价' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  salePrice?: number;

  @ApiPropertyOptional({ example: 399.99, description: '市场价' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  marketPrice?: number;

  @ApiPropertyOptional({ example: 'https://example.com/sku.jpg', description: 'SKU图片' })
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

  @ApiPropertyOptional({ example: 'ACTIVE', enum: SkuStatus, description: 'SKU状态' })
  @IsString()
  @IsOptional()
  status?: SkuStatus;
}
