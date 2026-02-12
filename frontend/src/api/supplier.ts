import api from './request';
import type { Supplier, CreateSupplierDto, UpdateSupplierDto } from '@/types/basic-data';

// 获取供应商列表
export const getSuppliers = () => {
  return api.get<any, Supplier[]>('/suppliers');
};

// 获取单个供应商
export const getSupplier = (id: number) => {
  return api.get<any, Supplier>(`/suppliers/${id}`);
};

// 创建供应商
export const createSupplier = (data: CreateSupplierDto) => {
  return api.post<any, Supplier>('/suppliers', data);
};

// 更新供应商
export const updateSupplier = (id: number, data: UpdateSupplierDto) => {
  return api.patch<any, Supplier>(`/suppliers/${id}`, data);
};

// 删除供应商
export const deleteSupplier = (id: number) => {
  return api.delete(`/suppliers/${id}`);
};
