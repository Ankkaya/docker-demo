import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateMallReviewDto {
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
