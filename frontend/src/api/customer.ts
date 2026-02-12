import api from './request';
import type { Customer, CreateCustomerDto, UpdateCustomerDto } from '@/types/basic-data';

// 获取客户列表
export const getCustomers = () => {
  return api.get<any, Customer[]>('/customers');
};

// 获取单个客户
export const getCustomer = (id: number) => {
  return api.get<any, Customer>(`/customers/${id}`);
};

// 创建客户
export const createCustomer = (data: CreateCustomerDto) => {
  return api.post<any, Customer>('/customers', data);
};

// 更新客户
export const updateCustomer = (id: number, data: UpdateCustomerDto) => {
  return api.patch<any, Customer>(`/customers/${id}`, data);
};

// 删除客户
export const deleteCustomer = (id: number) => {
  return api.delete(`/customers/${id}`);
};
