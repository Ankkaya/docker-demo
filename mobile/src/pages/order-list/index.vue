<script setup lang="ts">
/**
 * 订单列表页面 - 参考 Stitch 设计稿
 */

definePage({
  name: 'order-list',
  layout: 'default',
  style: {
    navigationBarTitleText: '订单列表',
    navigationStyle: 'custom',
  },
  needLogin: true,
})

const router = useRouter()

const statusTabs = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待付款' },
  { key: 'shipping', label: '待发货' },
  { key: 'receiving', label: '待收货' },
  { key: 'completed', label: '已完成' },
]

const activeStatus = ref('all')
const loading = ref(false)
const orders = ref<any[]>([])
const currentTime = ref(Date.now())
const countdownTimer = ref<ReturnType<typeof setInterval> | null>(null)

function formatSpecs(specs: Record<string, string>) {
  const entries = Object.entries(specs || {})
  if (!entries.length)
    return '默认规格'
  return entries.map(([key, value]) => `${key}: ${value}`).join(' / ')
}

function resolveOrderStatus(order: any) {
  if (order.status === 'CANCELLED')
    return { key: 'cancelled', label: '已取消' }
  if (order.status === 'COMPLETED')
    return { key: 'completed', label: '已完成' }
  if (order.shipStatus === 'SHIPPED')
    return { key: 'receiving', label: '待收货' }
  if (order.payStatus === 'PAID')
    return { key: 'shipping', label: '待发货' }
  return { key: 'pending', label: '待付款' }
}

function normalizeOrder(order: any) {
  const statusInfo = resolveOrderStatus(order)
  return {
    id: order.id,
    no: order.orderNo,
    status: statusInfo.key,
    statusLabel: statusInfo.label,
    total: Number(order.payable || 0),
    count: Number(order.itemCount || 0),
    expireAt: order.expireAt || '',
    items: (order.items || []).map((item: any, index: number) => ({
      id: `${order.id}-${item.skuId}-${index}`,
      productId: Number(item.productId || 0),
      skuId: Number(item.skuId || 0),
      name: item.productName || '未命名商品',
      spec: formatSpecs(item.specs || {}),
      price: Number(item.price || 0),
      quantity: Number(item.quantity || 0),
      image: item.image || '',
    })),
  }
}

function formatCountdown(expireAt?: string) {
  if (!expireAt) {
    return ''
  }

  const diff = Math.max(0, Math.floor((new Date(expireAt).getTime() - currentTime.value) / 1000))
  const minutes = Math.floor(diff / 60)
  const seconds = diff % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

async function loadOrders() {
  loading.value = true
  try {
    const list = await (Apis.general as any).MallOrdersController_findOrders({
      params: {
        status: activeStatus.value === 'all' ? undefined : activeStatus.value,
      },
    }).send()
    orders.value = (Array.isArray(list) ? list : []).map(normalizeOrder)
  }
  catch {
    orders.value = []
  }
  finally {
    loading.value = false
  }
}

const filteredOrders = computed(() => orders.value)

function statusTone(status: string) {
  if (status === 'pending')
    return 'text-orange-500'
  if (status === 'completed' || status === 'cancelled')
    return 'text-slate-400'
  return 'text-[#efb239]'
}

function headerTone(status: string) {
  if (status === 'completed' || status === 'cancelled')
    return 'bg-slate-100'
  return 'bg-[#efb239]/6'
}

onLoad((options) => {
  const status = options?.status ? String(options.status) : 'all'
  const valid = statusTabs.some(tab => tab.key === status)
  activeStatus.value = valid ? status : 'all'
  countdownTimer.value = setInterval(() => {
    currentTime.value = Date.now()
  }, 1000)
  loadOrders()
})

onShow(() => {
  loadOrders()
})

onUnload(() => {
  if (countdownTimer.value) {
    clearInterval(countdownTimer.value)
  }
})

function switchStatus(key: string) {
  activeStatus.value = key
  loadOrders()
}

function openDetail(orderId: number) {
  router.push({
    name: 'order-detail',
    params: { id: String(orderId) },
  })
}

function payOrder(orderId: number) {
  router.push({
    name: 'order-detail',
    params: {
      id: String(orderId),
    },
  })
}

async function cancelOrder(orderId: number) {
  try {
    await alovaInstance.Patch(`/mall/orders/${orderId}/cancel`, {}).send()
    uni.showToast({ title: '订单已取消', icon: 'none' })
    loadOrders()
  }
  catch (error: any) {
    uni.showToast({ title: error?.message || '取消订单失败', icon: 'none' })
  }
}

async function confirmReceive(orderId: number) {
  try {
    await alovaInstance.Patch(`/mall/orders/${orderId}/receive`, {}).send()
    uni.showToast({ title: '已确认收货', icon: 'success' })
    loadOrders()
  }
  catch (error: any) {
    uni.showToast({ title: error?.message || '确认收货失败', icon: 'none' })
  }
}

function buyAgain(order: typeof orders.value[number]) {
  const firstItem = order.items[0]
  if (!firstItem?.productId)
    return

  router.push({
    name: 'product-detail',
    query: {
      id: String(firstItem.productId),
    },
  })
}
</script>

<template>
  <view class="orders-page text-slate-900">
    <view class="sticky top-0 z-40 border-b border-[#efb239]/10 bg-white/92 px-4 pt-3 backdrop-blur-md">

      <scroll-view scroll-x class="no-scrollbar whitespace-nowrap">
        <view class="flex gap-7">
          <view v-for="tab in statusTabs" :key="tab.key" class="border-b-[3px] px-0.5 pb-3 pt-1 text-sm font-semibold"
            :class="activeStatus === tab.key ? 'border-[#efb239] text-[#efb239]' : 'border-transparent text-slate-500'"
            @click="switchStatus(tab.key)">
            {{ tab.label }}
          </view>
        </view>
      </scroll-view>
    </view>

    <scroll-view scroll-y class="pb-24">
      <view class="px-4 pt-4">
        <view v-if="loading" class="py-12 text-center text-sm text-slate-400">
          正在加载订单...
        </view>
        <view v-else-if="!filteredOrders.length" class="py-12 text-center text-sm text-slate-400">
          暂无订单
        </view>
        <view v-for="order in filteredOrders" :key="order.id"
          class="order-card mb-4 overflow-hidden rounded-2xl border border-[#efb239]/8 bg-white"
          @click="openDetail(order.id)">
          <view class="flex items-center justify-between border-b border-[#efb239]/8 px-4 py-3.5"
            :class="headerTone(order.status)">
            <view class="flex flex-col gap-1">
              <text class="text-xs text-slate-400">
                订单号 {{ order.no }}
              </text>
              <text v-if="order.status === 'pending' && order.expireAt" class="text-[11px] text-orange-400 font-medium">
                支付剩余 {{ formatCountdown(order.expireAt) }}
              </text>
            </view>
            <text class="text-sm font-bold" :class="statusTone(order.status)">
              {{ order.statusLabel }}
            </text>
          </view>

          <view class="flex flex-col gap-3 px-4 py-4">
            <view v-for="item in order.items.slice(0, 2)" :key="item.id" class="flex items-center gap-3">
              <image :src="item.image" class="size-20 rounded-xl bg-[#f5efe5]" mode="aspectFill" />
              <view class="min-w-0 flex-1">
                <text class="line-clamp-1 block text-sm font-semibold">
                  {{ item.name }}
                </text>
                <text class="mt-1 block text-xs text-slate-400">
                  {{ item.spec }}
                </text>
                <view class="mt-2 flex items-end justify-between">
                  <text class="text-sm text-slate-900 font-bold">
                    ￥{{ item.price.toFixed(2) }}
                  </text>
                  <text class="text-xs text-slate-400">
                    x{{ item.quantity }}
                  </text>
                </view>
              </view>
            </view>
          </view>

          <view v-if="order.count > 2" class="px-4 text-xs text-slate-400">
            还有 {{ order.count - 2 }} 件商品
          </view>

          <view class="px-4 py-4">
            <view class="flex items-center justify-end text-xs text-slate-500">
              <text>
                共 {{ order.count }} 件商品 合计
                <text class="ml-1 text-base text-slate-900 font-bold">￥{{ order.total.toFixed(2) }}</text>
              </text>
            </view>
          </view>

          <view class="flex flex-wrap justify-end gap-2 border-t border-[#efb239]/8 bg-[#faf9f7] px-4 py-3">
            <view v-if="order.status === 'pending'"
              class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs text-slate-600 font-bold"
              @click.stop="cancelOrder(order.id)">
              取消订单
            </view>
            <view v-if="order.status === 'pending'"
              class="rounded-lg bg-[#efb239] px-5 py-2 text-xs text-slate-900 font-bold"
              @click.stop="payOrder(order.id)">
              去支付
            </view>
            <view v-if="order.status === 'receiving'"
              class="rounded-lg border border-[#efb239]/20 bg-[#efb239]/20 px-4 py-2 text-xs text-[#c98500] font-bold"
              @click.stop>
              查看物流
            </view>
            <view v-if="order.status === 'receiving'"
              class="rounded-lg bg-[#efb239] px-5 py-2 text-xs text-slate-900 font-bold"
              @click.stop="confirmReceive(order.id)">
              确认收货
            </view>
            <view v-if="order.status === 'completed'"
              class="rounded-lg bg-[#efb239]/10 px-4 py-2 text-xs text-[#c98500] font-bold"
              @click.stop="buyAgain(order)">
              再次购买
            </view>
            <view v-if="order.status === 'completed'"
              class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs text-slate-600 font-bold"
              @click.stop>
              评价商品
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<style scoped>
.orders-page {
  background:
    linear-gradient(180deg, #f8f7f6 0%, #f8f7f6 24%, #f2eee7 100%);
}

.order-card {
  box-shadow: 0 12px 26px rgba(15, 23, 42, 0.05);
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}

.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
