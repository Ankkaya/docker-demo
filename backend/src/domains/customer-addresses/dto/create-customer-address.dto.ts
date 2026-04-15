import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateCustomerAddressDto {
  @ApiProperty({ description: '收货人' })
  @IsString()
  @MaxLength(50)
  receiverName: string;

  @ApiProperty({ description: '收货电话' })
  @IsString()
  @MaxLength(30)
  receiverPhone: string;

  @ApiPropertyOptional({ description: '省' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  province?: string;

  @ApiPropertyOptional({ description: '市' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  city?: string;

  @ApiPropertyOptional({ description: '区/县' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  district?: string;

  @ApiProperty({ description: '详细地址' })
  @IsString()
  @MaxLength(200)
  address: string;

  @ApiPropertyOptional({ description: '邮编' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @ApiPropertyOptional({ description: '地址标签，如家/公司' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  tag?: string;

  @ApiPropertyOptional({ description: '是否默认地址' })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({ description: '排序值' })
  @IsOptional()
  @IsInt()
  @Min(0)
  sort?: number;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  remark?: string;
}
