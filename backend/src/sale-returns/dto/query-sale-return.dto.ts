import { IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class QuerySaleReturnDto {
  @IsString()
  @IsOptional()
  keyword?: string;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  customerId?: number;

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
