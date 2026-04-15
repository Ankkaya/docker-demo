import api from './request'
import type { OrderApi, ShipmentApi, SaleReturnApi } from '@/types'

// ==================== 销售订单 API ====================

// 获取销售订单列表
export const getOrders = (params?: OrderApi.QueryParams) => {
  return api.get<OrderApi.List>('/orders', { params })
}

// 获取销售订单详情
export const getOrder = (id: number) => {
  return api.get<OrderApi.Detail>(`/orders/${id}`)
}

// 创建销售订单
export const createOrder = (data: OrderApi.CreateParams) => {
  return api.post<OrderApi.Create>('/orders', data)
}

// 更新销售订单
export const updateOrder = (id: number, data: OrderApi.UpdateParams) => {
  return api.patch<OrderApi.Update>(`/orders/${id}`, data)
}

// 确认销售订单
export const confirmOrder = (id: number) => {
  return api.patch<OrderApi.Confirm>(`/orders/${id}/confirm`)
}

// 取消销售订单
export const cancelOrder = (id: number) => {
  return api.patch<OrderApi.Cancel>(`/orders/${id}/cancel`)
}

// 删除销售订单
export const deleteOrder = (id: number) => {
  return api.delete<OrderApi.Delete>(`/orders/${id}`)
}

// ==================== 发货单 API ====================

// 获取发货单列表
export const getShipments = (params?: ShipmentApi.QueryParams) => {
  return api.get<ShipmentApi.List>('/shipments', { params })
}

// 获取发货单详情
export const getShipment = (id: number) => {
  return api.get<ShipmentApi.Detail>(`/shipments/${id}`)
}

// 创建发货单
export const createShipment = (data: ShipmentApi.CreateParams) => {
  return api.post<ShipmentApi.Create>('/shipments', data)
}

// 确认发货
export const shipShipment = (id: number) => {
  return api.patch<ShipmentApi.Ship>(`/shipments/${id}/ship`)
}

// 确认收货
export const receiveShipment = (id: number) => {
  return api.patch<ShipmentApi.Receive>(`/shipments/${id}/receive`)
}

// 删除发货单
export const deleteShipment = (id: number) => {
  return api.delete<ShipmentApi.Delete>(`/shipments/${id}`)
}

// ==================== 销售退货 API ====================

// 获取销售退货单列表
export const getSaleReturns = (params?: SaleReturnApi.QueryParams) => {
  return api.get<SaleReturnApi.List>('/sale-returns', { params })
}

// 获取销售退货单详情
export const getSaleReturn = (id: number) => {
  return api.get<SaleReturnApi.Detail>(`/sale-returns/${id}`)
}

// 创建销售退货单
export const createSaleReturn = (data: SaleReturnApi.CreateParams) => {
  return api.post<SaleReturnApi.Create>('/sale-returns', data)
}

// 更新销售退货单
export const updateSaleReturn = (id: number, data: SaleReturnApi.UpdateParams) => {
  return api.patch<SaleReturnApi.Update>(`/sale-returns/${id}`, data)
}

// 审核销售退货单
export const auditSaleReturn = (id: number, data: SaleReturnApi.AuditParams) => {
  return api.patch<SaleReturnApi.Audit>(`/sale-returns/${id}/audit`, data)
}

// 完成销售退货单
export const completeSaleReturn = (id: number) => {
  return api.patch<SaleReturnApi.Complete>(`/sale-returns/${id}/complete`)
}

// 取消销售退货单
export const cancelSaleReturn = (id: number) => {
  return api.patch<SaleReturnApi.Cancel>(`/sale-returns/${id}/cancel`)
}

// 删除销售退货单
export const deleteSaleReturn = (id: number) => {
  return api.delete<SaleReturnApi.Delete>(`/sale-returns/${id}`)
}

// 获取可退货的发货单列表
export const getReturnableShipments = (customerId?: number) => {
  return api.get<SaleReturnApi.ReturnableShipments>('/sale-returns/shipments/returnable', {
    params: customerId ? { customerId } : undefined,
  })
}
