import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export enum BalanceAdjustDirection {
  INCREASE = 'INCREASE',
  DECREASE = 'DECREASE',
}

export class AdjustBalanceDto {
  @ApiProperty({ description: '调账方向', enum: BalanceAdjustDirection })
  @IsEnum(BalanceAdjustDirection)
  direction: BalanceAdjustDirection;

  @ApiProperty({ description: '调账金额' })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ description: '业务类型' })
  @IsString()
  @IsOptional()
  bizType?: string;

  @ApiPropertyOptional({ description: '业务ID' })
  @IsOptional()
  bizId?: number;

  @ApiPropertyOptional({ description: '业务单号' })
  @IsString()
  @IsOptional()
  bizNo?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsString()
  @IsOptional()
  remark?: string;
}
