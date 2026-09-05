// 标准响应格式
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

// 响应数据结构（兼容旧接口）
export interface ResponseData<T> {
  data: T
  message?: string
  statusCode?: number
}

// 分页数据
export interface PageData<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

// 登录请求
export interface LoginDto {
  username: string
  password: string
}

// 登录响应
export interface AuthResponse {
  user: User
  token: string
}

// 用户
export interface User {
  id: number
  username: string
  email?: string
  avatar?: string
  name?: string
  createdAt: string
  updatedAt: string
  roles?: Role[]
}

// 创建用户
export interface CreateUserDto {
  username: string
  password: string
  email?: string
  name?: string
}

// 更新用户
export interface UpdateUserDto {
  email?: string
  password?: string
  name?: string
}

// 角色
export interface Role {
  id: number
  name: string
  code: string
  description?: string
  createdAt: string
  updatedAt: string
}

// 菜单
export interface Menu {
  id: number
  name: string
  path?: string
  icon?: string
  iconUrl?: string
  component?: string
  permission?: string
  redirect?: string
  parentId?: number
  order: number
  hidden: boolean
  alwaysShow: boolean
  type: 'menu' | 'button' | 'iframe'
  createdAt: string
  updatedAt: string
  children?: Menu[]
}

// 创建菜单
export interface CreateMenuDto {
  name: string
  path?: string
  icon?: string
  iconUrl?: string
  component?: string
  permission?: string
  redirect?: string
  parentId?: number
  order?: number
  hidden?: boolean
  alwaysShow?: boolean
  type?: 'menu' | 'button' | 'iframe'
}

// 更新菜单
export interface UpdateMenuDto extends Partial<CreateMenuDto> {}

// 导出采购管理类型
export * from './purchase'

// ==================== API 响应类型 ====================

// 采购订单 API
export namespace PurchaseApi {
  export interface QueryParams {
    keyword?: string
    supplierId?: number
    status?: import('./purchase').PurchaseStatus
    page?: number
    pageSize?: number
  }
  export type List = import('./api').ApiResponse<import('./purchase').PaginatedResponse<import('./purchase').Purchase>>
  export type Detail = import('./api').ApiResponse<import('./purchase').Purchase>
  export type CreateParams = import('./purchase').CreatePurchaseDto
  export type Create = import('./api').ApiResponse<import('./purchase').Purchase>
  export type UpdateParams = import('./purchase').UpdatePurchaseDto
  export type Update = import('./api').ApiResponse<import('./purchase').Purchase>
  export type Delete = import('./api').ApiResponse<{ success: boolean }>
  export type AuditParams = import('./purchase').AuditPurchaseDto
  export type Audit = import('./api').ApiResponse<import('./purchase').Purchase>
  export type Cancel = import('./api').ApiResponse<import('./purchase').Purchase>
}

// 采购入库 API
export namespace PurchaseReceiptApi {
  export interface QueryParams {
    keyword?: string
    purchaseId?: number
    status?: import('./purchase').ReceiptStatus
    page?: number
    pageSize?: number
  }
  export type List = import('./api').ApiResponse<import('./purchase').PaginatedResponse<import('./purchase').PurchaseReceipt>>
  export type Detail = import('./api').ApiResponse<import('./purchase').PurchaseReceipt>
  export type CreateParams = import('./purchase').CreateReceiptDto
  export type Create = import('./api').ApiResponse<import('./purchase').PurchaseReceipt>
  export type Confirm = import('./api').ApiResponse<import('./purchase').PurchaseReceipt>
  export type Cancel = import('./api').ApiResponse<{ success: boolean }>
  export type Delete = import('./api').ApiResponse<{ success: boolean }>
}

// 收付款 API
export namespace PaymentApi {
  export interface QueryParams {
    keyword?: string
    type?: import('./purchase').PaymentType
    bizType?: string
    method?: import('./purchase').PaymentMethod
    status?: import('./purchase').PaymentStatus
    orderSource?: 'SHOPPING' | 'RECHARGE'
    page?: number
    pageSize?: number
  }
  export type List = import('./purchase').PaginatedResponse<import('./purchase').Payment>
  export type Detail = import('./purchase').Payment
  export type CreateParams = import('./purchase').CreatePaymentDto
  export type Create = import('./purchase').Payment
  export type Confirm = import('./purchase').Payment
  export type Cancel = import('./purchase').Payment
  export type Sync = import('./purchase').Payment
  export type RefundParams = import('./purchase').CreatePaymentRefundDto
  export type Refund = import('./purchase').PaymentRefund
  export type RefundSync = import('./purchase').PaymentRefund
  export interface RefundQueryParams {
    keyword?: string
    orderSource?: 'SHOPPING' | 'RECHARGE'
    status?: import('./purchase').PaymentRefundStatus
    page?: number
    pageSize?: number
  }
  export type RefundList = import('./purchase').PaginatedResponse<import('./purchase').PaymentRefund>
  export type Delete = { success: boolean }
  export type PayableStats = import('./purchase').PayableStats
}

// 采购退货 API
export namespace PurchaseReturnApi {
  export interface QueryParams {
    keyword?: string
    supplierId?: number
    status?: import('./purchase').ReturnStatus
    page?: number
    pageSize?: number
  }
  export type List = import('./api').ApiResponse<import('./purchase').PaginatedResponse<import('./purchase').PurchaseReturn>>
  export type Detail = import('./api').ApiResponse<import('./purchase').PurchaseReturn>
  export type CreateParams = import('./purchase').CreateReturnDto
  export type Create = import('./api').ApiResponse<import('./purchase').PurchaseReturn>
  export type UpdateParams = import('./purchase').UpdateReturnDto
  export type Update = import('./api').ApiResponse<import('./purchase').PurchaseReturn>
  export type AuditParams = import('./purchase').AuditReturnDto
  export type Audit = import('./api').ApiResponse<import('./purchase').PurchaseReturn>
  export type Complete = import('./api').ApiResponse<import('./purchase').PurchaseReturn>
  export type Cancel = import('./api').ApiResponse<import('./purchase').PurchaseReturn>
  export type Delete = import('./api').ApiResponse<{ success: boolean }>
  export type ReturnableReceipts = import('./api').ApiResponse<import('./purchase').ReturnableReceipt[]>
}

// 销售订单 API
export namespace OrderApi {
  export interface QueryParams {
    keyword?: string
    customerId?: number
    type?: import('./purchase').OrderType
    status?: import('./purchase').OrderStatus
    payStatus?: import('./purchase').PayStatus
    shipStatus?: import('./purchase').ShipStatus
    page?: number
    pageSize?: number
  }
  export type List = import('./api').ApiResponse<import('./purchase').PaginatedResponse<import('./purchase').Order>>
  export type Detail = import('./api').ApiResponse<import('./purchase').Order>
  export type CreateParams = import('./purchase').CreateOrderDto
  export type Create = import('./api').ApiResponse<import('./purchase').Order>
  export type UpdateParams = import('./purchase').UpdateOrderDto
  export type Update = import('./api').ApiResponse<import('./purchase').Order>
  export type Confirm = import('./api').ApiResponse<import('./purchase').Order>
  export type Cancel = import('./api').ApiResponse<import('./purchase').Order>
  export type Delete = import('./api').ApiResponse<{ success: boolean }>
}

// 发货单 API
export namespace ShipmentApi {
  export interface QueryParams {
    keyword?: string
    orderId?: number
    status?: import('./purchase').ShipmentStatus
    page?: number
    pageSize?: number
  }
  export type List = import('./api').ApiResponse<import('./purchase').PaginatedResponse<import('./purchase').Shipment>>
  export type Detail = import('./api').ApiResponse<import('./purchase').Shipment>
  export type CreateParams = import('./purchase').CreateShipmentDto
  export type Create = import('./api').ApiResponse<import('./purchase').Shipment>
  export type Ship = import('./api').ApiResponse<import('./purchase').Shipment>
  export type Receive = import('./api').ApiResponse<import('./purchase').Shipment>
  export type Delete = import('./api').ApiResponse<{ success: boolean }>
}

// 销售退货 API
export namespace SaleReturnApi {
  export interface QueryParams {
    keyword?: string
    customerId?: number
    status?: import('./purchase').ReturnStatus
    page?: number
    pageSize?: number
  }
  export type List = import('./api').ApiResponse<import('./purchase').PaginatedResponse<import('./purchase').SaleReturn>>
  export type Detail = import('./api').ApiResponse<import('./purchase').SaleReturn>
  export type CreateParams = import('./purchase').CreateSaleReturnDto
  export type Create = import('./api').ApiResponse<import('./purchase').SaleReturn>
  export type UpdateParams = import('./purchase').UpdateSaleReturnDto
  export type Update = import('./api').ApiResponse<import('./purchase').SaleReturn>
  export type AuditParams = import('./purchase').AuditSaleReturnDto
  export type Audit = import('./api').ApiResponse<import('./purchase').SaleReturn>
  export type Complete = import('./api').ApiResponse<import('./purchase').SaleReturn>
  export type Cancel = import('./api').ApiResponse<import('./purchase').SaleReturn>
  export type Delete = import('./api').ApiResponse<{ success: boolean }>
  export type ReturnableShipments = import('./api').ApiResponse<import('./purchase').ReturnableShipment[]>
}
