import api from './request'

export interface CouponItem {
  id: number
  name: string
  code: string
  type: 'CASH'
  typeText: string
  thresholdAmount: number
  discountAmount: number
  totalCount: number | null
  perLimit: number
  receivedCount: number
  usedCount: number
  startTime: string
  endTime: string
  description: string | null
  sort: number
  isEnabled: boolean
  statusText: string
  createdAt: string
  updatedAt: string
}

export interface CouponReceiveItem {
  id: number
  couponId: number
  couponName: string
  couponCode: string
  customerId: number
  customerName: string
  customerCode: string | null
  status: 'UNUSED' | 'USED' | 'EXPIRED' | 'INVALID'
  statusText: string
  source: string | null
  validFrom: string
  validTo: string
  receivedAt: string
  usedAt: string | null
  remark: string | null
}

export interface CouponListQuery {
  keyword?: string
  isEnabled?: boolean
}

export interface CouponReceiveListQuery {
  couponId?: number
  customerId?: number
  status?: 'UNUSED' | 'USED' | 'EXPIRED' | 'INVALID'
  keyword?: string
  page?: number
  pageSize?: number
}

export interface CouponPayload {
  name: string
  code?: string
  type?: 'CASH'
  thresholdAmount?: number
  discountAmount: number
  totalCount?: number | null
  perLimit?: number
  startTime: string
  endTime: string
  description?: string
  sort?: number
  isEnabled?: boolean
}

export interface IssueCouponPayload {
  customerIds: number[]
  remark?: string
}

export const getCoupons = (params?: CouponListQuery) => api.get<CouponItem[]>('/coupons', { params })
export const getCouponReceives = (params?: CouponReceiveListQuery) => api.get<{ data: CouponReceiveItem[]; meta: any }>('/coupons/receives', { params })
export const createCoupon = (data: CouponPayload) => api.post<CouponItem>('/coupons', data)
export const updateCoupon = (id: number, data: Partial<CouponPayload>) => api.patch<CouponItem>(`/coupons/${id}`, data)
export const deleteCoupon = (id: number) => api.delete(`/coupons/${id}`)
export const issueCoupon = (id: number, data: IssueCouponPayload) => api.post<{ success: boolean; issuedCount: number; message: string }>(`/coupons/${id}/issue`, data)
