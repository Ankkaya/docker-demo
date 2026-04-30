import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BalanceLogType } from '@prisma/client';

export class BalanceLogVo {
  @ApiProperty()
  id: number;

  @ApiProperty()
  accountId: number;

  @ApiProperty()
  customerId: number;

  @ApiProperty({ enum: BalanceLogType })
  type: BalanceLogType;

  @ApiProperty()
  typeText: string;

  @ApiProperty({ type: String })
  changeAmount: string;

  @ApiProperty({ type: String })
  bonusAmount: string;

  @ApiProperty({ type: String })
  balanceBefore: string;

  @ApiProperty({ type: String })
  balanceAfter: string;

  @ApiProperty()
  customerName: string;

  @ApiProperty()
  customerCode: string;

  @ApiPropertyOptional({ nullable: true })
  customerPhone: string | null;

  @ApiPropertyOptional({ nullable: true })
  bizType: string | null;

  @ApiPropertyOptional({ nullable: true })
  bizId: number | null;

  @ApiPropertyOptional({ nullable: true })
  bizNo: string | null;

  @ApiPropertyOptional({ nullable: true })
  remark: string | null;

  @ApiProperty()
  createdBy: number;

  @ApiProperty()
  createdAt: Date;

  static fromEntity(entity: any): BalanceLogVo {
    return {
      id: entity.id,
      accountId: entity.accountId,
      customerId: entity.customerId,
      type: entity.type,
      typeText: this.getTypeText(entity.type),
      changeAmount: entity.changeAmount.toString(),
      bonusAmount: (entity.bonusAmount ?? 0).toString(),
      balanceBefore: entity.balanceBefore.toString(),
      balanceAfter: entity.balanceAfter.toString(),
      customerName: entity.customer.name,
      customerCode: entity.customer.code,
      customerPhone: entity.customer.phone || null,
      bizType: entity.bizType || null,
      bizId: entity.bizId ?? null,
      bizNo: entity.bizNo || null,
      remark: entity.remark || null,
      createdBy: entity.createdBy,
      createdAt: entity.createdAt,
    };
  }

  static fromEntities(entities: any[]): BalanceLogVo[] {
    return entities.map(entity => this.fromEntity(entity));
  }

  private static getTypeText(type: BalanceLogType): string {
    const map: Record<BalanceLogType, string> = {
      RECHARGE: '充值',
      CONSUME: '消费',
      REFUND: '退款',
      ADJUST_INCREASE: '后台加款',
      ADJUST_DECREASE: '后台扣减',
    };
    return map[type];
  }
}
