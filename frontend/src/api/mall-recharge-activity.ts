import api from './request'
import type {
  MallRechargeActivity,
  MallRechargeActivityListResponse,
  MallRechargeActivityPayload,
  QueryMallRechargeActivityParams,
} from '@/types/mall-recharge-activity'

export const getMallRechargeActivities = (params?: QueryMallRechargeActivityParams) => {
  return api.get<MallRechargeActivityListResponse>('/mall-recharge-activities', { params })
}

export const createMallRechargeActivity = (data: MallRechargeActivityPayload) => {
  return api.post<MallRechargeActivity>('/mall-recharge-activities', data)
}

export const updateMallRechargeActivity = (id: number, data: Partial<MallRechargeActivityPayload>) => {
  return api.patch<MallRechargeActivity>(`/mall-recharge-activities/${id}`, data)
}

export const deleteMallRechargeActivity = (id: number) => {
  return api.delete(`/mall-recharge-activities/${id}`)
}
