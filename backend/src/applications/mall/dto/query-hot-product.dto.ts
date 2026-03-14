import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryHotProductDto {
  @ApiPropertyOptional({ example: 8, description: '返回数量，最大20' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(20)
  limit?: number;
}
