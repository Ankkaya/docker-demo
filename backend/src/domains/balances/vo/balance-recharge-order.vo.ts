import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

export class BalanceRechargeOrderVo {
  @ApiProperty()
  id: number;

  @ApiProperty()
  rechargeNo: string;

  @ApiProperty()
  accountId: number;

  @ApiProperty()
  customerId: number;

  @ApiProperty()
  customerName: string;

  @ApiProperty()
  customerCode: string;

  @ApiPropertyOptional({ nullable: true })
  customerPhone: string | null;

  @ApiProperty({ type: String })
  amount: string;

  @ApiProperty({ enum: PaymentMethod })
  method: PaymentMethod;

  @ApiProperty()
  methodText: string;

  @ApiProperty({ enum: PaymentStatus })
  status: PaymentStatus;

  @ApiProperty()
  statusText: string;

  @ApiPropertyOptional({ nullable: true })
  outTradeNo: string | null;

  @ApiPropertyOptional({ nullable: true })
  thirdTradeNo: string | null;

  @ApiPropertyOptional({ nullable: true })
  thirdStatus: string | null;

  @ApiPropertyOptional({ nullable: true })
  paidAt: Date | null;

  @ApiProperty()
  createdAt: Date;

  static fromEntity(entity: any): BalanceRechargeOrderVo {
    return {
      id: entity.id,
      rechargeNo: entity.rechargeNo,
      accountId: entity.accountId,
      customerId: entity.customerId,
      customerName: entity.customer.name,
      customerCode: entity.customer.code,
      customerPhone: entity.customer.phone || null,
      amount: entity.amount.toString(),
      method: entity.method,
      methodText: this.getMethodText(entity.method),
      status: entity.status,
      statusText: this.getStatusText(entity.status),
      outTradeNo: entity.outTradeNo || null,
      thirdTradeNo: entity.thirdTradeNo || null,
      thirdStatus: entity.thirdStatus || null,
      paidAt: entity.paidAt || null,
      createdAt: entity.createdAt,
    };
  }

  static fromEntities(entities: any[]) {
    return entities.map(entity => this.fromEntity(entity));
  }

  private static getMethodText(method: PaymentMethod) {
    const map: Record<string, string> = {
      WECHAT: '微信支付',
      ALIPAY: '支付宝',
      BANK: '银行转账',
      CASH: '现金',
      CREDIT: '挂账',
      BALANCE: '余额',
    };
    return map[method] || method;
  }

  private static getStatusText(status: PaymentStatus) {
    const map: Record<string, string> = {
      PENDING: '待支付',
      COMPLETED: '已完成',
      CANCELLED: '已取消',
    };
    return map[status] || status;
  }
}
