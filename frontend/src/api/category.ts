import api from './request';
import type { Category, CreateCategoryDto, UpdateCategoryDto } from '@/types/basic-data';

// 获取分类列表（树形）
export const getCategories = () => {
  return api.get<any, Category[]>('/categories');
};

// 获取分类列表（扁平化）
export const getCategoriesFlat = () => {
  return api.get<any, Category[]>('/categories?format=flat');
};

// 获取单个分类
export const getCategory = (id: number) => {
  return api.get<any, Category>(`/categories/${id}`);
};

// 创建分类
export const createCategory = (data: CreateCategoryDto) => {
  return api.post<any, Category>('/categories', data);
};

// 更新分类
export const updateCategory = (id: number, data: UpdateCategoryDto) => {
  return api.patch<any, Category>(`/categories/${id}`, data);
};

// 删除分类
export const deleteCategory = (id: number) => {
  return api.delete(`/categories/${id}`);
};
