export type BalanceAccountStatus = 'ACTIVE' | 'DISABLED';
export type BalanceLogType =
  | 'RECHARGE'
  | 'CONSUME'
  | 'REFUND'
  | 'ADJUST_INCREASE'
  | 'ADJUST_DECREASE';

export interface BalanceAccountCustomer {
  id: number;
  name: string;
  code: string;
  phone?: string | null;
  user?: {
    id: number;
    username: string;
    email?: string | null;
  } | null;
}

export interface BalanceAccount {
  id: number;
  customerId: number;
  customer: BalanceAccountCustomer;
  availableBalance: string;
  frozenBalance: string;
  totalRecharged: string;
  totalPresented: string;
  totalConsumed: string;
  totalRefunded: string;
  totalAdjusted: string;
  status: BalanceAccountStatus;
  remark?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BalanceLog {
  id: number;
  accountId: number;
  customerId: number;
  type: BalanceLogType;
  typeText: string;
  changeAmount: string;
  bonusAmount: string;
  balanceBefore: string;
  balanceAfter: string;
  customerName: string;
  customerCode: string;
  customerPhone?: string | null;
  bizType?: string | null;
  bizId?: number | null;
  bizNo?: string | null;
  remark?: string | null;
  createdBy: number;
  createdAt: string;
}

export interface BalanceListResponse<T> {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateBalanceAccountDto {
  customerId: number;
  remark?: string;
}

export interface AdjustBalanceDto {
  direction: 'INCREASE' | 'DECREASE';
  amount: number;
  bizType?: string;
  bizId?: number;
  bizNo?: string;
  remark?: string;
}

export interface QueryBalanceAccountParams {
  keyword?: string;
  status?: BalanceAccountStatus;
  customerId?: number;
  page?: number;
  pageSize?: number;
}

export interface QueryBalanceLogParams {
  keyword?: string;
  type?: BalanceLogType;
  accountId?: number;
  customerId?: number;
  page?: number;
  pageSize?: number;
}

export interface BalanceRechargeOrder {
  id: number;
  rechargeNo: string;
  accountId: number;
  customerId: number;
  customerName: string;
  customerCode: string;
  customerPhone?: string | null;
  amount: string;
  bonusAmount: string;
  arrivalAmount: string;
  activityName?: string | null;
  method: import('./purchase').PaymentMethod;
  methodText: string;
  status: import('./purchase').PaymentStatus;
  statusText: string;
  outTradeNo?: string | null;
  thirdTradeNo?: string | null;
  thirdStatus?: string | null;
  paidAt?: string | null;
  createdAt: string;
  refundStatus?: import('./purchase').PaymentRefundStatus | null;
  refundStatusText?: string | null;
  canRefund: boolean;
}

export interface QueryBalanceRechargeParams {
  keyword?: string;
  status?: import('./purchase').PaymentStatus;
  method?: import('./purchase').PaymentMethod;
  accountId?: number;
  customerId?: number;
  page?: number;
  pageSize?: number;
}
