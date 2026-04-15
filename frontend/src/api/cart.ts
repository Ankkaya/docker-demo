import api from './request';

// 获取购物车列表（管理后台）
export function getCartList(params: {
  userId?: number;
  keyword?: string;
  page?: number;
  pageSize?: number;
}) {
  return api.get('/carts', { params });
}

// 获取购物车项详情
export function getCartDetail(id: number) {
  return api.get(`/carts/${id}`);
}

// 创建购物车项
export function createCart(data: {
  userId: number;
  skuId: number;
  quantity: number;
  selected?: boolean;
}) {
  return api.post('/carts', data);
}

// 更新购物车项
export function updateCart(
  id: number,
  data: {
    quantity?: number;
    selected?: boolean;
  }
) {
  return api.patch(`/carts/${id}`, data);
}

// 删除购物车项
export function deleteCart(id: number) {
  return api.delete(`/carts/${id}`);
}

// 批量删除购物车项
export function deleteCartBatch(ids: number[]) {
  return api.delete('/carts/batch', { data: { ids } });
}

// 获取购物车统计
export function getCartStats() {
  return api.get('/carts/stats');
}

// ============ 商城前台接口 ============

// 获取我的购物车
export function getMyCart() {
  return api.get('/carts/my');
}

// 添加商品到购物车
export function addToCart(data: { skuId: number; quantity?: number }) {
  return api.post('/carts/add', data);
}

// 切换选中状态
export function toggleCartSelect(id: number, selected: boolean) {
  return api.patch(`/carts/${id}/select`, { selected });
}

// 全选/取消全选
export function selectAllCart(selected: boolean) {
  return api.patch('/carts/select-all', { selected });
}

// 清空我的购物车
export function clearMyCart() {
  return api.delete('/carts/clear/my');
}
