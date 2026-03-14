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

// 订单明细项
export class OrderItemDto {
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

// 创建订单DTO
export class CreateOrderDto {
  @IsInt()
  @IsNotEmpty()
  customerId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsNumber()
  @IsOptional()
  discount?: number;

  @IsNumber()
  @IsOptional()
  freight?: number;

  @IsString()
  @IsOptional()
  receiverName?: string;

  @IsString()
  @IsOptional()
  receiverPhone?: string;

  @IsString()
  @IsOptional()
  receiverAddress?: string;

  @IsString()
  @IsOptional()
  remark?: string;
}
