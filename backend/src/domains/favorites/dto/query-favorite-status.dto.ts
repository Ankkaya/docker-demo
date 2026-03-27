import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsInt, IsOptional, Min } from 'class-validator';

export class QueryFavoriteStatusDto {
  @ApiPropertyOptional({
    description: '商品ID列表，支持逗号分隔字符串或数组',
    type: [Number],
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.map(item => Number(item)).filter(item => Number.isInteger(item) && item > 0);
    }
    if (typeof value === 'string') {
      return value
        .split(',')
        .map(item => Number(item.trim()))
        .filter(item => Number.isInteger(item) && item > 0);
    }
    return [];
  })
  @IsArray()
  @ArrayMaxSize(100)
  @IsInt({ each: true })
  @Min(1, { each: true })
  productIds?: number[] = [];
}
