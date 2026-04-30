import api from './request'
import type {
  MallRechargePackage,
  MallRechargePackageListResponse,
  MallRechargePackagePayload,
  QueryMallRechargePackageParams,
} from '@/types/mall-recharge-package'

export const getMallRechargePackages = (params?: QueryMallRechargePackageParams) => {
  return api.get<MallRechargePackageListResponse>('/mall-recharge-packages', { params })
}

export const createMallRechargePackage = (data: MallRechargePackagePayload) => {
  return api.post<MallRechargePackage>('/mall-recharge-packages', data)
}

export const updateMallRechargePackage = (id: number, data: Partial<MallRechargePackagePayload>) => {
  return api.patch<MallRechargePackage>(`/mall-recharge-packages/${id}`, data)
}

export const deleteMallRechargePackage = (id: number) => {
  return api.delete(`/mall-recharge-packages/${id}`)
}
