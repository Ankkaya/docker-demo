import { IsInt, IsBoolean, Min, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCartDto {
  @ApiPropertyOptional({ description: '数量', minimum: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional({ description: '是否选中' })
  @IsBoolean()
  @IsOptional()
  selected?: boolean;
}
