import api from './request'

export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'HIDDEN'

export interface ReviewItem {
  id: number
  reviewNo: string
  orderId: number
  orderItemId: number
  productId: number
  productName: string
  skuId: number
  skuCode: string
  skuSpecs: Record<string, string> | null
  userId: number
  userName: string
  rating: number
  content: string | null
  images: string[]
  isAnonymous: boolean
  status: ReviewStatus
  replyContent: string | null
  replyAt: string | null
  reviewedAt: string | null
  createdAt: string
}

export interface ReviewListQuery {
  keyword?: string
  productId?: number
  userId?: number
  status?: ReviewStatus
  page?: number
  pageSize?: number
}

export interface ReviewListResponse {
  data: ReviewItem[]
  meta: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export const getReviews = (params?: ReviewListQuery) =>
  api.get<ReviewListResponse>('/reviews', { params })

export const getReview = (id: number) =>
  api.get<ReviewItem>(`/reviews/${id}`)

export const auditReview = (id: number, status: ReviewStatus) =>
  api.patch<ReviewItem>(`/reviews/${id}/audit`, { status })

export const replyReview = (id: number, replyContent: string) =>
  api.patch<ReviewItem>(`/reviews/${id}/reply`, { replyContent })

export const deleteReview = (id: number) =>
  api.delete<{ success: boolean }>(`/reviews/${id}`)
