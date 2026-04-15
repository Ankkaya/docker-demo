import api from './request'
import type { CategoryApi } from '@/types/api/index.ts'

// 获取分类列表（树形）
export const getCategories = () => {
  return api.get<CategoryApi.List>('/categories')
}

// 获取分类列表（扁平化）
export const getCategoriesFlat = () => {
  return api.get<CategoryApi.ListFlat>('/categories?format=flat')
}

// 获取单个分类
export const getCategory = (id: number) => {
  return api.get<CategoryApi.Detail>(`/categories/${id}`)
}

// 创建分类
export const createCategory = (data: CategoryApi.CreateParams) => {
  return api.post<CategoryApi.Create>('/categories', data)
}

// 更新分类
export const updateCategory = (id: number, data: CategoryApi.UpdateParams) => {
  return api.patch<CategoryApi.Update>(`/categories/${id}`, data)
}

// 删除分类
export const deleteCategory = (id: number) => {
  return api.delete<CategoryApi.Delete>(`/categories/${id}`)
}
