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

class TransferItemDto {
  @IsInt({ message: 'SKU ID必须是整数' })
  @IsNotEmpty({ message: 'SKU ID不能为空' })
  skuId: number;

  @IsInt({ message: '数量必须是整数' })
  @Min(1, { message: '数量必须大于0' })
  quantity: number;
}

export class CreateTransferDto {
  @IsInt({ message: '出库仓库ID必须是整数' })
  @IsNotEmpty({ message: '出库仓库ID不能为空' })
  fromId: number;

  @IsInt({ message: '入库仓库ID必须是整数' })
  @IsNotEmpty({ message: '入库仓库ID不能为空' })
  toId: number;

  @IsString({ message: '备注必须是字符串' })
  @IsOptional()
  remark?: string;

  @IsNotEmpty({ message: '调拨商品不能为空' })
  @ArrayMinSize(1, { message: '至少需要一个调拨商品' })
  @ValidateNested({ each: true })
  @Type(() => TransferItemDto)
  items: TransferItemDto[];
}
