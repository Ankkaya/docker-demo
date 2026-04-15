import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsEnum,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CustomerType } from '@prisma/client';

export class CreateCustomerDto {
  @ApiProperty({
    example: 'XX公司',
    description: '客户名称',
  })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({
    example: 'C0001',
    description: '客户编码，唯一标识',
  })
  @IsString()
  @MinLength(1)
  code: string;

  @ApiPropertyOptional({
    example: 'COMPANY',
    enum: CustomerType,
    description: '客户类型：INDIVIDUAL-个人，COMPANY-企业',
  })
  @IsEnum(CustomerType)
  @IsOptional()
  type?: CustomerType;

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
    example: 'customer@example.com',
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
    example: 10000,
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
    example: '重要客户',
    description: '备注',
  })
  @IsString()
  @IsOptional()
  remark?: string;

  @ApiPropertyOptional({
    example: 1,
    description: '关联的系统用户ID（如果是注册用户）',
  })
  @IsNumber()
  @IsOptional()
  userId?: number;
}
