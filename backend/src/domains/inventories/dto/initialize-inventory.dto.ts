import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class InitializeInventoryDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  skuId: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  warehouseId: number;

  @ApiProperty({ description: '初始入库数量' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  quantity: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  minStock?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  maxStock?: number;
}
