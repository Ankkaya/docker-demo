import api from './request';
import type { Unit, CreateUnitDto, UpdateUnitDto } from '@/types/basic-data';

// 获取计量单位列表
export const getUnits = () => {
  return api.get<any, Unit[]>('/units');
};

// 获取单个计量单位
export const getUnit = (id: number) => {
  return api.get<any, Unit>(`/units/${id}`);
};

// 创建计量单位
export const createUnit = (data: CreateUnitDto) => {
  return api.post<any, Unit>('/units', data);
};

// 更新计量单位
export const updateUnit = (id: number, data: UpdateUnitDto) => {
  return api.patch<any, Unit>(`/units/${id}`, data);
};

// 删除计量单位
export const deleteUnit = (id: number) => {
  return api.delete(`/units/${id}`);
};
