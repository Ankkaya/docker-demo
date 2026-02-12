import api from './request';
import type { Warehouse, CreateWarehouseDto, UpdateWarehouseDto } from '@/types/basic-data';

// 获取仓库列表
export const getWarehouses = () => {
  return api.get<any, Warehouse[]>('/warehouses');
};

// 获取单个仓库
export const getWarehouse = (id: number) => {
  return api.get<any, Warehouse>(`/warehouses/${id}`);
};

// 创建仓库
export const createWarehouse = (data: CreateWarehouseDto) => {
  return api.post<any, Warehouse>('/warehouses', data);
};

// 更新仓库
export const updateWarehouse = (id: number, data: UpdateWarehouseDto) => {
  return api.patch<any, Warehouse>(`/warehouses/${id}`, data);
};

// 删除仓库
export const deleteWarehouse = (id: number) => {
  return api.delete(`/warehouses/${id}`);
};
