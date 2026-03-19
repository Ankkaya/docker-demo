import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional } from 'class-validator';

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

  @ApiPropertyOptional({
    example: true,
    description: '是否仅返回商城搜索推荐分类',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }

    if (typeof value === 'boolean') {
      return value;
    }

    return ['true', '1'].includes(String(value).toLowerCase());
  })
  @IsBoolean()
  recommendOnly?: boolean;
}
