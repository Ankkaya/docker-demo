import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BalanceLogType, PaymentMethod } from '@prisma/client';

export class MallBalanceSummaryVo {
  @ApiProperty({ description: '账户ID' })
  id: number;

  @ApiProperty({ description: '客户ID' })
  customerId: number;

  @ApiProperty({ description: '可用余额', type: String })
  availableBalance: string;

  @ApiProperty({ description: '冻结余额', type: String })
  frozenBalance: string;

  @ApiProperty({ description: '累计充值', type: String })
  totalRecharged: string;

  @ApiProperty({ description: '累计消费', type: String })
  totalConsumed: string;

  @ApiProperty({ description: '累计退款', type: String })
  totalRefunded: string;

  @ApiProperty({ description: '最近更新时间' })
  updatedAt: Date;

  static fromEntity(entity: any): MallBalanceSummaryVo {
    return {
      id: entity.id,
      customerId: entity.customerId,
      availableBalance: entity.availableBalance.toString(),
      frozenBalance: entity.frozenBalance.toString(),
      totalRecharged: entity.totalRecharged.toString(),
      totalConsumed: entity.totalConsumed.toString(),
      totalRefunded: entity.totalRefunded.toString(),
      updatedAt: entity.updatedAt,
    };
  }
}

export class MallBalanceLogVo {
  @ApiProperty({ description: '流水ID' })
  id: number;

  @ApiProperty({ description: '流水类型', enum: BalanceLogType })
  type: BalanceLogType;

  @ApiProperty({ description: '流水类型文案' })
  typeText: string;

  @ApiProperty({ description: '变动金额', type: String })
  changeAmount: string;

  @ApiProperty({ description: '变动前余额', type: String })
  balanceBefore: string;

  @ApiProperty({ description: '变动后余额', type: String })
  balanceAfter: string;

  @ApiPropertyOptional({ description: '业务单号', nullable: true })
  bizNo: string | null;

  @ApiPropertyOptional({ description: '备注', nullable: true })
  remark: string | null;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  static fromEntity(entity: any): MallBalanceLogVo {
    return {
      id: entity.id,
      type: entity.type,
      typeText: this.getTypeText(entity.type),
      changeAmount: entity.changeAmount.toString(),
      balanceBefore: entity.balanceBefore.toString(),
      balanceAfter: entity.balanceAfter.toString(),
      bizNo: entity.bizNo || null,
      remark: entity.remark || null,
      createdAt: entity.createdAt,
    };
  }

  static fromEntities(entities: any[]): MallBalanceLogVo[] {
    return entities.map(entity => this.fromEntity(entity));
  }

  private static getTypeText(type: BalanceLogType): string {
    const map: Record<BalanceLogType, string> = {
      RECHARGE: '余额充值',
      CONSUME: '余额消费',
      REFUND: '退款返还',
      ADJUST_INCREASE: '余额调增',
      ADJUST_DECREASE: '余额调减',
    };
    return map[type];
  }
}

export class MallBalanceLogListVo {
  @ApiProperty({ type: [MallBalanceLogVo] })
  data: MallBalanceLogVo[];

  @ApiProperty({ description: '分页信息' })
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export class MallBalanceRechargeVo {
  @ApiProperty({ description: '账户ID' })
  accountId: number;

  @ApiProperty({ description: '充值金额', type: String })
  amount: string;

  @ApiProperty({ description: '充值方式', enum: PaymentMethod })
  method: PaymentMethod;

  @ApiProperty({ description: '充值后余额', type: String })
  availableBalance: string;

  @ApiProperty({ description: '充值流水号' })
  bizNo: string;

  @ApiProperty({ description: '充值时间' })
  createdAt: Date;
}
