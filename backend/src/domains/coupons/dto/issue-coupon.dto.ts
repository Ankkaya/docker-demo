import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class IssueCouponDto {
  @ApiProperty({ description: '客户ID列表', type: [Number], example: [1, 2, 3] })
  @IsArray()
  @ArrayMinSize(1)
  @Type(() => Number)
  @IsInt({ each: true })
  customerIds: number[];

  @ApiPropertyOptional({ description: '发放备注', example: '后台补发' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  remark?: string;
}
