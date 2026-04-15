import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateInventoryDto {
  @ApiPropertyOptional({ example: 100, description: '调整后的库存数量' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  quantity?: number;

  @ApiPropertyOptional({ example: 10, description: '安全库存下限' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  minStock?: number;

  @ApiPropertyOptional({ example: 1000, description: '库存上限' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  maxStock?: number;

  @ApiPropertyOptional({ example: 'A-01-02', description: '库位编码' })
  @IsString()
  @IsOptional()
  location?: string;
}
