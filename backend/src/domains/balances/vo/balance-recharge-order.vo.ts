import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod, PaymentRefundStatus, PaymentStatus } from '@prisma/client';

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

  @ApiProperty({ type: String })
  bonusAmount: string;

  @ApiProperty({ type: String })
  arrivalAmount: string;

  @ApiPropertyOptional({ nullable: true })
  activityName: string | null;

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

  @ApiPropertyOptional({ enum: PaymentRefundStatus, nullable: true })
  refundStatus?: PaymentRefundStatus | null;

  @ApiPropertyOptional({ nullable: true })
  refundStatusText?: string | null;

  @ApiProperty()
  canRefund: boolean;

  static fromEntity(entity: any, refunds: any[] = []): BalanceRechargeOrderVo {
    const latestRefund = refunds[0] || null;
    const hasBlockedRefund = refunds.some(item => item.status === 'PROCESSING' || item.status === 'SUCCESS');

    return {
      id: entity.id,
      rechargeNo: entity.rechargeNo,
      accountId: entity.accountId,
      customerId: entity.customerId,
      customerName: entity.customer.name,
      customerCode: entity.customer.code,
      customerPhone: entity.customer.phone || null,
      amount: entity.amount.toString(),
      bonusAmount: (entity.bonusAmount ?? 0).toString(),
      arrivalAmount: (Number(entity.amount || 0) + Number(entity.bonusAmount || 0)).toFixed(2),
      activityName: entity.activityName || null,
      method: entity.method,
      methodText: this.getMethodText(entity.method),
      status: entity.status,
      statusText: this.getStatusText(entity.status),
      outTradeNo: entity.outTradeNo || null,
      thirdTradeNo: entity.thirdTradeNo || null,
      thirdStatus: entity.thirdStatus || null,
      paidAt: entity.paidAt || null,
      createdAt: entity.createdAt,
      refundStatus: latestRefund?.status || null,
      refundStatusText: latestRefund ? this.getRefundStatusText(latestRefund.status) : null,
      canRefund: entity.status === PaymentStatus.COMPLETED
        && entity.method === PaymentMethod.WECHAT
        && !!entity.outTradeNo
        && !!entity.thirdTradeNo
        && !hasBlockedRefund,
    };
  }

  static fromEntities(entities: any[], refundMap?: Map<string, any[]>) {
    return entities.map((entity) => this.fromEntity(
      entity,
      entity.outTradeNo ? (refundMap?.get(entity.outTradeNo) || []) : [],
    ));
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

  private static getRefundStatusText(status: PaymentRefundStatus) {
    const map: Record<PaymentRefundStatus, string> = {
      PROCESSING: '退款处理中',
      SUCCESS: '退款成功',
      CLOSED: '退款关闭',
      ABNORMAL: '退款异常',
    };
    return map[status];
  }
}
