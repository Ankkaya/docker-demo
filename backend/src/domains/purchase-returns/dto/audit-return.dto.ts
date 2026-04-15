import { IsEnum, IsNotEmpty } from 'class-validator';

export enum AuditAction {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
}

export class AuditReturnDto {
  @IsEnum(AuditAction)
  @IsNotEmpty()
  action: AuditAction;
}
