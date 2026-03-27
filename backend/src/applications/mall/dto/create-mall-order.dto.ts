import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';

export enum MallOrderSource {
  CART = 'cart',
  PRODUCT_DETAIL = 'product-detail',
}

export class CreateMallOrderItemDto {
  @IsInt()
  skuId: number;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateMallOrderDto {
  @IsEnum(MallOrderSource)
  source: MallOrderSource;

  @IsInt()
  @IsOptional()
  addressId?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMallOrderItemDto)
  @IsOptional()
  items?: CreateMallOrderItemDto[];
}
