import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// 采购订单明细项
export class UpdatePurchaseItemDto {
  @IsInt()
  @IsOptional()
  id?: number;

  @IsInt()
  @IsNotEmpty()
  skuId: number;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  price: number;
}

// 更新采购订单DTO
export class UpdatePurchaseDto {
  @IsInt()
  @IsOptional()
  supplierId?: number;

  @IsInt()
  @IsOptional()
  warehouseId?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdatePurchaseItemDto)
  @IsOptional()
  items?: UpdatePurchaseItemDto[];

  @IsNumber()
  @IsOptional()
  discount?: number;

  @IsString()
  @IsOptional()
  remark?: string;

  @IsString()
  @IsOptional()
  deliveryDate?: string;
}
