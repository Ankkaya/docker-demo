import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';

export class QueryMallCategoryDto {
  @ApiPropertyOptional({
    example: '',
    description: '父级分类ID，传空字符串时筛选一级分类',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) {
      return null;
    }

    const parsed = Number(value);
    return Number.isNaN(parsed) ? value : parsed;
  })
  @IsNumber()
  parentId?: number | null;
}
