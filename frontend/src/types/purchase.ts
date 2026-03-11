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
  barcode?: string;
  skuName: string;
  productName: string;
  specs: Record<string, string>;
  quantity: number;
  price: number;
  salePrice: number;
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

// 订单类型
export type OrderType = 'SALE' | 'MALL';

// 订单状态
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED' | 'REFUNDING' | 'REFUNDED';

// 支付状态
export type PayStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'REFUNDING' | 'REFUNDED';

// 发货状态
export type ShipStatus = 'UNSHIPPED' | 'PARTIAL' | 'SHIPPED' | 'RECEIVED';

// 订单明细
export interface OrderItem {
  id: number;
  skuId: number;
  skuCode: string;
  skuName: string;
  productName: string;
  specs: Record<string, string>;
  quantity: number;
  shipped: number;
  price: number;
  amount: number;
}

// 订单
export interface Order {
  id: number;
  orderNo: string;
  type: OrderType;
  customerId: number;
  customerName: string;
  receiverName?: string;
  receiverPhone?: string;
  receiverAddress?: string;
  totalAmount: number;
  discount: number;
  freight: number;
  payable: number;
  paid: number;
  status: OrderStatus;
  payStatus: PayStatus;
  shipStatus: ShipStatus;
  orderDate: string;
  payDate?: string;
  shipDate?: string;
  receiveDate?: string;
  remark?: string;
  createdBy?: number;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
  shipments?: {
    id: number;
    shipmentNo: string;
    status: ShipmentStatus;
    logisticsCompany?: string;
    trackingNo?: string;
    createdAt: string;
  }[];
}

// 发货单状态
export type ShipmentStatus = 'PENDING' | 'SHIPPED' | 'RECEIVED' | 'CANCELLED';

// 发货明细
export interface ShipmentItem {
  id: number;
  skuId: number;
  skuCode: string;
  skuName: string;
  productName: string;
  specs: Record<string, string>;
  quantity: number;
}

// 发货单
export interface Shipment {
  id: number;
  shipmentNo: string;
  orderId: number;
  orderNo: string;
  warehouseId: number;
  warehouseName: string;
  logisticsCompany?: string;
  trackingNo?: string;
  status: ShipmentStatus;
  remark?: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  items?: ShipmentItem[];
}

// 创建订单DTO
export interface CreateOrderDto {
  customerId: number;
  items: {
    skuId: number;
    quantity: number;
    price: number;
  }[];
  discount?: number;
  freight?: number;
  receiverName?: string;
  receiverPhone?: string;
  receiverAddress?: string;
  remark?: string;
}

// 更新订单DTO
export type UpdateOrderDto = Partial<CreateOrderDto>;

// 查询订单参数
export interface QueryOrderParams {
  keyword?: string;
  customerId?: number;
  status?: OrderStatus;
  payStatus?: PayStatus;
  shipStatus?: ShipStatus;
  page?: number;
  pageSize?: number;
}

// 创建发货单DTO
export interface CreateShipmentDto {
  orderId: number;
  warehouseId: number;
  items: {
    skuId: number;
    quantity: number;
  }[];
  logisticsCompany?: string;
  trackingNo?: string;
  remark?: string;
}

// 查询发货单参数
export interface QueryShipmentParams {
  keyword?: string;
  orderId?: number;
  status?: ShipmentStatus;
  page?: number;
  pageSize?: number;
}

// 销售退货单
export interface SaleReturn {
  id: number;
  returnNo: string;
  shipmentId: number;
  shipmentNo: string;
  customerId: number;
  customerName: string;
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

// 可退货的发货单（用于创建销售退货单）
export interface ReturnableShipment {
  id: number;
  shipmentNo: string;
  order: {
    orderNo: string;
    customer: {
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
    availableQty: number;
    returnedQty: number;
  }[];
}

// 创建销售退货单DTO
export interface CreateSaleReturnDto {
  shipmentId: number;
  customerId: number;
  items: {
    skuId: number;
    quantity: number;
    price: number;
  }[];
  remark?: string;
}

// 更新销售退货单DTO
export type UpdateSaleReturnDto = Partial<CreateSaleReturnDto>;

// 审核销售退货单DTO
export interface AuditSaleReturnDto {
  action: 'APPROVE' | 'REJECT';
}

// 查询销售退货单参数
export interface QuerySaleReturnParams {
  keyword?: string;
  customerId?: number;
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
