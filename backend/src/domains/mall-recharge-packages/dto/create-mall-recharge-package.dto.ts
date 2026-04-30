import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateMallRechargePackageDto {
  @ApiProperty({ description: '套餐名称' })
  @IsString()
  @MaxLength(60)
  name: string;

  @ApiProperty({ description: '充值金额' })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  rechargeAmount: number;

  @ApiPropertyOptional({ description: '套餐标签' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  tag?: string;

  @ApiPropertyOptional({ description: '套餐说明' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

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

  @ApiPropertyOptional({ description: '后台备注' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  remark?: string;

  @ApiPropertyOptional({ description: '绑定活动ID列表', type: [Number] })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  activityIds?: number[];
}
