<script setup lang="ts">
/**
 * 订单列表页面 - 参考 Stitch 设计稿
 */
import PullLoadContainer from '@/components/common/PullLoadContainer.vue'

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
const toast = useToast()
const { confirm } = useGlobalMessage()
const { topAreaHeight, safeAreaInsetsBottom } = usePlatform()

const DEFAULT_ORDER_STATUS_TABS_HEIGHT = 60

const statusTabs = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待付款' },
  { key: 'shipping', label: '待发货' },
  { key: 'receiving', label: '待收货' },
  { key: 'completed', label: '已完成' },
  { key: 'cancelled', label: '已取消' },
]

const activeStatus = ref('all')
const loading = ref(false)
const loadingMore = ref(false)
const page = ref(1)
const pageSize = 10
const hasMore = ref(true)
const orders = ref<any[]>([])
const currentTime = ref(Date.now())
const countdownTimer = ref<ReturnType<typeof setInterval> | null>(null)
const statusTabsHeight = ref(DEFAULT_ORDER_STATUS_TABS_HEIGHT)

const pageContentHeight = computed(() => {
  return `calc(100vh - ${topAreaHeight}px - ${safeAreaInsetsBottom}px)`
})

const listAreaStyle = computed(() => ({
  height: `calc(${pageContentHeight.value} - ${statusTabsHeight.value}px)`,
}))

function measureStatusTabsHeight() {
  nextTick(() => {
    const query = uni.createSelectorQuery()
    query
      .select('.order-list-tabs')
      .boundingClientRect((rect) => {
        if (rect?.height) {
          statusTabsHeight.value = Math.ceil(rect.height)
        }
      })
      .exec()
  })
}

function isExpiredUnpaidOrder(order: any) {
  if (order.payStatus !== 'UNPAID' || order.payDate || order.status === 'COMPLETED') {
    return false
  }

  if (!order.expireAt) {
    return false
  }

  const expireAt = new Date(order.expireAt).getTime()
  return !Number.isNaN(expireAt) && expireAt <= Date.now()
}

function formatSpecs(specs: Record<string, string>) {
  const entries = Object.entries(specs || {})
  if (!entries.length)
    return '默认规格'
  return entries.map(([key, value]) => `${key}: ${value}`).join(' / ')
}

function formatDateTime(value?: string | null) {
  if (!value)
    return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime()))
    return String(value)
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mi = String(date.getMinutes()).padStart(2, '0')
  const ss = String(date.getSeconds()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`
}

function resolveOrderStatus(order: any) {
  if (isExpiredUnpaidOrder(order))
    return { key: 'expired', label: '已超时' }
  if (order.status === 'REFUNDING' || order.payStatus === 'REFUNDING')
    return { key: 'cancelled', label: '退款中' }
  if (order.status === 'REFUNDED' || order.payStatus === 'REFUNDED')
    return { key: 'cancelled', label: '已退款' }
  if (order.status === 'CANCELLED')
    return { key: 'cancelled', label: '已取消' }
  if (order.status === 'COMPLETED')
    return { key: 'completed', label: '已完成' }
  if (order.shipStatus === 'RECEIVED')
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
    rawStatus: order.status || '',
    rawPayStatus: order.payStatus || '',
    orderDate: order.orderDate || '',
    total: Number(order.payable || 0),
    count: Number(order.itemCount || 0),
    expireAt: order.expireAt || '',
    hasPendingReview: Boolean(order.hasPendingReview),
    pendingReviewItemCount: Number(order.pendingReviewItemCount || 0),
    items: (order.items || []).map((item: any, index: number) => ({
      id: `${order.id}-${item.skuId}-${index}`,
      orderItemId: Number(item.orderItemId || 0),
      productId: Number(item.productId || 0),
      skuId: Number(item.skuId || 0),
      name: item.productName || '未命名商品',
      spec: formatSpecs(item.specs || {}),
      price: Number(item.price || 0),
      quantity: Number(item.quantity || 0),
      image: item.image || '',
      reviewed: Boolean(item.reviewed),
      canReview: Boolean(item.canReview),
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

async function loadOrders(options: { reset?: boolean, append?: boolean, silent?: boolean } = {}) {
  const { reset = false, append = false, silent = false } = options

  if (reset) {
    page.value = 1
    hasMore.value = true
  }

  if (!hasMore.value && append) {
    return
  }

  if (append) {
    loadingMore.value = true
  }
  else if (!silent) {
    loading.value = true
  }

  try {
    const response = await (Apis.general as any).MallOrdersController_findOrders({
      params: {
        status: activeStatus.value === 'all' ? undefined : activeStatus.value,
        page: page.value,
        pageSize,
      },
    }).send()
    const list = Array.isArray(response?.data) ? response.data : []
    const normalized = list.map(normalizeOrder)
    const totalPages = Number(response?.meta?.totalPages || 0)

    orders.value = append ? [...orders.value, ...normalized] : normalized
    hasMore.value = totalPages > page.value

    if (hasMore.value) {
      page.value += 1
    }
  }
  catch {
    if (!append) {
      orders.value = []
    }
    hasMore.value = false
  }
  finally {
    if (append) {
      loadingMore.value = false
    }
    else if (!silent) {
      loading.value = false
    }
  }
}

async function handleRefresh(ctx?: { done: () => void }) {
  try {
    await loadOrders({ reset: true })
  }
  finally {
    ctx?.done()
  }
}

async function handleLoadMore(ctx?: { done: () => void }) {
  try {
    await loadOrders({ append: true, silent: true })
  }
  finally {
    ctx?.done()
  }
}

const filteredOrders = computed(() => orders.value)

function canDeleteOrder(order: { status: string, rawPayStatus?: string }) {
  if (order.status === 'completed' || order.status === 'expired') {
    return true
  }

  if (order.status !== 'cancelled') {
    return false
  }

  return order.rawPayStatus !== 'REFUNDING'
}

function statusToneStyle(status: string) {
  if (status === 'pending')
    return { color: '#b7791f' }
  if (status === 'completed' || status === 'cancelled' || status === 'expired')
    return { color: '#94a3b8' }
  return { color: '#efb239' }
}

function headerToneStyle(status: string) {
  if (status === 'completed' || status === 'cancelled' || status === 'expired')
    return { background: '#f1f5f9' }
  if (status === 'pending')
    return { background: '#fff7e8' }
  return { background: 'rgba(239, 178, 57, 0.08)' }
}

function orderMetaToneStyle(status: string) {
  if (status === 'pending')
    return { color: '#9a6b12' }
  return { color: '#94a3b8' }
}

function countdownToneStyle(status: string) {
  if (status === 'pending')
    return { color: '#c98500' }
  return { color: '#94a3b8' }
}

function syncActiveStatus(rawStatus?: string | null) {
  const status = String(rawStatus || 'all')
  const valid = statusTabs.some(tab => tab.key === status)
  activeStatus.value = valid ? status : 'all'
}

onLoad((options) => {
  syncActiveStatus(options?.status ? String(options.status) : 'all')
  measureStatusTabsHeight()
  countdownTimer.value = setInterval(() => {
    currentTime.value = Date.now()
  }, 1000)
  loadOrders({ reset: true })
})

onShow(() => {
  measureStatusTabsHeight()
  loadOrders({ reset: true, silent: true })
})

onUnload(() => {
  if (countdownTimer.value) {
    clearInterval(countdownTimer.value)
  }
})

function switchStatus(key: string) {
  activeStatus.value = key
  measureStatusTabsHeight()
  loadOrders({ reset: true })
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
  confirm({
    title: '确认取消订单',
    msg: '取消后订单将关闭，是否继续？',
    confirmButtonText: '确认取消',
    cancelButtonText: '再想想',
    success: async (res) => {
      if (res.action !== 'confirm') {
        return
      }
      try {
        const result = await alovaInstance.Patch(`/mall/orders/${orderId}/cancel`, {}).send() as any
        const toastTitle = result?.payStatus === 'REFUNDING'
          ? '取消成功，退款处理中'
          : result?.payStatus === 'REFUNDED'
            ? '订单已取消并退款'
            : '订单已取消'
        toast.success(toastTitle)
        loadOrders({ reset: true, silent: true })
      }
      catch {
      }
    },
  })
}

async function confirmReceive(orderId: number) {
  try {
    await alovaInstance.Patch(`/mall/orders/${orderId}/receive`, {}).send()
    toast.success('已确认收货')
    loadOrders({ reset: true, silent: true })
  }
  catch {
  }
}

async function deleteOrder(orderId: number) {
  confirm({
    title: '删除订单',
    msg: '删除后订单记录将无法恢复，是否继续？',
    confirmButtonText: '确认删除',
    cancelButtonText: '取消',
    success: async (res) => {
      if (res.action !== 'confirm') {
        return
      }
      try {
        await alovaInstance.Delete(`/mall/orders/${orderId}`).send()
        toast.success('订单已删除')
        loadOrders({ reset: true, silent: true })
      }
      catch {
      }
    },
  })
}

function buyAgain(order: typeof orders.value[number]) {
  const firstItem = order.items[0]
  if (!firstItem?.productId)
    return

  router.push({
    name: 'product-detail',
    params: {
      id: String(firstItem.productId),
    },
  })
}

function reviewOrder(orderId: number) {
  router.push({
    name: 'order-review',
    params: {
      id: String(orderId),
    },
  })
}
</script>

<template>
  <view class="orders-page flex flex-col overflow-hidden text-slate-900" :style="{ height: pageContentHeight }">
    <view class="order-list-tabs z-40 border-b border-[#efb239]/10 bg-white/92 px-4 pt-4 backdrop-blur-md">
      <scroll-view scroll-x class="no-scrollbar whitespace-nowrap">
        <view class="flex gap-7">
          <view
            v-for="tab in statusTabs" :key="tab.key" class="border-b-[3px] px-0.5 pb-3 pt-1 text-sm font-semibold"
            :class="activeStatus === tab.key ? 'border-[#efb239] text-[#efb239]' : 'border-transparent text-slate-500'"
            @click="switchStatus(tab.key)"
          >
            {{ tab.label }}
          </view>
        </view>
      </scroll-view>
    </view>

    <view class="min-h-0 flex-1 overflow-hidden" :style="listAreaStyle">
      <PullLoadContainer
        class="h-full"
        :loading-more="loadingMore"
        :has-more="hasMore"
        @refresh="handleRefresh"
        @load-more="handleLoadMore"
      >
        <view class="px-4 pt-4">
          <view v-if="!filteredOrders.length" class="py-12 text-center text-sm text-slate-400">
            暂无订单
          </view>
          <template v-else>
            <view
              v-for="order in filteredOrders" :key="order.id"
              class="order-card mb-4 overflow-hidden border border-[#efb239]/8 rounded-2xl bg-white"
              @click="openDetail(order.id)"
            >
              <view
                class="flex items-center justify-between border-b border-[#efb239]/8 px-4 py-3.5"
                :style="headerToneStyle(order.status)"
              >
                <view class="flex flex-col gap-1">
                  <text class="text-xs font-medium" :style="orderMetaToneStyle(order.status)">
                    订单号 {{ order.no }}
                  </text>
                  <text class="text-[11px]" :style="orderMetaToneStyle(order.status)">
                    下单时间 {{ formatDateTime(order.orderDate).slice(0, 16) || '-' }}
                  </text>
                  <text
                    v-if="order.status === 'pending' && order.expireAt"
                    class="text-[11px] font-medium"
                    :style="countdownToneStyle(order.status)"
                  >
                    支付剩余 {{ formatCountdown(order.expireAt) }}
                  </text>
                </view>
                <text class="text-sm font-bold" :style="statusToneStyle(order.status)">
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
                    <text class="ml-1 text-base text-slate-900 font-bold">
                      ￥{{ order.total.toFixed(2) }}
                    </text>
                  </text>
                </view>
              </view>

              <view class="flex flex-wrap justify-end gap-2 border-t border-[#efb239]/8 bg-[#faf9f7] px-4 py-3">
                <view
                  v-if="order.status === 'pending' || order.status === 'shipping'"
                  class="border border-slate-200 rounded-lg bg-white px-4 py-2 text-xs text-slate-600 font-bold"
                  @click.stop="cancelOrder(order.id)"
                >
                  取消订单
                </view>
                <view
                  v-if="order.status === 'pending'"
                  class="rounded-lg bg-[#efb239] px-5 py-2 text-xs text-slate-900 font-bold"
                  @click.stop="payOrder(order.id)"
                >
                  去支付
                </view>
                <view
                  v-if="order.status === 'receiving'"
                  class="border border-[#d8c29a] rounded-lg bg-[#fffaf0] px-4 py-2 text-xs text-[#8a6320] font-bold"
                  @click.stop
                >
                  查看物流
                </view>
                <view
                  v-if="order.status === 'receiving'"
                  class="rounded-lg bg-[#efb239] px-5 py-2 text-xs text-slate-900 font-bold"
                  @click.stop="confirmReceive(order.id)"
                >
                  确认收货
                </view>
                <view
                  v-if="order.status === 'completed'"
                  class="border border-[#ead7b5] rounded-lg bg-[#fffaf2] px-4 py-2 text-xs text-[#8a6320] font-bold"
                  @click.stop="buyAgain(order)"
                >
                  再次购买
                </view>
                <view
                  v-if="order.status === 'completed' && order.hasPendingReview"
                  class="border border-slate-200 rounded-lg bg-white px-4 py-2 text-xs text-slate-600 font-bold"
                  @click.stop="reviewOrder(order.id)"
                >
                  {{ order.pendingReviewItemCount > 1 ? `评价商品 (${order.pendingReviewItemCount})` : '评价商品' }}
                </view>
                <view
                  v-if="canDeleteOrder(order)"
                  class="border border-slate-200 rounded-full border-solid bg-white px-4 py-2 text-xs text-slate-700 font-semibold"
                  @click.stop="deleteOrder(order.id)"
                >
                  删除订单
                </view>
              </view>
            </view>
          </template>
        </view>
        <template #loadMore="{ loadingMore: slotLoadingMore, hasMore: slotHasMore }">
          <view v-if="filteredOrders.length > 0" class="pb-8 text-center text-xs text-slate-400">
            {{ slotLoadingMore ? '正在加载更多...' : slotHasMore ? '上拉加载更多' : '没有更多了' }}
          </view>
        </template>
      </PullLoadContainer>
    </view>
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
