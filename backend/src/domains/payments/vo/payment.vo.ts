import { PaymentType, PaymentMethod, PaymentStatus } from '@prisma/client';
import { PaymentRefundVo } from './payment-refund.vo';

// 收付款记录VO
export class PaymentVo {
  id: number;
  type: PaymentType;
  typeText: string;
  bizType: string;
  orderSource: 'SHOPPING' | 'RECHARGE';
  orderSourceText: string;
  bizId: number | null;
  orderNo?: string;
  orderType?: string | null;
  amount: number;
  method: PaymentMethod;
  methodText: string;
  status: PaymentStatus;
  statusText: string;
  outTradeNo?: string | null;
  thirdTradeNo?: string | null;
  tradeType?: string | null;
  prepayId?: string | null;
  thirdStatus?: string | null;
  queryCount: number;
  lastQueryAt?: Date | null;
  notifyAt?: Date | null;
  paidAt?: Date | null;
  failReason?: string | null;
  notifyPayload?: unknown;
  confirmSource: 'NOTIFY' | 'QUERY' | 'MANUAL' | 'UNKNOWN';
  confirmSourceText: string;
  refunds?: PaymentRefundVo[];
  remark?: string;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(entity: any): PaymentVo {
    const vo = new PaymentVo();
    vo.id = entity.id;
    vo.type = entity.type;
    vo.typeText = entity.type === PaymentType.RECEIPT ? '收款' : '付款';
    vo.bizType = entity.bizType;
    vo.orderSource = entity.orderSource || 'SHOPPING';
    vo.orderSourceText = vo.orderSource === 'RECHARGE' ? '充值' : '购物';
    vo.bizId = entity.purchaseId || entity.orderId || null;
    vo.orderNo = entity.purchase?.orderNo || entity.order?.orderNo || '';
    vo.orderType = entity.order?.type || null;
    vo.amount = Number(entity.amount);
    vo.method = entity.method;
    vo.methodText = this.getMethodText(entity.method);
    vo.status = entity.status;
    vo.statusText = this.getStatusText(entity.status);
    vo.outTradeNo = entity.outTradeNo || null;
    vo.thirdTradeNo = entity.thirdTradeNo || null;
    vo.tradeType = entity.tradeType || null;
    vo.prepayId = entity.prepayId || null;
    vo.thirdStatus = entity.thirdStatus || null;
    vo.queryCount = entity.queryCount || 0;
    vo.lastQueryAt = entity.lastQueryAt || null;
    vo.notifyAt = entity.notifyAt || null;
    vo.paidAt = entity.paidAt || null;
    vo.failReason = entity.failReason || null;
    vo.notifyPayload = entity.notifyPayload ?? null;
    vo.confirmSource = this.getConfirmSource(entity);
    vo.confirmSourceText = this.getConfirmSourceText(vo.confirmSource);
    vo.refunds = Array.isArray(entity.refunds) ? PaymentRefundVo.fromEntities(entity.refunds) : undefined;
    vo.remark = entity.remark || undefined;
    vo.createdBy = entity.createdBy;
    vo.createdAt = entity.createdAt;
    vo.updatedAt = entity.updatedAt;
    return vo;
  }

  static fromEntities(entities: any[]): PaymentVo[] {
    return entities.map((e) => this.fromEntity(e));
  }

  private static getMethodText(method: PaymentMethod): string {
    const map: Record<string, string> = {
      CASH: '现金',
      BANK: '银行转账',
      ALIPAY: '支付宝',
      WECHAT: '微信支付',
      CREDIT: '挂账/赊销',
      BALANCE: '余额支付',
    };
    return map[method] || method;
  }

  private static getStatusText(status: PaymentStatus): string {
    const map: Record<string, string> = {
      PENDING: '待确认',
      COMPLETED: '已完成',
      CANCELLED: '已取消',
    };
    return map[status] || status;
  }

  private static getConfirmSource(entity: any): 'NOTIFY' | 'QUERY' | 'MANUAL' | 'UNKNOWN' {
    if (entity.notifyAt) {
      return 'NOTIFY';
    }

    if (entity.queryCount > 0) {
      return 'QUERY';
    }

    if (entity.status === PaymentStatus.COMPLETED) {
      return 'MANUAL';
    }

    return 'UNKNOWN';
  }

  private static getConfirmSourceText(source: 'NOTIFY' | 'QUERY' | 'MANUAL' | 'UNKNOWN') {
    const map: Record<typeof source, string> = {
      NOTIFY: '微信回调',
      QUERY: '主动查单',
      MANUAL: '手工确认',
      UNKNOWN: '未确认',
    };
    return map[source];
  }
}
