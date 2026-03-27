import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class CreateFavoriteDto {
  @ApiProperty({ description: '商品ID' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  productId: number;
}
