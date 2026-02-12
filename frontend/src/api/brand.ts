import api from './request';
import type { Brand, CreateBrandDto, UpdateBrandDto } from '@/types/basic-data';

// 获取品牌列表
export const getBrands = () => {
  return api.get<any, Brand[]>('/brands');
};

// 获取单个品牌
export const getBrand = (id: number) => {
  return api.get<any, Brand>(`/brands/${id}`);
};

// 创建品牌
export const createBrand = (data: CreateBrandDto) => {
  return api.post<any, Brand>('/brands', data);
};

// 更新品牌
export const updateBrand = (id: number, data: UpdateBrandDto) => {
  return api.patch<any, Brand>(`/brands/${id}`, data);
};

// 删除品牌
export const deleteBrand = (id: number) => {
  return api.delete(`/brands/${id}`);
};
