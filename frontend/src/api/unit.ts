import api from './request'
import type { UnitApi } from '@/types/api'

// 获取计量单位列表
export const getUnits = () => {
  return api.get<UnitApi.List>('/units')
}

// 获取单个计量单位
export const getUnit = (id: number) => {
  return api.get<UnitApi.Detail>(`/units/${id}`)
}

// 创建计量单位
export const createUnit = (data: UnitApi.CreateParams) => {
  return api.post<UnitApi.Create>('/units', data)
}

// 更新计量单位
export const updateUnit = (id: number, data: UnitApi.UpdateParams) => {
  return api.patch<UnitApi.Update>(`/units/${id}`, data)
}

// 删除计量单位
export const deleteUnit = (id: number) => {
  return api.delete<UnitApi.Delete>(`/units/${id}`)
}
