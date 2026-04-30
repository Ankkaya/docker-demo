import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class ExchangeMallCouponDto {
  @ApiProperty({ description: '兑换码', example: 'EXC240427ABC123' })
  @IsString()
  @Length(6, 64)
  code: string;
}
