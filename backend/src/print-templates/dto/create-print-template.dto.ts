import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNumber, IsObject, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

// 业务类型枚举
export enum BizType {
  ORDER = 'ORDER', // 销售订单
  SHIPMENT = 'SHIPMENT', // 发货单
  PURCHASE = 'PURCHASE', // 采购单
  PRODUCT_LABEL = 'PRODUCT_LABEL', // 商品标签
}

export class CreatePrintTemplateDto {
  @ApiProperty({ example: '销售订单模板A', description: '模板名称' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({ example: 'ORDER', description: '业务类型', enum: BizType })
  @IsEnum(BizType)
  bizType: BizType;

  @ApiPropertyOptional({ example: 50, description: '纸张宽度(mm)，最大50' })
  @IsNumber()
  @Min(1)
  @Max(50)
  @IsOptional()
  paperWidth?: number;

  @ApiPropertyOptional({ example: 50, description: '纸张高度(mm)，最大300' })
  @IsNumber()
  @Min(1)
  @Max(300)
  @IsOptional()
  paperHeight?: number;

  @ApiPropertyOptional({ example: { blocks: [] }, description: '模板内容JSON' })
  @IsObject()
  @IsOptional()
  content?: Record<string, any>;

  @ApiPropertyOptional({ example: '默认销售单模板', description: '描述' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 0, description: '排序' })
  @IsNumber()
  @IsOptional()
  sort?: number;

  @ApiPropertyOptional({ example: true, description: '是否启用' })
  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;
}
