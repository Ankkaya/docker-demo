import { alovaInstance } from '@/api'

export interface AddToCartPayload {
  skuId: number
  quantity?: number
}

export interface UpdateCartPayload {
  quantity?: number
  selected?: boolean
}

export function getCurrentCart() {
  return alovaInstance.Get('/mall/carts/current')
}

export function addToCart(payload: AddToCartPayload) {
  return alovaInstance.Post('/mall/carts/add', payload)
}

export function updateCart(id: number, payload: UpdateCartPayload) {
  return alovaInstance.Patch(`/mall/carts/${id}`, payload)
}

export function toggleCartSelect(id: number, selected: boolean) {
  return alovaInstance.Patch(`/mall/carts/${id}/select`, { selected })
}

export function toggleCartSelectAll(selected: boolean) {
  return alovaInstance.Patch('/mall/carts/select-all', { selected })
}

export function removeCartItem(id: number) {
  return alovaInstance.Delete(`/mall/carts/${id}`)
}

export function clearCart() {
  return alovaInstance.Delete('/mall/carts/clear')
}
