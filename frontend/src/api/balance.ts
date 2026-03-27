import api from './request';
import type {
  AdjustBalanceDto,
  BalanceAccount,
  BalanceListResponse,
  BalanceLog,
  CreateBalanceAccountDto,
  QueryBalanceAccountParams,
  QueryBalanceLogParams,
} from '@/types/balance';

export const getBalanceAccounts = (params?: QueryBalanceAccountParams) => {
  return api.get<BalanceListResponse<BalanceAccount>>('/balances/accounts', { params });
};

export const getBalanceAccount = (id: number) => {
  return api.get<BalanceAccount>(`/balances/accounts/${id}`);
};

export const createBalanceAccount = (data: CreateBalanceAccountDto) => {
  return api.post<BalanceAccount>('/balances/accounts', data);
};

export const adjustBalanceAccount = (id: number, data: AdjustBalanceDto) => {
  return api.post<BalanceAccount>(`/balances/accounts/${id}/adjust`, data);
};

export const getBalanceLogs = (params?: QueryBalanceLogParams) => {
  return api.get<BalanceListResponse<BalanceLog>>('/balances/logs', { params });
};
