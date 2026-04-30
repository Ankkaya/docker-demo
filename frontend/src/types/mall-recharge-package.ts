import type { MallRechargeActivity } from './mall-recharge-activity'

export interface MallRechargePackage {
  id: number
  name: string
  rechargeAmount: string
  tag?: string | null
  description?: string | null
  sort: number
  isEnabled: boolean
  remark?: string | null
  activities: MallRechargeActivity[]
  createdAt: string
  updatedAt: string
}

export interface MallRechargePackageListResponse {
  data: MallRechargePackage[]
  meta: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export interface QueryMallRechargePackageParams {
  keyword?: string
  isEnabled?: boolean
  page?: number
  pageSize?: number
}

export interface MallRechargePackagePayload {
  name: string
  rechargeAmount: number
  tag?: string
  description?: string
  sort?: number
  isEnabled?: boolean
  remark?: string
  activityIds?: number[]
}
