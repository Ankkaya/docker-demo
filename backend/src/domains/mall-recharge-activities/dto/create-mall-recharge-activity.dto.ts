import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateMallRechargeActivityDto {
  @ApiProperty({ description: '活动名称' })
  @IsString()
  @MaxLength(60)
  name: string;

  @ApiProperty({ description: '赠送金额' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  bonusAmount: number;

  @ApiPropertyOptional({ description: '活动标签' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  tag?: string;

  @ApiPropertyOptional({ description: '活动说明' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @ApiPropertyOptional({ description: '开始时间' })
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @ApiPropertyOptional({ description: '结束时间' })
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiPropertyOptional({ description: '排序号' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  sort?: number;

  @ApiPropertyOptional({ description: '是否启用' })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @ApiPropertyOptional({ description: '是否仅首充可用' })
  @IsOptional()
  @IsBoolean()
  firstRechargeOnly?: boolean;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  remark?: string;
}
