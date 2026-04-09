import { PaymentType, PaymentMethod, PaymentStatus } from '@prisma/client';

// 收付款记录VO
export class PaymentVo {
  id: number;
  type: PaymentType;
  typeText: string;
  bizType: string;
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
  thirdStatus?: string | null;
  paidAt?: Date | null;
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
    vo.thirdStatus = entity.thirdStatus || null;
    vo.paidAt = entity.paidAt || null;
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
}
