import { IsEnum, IsNotEmpty } from 'class-validator';

export enum AuditAction {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
}

export class AuditSaleReturnDto {
  @IsEnum(AuditAction)
  @IsNotEmpty()
  action: AuditAction;
}
