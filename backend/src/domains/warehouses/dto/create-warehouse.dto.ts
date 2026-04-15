import {
  IsString,
  IsOptional,
  IsBoolean,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWarehouseDto {
  @ApiProperty({
    example: '主仓库',
    description: '仓库名称',
  })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({
    example: 'CK001',
    description: '仓库编码，唯一标识',
  })
  @IsString()
  @MinLength(1)
  code: string;

  @ApiPropertyOptional({
    example: '北京市朝阳区xxx路xxx号',
    description: '仓库地址',
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({
    example: '张三',
    description: '联系人',
  })
  @IsString()
  @IsOptional()
  contact?: string;

  @ApiPropertyOptional({
    example: '13800138000',
    description: '联系电话',
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    example: false,
    description: '是否默认仓库',
  })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: '是否启用',
  })
  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;
}
