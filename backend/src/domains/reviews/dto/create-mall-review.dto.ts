import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class CreateMallReviewItemDto {
  @ApiProperty({ description: '订单明细ID', example: 1 })
  @Type(() => Number)
  @IsInt()
  orderItemId: number;

  @ApiProperty({ description: '评分，1-5', example: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ description: '评价内容', required: false, example: '商品很好，发货很快' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  content?: string;

  @ApiProperty({
    description: '评价图片列表',
    required: false,
    type: [String],
    example: ['reviews/1/a.jpg'],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(9)
  @IsString({ each: true })
  images?: string[];

  @ApiProperty({ description: '是否匿名', required: false, example: false })
  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;
}

export class CreateMallReviewDto {
  @ApiPropertyOptional({ description: '订单明细ID', example: 1 })
  @ValidateIf(dto => !dto.items?.length)
  @Type(() => Number)
  @IsInt()
  orderItemId?: number;

  @ApiPropertyOptional({ description: '评分，1-5', example: 5 })
  @ValidateIf(dto => !dto.items?.length)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ description: '评价内容', example: '商品很好，发货很快' })
  @ValidateIf(dto => !dto.items?.length)
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  content?: string;

  @ApiPropertyOptional({
    description: '评价图片列表',
    type: [String],
    example: ['reviews/1/a.jpg'],
  })
  @ValidateIf(dto => !dto.items?.length)
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(9)
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ description: '是否匿名', example: false })
  @ValidateIf(dto => !dto.items?.length)
  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;

  @ApiPropertyOptional({
    description: '批量评价明细',
    type: [CreateMallReviewItemDto],
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateMallReviewItemDto)
  items?: CreateMallReviewItemDto[];
}
