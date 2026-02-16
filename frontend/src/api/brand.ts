import api from './request'
import type { BrandApi } from '@/types/api'

// 获取品牌列表
export const getBrands = () => {
  return api.get<BrandApi.List>('/brands')
}

// 获取单个品牌
export const getBrand = (id: number) => {
  return api.get<BrandApi.Detail>(`/brands/${id}`)
}

// 创建品牌
export const createBrand = (data: BrandApi.CreateParams) => {
  return api.post<BrandApi.Create>('/brands', data)
}

// 更新品牌
export const updateBrand = (id: number, data: BrandApi.UpdateParams) => {
  return api.patch<BrandApi.Update>(`/brands/${id}`, data)
}

// 删除品牌
export const deleteBrand = (id: number) => {
  return api.delete<BrandApi.Delete>(`/brands/${id}`)
}
