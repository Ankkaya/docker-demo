import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePaymentRefundDto {
  @IsString()
  @IsOptional()
  @MaxLength(200)
  reason?: string;
}
