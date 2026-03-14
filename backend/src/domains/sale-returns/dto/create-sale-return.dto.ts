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

// 退货明细项
export class SaleReturnItemDto {
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

// 创建销售退货单DTO
export class CreateSaleReturnDto {
  @IsInt()
  @IsNotEmpty()
  shipmentId: number;

  @IsInt()
  @IsNotEmpty()
  customerId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleReturnItemDto)
  items: SaleReturnItemDto[];

  @IsString()
  @IsOptional()
  remark?: string;
}
