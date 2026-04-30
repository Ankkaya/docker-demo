import api from './request';
import type { MallHotSearchApi } from '@/types/api/mall-hot-search.api';

export const getMallHotSearchKeywords = () => {
  return api.get<MallHotSearchApi.List>('/mall-hot-searches');
};

export const getMallHotSearchKeyword = (id: number) => {
  return api.get<MallHotSearchApi.Detail>(`/mall-hot-searches/${id}`);
};

export const createMallHotSearchKeyword = (data: MallHotSearchApi.CreateParams) => {
  return api.post<MallHotSearchApi.Create>('/mall-hot-searches', data);
};

export const updateMallHotSearchKeyword = (id: number, data: MallHotSearchApi.UpdateParams) => {
  return api.patch<MallHotSearchApi.Update>(`/mall-hot-searches/${id}`, data);
};

export const deleteMallHotSearchKeyword = (id: number) => {
  return api.delete<MallHotSearchApi.Delete>(`/mall-hot-searches/${id}`);
};
