import { IsIn, IsOptional, IsString } from 'class-validator';

export class QueryMallOrderDto {
  @IsString()
  @IsOptional()
  @IsIn(['all', 'pending', 'shipping', 'receiving', 'completed', 'cancelled'])
  status?: string;
}
