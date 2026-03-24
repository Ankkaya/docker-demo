<script setup lang="ts">
/**
 * 购物车页面
 */

import {
  clearCart,
  getCurrentCart,
  removeCartItem,
  toggleCartSelect,
  toggleCartSelectAll,
  updateCart,
} from '@/api/cart'
import { useUserStore } from '@/store/userStore'

definePage({
  name: 'cart',
  layout: 'default',
  style: {
    navigationBarTitleText: '购物车',
    navigationStyle: 'custom',
  },
})

interface CartItem {
  id: number
  productId: number
  productName: string
  salePrice: number
  quantity: number
  specs: Record<string, string>
  image: string
  subtotal: number
  selected: boolean
  stock: number
}

const router = useRouter()
const userStore = useUserStore()
const { error: showError } = useGlobalToast()

const loading = ref(false)
const actionLoading = ref(false)
const cartItems = ref<CartItem[]>([])
const cartStats = ref({
  totalCount: 0,
  selectedCount: 0,
  selectedAmount: 0,
})

const isLoggedIn = computed(() => userStore.isLoggedIn)
const hasCartItems = computed(() => cartItems.value.length > 0)
const cartCount = computed(() => Number(cartStats.value.totalCount || 0))
const selectedCount = computed(() => Number(cartStats.value.selectedCount || 0))
const totalAmount = computed(() => Number(cartStats.value.selectedAmount || 0))
const allSelected = computed(() => hasCartItems.value && cartItems.value.every(item => item.selected))

function formatSpecs(specs: Record<string, string>) {
  const entries = Object.entries(specs || {})
  if (!entries.length) {
    return '默认规格'
  }

  return entries.map(([key, value]) => `${key}: ${value}`).join(' / ')
}

function normalizeCartItem(item: any): CartItem {
  return {
    id: item.id,
    productId: Number(item.productId || 0),
    productName: item.productName || '未命名商品',
    salePrice: Number(item.salePrice || 0),
    quantity: Number(item.quantity || 0),
    specs: item.specs || {},
    image: item.skuImage || item.mainImage || '',
    subtotal: Number(item.subtotal || 0),
    selected: Boolean(item.selected),
    stock: Number(item.stock || 0),
  }
}

async function loadCart() {
  if (!userStore.isLoggedIn) {
    cartItems.value = []
    cartStats.value = {
      totalCount: 0,
      selectedCount: 0,
      selectedAmount: 0,
    }
    return
  }

  loading.value = true
  try {
    const response = await getCurrentCart().send()
    const list = Array.isArray(response?.list) ? response.list : []
    cartItems.value = list.map(normalizeCartItem)
    cartStats.value = {
      totalCount: Number(response?.stats?.totalCount || 0),
      selectedCount: Number(response?.stats?.selectedCount || 0),
      selectedAmount: Number(response?.stats?.selectedAmount || 0),
    }
  }
  catch (error: any) {
    cartItems.value = []
    cartStats.value = {
      totalCount: 0,
      selectedCount: 0,
      selectedAmount: 0,
    }
  }
  finally {
    loading.value = false
  }
}

function openLogin() {
  userStore.openAuthPopup({
    name: 'cart',
    path: '/pages/cart/index',
    isTabbar: true,
  })
}

function goShopping() {
  router.pushTab({ name: 'home' })
}

function checkout() {
  if (!userStore.isLoggedIn) {
    openLogin()
    return
  }

  if (!hasCartItems.value) {
    uni.showToast({ title: '购物车为空', icon: 'none' })
    return
  }

  uni.showToast({ title: '结算功能开发中', icon: 'none' })
}

async function runCartAction(action: () => Promise<unknown>, fallbackMessage: string) {
  if (actionLoading.value) {
    return
  }

  actionLoading.value = true
  try {
    await action()
    await loadCart()
  }
  catch {}
  finally {
    actionLoading.value = false
  }
}

function openProduct(item: CartItem) {
  if (!item.productId) {
    return
  }

  router.push({
    name: 'product-detail',
    query: { id: String(item.productId) },
  })
}

function toggleItem(item: CartItem) {
  runCartAction(() => toggleCartSelect(item.id, !item.selected).send(), '更新选中状态失败')
}

function toggleAll() {
  runCartAction(() => toggleCartSelectAll(!allSelected.value).send(), '更新全选状态失败')
}

function changeQuantity(item: CartItem, delta: number) {
  if (actionLoading.value) {
    return
  }

  const nextQuantity = item.quantity + delta
  if (nextQuantity < 1) {
    return
  }
  if (delta > 0 && nextQuantity > item.stock) {
    uni.showToast({ title: '商品库存不足', icon: 'none' })
    return
  }

  runCartAction(() => updateCart(item.id, { quantity: nextQuantity }).send(), '更新数量失败')
}

function removeItem(item: CartItem) {
  runCartAction(() => removeCartItem(item.id).send(), '删除购物车项失败')
}

function clearAllItems() {
  if (!hasCartItems.value) {
    return
  }

  runCartAction(() => clearCart().send(), '清空购物车失败')
}

onShow(() => {
  loadCart()
})
</script>

<template>
  <view class="flex flex-col bg-[#f8f7f6] text-slate-900">
    <scroll-view scroll-y class="flex-1">
      <view class="px-4 py-6">
        <view v-if="!isLoggedIn" class="overflow-hidden rounded-[32rpx] bg-white shadow-sm">
          <view class="bg-gradient-to-r from-[#efb239]/14 to-[#f59e0b]/6 px-6 py-8">
            <view class="size-14 flex items-center justify-center rounded-full bg-white/80 text-[#efb239]">
              <text class="i-material-symbols:shopping-cart-outline-rounded text-[30px]" />
            </view>
            <text class="mt-5 block text-xl font-bold">
              登录后查看你的购物车
            </text>
            <text class="mt-2 block text-sm text-slate-500 leading-7">
              同步已加购商品、快速结算，并在不同设备之间保持购物车状态一致。
            </text>
          </view>

          <view class="grid gap-3 px-6 py-6">
            <view class="flex items-center gap-3 rounded-2xl bg-[#f8f7f6] px-4 py-4">
              <text class="i-material-symbols:inventory-2-outline-rounded text-[22px] text-[#efb239]" />
              <text class="text-sm text-slate-600">
                保存宝宝常购商品和规格
              </text>
            </view>
            <view class="flex items-center gap-3 rounded-2xl bg-[#f8f7f6] px-4 py-4">
              <text class="i-material-symbols:bolt-outline-rounded text-[22px] text-[#efb239]" />
              <text class="text-sm text-slate-600">
                登录后可直接进入下单与结算流程
              </text>
            </view>
            <view class="mt-2 grid gap-3">
              <wd-button block type="primary" @click="openLogin">
                立即登录
              </wd-button>
              <wd-button block hairline @click="goShopping">
                先去逛逛
              </wd-button>
            </view>
          </view>
        </view>

        <view v-else-if="loading" class="flex items-center justify-center py-20 text-sm text-slate-400">
          正在加载购物车...
        </view>

        <view v-else-if="!hasCartItems" class="rounded-[32rpx] bg-white px-6 py-16 text-center shadow-sm">
          <view class="mx-auto size-16 flex items-center justify-center rounded-full bg-[#efb239]/10 text-[#efb239]">
            <text class="i-material-symbols:shopping-cart-outline-rounded text-[34px]" />
          </view>
          <text class="mt-5 block text-lg font-bold">
            购物车还是空的
          </text>
          <text class="mt-2 block text-sm text-slate-500 leading-7">
            去首页挑选一些宝宝好物吧
          </text>
          <view class="mt-6">
            <wd-button block type="primary" @click="goShopping">
              去逛逛
            </wd-button>
          </view>
        </view>

        <view v-else class="space-y-4">
          <view class="flex items-center justify-between rounded-3xl bg-white px-4 py-3 shadow-sm">
            <view class="flex items-center gap-3" @click="toggleAll">
              <view class="size-6 flex items-center justify-center rounded-full border text-xs"
                :class="allSelected ? 'border-[#efb239] bg-[#efb239] text-white' : 'border-slate-300 text-transparent'">
                ✓
              </view>
              <text class="text-sm text-slate-700 font-medium">
                {{ allSelected ? '已全选' : '全选商品' }}
              </text>
            </view>
            <wd-button size="small" hairline :loading="actionLoading" @click="clearAllItems">
              清空
            </wd-button>
          </view>

          <view
            v-for="item in cartItems"
            :key="item.id"
            class="rounded-[32rpx] border border-[#efb239]/6 bg-white px-4 py-4 shadow-[0_14px_32px_rgba(15,23,42,0.06)]"
          >
            <view class="flex gap-4">
              <view class="flex items-center" @click="toggleItem(item)">
                <view
                  class="size-6 flex items-center justify-center rounded-full border text-xs"
                  :class="item.selected ? 'border-[#efb239] bg-[#efb239] text-white' : 'border-slate-300 text-transparent'"
                >
                  ✓
                </view>
              </view>
              <image
                :src="item.image"
                mode="aspectFill"
                class="size-24 rounded-[24rpx] bg-[#f4efe7]"
                @click="openProduct(item)"
              />
              <view class="min-w-0 flex flex-1 flex-col justify-between">
                <view>
                  <view class="flex items-start justify-between gap-2">
                    <text class="line-clamp-2 min-w-0 flex-1 text-[30rpx] text-slate-900 font-semibold leading-6">
                      {{ item.productName }}
                    </text>
                    <view
                      class="shrink-0 flex items-center justify-center rounded-full bg-slate-100 p-2"
                      @click="removeItem(item)"
                    >
                      <text class="i-material-symbols:close text-[14px] text-slate-400 leading-none" />
                    </view>
                  </view>
                  <text class="mt-2 block text-xs text-slate-500 leading-6">
                    {{ formatSpecs(item.specs) }}
                  </text>
                  <view class="mt-3 inline-flex items-center rounded-full bg-[#f8f7f6] px-3 py-1">
                    <text class="text-[22rpx] text-slate-400">
                      库存 {{ item.stock }}
                    </text>
                  </view>
                </view>

                <view class="mt-4 flex items-end justify-between gap-3">
                  <view>
                    <text class="block text-lg text-[#efb239] font-bold leading-none">
                      ¥{{ item.salePrice.toFixed(2) }}
                    </text>
                    <text class="mt-2 block text-xs text-slate-400">
                      小计 ¥{{ item.subtotal.toFixed(2) }}
                    </text>
                  </view>
                  <view class="inline-flex items-center rounded-full bg-[#f8f7f6] px-2 py-2">
                    <view
                      class="size-8 flex items-center justify-center rounded-full bg-white text-slate-600 shadow-sm"
                      :class="item.quantity <= 1 || actionLoading ? 'opacity-40' : ''"
                      @click="changeQuantity(item, -1)"
                    >
                      -
                    </view>
                    <text class="min-w-[56rpx] px-2 text-center text-sm text-slate-900 font-semibold">
                      {{ item.quantity }}
                    </text>
                    <view
                      class="size-8 flex items-center justify-center rounded-full bg-[#efb239] text-white shadow-sm"
                      :class="item.quantity >= item.stock || actionLoading ? 'opacity-40' : ''"
                      @click="changeQuantity(item, 1)"
                    >
                      +
                    </view>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <view v-if="isLoggedIn && hasCartItems"
      class="border-t border-[#efb239]/8 bg-white px-5 pb-6 pt-4 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
      <view class="flex items-center justify-between">
        <view>
          <text class="block text-sm text-slate-500">
            共 {{ cartCount }} 件，已选 {{ selectedCount }} 件商品
          </text>
          <text class="mt-1 block text-2xl text-[#efb239] font-bold">
            ¥{{ totalAmount.toFixed(2) }}
          </text>
        </view>
        <view class="min-w-[240rpx]">
          <wd-button block type="primary" @click="checkout">
            去结算
          </wd-button>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
