import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class QueryMallOrderDto {
  @IsString()
  @IsOptional()
  @IsIn(['all', 'pending', 'shipping', 'receiving', 'completed', 'cancelled'])
  status?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  @IsOptional()
  pageSize?: number = 10;
}
