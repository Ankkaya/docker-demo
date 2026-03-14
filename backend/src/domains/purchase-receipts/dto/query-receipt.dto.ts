import { IsInt, IsOptional, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ReceiptStatus } from '@prisma/client';

export class QueryReceiptDto {
  @IsString()
  @IsOptional()
  keyword?: string;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  purchaseId?: number;

  @IsEnum(ReceiptStatus)
  @IsOptional()
  status?: ReceiptStatus;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  pageSize?: number = 10;
}
