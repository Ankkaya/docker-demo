import { IsInt, IsBoolean, Min, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCartDto {
  @ApiProperty({ description: '用户ID', required: false })
  @IsInt()
  @IsOptional()
  userId?: number;

  @ApiProperty({ description: 'SKU ID' })
  @IsInt()
  skuId: number;

  @ApiProperty({ description: '数量', minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: '是否选中', default: true, required: false })
  @IsBoolean()
  @IsOptional()
  selected?: boolean = true;
}
