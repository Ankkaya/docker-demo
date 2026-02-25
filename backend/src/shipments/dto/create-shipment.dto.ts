import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// 发货明细项 - 创建时只包含商品和数量
export class ShipmentItemDto {
  @IsInt()
  @IsNotEmpty()
  skuId: number;

  @IsInt()
  @Min(1)
  quantity: number;
}

// 创建发货单DTO - 不需要指定仓库
export class CreateShipmentDto {
  @IsInt()
  @IsNotEmpty()
  orderId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShipmentItemDto)
  items: ShipmentItemDto[];

  @IsString()
  @IsOptional()
  logisticsCompany?: string;

  @IsString()
  @IsOptional()
  trackingNo?: string;

  @IsString()
  @IsOptional()
  remark?: string;
}

// 确认发货时的明细项 - 包含仓库信息
export class ShipmentItemWithWarehouseDto {
  @IsInt()
  @IsNotEmpty()
  skuId: number;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsInt()
  @IsNotEmpty()
  warehouseId: number; // 确认发货时指定从哪个仓库出库
}

// 确认发货DTO
export class ConfirmShipmentDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShipmentItemWithWarehouseDto)
  items: ShipmentItemWithWarehouseDto[];
}
