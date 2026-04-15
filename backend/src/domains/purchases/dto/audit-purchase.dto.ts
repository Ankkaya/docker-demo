import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum AuditAction {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
}

export class AuditPurchaseDto {
  @IsEnum(AuditAction)
  action: AuditAction;

  @IsString()
  @IsOptional()
  remark?: string;
}
