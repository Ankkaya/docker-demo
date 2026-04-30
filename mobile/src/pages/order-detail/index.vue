<script setup lang="ts">
/**
 * 订单详情页面 - 参考 Stitch 设计稿
 */

import { useUserStore } from '@/store/userStore'

type MallOrderDetail = any
type MallOrderItem = any
type MallPaymentMethod = 'WECHAT' | 'BALANCE' | 'BANK'

definePage({
  name: 'order-detail',
  layout: 'default',
  style: {
    navigationBarTitleText: '订单详情',
    navigationStyle: 'custom',
  },
})

const router = useRouter()
const toast = useToast()
const userStore = useUserStore()
const { confirm } = useGlobalMessage()
const routeOrderId = ref(0)
const loading = ref(false)
const loadError = ref('')
const paymentPopupVisible = ref(false)
const paying = ref(false)
const remainingSeconds = ref(0)
const timer = ref<ReturnType<typeof setInterval> | null>(null)
const selectedPayment = ref('wechat')
const orderDetail = ref<MallOrderDetail | null>(null)
const balanceSummary = ref({
  availableBalance: '0.00',
})

type OrderViewStatus = '待付款' | '待发货' | '待收货' | '已完成' | '已取消' | '已超时' | '退款中' | '已退款'

interface OrderViewItem {
  id: string
  orderItemId: number
  productId: number
  name: string
  spec: string
  price: number
  qty: number
  amount: number
  image: string
  reviewed: boolean
  canReview: boolean
}

interface OrderViewTimelineItem {
  time?: string
  text: string
}

interface OrderViewLogistics {
  company: string
  companyCode: string
  trackingNo: string
  status: string
  canQuery: boolean
}

const formattedTimer = computed(() => {
  const minutes = Math.floor(remainingSeconds.value / 60)
  const seconds = remainingSeconds.value % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
})
const availableBalanceAmount = computed(() => Number(balanceSummary.value.availableBalance || 0))

const statusIconMap: Record<string, string> = {
  待付款: 'i-material-symbols:account-balance-wallet',
  待发货: 'i-material-symbols:package-2',
  待收货: 'i-material-symbols:local-shipping',
  已完成: 'i-material-symbols:task-alt',
  已取消: 'i-material-symbols:cancel',
  已超时: 'i-material-symbols:timer-off',
  退款中: 'i-material-symbols:sync',
  已退款: 'i-material-symbols:undo',
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

function formatAmount(value?: string | number | null) {
  return Number(value || 0).toFixed(2)
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
  if (value === 'BALANCE' || value === 'CREDIT')
    return '余额支付'
  if (value === 'CASH')
    return '现金支付'
  return '待支付'
}

const balancePayEnabled = computed(() => availableBalanceAmount.value >= Number(orderDetail.value?.payable || 0))

const paymentMethods = computed(() => [
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
    desc: balancePayEnabled.value
      ? `可用余额 ¥${formatAmount(balanceSummary.value.availableBalance)}`
      : `余额不足，当前 ¥${formatAmount(balanceSummary.value.availableBalance)}`,
    iconClass: 'i-material-symbols:wallet',
    iconToneClass: 'bg-amber-50 text-amber-500',
  },
])

function updateUserBalanceCache(availableBalance: string) {
  if (userStore.user?.customer) {
    userStore.user.customer.availableBalance = availableBalance
  }
}

async function loadBalanceSummary() {
  if (!userStore.isLoggedIn) {
    balanceSummary.value.availableBalance = '0.00'
    return
  }

  try {
    const data = await (Apis.general as any).MallBalanceController_getSummary({}).send()
    balanceSummary.value.availableBalance = data.availableBalance || '0.00'
    updateUserBalanceCache(balanceSummary.value.availableBalance)
  }
  catch {
    balanceSummary.value.availableBalance = userStore.user?.customer?.availableBalance || '0.00'
  }
}

function isExpiredUnpaidOrder(detail: MallOrderDetail) {
  if (detail.payStatus !== 'UNPAID' || detail.payDate || detail.status === 'COMPLETED') {
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
  if (detail.status === 'REFUNDING' || detail.payStatus === 'REFUNDING')
    return '退款中'
  if (detail.status === 'REFUNDED' || detail.payStatus === 'REFUNDED')
    return '已退款'
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
  if (statusLabel === '退款中')
    return '订单已取消，退款正在处理中'
  if (statusLabel === '已退款')
    return '订单已取消，支付金额已原路退回'
  if (statusLabel === '已取消')
    return '订单已取消，可返回继续挑选商品'
  return '订单已完成，期待你再次光临'
}

function resolveCompanyLabel(code?: string | null) {
  if (!code)
    return '平台配送'
  return KUAIDI_COMPANY_LABELS[code] || code
}

function resolveLogistics(detail: MallOrderDetail, statusLabel: OrderViewStatus): OrderViewLogistics {
  const code = detail.logisticsCompany || ''
  const trackingNo = detail.trackingNo || ''
  const hasShipped = Boolean(detail.shipDate || trackingNo)
  const company = resolveCompanyLabel(code)

  // 已发货（待收货 / 已完成）且后台已填运单号，允许跳转插件查看
  if ((statusLabel === '待收货' || statusLabel === '已完成') && trackingNo) {
    const desc = statusLabel === '已完成'
      ? (detail.receiveDate ? `签收时间 ${formatDateTime(detail.receiveDate).slice(5, 16)}` : '订单已完成')
      : (detail.shipDate ? `发货时间 ${formatDateTime(detail.shipDate).slice(5, 16)}` : '包裹运输中')
    return {
      company,
      companyCode: code,
      trackingNo,
      status: desc,
      canQuery: true,
    }
  }

  if (statusLabel === '待收货') {
    return {
      company,
      companyCode: code,
      trackingNo: hasShipped ? '已发货' : '配送中',
      status: detail.shipDate ? `发货时间 ${formatDateTime(detail.shipDate).slice(5, 16)}` : '包裹运输中',
      canQuery: false,
    }
  }

  if (statusLabel === '待发货') {
    return {
      company: '平台配送',
      companyCode: '',
      trackingNo: '待出库',
      status: '商家备货中',
      canQuery: false,
    }
  }

  if (statusLabel === '已完成') {
    return {
      company,
      companyCode: code,
      trackingNo: '已签收',
      status: detail.receiveDate ? `签收时间 ${formatDateTime(detail.receiveDate).slice(5, 16)}` : '订单已完成',
      canQuery: false,
    }
  }

  if (statusLabel === '已超时') {
    return {
      company: '平台配送',
      companyCode: '',
      trackingNo: '订单关闭',
      status: '订单支付超时',
      canQuery: false,
    }
  }

  if (statusLabel === '退款中') {
    return {
      company: '平台配送',
      companyCode: '',
      trackingNo: '退款处理中',
      status: '订单已取消，退款处理中',
      canQuery: false,
    }
  }

  if (statusLabel === '已退款') {
    return {
      company: '平台配送',
      companyCode: '',
      trackingNo: '已退款',
      status: '订单已取消并退款',
      canQuery: false,
    }
  }

  if (statusLabel === '已取消') {
    return {
      company: '平台配送',
      companyCode: '',
      trackingNo: '订单关闭',
      status: '订单已取消',
      canQuery: false,
    }
  }

  return {
    company: '平台配送',
    companyCode: '',
    trackingNo: '待支付',
    status: '等待付款',
    canQuery: false,
  }
}

// 快递100 公司编码 -> 中文名称映射（常用，完整表见 https://api.kuaidi100.com/manager/openapi/download/kdbm.do）
// 后台如果存的已是中文名称或未知编码，这里 fallback 直接展示后台值
const KUAIDI_COMPANY_LABELS: Record<string, string> = {
  shunfeng: '顺丰速运',
  yuantong: '圆通速递',
  zhongtong: '中通快递',
  shentong: '申通快递',
  yunda: '韵达快递',
  ems: 'EMS',
  youzhengguonei: '邮政快递包裹',
  jd: '京东物流',
  jtexpress: '极兔速递',
  debangkuaidi: '德邦快递',
  zhaijisong: '宅急送',
  huitongkuaidi: '百世汇通',
  tiantian: '天天快递',
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

  if (statusLabel === '退款中') {
    list.push({
      time: detail.cancelDate ? formatDateTime(detail.cancelDate).slice(0, 16) : undefined,
      text: '订单已取消，退款处理中',
    })
    return list
  }

  if (statusLabel === '已退款') {
    list.push({
      time: detail.cancelDate ? formatDateTime(detail.cancelDate).slice(0, 16) : undefined,
      text: '订单已取消并退款',
    })
    return list
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
    await loadBalanceSummary()
  }
  catch (error: any) {
    orderDetail.value = null
    loadError.value = error?.message || '加载订单失败'
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
  toast.info('联系客服开发中')
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

function goReviewOrder() {
  if (!routeOrderId.value || !orderDetail.value?.hasPendingReview) {
    return
  }

  router.push({
    name: 'order-review',
    params: {
      id: String(routeOrderId.value),
    },
  })
}

async function openPaymentPopup() {
  if (orderStatusLabel.value !== '待付款')
    return

  await loadBalanceSummary()
  if (selectedPayment.value === 'balance' && !balancePayEnabled.value) {
    selectedPayment.value = 'wechat'
  }
  syncCountdownByExpireAt(orderDetail.value?.expireAt)
  startCountdown()
  paymentPopupVisible.value = true
}

function resolvePaymentMethod(): MallPaymentMethod {
  if (selectedPayment.value === 'wechat')
    return 'WECHAT'
  if (selectedPayment.value === 'balance')
    return 'BALANCE'
  return 'WECHAT'
}

async function queryPaymentStatus(orderId: number) {
  return alovaInstance.Get(`/mall/orders/${orderId}/payment-status`).send() as Promise<any>
}

async function requestWechatPayment(paymentConfig?: Record<string, string> | null) {
  if (!paymentConfig?.timeStamp || !paymentConfig?.nonceStr || !paymentConfig?.package || !paymentConfig?.paySign) {
    throw new Error('支付参数缺失')
  }

  return new Promise((resolve, reject) => {
    uni.requestPayment({
      provider: 'wxpay',
      timeStamp: paymentConfig.timeStamp,
      nonceStr: paymentConfig.nonceStr,
      package: paymentConfig.package,
      signType: (paymentConfig.signType || 'RSA') as 'RSA',
      paySign: paymentConfig.paySign,
      success: resolve,
      fail: reject,
    })
  })
}

async function payNow() {
  if (orderStatusLabel.value === '待收货') {
    try {
      await alovaInstance.Patch(`/mall/orders/${routeOrderId.value}/receive`, {}).send()
      toast.success('已确认收货')
      loadOrder()
    }
    catch {
    }
    return
  }

  if (orderStatusLabel.value === '待发货') {
    toast.info('已提醒商家发货')
    return
  }

  if (!routeOrderId.value)
    return

  if (selectedPayment.value === 'balance' && !balancePayEnabled.value) {
    toast.error('余额不足，请先充值')
    return
  }

  paying.value = true
  try {
    const payResult = await (Apis.general as any).MallOrdersController_payOrder({
      pathParams: { id: routeOrderId.value },
      data: { method: resolvePaymentMethod() },
    }).send()

    if (selectedPayment.value === 'wechat') {
      await requestWechatPayment(payResult?.paymentConfig || null)
      const latestStatus = await queryPaymentStatus(routeOrderId.value)
      if (latestStatus?.payStatus !== 'PAID') {
        throw new Error('支付结果确认中，请稍后刷新订单')
      }
    }
    else if (payResult?.payStatus !== 'PAID') {
      throw new Error('余额支付结果确认中，请稍后刷新订单')
    }

    paymentPopupVisible.value = false
    await loadBalanceSummary()
    toast.success(`${selectedPayment.value === 'balance' ? '余额' : '微信'}支付成功`)
    await loadOrder()
  }
  catch (error: any) {
    const errMsg = String(error?.errMsg || error?.message || '')
    if (errMsg.includes('cancel')) {
      toast.info('已取消支付')
      return
    }
    if (!error?.handled) {
      toast.error(error?.message || error?.errMsg || '支付失败')
    }
  }
  finally {
    paying.value = false
  }
}

async function cancelOrder() {
  if (orderStatusLabel.value === '待收货') {
    toast.success('售后申请已提交')
    return
  }

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
        const result = await alovaInstance.Patch(`/mall/orders/${routeOrderId.value}/cancel`, {}).send() as any
        const toastTitle = result?.payStatus === 'REFUNDING'
          ? '取消成功，退款处理中'
          : result?.payStatus === 'REFUNDED'
            ? '订单已取消并退款'
            : '订单已取消'
        toast.success(toastTitle)
        loadOrder()
      }
      catch {
      }
    },
  })
}

async function deleteOrder() {
  if (!routeOrderId.value)
    return

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
        await alovaInstance.Delete(`/mall/orders/${routeOrderId.value}`).send()
        toast.success('订单已删除')
        router.push({
          name: 'order-list',
          query: { status: 'all' },
        })
      }
      catch {
      }
    },
  })
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
    orderItemId: Number(item.orderItemId || 0),
    productId: Number(item.productId || 0),
    name: item.productName || '未命名商品',
    spec: formatSpecs(item.specs || {}),
    price: Number(item.price || 0),
    qty: Number(item.quantity || 0),
    amount: Number(item.amount || 0),
    image: item.image || '',
    reviewed: Boolean(item.reviewed),
    canReview: Boolean(item.canReview),
  }))
})

const orderLogistics = computed<OrderViewLogistics>(() => {
  if (!orderDetail.value) {
    return {
      company: '平台配送',
      companyCode: '',
      trackingNo: '-',
      status: '-',
      canQuery: false,
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

  const rows = [
    { label: '订单编号', value: orderDetail.value.orderNo || '-' },
    { label: '下单时间', value: formatDateTime(orderDetail.value.orderDate) || '-' },
    { label: '支付方式', value: resolvePaymentMethodLabel(orderDetail.value.paymentMethod) },
    { label: '支付时间', value: orderDetail.value.payDate ? formatDateTime(orderDetail.value.payDate) : '-' },
    { label: '发货时间', value: orderDetail.value.shipDate ? formatDateTime(orderDetail.value.shipDate) : '-' },
    { label: '收货时间', value: orderDetail.value.receiveDate ? formatDateTime(orderDetail.value.receiveDate) : '-' },
    { label: '订单状态', value: orderStatusLabel.value },
  ]

  if (orderDetail.value.status === 'CANCELLED' && orderDetail.value.cancelDate) {
    rows.splice(4, 0, {
      label: '取消时间',
      value: formatDateTime(orderDetail.value.cancelDate),
    })
  }

  return rows
})

const canDeleteCurrentOrder = computed(() =>
  orderStatusLabel.value === '已完成'
  || orderStatusLabel.value === '已取消'
  || orderStatusLabel.value === '已超时'
  || orderStatusLabel.value === '已退款',
)

const canReviewCurrentOrder = computed(() =>
  orderStatusLabel.value === '已完成' && Boolean(orderDetail.value?.hasPendingReview),
)

const showBottomActions = computed(() => {
  if (!orderDetail.value) {
    return false
  }

  if (canDeleteCurrentOrder.value || canReviewCurrentOrder.value) {
    return true
  }

  return ['待付款', '待发货', '待收货'].includes(orderStatusLabel.value)
})

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
  canDeleteCurrentOrder.value
    ? '删除订单'
    : orderStatusLabel.value === '待收货'
    ? '申请售后'
    : '取消订单'
))

onUnload(() => {
  if (timer.value) {
    clearInterval(timer.value)
  }
})

function openLogisticsPlugin() {
  const detail = orderDetail.value
  if (!detail?.trackingNo) {
    toast.info('暂无可查询的物流信息')
    return
  }

  const phone = (detail.receiverPhone || '').replace(/\D/g, '')
  const phoneTail = phone ? phone.slice(-4) : ''
  // 快递100 插件页面为 index，必填参数 num（运单号），可选 com（公司编码）/ phone（顺丰必填收件人手机后4位）/ appName（调用方名称）
  const params: string[] = [
    `num=${encodeURIComponent(detail.trackingNo)}`,
    `appName=${encodeURIComponent('商城订单')}`,
  ]
  if (detail.logisticsCompany)
    params.push(`com=${encodeURIComponent(detail.logisticsCompany)}`)
  if (phoneTail)
    params.push(`phone=${encodeURIComponent(phoneTail)}`)

  const url = `plugin://kdPlugin/index?${params.join('&')}`
  // #ifdef MP-WEIXIN
  uni.navigateTo({
    url,
    fail: (err) => {
      console.error('[kdPlugin] navigateTo failed', err)
      toast.error('无法打开物流查询，请检查插件是否已启用')
    },
  })
  // #endif
  // #ifndef MP-WEIXIN
  toast.info('请在微信小程序中查看物流')
  // #endif
}
</script>

<template>
  <view class="order-detail-page text-slate-900">
    <scroll-view scroll-y class="pb-28">
      <view class="px-4 pt-4">
        <view v-if="loadError" class="card-shell rounded-[28px] bg-white px-5 py-10 text-center">
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
                <view class="flex items-center justify-between">
                  <text class="text-sm font-semibold">
                    配送信息
                  </text>
                  <view
                    v-if="orderLogistics.canQuery"
                    class="flex items-center gap-1 rounded-full bg-[#fff6df] px-3 py-1 text-xs text-[#c98500] font-semibold"
                    @click.stop="openLogisticsPlugin"
                  >
                    <text class="i-material-symbols:search text-[14px] leading-none" />
                    <text>查看物流</text>
                  </view>
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
                    <view v-if="orderStatusLabel === '已完成'" class="mt-2">
                      <text
                        class="inline-flex rounded-full px-2 py-1 text-[20rpx] font-semibold"
                        :class="item.reviewed ? 'bg-slate-100 text-slate-500' : item.canReview ? 'bg-[#fff6df] text-[#c98500]' : 'bg-slate-100 text-slate-400'"
                      >
                        {{ item.reviewed ? '已评价' : item.canReview ? '待评价' : '不可评价' }}
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
        v-if="!canReviewCurrentOrder"
        class="flex-1 border border-slate-200 rounded-full border-solid bg-white py-3 text-center text-sm text-slate-700 font-semibold"
        @click="canDeleteCurrentOrder ? deleteOrder() : cancelOrder()"
      >
        {{ secondaryActionLabel }}
      </view>
      <view
        v-if="!canDeleteCurrentOrder && !canReviewCurrentOrder"
        class="detail-action flex-[1.2] rounded-full bg-[#efb239] py-3 text-center text-sm text-slate-900 font-bold"
        @click="orderStatusLabel === '待付款' ? openPaymentPopup() : payNow()"
      >
        {{ primaryActionLabel }}
      </view>
      <view
        v-if="canReviewCurrentOrder"
        class="detail-action flex-[1.2] rounded-full bg-[#efb239] py-3 text-center text-sm text-slate-900 font-bold"
        @click="goReviewOrder"
      >
        评价商品
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
            @click="item.key === 'balance' && !balancePayEnabled ? toast.error('余额不足，请先充值') : selectedPayment = item.key"
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

        <view v-if="selectedPayment === 'balance'" class="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-xs text-amber-700">
          支付后剩余余额 ¥{{ formatAmount(Math.max(0, availableBalanceAmount - orderSummary.total)) }}
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
