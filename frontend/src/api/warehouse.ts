import api from './request'
import type { WarehouseApi } from '@/types/api/index.ts'

// 获取仓库列表
export const getWarehouses = () => {
  return api.get<WarehouseApi.List>('/warehouses')
}

// 获取单个仓库
export const getWarehouse = (id: number) => {
  return api.get<WarehouseApi.Detail>(`/warehouses/${id}`)
}

// 创建仓库
export const createWarehouse = (data: WarehouseApi.CreateParams) => {
  return api.post<WarehouseApi.Create>('/warehouses', data)
}

// 更新仓库
export const updateWarehouse = (id: number, data: WarehouseApi.UpdateParams) => {
  return api.patch<WarehouseApi.Update>(`/warehouses/${id}`, data)
}

// 删除仓库
export const deleteWarehouse = (id: number) => {
  return api.delete<WarehouseApi.Delete>(`/warehouses/${id}`)
}
