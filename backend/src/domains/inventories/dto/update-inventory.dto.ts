import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateInventoryDto {
  @ApiPropertyOptional({ example: 10, description: '安全库存下限' })
  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  minStock?: number;

  @ApiPropertyOptional({ example: 1000, description: '库存上限' })
  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  maxStock?: number;

  @ApiPropertyOptional({ example: 'A-01-02', description: '库位编码' })
  @IsString()
  @IsOptional()
  location?: string;
}
