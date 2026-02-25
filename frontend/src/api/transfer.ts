import request from './request';

export interface TransferItem {
  id: number;
  skuId: number;
  quantity: number;
  skuCode: string;
  productName: string;
  specs: Record<string, string>;
}

export interface Transfer {
  id: number;
  transferNo: string;
  fromId: number;
  fromName: string;
  toId: number;
  toName: string;
  status: 'PENDING' | 'OUT' | 'IN' | 'COMPLETED' | 'CANCELLED';
  remark?: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  items: TransferItem[];
}

export interface CreateTransferData {
  fromId: number;
  toId: number;
  remark?: string;
  items: { skuId: number; quantity: number }[];
}

export function getTransfers(params: {
  transferNo?: string;
  fromId?: number;
  toId?: number;
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  return request.get<{
    data: Transfer[];
    meta: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  }>('/transfers', { params });
}

export function getTransfer(id: number) {
  return request.get<Transfer>(`/transfers/${id}`);
}

export function createTransfer(data: CreateTransferData) {
  return request.post<Transfer>('/transfers', data);
}

export function confirmOut(id: number) {
  return request.patch<Transfer>(`/transfers/${id}/out`);
}

export function confirmIn(id: number) {
  return request.patch<Transfer>(`/transfers/${id}/in`);
}

export function cancelTransfer(id: number) {
  return request.patch<Transfer>(`/transfers/${id}/cancel`);
}
