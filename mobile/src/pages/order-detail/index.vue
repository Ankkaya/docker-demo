<script setup lang="ts">
/**
 * 订单详情页面 - 参考 Stitch 设计稿
 */

type MallOrderDetail = any
type MallOrderItem = any
type MallPaymentMethod = 'WECHAT' | 'CREDIT' | 'BANK'

definePage({
  name: 'order-detail',
  layout: 'default',
  style: {
    navigationBarTitleText: '订单详情',
    navigationStyle: 'custom',
  },
})

const router = useRouter()
const routeOrderId = ref(0)
const loading = ref(false)
const loadError = ref('')
const paymentPopupVisible = ref(false)
const paying = ref(false)
const remainingSeconds = ref(0)
const timer = ref<ReturnType<typeof setInterval> | null>(null)
const selectedPayment = ref('wechat')
const orderDetail = ref<MallOrderDetail | null>(null)

type OrderViewStatus = '待付款' | '待发货' | '待收货' | '已完成' | '已取消' | '已超时'

interface OrderViewItem {
  id: string
  productId: number
  name: string
  spec: string
  price: number
  qty: number
  amount: number
  image: string
}

interface OrderViewTimelineItem {
  time?: string
  text: string
}

interface OrderViewLogistics {
  company: string
  trackingNo: string
  status: string
}

const paymentMethods = [
  {
    key: 'wechat',
    name: '微信支付',
    desc: '快速安全支付',
    iconClass: 'i-material-symbols:account-balance-wallet',
    iconToneClass: 'bg-emerald-50 text-emerald-500',
  },
  {
    key: 'balance',
    name: '余额支付',
    desc: '余额优先扣款',
    iconClass: 'i-material-symbols:savings',
    iconToneClass: 'bg-orange-50 text-[#efb239]',
  },
  {
    key: 'card',
    name: '银行卡支付',
    desc: '支持银行卡快捷支付',
    iconClass: 'i-material-symbols:credit-card',
    iconToneClass: 'bg-blue-50 text-blue-500',
  },
]

const formattedTimer = computed(() => {
  const minutes = Math.floor(remainingSeconds.value / 60)
  const seconds = remainingSeconds.value % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
})

const statusIconMap: Record<string, string> = {
  待付款: 'i-material-symbols:account-balance-wallet',
  待发货: 'i-material-symbols:package-2',
  待收货: 'i-material-symbols:local-shipping',
  已完成: 'i-material-symbols:task-alt',
  已取消: 'i-material-symbols:cancel',
  已超时: 'i-material-symbols:timer-off',
}

function getOrderDetailIconClass(name: string) {
  const map: Record<string, string> = {
    back: 'i-material-symbols:arrow-back',
    support: 'i-material-symbols:support-agent',
    fallback: 'i-material-symbols:receipt',
    address: 'i-material-symbols:location-on',
    shipping: 'i-material-symbols:local-shipping',
    goods: 'i-material-symbols:shopping-bag',
    receipt: 'i-material-symbols:receipt',
  }
  return map[name] || ''
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

function maskPhone(phone: string) {
  if (!/^1\d{10}$/.test(phone))
    return phone
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`
}

function formatSpecs(specs: Record<string, string> | Array<{ name?: string, value?: string }>) {
  if (Array.isArray(specs)) {
    const values = specs
      .map((item) => {
        if (!item?.name || !item?.value) {
          return ''
        }
        return `${item.name}: ${item.value}`
      })
      .filter(Boolean)

    return values.length ? values.join(' / ') : '默认规格'
  }

  const entries = Object.entries(specs || {})
  if (!entries.length)
    return '默认规格'
  return entries.map(([key, value]) => `${key}: ${value}`).join(' / ')
}

function resolvePaymentMethodLabel(value?: string | null) {
  if (value === 'WECHAT')
    return '微信支付'
  if (value === 'ALIPAY')
    return '支付宝'
  if (value === 'BANK')
    return '银行卡'
  if (value === 'CREDIT')
    return '余额支付'
  if (value === 'CASH')
    return '现金支付'
  return '待支付'
}

function isExpiredUnpaidOrder(detail: MallOrderDetail) {
  if (detail.status !== 'CANCELLED' || detail.payStatus !== 'UNPAID' || detail.payDate) {
    return false
  }

  if (!detail.expireAt) {
    return false
  }

  const expireAt = new Date(detail.expireAt).getTime()
  return !Number.isNaN(expireAt) && expireAt <= Date.now()
}

function resolveOrderStatus(detail: MallOrderDetail): OrderViewStatus {
  if (isExpiredUnpaidOrder(detail))
    return '已超时'
  if (detail.status === 'CANCELLED')
    return '已取消'
  if (detail.status === 'COMPLETED')
    return '已完成'
  if (detail.shipStatus === 'SHIPPED' || detail.shipStatus === 'RECEIVED')
    return '待收货'
  if (detail.payStatus === 'PAID')
    return '待发货'
  return '待付款'
}

function resolveStatusDesc(detail: MallOrderDetail, statusLabel: OrderViewStatus) {
  if (statusLabel === '待付款')
    return detail.expireAt && remainingSeconds.value > 0 ? `请在 ${formattedTimer.value} 内完成支付` : '订单待支付'
  if (statusLabel === '已超时')
    return detail.expireAt ? `订单已于 ${formatDateTime(detail.expireAt)} 支付超时关闭` : '订单支付超时，已自动关闭'
  if (statusLabel === '待发货')
    return '商家正在备货，请耐心等待'
  if (statusLabel === '待收货')
    return '包裹已经发出，记得及时签收'
  if (statusLabel === '已取消')
    return '订单已取消，可返回继续挑选商品'
  return '订单已完成，期待你再次光临'
}

function resolveLogistics(detail: MallOrderDetail, statusLabel: OrderViewStatus): OrderViewLogistics {
  if (statusLabel === '待收货') {
    return {
      company: '平台配送',
      trackingNo: detail.shipDate ? '已发货' : '配送中',
      status: detail.shipDate ? `发货时间 ${formatDateTime(detail.shipDate).slice(5, 16)}` : '包裹运输中',
    }
  }

  if (statusLabel === '待发货') {
    return {
      company: '平台配送',
      trackingNo: '待出库',
      status: '商家备货中',
    }
  }

  if (statusLabel === '已完成') {
    return {
      company: '平台配送',
      trackingNo: '已签收',
      status: detail.receiveDate ? `签收时间 ${formatDateTime(detail.receiveDate).slice(5, 16)}` : '订单已完成',
    }
  }

  if (statusLabel === '已超时') {
    return {
      company: '平台配送',
      trackingNo: '订单关闭',
      status: '订单支付超时',
    }
  }

  if (statusLabel === '已取消') {
    return {
      company: '平台配送',
      trackingNo: '订单关闭',
      status: '订单已取消',
    }
  }

  return {
    company: '平台配送',
    trackingNo: '待支付',
    status: '等待付款',
  }
}

function syncCountdownByExpireAt(expireAt?: string | null) {
  if (!expireAt) {
    remainingSeconds.value = 0
    return
  }

  remainingSeconds.value = Math.max(0, Math.floor((new Date(expireAt).getTime() - Date.now()) / 1000))
}

function startCountdown() {
  if (timer.value) {
    clearInterval(timer.value)
  }

  timer.value = setInterval(() => {
    if (remainingSeconds.value <= 0) {
      if (timer.value)
        clearInterval(timer.value)
      return
    }
    remainingSeconds.value -= 1
  }, 1000)
}

function resolveTimeline(detail: MallOrderDetail, statusLabel: OrderViewStatus): OrderViewTimelineItem[] {
  const list: OrderViewTimelineItem[] = [
    {
      time: formatDateTime(detail.orderDate).slice(0, 16),
      text: '订单提交成功',
    },
  ]

  if (statusLabel === '待付款') {
    list.push({
      time: detail.expireAt ? formatDateTime(detail.expireAt).slice(0, 16) : formatDateTime(detail.orderDate).slice(0, 16),
      text: remainingSeconds.value > 0 ? '支付截止时间' : '支付超时',
    })
    return list
  }

  if (statusLabel === '已超时') {
    list.push({
      time: detail.expireAt ? formatDateTime(detail.expireAt).slice(0, 16) : formatDateTime(detail.orderDate).slice(0, 16),
      text: '支付超时，订单已关闭',
    })
    return list
  }

  if (detail.payDate) {
    list.push({
      time: formatDateTime(detail.payDate).slice(0, 16),
      text: '支付成功',
    })
  }

  if (statusLabel === '待发货') {
    list.push({
      text: '商家备货中',
    })
  }

  if (detail.shipDate) {
    list.push({
      time: formatDateTime(detail.shipDate).slice(0, 16),
      text: '商品已发货',
    })
  }

  if (detail.receiveDate) {
    list.push({
      time: formatDateTime(detail.receiveDate).slice(0, 16),
      text: '订单已完成',
    })
  }

  if (statusLabel === '已取消') {
    list.push({
      time: detail.cancelDate ? formatDateTime(detail.cancelDate).slice(0, 16) : undefined,
      text: '订单已取消',
    })
  }

  return list
}

function normalizeOrder(detail: MallOrderDetail) {
  const statusLabel = resolveOrderStatus(detail)
  orderDetail.value = detail
  syncCountdownByExpireAt(detail.expireAt)
  if (statusLabel === '待付款' && remainingSeconds.value > 0)
    startCountdown()
  else if (timer.value)
    clearInterval(timer.value)
}

async function loadOrder() {
  if (!routeOrderId.value)
    return

  loading.value = true
  loadError.value = ''
  try {
    const detail = await (Apis.general as any).MallOrdersController_findOrderDetail({
      pathParams: { id: routeOrderId.value },
    }).send()
    normalizeOrder(detail)
  }
  catch (error: any) {
    orderDetail.value = null
    loadError.value = error?.message || '加载订单失败'
    uni.showToast({ title: loadError.value, icon: 'none' })
  }
  finally {
    loading.value = false
  }
}

onLoad((options) => {
  routeOrderId.value = Number(options?.id || 0)
  if (!routeOrderId.value) {
    loadError.value = '缺少订单ID'
    return
  }
  loadOrder()
})

function goBack() {
  router.back()
}

function contactService() {
  uni.showToast({ title: '联系客服开发中', icon: 'none' })
}

function openProduct(item: OrderViewItem) {
  if (!item.productId)
    return

  router.push({
    name: 'product-detail',
    params: {
      id: String(item.productId),
    },
  })
}

function openPaymentPopup() {
  if (orderStatusLabel.value !== '待付款')
    return

  syncCountdownByExpireAt(orderDetail.value?.expireAt)
  startCountdown()
  paymentPopupVisible.value = true
}

function resolvePaymentMethod(): MallPaymentMethod {
  if (selectedPayment.value === 'wechat')
    return 'WECHAT'
  if (selectedPayment.value === 'balance')
    return 'CREDIT'
  return 'BANK'
}

async function payNow() {
  if (orderStatusLabel.value === '待收货') {
    try {
      await alovaInstance.Patch(`/mall/orders/${routeOrderId.value}/receive`, {}).send()
      uni.showToast({ title: '已确认收货', icon: 'success' })
      loadOrder()
    }
    catch (error: any) {
      uni.showToast({ title: error?.message || '确认收货失败', icon: 'none' })
    }
    return
  }

  if (orderStatusLabel.value === '待发货') {
    uni.showToast({ title: '已提醒商家发货', icon: 'none' })
    return
  }

  if (!routeOrderId.value)
    return

  paying.value = true
  try {
    await (Apis.general as any).MallOrdersController_payOrder({
      pathParams: { id: routeOrderId.value },
      data: { method: resolvePaymentMethod() },
    }).send()
    paymentPopupVisible.value = false
    uni.showToast({ title: '支付成功', icon: 'success' })
    await loadOrder()
  }
  catch (error: any) {
    uni.showToast({ title: error?.message || '支付失败', icon: 'none' })
  }
  finally {
    paying.value = false
  }
}

async function cancelOrder() {
  if (orderStatusLabel.value === '待收货') {
    uni.showToast({ title: '售后申请已提交', icon: 'success' })
    return
  }

  try {
    await alovaInstance.Patch(`/mall/orders/${routeOrderId.value}/cancel`, {}).send()
    uni.showToast({ title: '订单已取消', icon: 'none' })
    loadOrder()
  }
  catch (error: any) {
    uni.showToast({ title: error?.message || '取消订单失败', icon: 'none' })
  }
}

const orderStatusLabel = computed<OrderViewStatus>(() => {
  if (!orderDetail.value) {
    return '待付款'
  }
  return resolveOrderStatus(orderDetail.value)
})

const orderItems = computed<OrderViewItem[]>(() => {
  if (!orderDetail.value) {
    return []
  }

  return (orderDetail.value.items || []).map((item: MallOrderItem, index: number) => ({
    id: `${orderDetail.value?.id}-${item.skuId}-${index}`,
    productId: Number(item.productId || 0),
    name: item.productName || '未命名商品',
    spec: formatSpecs(item.specs || {}),
    price: Number(item.price || 0),
    qty: Number(item.quantity || 0),
    amount: Number(item.amount || 0),
    image: item.image || '',
  }))
})

const orderLogistics = computed<OrderViewLogistics>(() => {
  if (!orderDetail.value) {
    return {
      company: '平台配送',
      trackingNo: '-',
      status: '-',
    }
  }
  return resolveLogistics(orderDetail.value, orderStatusLabel.value)
})

const orderTimeline = computed<OrderViewTimelineItem[]>(() => {
  if (!orderDetail.value) {
    return []
  }
  return resolveTimeline(orderDetail.value, orderStatusLabel.value)
})

const orderStatusDesc = computed(() => {
  if (!orderDetail.value) {
    return ''
  }
  return resolveStatusDesc(orderDetail.value, orderStatusLabel.value)
})

const orderSummary = computed(() => ({
  subtotal: Number(orderDetail.value?.totalAmount || 0),
  discount: Number(orderDetail.value?.discount || 0),
  freight: Number(orderDetail.value?.freight || 0),
  total: Number(orderDetail.value?.payable || 0),
  paid: Number(orderDetail.value?.paid || 0),
}))

const orderInfoRows = computed(() => {
  if (!orderDetail.value) {
    return []
  }

  return [
    { label: '订单编号', value: orderDetail.value.orderNo || '-' },
    { label: '下单时间', value: formatDateTime(orderDetail.value.orderDate) || '-' },
    { label: '支付方式', value: resolvePaymentMethodLabel(orderDetail.value.paymentMethod) },
    { label: '支付时间', value: orderDetail.value.payDate ? formatDateTime(orderDetail.value.payDate) : '-' },
    { label: '取消时间', value: orderDetail.value.cancelDate ? formatDateTime(orderDetail.value.cancelDate) : '-' },
    { label: '发货时间', value: orderDetail.value.shipDate ? formatDateTime(orderDetail.value.shipDate) : '-' },
    { label: '收货时间', value: orderDetail.value.receiveDate ? formatDateTime(orderDetail.value.receiveDate) : '-' },
    { label: '订单状态', value: orderStatusLabel.value },
  ]
})

const showBottomActions = computed(() =>
  Boolean(orderDetail.value) && orderStatusLabel.value !== '已取消' && orderStatusLabel.value !== '已完成',
)

const primaryActionLabel = computed(() => {
  if (orderStatusLabel.value === '已超时')
    return ''
  if (orderStatusLabel.value === '待付款')
    return '立即支付'
  if (orderStatusLabel.value === '待发货')
    return '提醒发货'
  return '确认收货'
})

const secondaryActionLabel = computed(() => (
  orderStatusLabel.value === '待收货'
    ? '申请售后'
    : orderStatusLabel.value === '已超时'
      ? '删除订单'
      : '取消订单'
))

onUnload(() => {
  if (timer.value) {
    clearInterval(timer.value)
  }
})
</script>

<template>
  <view class="order-detail-page text-slate-900">
    <scroll-view scroll-y class="pb-28">
      <view class="px-4 pt-4">
        <view v-if="loading" class="py-12 text-center text-sm text-slate-400">
          正在加载订单...
        </view>
        <view v-else-if="loadError" class="card-shell rounded-[28px] bg-white px-5 py-10 text-center">
          <text class="block text-sm text-slate-500">
            {{ loadError }}
          </text>
          <view
            class="mt-4 inline-flex rounded-full bg-[#efb239] px-5 py-2 text-sm text-white font-semibold"
            @click="loadOrder"
          >
            重新加载
          </view>
        </view>
        <template v-else-if="orderDetail">
          <view class="status-panel rounded-[28px] p-5">
            <view class="flex items-center justify-between">
              <view>
                <text class="text-[22px] text-slate-900 font-bold">
                  {{ orderStatusLabel }}
                </text>
                <text class="mt-2 block max-w-[480rpx] text-xs text-slate-600 leading-5">
                  {{ orderStatusDesc }}
                </text>
              </view>
              <view
                class="size-14 flex items-center justify-center rounded-3xl bg-[#efb239] shadow-[0_10px_20px_rgba(239,178,57,0.24)]"
              >
                <text
                  class="text-[26px] text-white leading-none"
                  :class="statusIconMap[orderStatusLabel] || getOrderDetailIconClass('fallback')"
                />
              </view>
            </view>

            <view class="mt-5">
              <view
                v-for="(item, index) in orderTimeline" :key="`${item.text}-${index}`"
                class="grid grid-cols-[26px_1fr] gap-x-3"
              >
                <view class="flex flex-col items-center">
                  <view class="size-3 border-2 border-[#efb239] rounded-full bg-white" />
                  <view v-if="index !== orderTimeline.length - 1" class="mt-1 h-8 w-px bg-[#efb239]/30" />
                </view>
                <view class="pb-4">
                  <text class="block text-sm text-slate-800 font-semibold">
                    {{ item.text }}
                  </text>
                  <text v-if="item.time" class="mt-1 block text-xs text-slate-500">
                    {{ item.time }}
                  </text>
                </view>
              </view>
            </view>
          </view>

          <view class="card-shell mt-4 rounded-2xl bg-white p-4">
            <view class="flex gap-2">
              <view class="size-5 flex rounded-2xl">
                <text class="text-[20px] text-[#efb239] leading-none" :class="getOrderDetailIconClass('address')" />
              </view>
              <view class="min-w-0 flex-1">
                <view class="text-sm font-semibold">
                  收货信息
                </view>
                <view class="mt-3 flex items-center gap-3 text-sm">
                  <text class="font-semibold">
                    {{ orderDetail.receiverName || '-' }}
                  </text>
                  <text class="text-slate-400">
                    {{ maskPhone(orderDetail.receiverPhone || '') }}
                  </text>
                </view>
                <text class="mt-2 block text-sm text-slate-600 leading-6">
                  {{ orderDetail.receiverAddress || '-' }}
                </text>
              </view>
            </view>
          </view>

          <view class="card-shell mt-4 rounded-2xl bg-white p-4">
            <view class="flex gap-2">
              <view class="size-5 flex rounded-2xl">
                <text class="text-[20px] text-[#efb239] leading-none" :class="getOrderDetailIconClass('shipping')" />
              </view>
              <view class="min-w-0 flex-1">
                <view class="text-sm font-semibold">
                  配送信息
                </view>
                <view class="mt-3 text-sm text-slate-700 font-medium">
                  {{ orderLogistics.company }} · {{ orderLogistics.trackingNo }}
                </view>
                <text class="mt-1 block text-xs text-slate-400">
                  {{ orderLogistics.status }}
                </text>
              </view>
            </view>
          </view>

          <view class="card-shell mt-4 rounded-2xl bg-white p-4">
            <view class="flex items-center gap-2 text-sm font-semibold leading-none">
              <text class="text-[20px] text-[#efb239] leading-none" :class="getOrderDetailIconClass('goods')" />
              商品信息
            </view>
            <view class="mt-4 flex flex-col gap-4">
              <view v-for="item in orderItems" :key="item.id" class="flex gap-3" @click="openProduct(item)">
                <image :src="item.image" class="size-20 rounded-xl bg-[#f5efe5]" mode="aspectFill" />
                <view class="min-w-0 flex flex-1 items-center justify-between gap-3">
                  <view class="min-w-0 flex-1">
                    <text class="line-clamp-2 block text-sm font-semibold">
                      {{ item.name }}
                    </text>
                    <text class="mt-1 block text-xs text-slate-400">
                      {{ item.spec }}
                    </text>
                    <view class="mt-2">
                      <text class="text-sm text-[#efb239] font-bold">
                        ￥{{ item.price.toFixed(2) }}
                      </text>
                    </view>
                  </view>
                  <text class="shrink-0 self-center text-right text-xs text-slate-400">
                    x{{ item.qty }}
                  </text>
                </view>
              </view>
            </view>
          </view>

          <view class="summary-shell mt-4 rounded-2xl px-4 py-4">
            <view class="flex items-center justify-between text-sm text-slate-600">
              <text>商品小计</text>
              <text>￥{{ orderSummary.subtotal.toFixed(2) }}</text>
            </view>
            <view class="mt-2 flex items-center justify-between text-sm text-slate-600">
              <text>优惠</text>
              <text>-￥{{ orderSummary.discount.toFixed(2) }}</text>
            </view>
            <view class="mt-2 flex items-center justify-between text-sm text-slate-600">
              <text>运费</text>
              <text>￥{{ orderSummary.freight.toFixed(2) }}</text>
            </view>
            <view class="mt-2 flex items-center justify-between text-sm text-slate-600">
              <text>已支付</text>
              <text>￥{{ orderSummary.paid.toFixed(2) }}</text>
            </view>
            <view class="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-base font-semibold">
              <text>实付款</text>
              <text class="text-[22px] text-[#efb239]">
                ￥{{ orderSummary.total.toFixed(2) }}
              </text>
            </view>
          </view>

          <view class="card-shell mt-4 rounded-2xl bg-white p-4">
            <view class="flex items-center gap-2 text-sm font-semibold leading-none">
              <text class="text-[20px] text-[#efb239] leading-none" :class="getOrderDetailIconClass('receipt')" />
              订单信息
            </view>
            <view class="mt-3 flex flex-col gap-2 text-xs text-slate-500">
              <view v-for="row in orderInfoRows" :key="row.label" class="flex items-start justify-between gap-4">
                <text>{{ row.label }}</text>
                <text class="max-w-[60%] text-right text-slate-600">
                  {{ row.value }}
                </text>
              </view>
            </view>
          </view>
        </template>
        <view v-else class="card-shell rounded-[28px] bg-white px-5 py-10 text-center text-sm text-slate-500">
          暂无订单信息
        </view>
      </view>
    </scroll-view>

    <view
      v-if="showBottomActions"
      class="fixed bottom-0 left-0 right-0 z-40 flex items-center gap-3 border-t border-[#efb239]/8 bg-white/95 p-4 pb-6 backdrop-blur-md"
    >
      <view
        class="flex-1 border border-slate-200 rounded-full border-solid bg-white py-3 text-center text-sm text-slate-700 font-semibold"
        @click="cancelOrder"
      >
        {{ secondaryActionLabel }}
      </view>
      <view
        v-if="orderStatusLabel !== '已超时'"
        class="detail-action flex-[1.2] rounded-full bg-[#efb239] py-3 text-center text-sm text-slate-900 font-bold"
        @click="orderStatusLabel === '待付款' ? openPaymentPopup() : payNow()"
      >
        {{ primaryActionLabel }}
      </view>
    </view>

    <wd-popup
      v-model="paymentPopupVisible" position="bottom" safe-area-inset-bottom custom-class="order-payment-popup"
      lock-scroll root-portal :z-index="2100"
    >
      <view class="order-payment-popup__panel">
        <view class="order-payment-popup__handle" />
        <view class="order-payment-popup__title">
          订单支付
        </view>

        <view class="order-payment-popup__summary">
          <view class="order-payment-popup__timer">
            <text class="i-material-symbols:schedule text-[14px] leading-none" />
            <text>支付剩余时间 {{ formattedTimer }}</text>
          </view>
          <text class="order-payment-popup__label">
            支付金额
          </text>
          <view class="order-payment-popup__amount">
            <text class="text-2xl text-slate-900 font-bold">
              ¥
            </text>
            <text class="text-5xl text-slate-900 font-extrabold tracking-tight">
              {{ orderSummary.total.toFixed(2) }}
            </text>
          </view>
        </view>

        <view class="order-payment-popup__methods">
          <view
            v-for="item in paymentMethods" :key="item.key" class="order-payment-popup__method"
            :class="selectedPayment === item.key ? 'order-payment-popup__method--active' : 'order-payment-popup__method--idle'"
            @click="selectedPayment = item.key"
          >
            <view class="flex items-center gap-3">
              <view class="size-10 flex items-center justify-center rounded-2xl" :class="item.iconToneClass">
                <text class="text-[22px] leading-none" :class="item.iconClass" />
              </view>
              <view>
                <text class="block text-sm text-slate-900 font-semibold">
                  {{ item.name }}
                </text>
                <text class="block text-[10px] text-slate-400">
                  {{ item.desc }}
                </text>
              </view>
            </view>
            <view
              class="size-6 flex items-center justify-center border rounded-full border-solid"
              :class="selectedPayment === item.key ? 'border-[#efb239] bg-[#efb239]' : 'border-[#d6c7a1] bg-white'"
            >
              <text
                v-if="selectedPayment === item.key"
                class="i-material-symbols:check text-[16px] text-white leading-none"
              />
            </view>
          </view>
        </view>

        <view class="order-payment-popup__submit" :class="paying ? 'opacity-75' : ''" @click="payNow">
          <text>{{ paying ? '支付中...' : '立即支付' }}</text>
          <text class="text-white/80 font-normal">
            |
          </text>
          <text>¥{{ orderSummary.total.toFixed(2) }}</text>
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<style scoped>
.order-detail-page {
  background:
    linear-gradient(180deg, #f8f7f6 0%, #f8f7f6 18%, #f1ede6 100%);
}

.status-panel {
  background: linear-gradient(180deg, rgba(239, 178, 57, 0.14) 0%, rgba(239, 178, 57, 0.05) 100%);
}

.card-shell {
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
}

.summary-shell {
  background: rgba(255, 255, 255, 0.72);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
}

.detail-action {
  box-shadow: 0 14px 28px rgba(239, 178, 57, 0.22);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

:deep(.order-payment-popup) {
  border-radius: 36rpx 36rpx 0 0;
  overflow: hidden;
}

.order-payment-popup__panel {
  border-radius: 32rpx 32rpx 0 0;
  background: linear-gradient(180deg, #fffdf8 0%, #fff 42%, #fff 100%);
  padding: 20px 20px 24px;
}

.order-payment-popup__handle {
  margin: 0 auto 14px;
  height: 4px;
  width: 52px;
  border-radius: 9999px;
  background: rgba(239, 178, 57, 0.28);
}

.order-payment-popup__title {
  text-align: center;
  font-size: 18px;
  font-weight: 700;
  color: #efb239;
}

.order-payment-popup__summary {
  padding: 18px 0 10px;
  text-align: center;
}

.order-payment-popup__timer {
  margin-bottom: 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 9999px;
  background: #fff7e8;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #efb239;
}

.order-payment-popup__label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #94a3b8;
}

.order-payment-popup__amount {
  margin-top: 8px;
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
}

.order-payment-popup__methods {
  margin-top: 10px;
  display: grid;
  gap: 10px;
}

.order-payment-popup__method {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 28rpx;
  padding: 16px;
  transition: all 0.2s ease;
}

.order-payment-popup__method--active {
  border: 2px solid #efb239;
  background: #fff;
  box-shadow: 0 4px 12px rgba(239, 178, 57, 0.05);
}

.order-payment-popup__method--idle {
  border: 1px solid transparent;
  background: rgba(255, 255, 255, 0.6);
}

.order-payment-popup__submit {
  margin-top: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 9999px;
  background: #efb239;
  padding: 16px 0;
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  box-shadow: 0 18px 28px rgba(239, 178, 57, 0.24);
}
</style>
