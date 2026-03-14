import { IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryShipmentDto {
  @IsString()
  @IsOptional()
  keyword?: string;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  orderId?: number;

  @IsString()
  @IsOptional()
  status?: string;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  pageSize?: number = 10;
}
