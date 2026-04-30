import { PaymentRefundStatus } from '@prisma/client';

export class PaymentRefundVo {
  id: number;
  refundNo: string;
  paymentId: number;
  orderId: number | null;
  orderNo?: string | null;
  outTradeNo?: string | null;
  orderSource: 'SHOPPING' | 'RECHARGE';
  orderSourceText: string;
  amount: number;
  reason?: string;
  status: PaymentRefundStatus;
  statusText: string;
  thirdRefundNo?: string | null;
  thirdStatus?: string | null;
  successAt?: Date | null;
  failReason?: string | null;
  notifyAt?: Date | null;
  notifyPayload?: unknown;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(entity: any): PaymentRefundVo {
    const vo = new PaymentRefundVo();
    vo.id = entity.id;
    vo.refundNo = entity.refundNo;
    vo.paymentId = entity.paymentId;
    vo.orderId = entity.orderId ?? null;
    vo.orderNo = entity.orderNo ?? entity.payment?.order?.orderNo ?? null;
    vo.outTradeNo = entity.outTradeNo ?? entity.payment?.outTradeNo ?? null;
    vo.orderSource = entity.orderSource || 'SHOPPING';
    vo.orderSourceText = vo.orderSource === 'RECHARGE' ? '充值' : '购物';
    vo.amount = Number(entity.amount);
    vo.reason = entity.reason || undefined;
    vo.status = entity.status;
    vo.statusText = this.getStatusText(entity.status);
    vo.thirdRefundNo = entity.thirdRefundNo || null;
    vo.thirdStatus = entity.thirdStatus || null;
    vo.successAt = entity.successAt || null;
    vo.failReason = entity.failReason || null;
    vo.notifyAt = entity.notifyAt || null;
    vo.notifyPayload = entity.notifyPayload ?? null;
    vo.createdBy = entity.createdBy;
    vo.createdAt = entity.createdAt;
    vo.updatedAt = entity.updatedAt;
    return vo;
  }

  static fromEntities(entities: any[]) {
    return entities.map((item) => this.fromEntity(item));
  }

  private static getStatusText(status: PaymentRefundStatus) {
    const map: Record<PaymentRefundStatus, string> = {
      PROCESSING: '退款处理中',
      SUCCESS: '退款成功',
      CLOSED: '退款关闭',
      ABNORMAL: '退款异常',
    };

    return map[status];
  }
}
