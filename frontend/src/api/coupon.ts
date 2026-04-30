import api from './request'

export interface CouponItem {
  id: number
  name: string
  code: string
  type: 'CASH' | 'DISCOUNT' | 'INSTANT_REDUCTION'
  typeText: string
  sceneType: 'COMMON' | 'NEW_USER' | 'FIRST_ORDER' | 'RECHARGE_GIFT' | 'ORDER_GIFT' | 'MANUAL'
  sceneTypeText: string
  issueType: 'USER_CLAIM' | 'ADMIN_ASSIGN' | 'AUTO_GRANT' | 'EXCHANGE_CODE'
  issueTypeText: string
  thresholdAmount: number
  discountAmount: number
  discountRate: number | null
  maxDiscountAmount: number | null
  totalCount: number | null
  perLimit: number
  dailyLimit: number | null
  receivedCount: number
  usedCount: number
  expiredCount: number
  claimStartTime: string | null
  claimEndTime: string | null
  startTime: string
  endTime: string
  validType: 'FIXED' | 'RELATIVE'
  validTypeText: string
  validDays: number | null
  validDelayDays: number
  issueScopeType: 'ALL' | 'CUSTOMERS' | 'NEW_USERS' | 'FIRST_ORDER_USERS' | 'RECHARGED_USERS'
  issueScopeTypeText: string
  issueRuleJson: Record<string, any> | null
  useScopeType: 'ALL' | 'CATEGORY' | 'BRAND' | 'PRODUCT' | 'SKU'
  useScopeTypeText: string
  useRuleJson: Record<string, any> | null
  channelScope: string[]
  stackable: boolean
  canUseWithPromotion: boolean
  canUseWithMemberPrice: boolean
  canUseWithPoint: boolean
  canUseWithBalance: boolean
  isPublic: boolean
  refundReturnMode: 'RETURN_ORIGINAL' | 'GRANT_NEW' | 'NOT_RETURN'
  refundReturnModeText: string
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
  type?: 'CASH' | 'DISCOUNT' | 'INSTANT_REDUCTION'
  sceneType?: 'COMMON' | 'NEW_USER' | 'FIRST_ORDER' | 'RECHARGE_GIFT' | 'ORDER_GIFT' | 'MANUAL'
  issueType?: 'USER_CLAIM' | 'ADMIN_ASSIGN' | 'AUTO_GRANT' | 'EXCHANGE_CODE'
  thresholdAmount?: number
  discountAmount: number
  discountRate?: number | null
  maxDiscountAmount?: number | null
  totalCount?: number | null
  perLimit?: number
  dailyLimit?: number | null
  claimStartTime?: string | null
  claimEndTime?: string | null
  startTime: string
  endTime: string
  validType?: 'FIXED' | 'RELATIVE'
  validDays?: number | null
  validDelayDays?: number
  issueScopeType?: 'ALL' | 'CUSTOMERS' | 'NEW_USERS' | 'FIRST_ORDER_USERS' | 'RECHARGED_USERS'
  issueRuleJson?: Record<string, any>
  useScopeType?: 'ALL' | 'CATEGORY' | 'BRAND' | 'PRODUCT' | 'SKU'
  useRuleJson?: Record<string, any>
  channelScope?: string[]
  stackable?: boolean
  canUseWithPromotion?: boolean
  canUseWithMemberPrice?: boolean
  canUseWithPoint?: boolean
  canUseWithBalance?: boolean
  isPublic?: boolean
  refundReturnMode?: 'RETURN_ORIGINAL' | 'GRANT_NEW' | 'NOT_RETURN'
  description?: string
  sort?: number
  isEnabled?: boolean
}

export interface IssueCouponPayload {
  customerIds: number[]
  remark?: string
}

export interface CreateCouponExchangeCodesPayload {
  count: number
  remark?: string
}

export interface ExchangeMallCouponPayload {
  code: string
}

export const getCoupons = (params?: CouponListQuery) => api.get<CouponItem[]>('/coupons', { params })
export const getCouponReceives = (params?: CouponReceiveListQuery) => api.get<{ data: CouponReceiveItem[]; meta: any }>('/coupons/receives', { params })
export const createCoupon = (data: CouponPayload) => api.post<CouponItem>('/coupons', data)
export const updateCoupon = (id: number, data: Partial<CouponPayload>) => api.patch<CouponItem>(`/coupons/${id}`, data)
export const deleteCoupon = (id: number) => api.delete(`/coupons/${id}`)
export const issueCoupon = (id: number, data: IssueCouponPayload) => api.post<{ success: boolean; issuedCount: number; message: string }>(`/coupons/${id}/issue`, data)
export const createCouponExchangeCodes = (id: number, data: CreateCouponExchangeCodesPayload) => api.post<{ success: boolean; count: number; codes: string[]; message: string }>(`/coupons/${id}/exchange-codes`, data)
export const exchangeMallCoupon = (data: ExchangeMallCouponPayload) => api.post<{ success: boolean; message: string }>('/mall/coupons/exchange', data)
