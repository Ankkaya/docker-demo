import api from './request'
import type { SupplierApi } from '@/types/api/index.ts'

// 获取供应商列表
export const getSuppliers = () => {
  return api.get<SupplierApi.List>('/suppliers')
}

// 获取单个供应商
export const getSupplier = (id: number) => {
  return api.get<SupplierApi.Detail>(`/suppliers/${id}`)
}

// 创建供应商
export const createSupplier = (data: SupplierApi.CreateParams) => {
  return api.post<SupplierApi.Create>('/suppliers', data)
}

// 更新供应商
export const updateSupplier = (id: number, data: SupplierApi.UpdateParams) => {
  return api.patch<SupplierApi.Update>(`/suppliers/${id}`, data)
}

// 删除供应商
export const deleteSupplier = (id: number) => {
  return api.delete<SupplierApi.Delete>(`/suppliers/${id}`)
}
