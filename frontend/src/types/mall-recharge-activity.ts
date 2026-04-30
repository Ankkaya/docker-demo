export interface MallRechargeActivity {
  id: number
  name: string
  bonusAmount: string
  tag?: string | null
  description?: string | null
  startTime?: string | null
  endTime?: string | null
  sort: number
  isEnabled: boolean
  firstRechargeOnly: boolean
  remark?: string | null
  createdAt: string
  updatedAt: string
}

export interface MallRechargeActivityListResponse {
  data: MallRechargeActivity[]
  meta: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export interface QueryMallRechargeActivityParams {
  keyword?: string
  isEnabled?: boolean
  page?: number
  pageSize?: number
}

export interface MallRechargeActivityPayload {
  name: string
  bonusAmount: number
  tag?: string
  description?: string
  startTime?: string
  endTime?: string
  sort?: number
  isEnabled?: boolean
  firstRechargeOnly?: boolean
  remark?: string
}
