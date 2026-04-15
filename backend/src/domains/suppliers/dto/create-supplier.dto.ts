import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSupplierDto {
  @ApiProperty({
    example: 'XX供应商',
    description: '供应商名称',
  })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({
    example: 'SUP001',
    description: '供应商编码，唯一标识',
  })
  @IsString()
  @MinLength(1)
  code: string;

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
    example: 'supplier@example.com',
    description: '邮箱',
  })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    example: '北京市朝阳区xxx路',
    description: '地址',
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({
    example: '中国银行',
    description: '开户行',
  })
  @IsString()
  @IsOptional()
  bankName?: string;

  @ApiPropertyOptional({
    example: '6222021234567890123',
    description: '银行账号',
  })
  @IsString()
  @IsOptional()
  bankAccount?: string;

  @ApiPropertyOptional({
    example: '91110108123456789X',
    description: '税号',
  })
  @IsString()
  @IsOptional()
  taxNo?: string;

  @ApiPropertyOptional({
    example: 50000,
    description: '信用额度',
  })
  @IsNumber()
  @IsOptional()
  creditLimit?: number;

  @ApiPropertyOptional({
    example: 30,
    description: '账期(天)',
  })
  @IsNumber()
  @IsOptional()
  period?: number;

  @ApiPropertyOptional({
    example: true,
    description: '是否启用',
  })
  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;

  @ApiPropertyOptional({
    example: '优质供应商',
    description: '备注',
  })
  @IsString()
  @IsOptional()
  remark?: string;
}
