// ==================== 采购管理类型定义 ====================

// 采购订单状态
export type PurchaseStatus = 'PENDING' | 'APPROVED' | 'PARTIAL' | 'COMPLETED' | 'CANCELLED';

// 入库单状态
export type ReceiptStatus = 'PENDING' | 'RECEIVED' | 'CANCELLED';

// 收付款类型
export type PaymentType = 'RECEIPT' | 'PAYMENT';

// 支付方式
export type PaymentMethod = 'CASH' | 'BANK' | 'ALIPAY' | 'WECHAT' | 'CREDIT';

// 收付款状态
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

// 采购订单明细
export interface PurchaseItem {
  id: number;
  skuId: number;
  skuCode: string;
  skuName: string;
  productName: string;
  specs: Record<string, string>;
  quantity: number;
  received: number;
  price: number;
  amount: number;
}

// 采购订单
export interface Purchase {
  id: number;
  orderNo: string;
  supplierId: number;
  supplierName: string;
  warehouseId: number;
  warehouseName: string;
  totalAmount: number;
  discount: number;
  payable: number;
  paid: number;
  status: PurchaseStatus;
  orderDate: string;
  deliveryDate?: string;
  remark?: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  items?: PurchaseItem[];
  receipts?: {
    id: number;
    receiptNo: string;
    status: ReceiptStatus;
    totalAmount: number;
    createdAt: string;
  }[];
}

// 入库单明细
export interface ReceiptItem {
  id: number;
  skuId: number;
  skuCode: string;
  skuName: string;
  productName: string;
  specs: Record<string, string>;
  quantity: number;
  price: number;
}

// 入库单
export interface PurchaseReceipt {
  id: number;
  receiptNo: string;
  purchaseId: number;
  purchaseNo: string;
  supplierName: string;
  warehouseId: number;
  warehouseName: string;
  totalAmount: number;
  status: ReceiptStatus;
  remark?: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  items?: ReceiptItem[];
}

// 收付款记录
export interface Payment {
  id: number;
  type: PaymentType;
  typeText: string;
  bizType: string;
  bizId: number;
  orderNo?: string;
  amount: number;
  method: PaymentMethod;
  methodText: string;
  status: PaymentStatus;
  statusText: string;
  remark?: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

// 创建采购订单DTO
export interface CreatePurchaseDto {
  supplierId: number;
  warehouseId: number;
  items: {
    skuId: number;
    quantity: number;
    price: number;
  }[];
  discount?: number;
  remark?: string;
  deliveryDate?: string;
}

// 更新采购订单DTO
export type UpdatePurchaseDto = Partial<CreatePurchaseDto>;

// 审核采购订单DTO
export interface AuditPurchaseDto {
  action: 'APPROVE' | 'REJECT';
  remark?: string;
}

// 查询采购订单参数
export interface QueryPurchaseParams {
  keyword?: string;
  supplierId?: number;
  status?: PurchaseStatus;
  page?: number;
  pageSize?: number;
}

// 创建入库单DTO
export interface CreateReceiptDto {
  purchaseId: number;
  items: {
    skuId: number;
    quantity: number;
    price: number;
  }[];
  remark?: string;
}

// 查询入库单参数
export interface QueryReceiptParams {
  keyword?: string;
  purchaseId?: number;
  status?: ReceiptStatus;
  page?: number;
  pageSize?: number;
}

// 创建收付款DTO
export interface CreatePaymentDto {
  type: PaymentType;
  bizType: string;
  bizId: number;
  amount: number;
  method: PaymentMethod;
  remark?: string;
}

// 查询收付款参数
export interface QueryPaymentParams {
  type?: PaymentType;
  bizType?: string;
  status?: PaymentStatus;
  page?: number;
  pageSize?: number;
}

// 应付款统计项
export interface PayableStatsItem {
  purchaseId: number;
  orderNo: string;
  supplierId: number;
  supplierName: string;
  payable: number;
  paid: number;
  unpaid: number;
}

// 应付款统计
export interface PayableStats {
  list: PayableStatsItem[];
  summary: {
    totalPayable: number;
    totalPaid: number;
    totalUnpaid: number;
  };
}

// 退货单状态
export type ReturnStatus = 'PENDING' | 'APPROVED' | 'COMPLETED' | 'CANCELLED';

// 退货单明细
export interface ReturnItem {
  id: number;
  skuId: number;
  skuCode: string;
  skuName: string;
  productName: string;
  specs: Record<string, string>;
  quantity: number;
  price: number;
  amount: number;
}

// 退货单
export interface PurchaseReturn {
  id: number;
  returnNo: string;
  receiptId: number;
  receiptNo: string;
  supplierId: number;
  supplierName: string;
  warehouseId: number;
  warehouseName: string;
  totalAmount: number;
  status: ReturnStatus;
  remark?: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  items?: ReturnItem[];
}

// 可退货的入库单（用于创建退货单）
export interface ReturnableReceipt {
  id: number;
  receiptNo: string;
  purchase: {
    orderNo: string;
    supplier: {
      id: number;
      name: string;
    };
  };
  warehouse: {
    id: number;
    name: string;
  };
  items: {
    id: number;
    skuId: number;
    sku: {
      skuCode: string;
      product: {
        id: number;
        name: string;
      };
      specs: Record<string, string>;
    };
    quantity: number;
    price: number;
    availableQty: number;
    returnedQty: number;
  }[];
}

// 创建退货单DTO
export interface CreateReturnDto {
  receiptId: number;
  supplierId: number;
  items: {
    skuId: number;
    quantity: number;
    price: number;
  }[];
  remark?: string;
}

// 更新退货单DTO
export type UpdateReturnDto = Partial<CreateReturnDto>;

// 审核退货单DTO
export interface AuditReturnDto {
  action: 'APPROVE' | 'REJECT';
}

// 查询退货单参数
export interface QueryReturnParams {
  keyword?: string;
  supplierId?: number;
  status?: ReturnStatus;
  page?: number;
  pageSize?: number;
}

// 分页响应
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
