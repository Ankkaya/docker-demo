import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

class AdjustmentItemDto {
  @IsInt({ message: 'SKU ID必须是整数' })
  @IsNotEmpty({ message: 'SKU ID不能为空' })
  skuId: number;

  @IsInt({ message: '实盘数量必须是整数' })
  @Min(0, { message: '实盘数量不能为负数' })
  actualQty: number;
}

export class CreateAdjustmentDto {
  @IsInt({ message: '仓库ID必须是整数' })
  @IsNotEmpty({ message: '仓库ID不能为空' })
  warehouseId: number;

  @IsString({ message: '备注必须是字符串' })
  @IsOptional()
  remark?: string;

  @IsNotEmpty({ message: '调整商品不能为空' })
  @ArrayMinSize(1, { message: '至少需要一个调整商品' })
  @ValidateNested({ each: true })
  @Type(() => AdjustmentItemDto)
  items: AdjustmentItemDto[];
}
