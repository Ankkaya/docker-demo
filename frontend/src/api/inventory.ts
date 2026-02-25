import request from './request';

export interface Inventory {
  id: number;
  skuId: number;
  warehouseId: number;
  quantity: number;
  locked: number;
  available: number;
  minStock: number;
  maxStock: number;
  location?: string;
  skuCode: string;
  productName: string;
  specs: Record<string, string>;
  warehouseName: string;
}

export interface InventoryLog {
  id: number;
  type: string;
  typeName: string;
  skuId: number;
  skuCode: string;
  productName: string;
  specs: Record<string, string>;
  warehouseId: number;
  warehouseName: string;
  quantity: number;
  before: number;
  after: number;
  bizType?: string;
  bizNo?: string;
  remark?: string;
  createdAt: string;
}

export function getInventories(params: {
  skuId?: number;
  warehouseId?: number;
  spuCode?: string;
  skuCode?: string;
  productName?: string;
  page?: number;
  pageSize?: number;
}) {
  return request.get<{
    data: Inventory[];
    meta: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  }>('/inventories', { params });
}

export function getInventoryStats(warehouseId?: number) {
  return request.get<{
    totalSkuCount: number;
    totalQuantity: number;
    totalAvailable: number;
    totalLocked: number;
    lowStockCount: number;
  }>('/inventories/stats', { params: { warehouseId } });
}

export function getInventoryWarnings(params: {
  warehouseId?: number;
  type?: 'low' | 'high';
  page?: number;
  pageSize?: number;
}) {
  return request.get<{
    data: (Inventory & { warningType: 'low' | 'high' })[];
    meta: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  }>('/inventories/warnings', { params });
}

export function getInventoryLogs(params: {
  skuId?: number;
  warehouseId?: number;
  type?: string;
  bizNo?: string;
  page?: number;
  pageSize?: number;
}) {
  return request.get<{
    data: InventoryLog[];
    meta: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  }>('/inventories/logs/list', { params });
}

export function updateInventory(
  id: number,
  data: {
    quantity?: number;
    minStock?: number;
    maxStock?: number;
    location?: string;
  }
) {
  return request.patch<Inventory>(`/inventories/${id}`, data);
}
