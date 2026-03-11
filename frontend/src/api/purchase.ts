import api from './request'
import type {
  Purchase,
  PurchaseApi,
  PurchaseReceiptApi,
  PaymentApi,
  PurchaseReturnApi,
} from '@/types'

// ==================== 采购订单 API ====================

// 获取采购订单列表
export const getPurchases = (params?: PurchaseApi.QueryParams) => {
  return api.get<PurchaseApi.List>('/purchases', { params })
}

// 获取采购订单详情
export const getPurchase = (id: number) => {
  return api.get<PurchaseApi.Detail>(`/purchases/${id}`)
}

// 创建采购订单
export const createPurchase = (data: PurchaseApi.CreateParams) => {
  return api.post<PurchaseApi.Create>('/purchases', data)
}

// 更新采购订单
export const updatePurchase = (id: number, data: PurchaseApi.UpdateParams) => {
  return api.patch<PurchaseApi.Update>(`/purchases/${id}`, data)
}

// 删除采购订单
export const deletePurchase = (id: number) => {
  return api.delete<PurchaseApi.Delete>(`/purchases/${id}`)
}

// 审核采购订单
export const auditPurchase = (id: number, data: PurchaseApi.AuditParams) => {
  return api.patch<PurchaseApi.Audit>(`/purchases/${id}/audit`, data)
}

// 取消采购订单
export const cancelPurchase = (id: number) => {
  return api.patch<PurchaseApi.Cancel>(`/purchases/${id}/cancel`)
}

// ==================== 采购入库 API ====================

// 获取入库单列表
export const getPurchaseReceipts = (params?: PurchaseReceiptApi.QueryParams) => {
  return api.get<PurchaseReceiptApi.List>('/purchase-receipts', { params })
}

// 获取可入库采购订单
export const getAvailableReceiptPurchases = (params?: { keyword?: string }) => {
  return api.get<Purchase[]>('/purchase-receipts/available-purchases', { params })
}

// 获取入库单详情
export const getPurchaseReceipt = (id: number) => {
  return api.get<PurchaseReceiptApi.Detail>(`/purchase-receipts/${id}`)
}

// 创建入库单
export const createPurchaseReceipt = (data: PurchaseReceiptApi.CreateParams) => {
  return api.post<PurchaseReceiptApi.Create>('/purchase-receipts', data)
}

// 确认入库
export const confirmReceipt = (id: number) => {
  return api.patch<PurchaseReceiptApi.Confirm>(`/purchase-receipts/${id}/confirm`)
}

// 取消入库单
export const cancelReceipt = (id: number) => {
  return api.patch<PurchaseReceiptApi.Cancel>(`/purchase-receipts/${id}/cancel`)
}

// 删除入库单
export const deleteReceipt = (id: number) => {
  return api.delete<PurchaseReceiptApi.Delete>(`/purchase-receipts/${id}`)
}

// ==================== 收付款 API ====================

// 获取收付款列表
export const getPayments = (params?: PaymentApi.QueryParams) => {
  return api.get<PaymentApi.List>('/payments', { params })
}

// 获取收付款详情
export const getPayment = (id: number) => {
  return api.get<PaymentApi.Detail>(`/payments/${id}`)
}

// 创建收付款记录
export const createPayment = (data: PaymentApi.CreateParams) => {
  return api.post<PaymentApi.Create>('/payments', data)
}

// 确认收付款
export const confirmPayment = (id: number) => {
  return api.patch<PaymentApi.Confirm>(`/payments/${id}/confirm`)
}

// 取消收付款
export const cancelPayment = (id: number) => {
  return api.patch<PaymentApi.Cancel>(`/payments/${id}/cancel`)
}

// 删除收付款记录
export const deletePayment = (id: number) => {
  return api.delete<PaymentApi.Delete>(`/payments/${id}`)
}

// 获取应付款统计
export const getPayableStats = (supplierId?: number) => {
  return api.get<PaymentApi.PayableStats>('/payments/stats/payable', {
    params: supplierId ? { supplierId } : undefined,
  })
}

// ==================== 采购退货 API ====================

// 获取退货单列表
export const getPurchaseReturns = (params?: PurchaseReturnApi.QueryParams) => {
  return api.get<PurchaseReturnApi.List>('/purchase-returns', { params })
}

// 获取退货单详情
export const getPurchaseReturn = (id: number) => {
  return api.get<PurchaseReturnApi.Detail>(`/purchase-returns/${id}`)
}

// 创建退货单
export const createPurchaseReturn = (data: PurchaseReturnApi.CreateParams) => {
  return api.post<PurchaseReturnApi.Create>('/purchase-returns', data)
}

// 更新退货单
export const updatePurchaseReturn = (id: number, data: PurchaseReturnApi.UpdateParams) => {
  return api.patch<PurchaseReturnApi.Update>(`/purchase-returns/${id}`, data)
}

// 审核退货单
export const auditPurchaseReturn = (id: number, data: PurchaseReturnApi.AuditParams) => {
  return api.patch<PurchaseReturnApi.Audit>(`/purchase-returns/${id}/audit`, data)
}

// 完成退货单
export const completePurchaseReturn = (id: number) => {
  return api.patch<PurchaseReturnApi.Complete>(`/purchase-returns/${id}/complete`)
}

// 取消退货单
export const cancelPurchaseReturn = (id: number) => {
  return api.patch<PurchaseReturnApi.Cancel>(`/purchase-returns/${id}/cancel`)
}

// 删除退货单
export const deletePurchaseReturn = (id: number) => {
  return api.delete<PurchaseReturnApi.Delete>(`/purchase-returns/${id}`)
}

// 获取可退货的入库单列表
export const getReturnableReceipts = (supplierId?: number) => {
  return api.get<PurchaseReturnApi.ReturnableReceipts>('/purchase-returns/receipts/returnable', {
    params: supplierId ? { supplierId } : undefined,
  })
}
