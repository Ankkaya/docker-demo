import { IsInt, IsOptional, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { TransferStatus } from '@prisma/client';

export class QueryTransferDto {
  @IsString({ message: '调拨单号必须是字符串' })
  @IsOptional()
  transferNo?: string;

  @IsInt({ message: '出库仓库ID必须是整数' })
  @IsOptional()
  @Type(() => Number)
  fromId?: number;

  @IsInt({ message: '入库仓库ID必须是整数' })
  @IsOptional()
  @Type(() => Number)
  toId?: number;

  @IsEnum(TransferStatus, { message: '状态参数不正确' })
  @IsOptional()
  status?: TransferStatus;

  @IsInt({ message: '页码必须是整数' })
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsInt({ message: '每页数量必须是整数' })
  @IsOptional()
  @Type(() => Number)
  pageSize?: number = 10;
}
