import { defineStore } from 'pinia'

export type CheckoutSource = 'cart' | 'product-detail' | 'order' | ''

export interface CheckoutAddress {
  id: number
  receiverName: string
  receiverPhone: string
  fullAddress: string
  tag?: string | null
  isDefault?: boolean
}

export interface CheckoutItem {
  productId: number
  skuId: number
  productName: string
  specText: string
  image: string
  price: number
  quantity: number
}

export const useCheckoutStore = defineStore('checkout', {
  state: () => ({
    source: '' as CheckoutSource,
    orderId: 0,
    orderNo: '',
    expireAt: '',
    items: [] as CheckoutItem[],
    totalAmount: 0,
    selectedAddress: null as CheckoutAddress | null,
  }),
  getters: {
    itemCount: state => state.items.reduce((sum, item) => sum + item.quantity, 0),
    primaryItem: state => state.items[0] || null,
  },
  actions: {
    setPayload(payload: {
      source: CheckoutSource
      orderId?: number
      orderNo?: string
      expireAt?: string
      items: CheckoutItem[]
      totalAmount?: number
    }) {
      this.source = payload.source
      this.orderId = Number(payload.orderId || 0)
      this.orderNo = payload.orderNo || `PAY${Date.now()}`
      this.expireAt = payload.expireAt || ''
      this.items = payload.items.map(item => ({ ...item }))
      this.totalAmount = payload.totalAmount ?? payload.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    },
    setSelectedAddress(address: CheckoutAddress | null) {
      this.selectedAddress = address ? { ...address } : null
    },
    clear() {
      this.source = ''
      this.orderId = 0
      this.orderNo = ''
      this.expireAt = ''
      this.items = []
      this.totalAmount = 0
      this.selectedAddress = null
    },
  },
})
