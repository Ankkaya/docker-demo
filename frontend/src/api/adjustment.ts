import request from './request';

export interface AdjustmentItem {
  id: number;
  skuId: number;
  bookQty: number;
  actualQty: number;
  diffQty: number;
  skuCode: string;
  productName: string;
  specs: Record<string, string>;
}

export interface Adjustment {
  id: number;
  adjustNo: string;
  warehouseId: number;
  warehouseName: string;
  status: 'PENDING' | 'APPROVED' | 'COMPLETED' | 'CANCELLED';
  remark?: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  items: AdjustmentItem[];
}

export interface CreateAdjustmentData {
  warehouseId: number;
  remark?: string;
  items: { skuId: number; actualQty: number }[];
}

export function getAdjustments(params: {
  adjustNo?: string;
  warehouseId?: number;
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  return request.get<{
    data: Adjustment[];
    meta: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  }>('/adjustments', { params });
}

export function getAdjustment(id: number) {
  return request.get<Adjustment>(`/adjustments/${id}`);
}

export function createAdjustment(data: CreateAdjustmentData) {
  return request.post<Adjustment>('/adjustments', data);
}

export function auditAdjustment(id: number) {
  return request.patch<Adjustment>(`/adjustments/${id}/audit`);
}

export function completeAdjustment(id: number) {
  return request.patch<Adjustment>(`/adjustments/${id}/complete`);
}

export function cancelAdjustment(id: number) {
  return request.patch<Adjustment>(`/adjustments/${id}/cancel`);
}
