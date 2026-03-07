import api from './request'
import type { CustomerApi } from '@/types/api/index.ts'

// 获取客户列表
export const getCustomers = () => {
  return api.get<CustomerApi.List>('/customers')
}

// 获取单个客户
export const getCustomer = (id: number) => {
  return api.get<CustomerApi.Detail>(`/customers/${id}`)
}

// 创建客户
export const createCustomer = (data: CustomerApi.CreateParams) => {
  return api.post<CustomerApi.Create>('/customers', data)
}

// 更新客户
export const updateCustomer = (id: number, data: CustomerApi.UpdateParams) => {
  return api.patch<CustomerApi.Update>(`/customers/${id}`, data)
}

// 删除客户
export const deleteCustomer = (id: number) => {
  return api.delete<CustomerApi.Delete>(`/customers/${id}`)
}
