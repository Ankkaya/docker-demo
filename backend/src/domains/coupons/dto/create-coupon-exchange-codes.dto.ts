import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateCouponExchangeCodesDto {
  @ApiProperty({ description: '生成数量', example: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  count: number;

  @ApiPropertyOptional({ description: '兑换码备注', example: '五一活动批次A' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  remark?: string;
}
