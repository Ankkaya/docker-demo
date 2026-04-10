<script setup lang="ts">
/**
 * 订单支付页 - 严格参考 Stitch 设计稿
 */

import { useCheckoutStore } from '@/store/checkoutStore'

type CustomerAddressItem = any

definePage({
  name: 'order-payment',
  layout: 'default',
  style: {
    navigationBarTitleText: '订单支付',
    navigationStyle: 'custom',
  },
})

interface PaymentMethod {
  key: string
  name: string
  desc: string
  iconClass: string
  iconToneClass: string
}

interface PaymentOrderSummary {
  orderId: number
  amount: number
  orderNo: string
  source: string
  expireAt: string
}

interface DeliveryOption {
  label: string
  desc: string
}

interface DiscountInfo {
  title: string
  desc: string
  amount: number
  couponReceiveId?: number | null
  couponName?: string | null
}

interface CouponOption {
  id: number
  couponId: number
  name: string
  thresholdAmount: number
  discountAmount: number
  thresholdLabel: string
  validPeriodText: string
  statusText: string
}

const router = useRouter()
const checkoutStore = useCheckoutStore()
const { safeAreaInsetsBottom } = usePlatform()

const remainingSeconds = ref(29 * 60 + 59)
const selectedPayment = ref('wechat')
const timer = ref<ReturnType<typeof setInterval> | null>(null)
const addressLoading = ref(false)
const creatingOrder = ref(false)
const paying = ref(false)
const paymentPopupVisible = ref(false)
const shouldHandlePaymentCancel = ref(false)
const couponPopupVisible = ref(false)
const couponLoading = ref(false)
const couponOptions = ref<CouponOption[]>([])

const paymentMethods: PaymentMethod[] = [
  {
    key: 'wechat',
    name: '微信支付',
    desc: '快速安全支付',
    iconClass: 'i-material-symbols:account-balance-wallet',
    iconToneClass: 'bg-emerald-50 text-emerald-500',
  },
]

const orderSummary = ref<PaymentOrderSummary>({
  orderId: 0,
  amount: 428,
  orderNo: 'NO202603250001',
  source: '',
  expireAt: '',
})

const deliveryAddress = ref<CustomerAddressItem | null>(null)

const deliveryOption = ref<DeliveryOption>({
  label: '普通快递',
  desc: '预计 24 小时内发货，免运费',
})

const discountInfo = ref<DiscountInfo>({
  title: '暂无优惠券',
  desc: '请选择可用优惠券',
  amount: 0,
  couponReceiveId: null,
  couponName: null,
})

const checkoutItems = computed(() => checkoutStore.items)
const itemCount = computed(() => checkoutStore.itemCount)
const goodsAmount = computed(() => {
  return checkoutItems.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
})
const payableAmount = computed(() => isExistingOrder.value ? orderSummary.value.amount : Math.max(0, goodsAmount.value - discountInfo.value.amount))
const hasSelectedAddress = computed(() => Boolean(deliveryAddress.value))
const isExistingOrder = computed(() => orderSummary.value.source === 'order' && orderSummary.value.orderId > 0)
const availableCouponOptions = computed(() => couponOptions.value.filter(item => goodsAmount.value >= Number(item.thresholdAmount || 0)))

const selectedPaymentMethod = computed(() => {
  return paymentMethods.find(item => item.key === selectedPayment.value) || paymentMethods[0]
})

const formattedTimer = computed(() => {
  const minutes = Math.floor(remainingSeconds.value / 60)
  const seconds = remainingSeconds.value % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
})

function startCountdown() {
  if (timer.value) {
    clearInterval(timer.value)
  }

  timer.value = setInterval(() => {
    if (remainingSeconds.value <= 0) {
      if (timer.value) {
        clearInterval(timer.value)
      }
      return
    }

    remainingSeconds.value -= 1
  }, 1000)
}

function resetCountdown() {
  remainingSeconds.value = 29 * 60 + 59
}

function syncCountdownByExpireAt(expireAt?: string | null) {
  if (!expireAt) {
    resetCountdown()
    return
  }

  const diffSeconds = Math.max(0, Math.floor((new Date(expireAt).getTime() - Date.now()) / 1000))
  remainingSeconds.value = diffSeconds
}

function maskPhone(phone: string) {
  if (!/^1\d{10}$/.test(phone))
    return phone
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`
}

async function loadDefaultAddress() {
  addressLoading.value = true
  try {
    const list = await (Apis.general as any).MallAddressesController_findCurrentUserAddresses({}).send()
    const addresses = Array.isArray(list) ? list : []
    const selectedAddressId = checkoutStore.selectedAddress?.id
    const matched = selectedAddressId ? addresses.find(item => item.id === selectedAddressId) : null
    const fallback = addresses.find(item => item.isDefault) || null
    deliveryAddress.value = matched || fallback

    checkoutStore.setSelectedAddress(deliveryAddress.value
      ? {
          id: deliveryAddress.value.id,
          receiverName: deliveryAddress.value.receiverName,
          receiverPhone: deliveryAddress.value.receiverPhone,
          fullAddress: deliveryAddress.value.fullAddress,
          tag: deliveryAddress.value.tag,
          isDefault: deliveryAddress.value.isDefault,
        }
      : null)
  }
  catch {
    deliveryAddress.value = null
    checkoutStore.setSelectedAddress(null)
  }
  finally {
    addressLoading.value = false
  }
}

function openAddressList() {
  if (isExistingOrder.value) {
    return
  }

  router.push({
    name: 'address',
    params: {
      source: 'order-payment',
      addressId: deliveryAddress.value ? String(deliveryAddress.value.id) : '',
    },
  })
}

function syncDiscountFromOrderDetail(detail: any) {
  const discountAmount = Number(detail?.discount || 0)
  discountInfo.value = {
    title: detail?.couponName || (discountAmount > 0 ? '订单优惠' : '暂无优惠券'),
    desc: detail?.couponName ? '已使用优惠券' : discountAmount > 0 ? '已为你减免商品优惠' : '请选择可用优惠券',
    amount: discountAmount,
    couponReceiveId: detail?.couponReceiveId ? Number(detail.couponReceiveId) : null,
    couponName: detail?.couponName || null,
  }
}

function resetDiscountSelection() {
  discountInfo.value = {
    title: '暂无优惠券',
    desc: availableCouponOptions.value.length ? '请选择可用优惠券' : '当前无可用优惠券',
    amount: 0,
    couponReceiveId: null,
    couponName: null,
  }
}

function selectCoupon(option?: CouponOption | null) {
  if (!option) {
    resetDiscountSelection()
    couponPopupVisible.value = false
    return
  }

  discountInfo.value = {
    title: option.name,
    desc: option.thresholdLabel,
    amount: Number(option.discountAmount || 0),
    couponReceiveId: option.id,
    couponName: option.name,
  }
  couponPopupVisible.value = false
}

async function loadCouponOptions() {
  if (isExistingOrder.value) {
    return
  }

  couponLoading.value = true
  try {
    const result = await alovaInstance.Get('/mall/coupons', {
      params: {
        status: 'UNUSED',
        page: 1,
        pageSize: 50,
      },
    }).send() as { data?: CouponOption[] }
    couponOptions.value = Array.isArray(result?.data) ? result.data : []
  }
  catch {
    couponOptions.value = []
  }
  finally {
    couponLoading.value = false
  }

  if (discountInfo.value.couponReceiveId) {
    const selected = couponOptions.value.find(item => item.id === discountInfo.value.couponReceiveId)
    if (!selected || goodsAmount.value < Number(selected.thresholdAmount || 0)) {
      resetDiscountSelection()
    }
    return
  }

  resetDiscountSelection()
}

function openCouponPopup() {
  if (isExistingOrder.value) {
    return
  }
  couponPopupVisible.value = true
}

function syncSelectedAddressFromStore() {
  if (!checkoutStore.selectedAddress) {
    return
  }

  deliveryAddress.value = {
    id: checkoutStore.selectedAddress.id,
    customerId: 0,
    receiverName: checkoutStore.selectedAddress.receiverName,
    receiverPhone: checkoutStore.selectedAddress.receiverPhone,
    province: '',
    city: '',
    district: '',
    address: checkoutStore.selectedAddress.fullAddress,
    fullAddress: checkoutStore.selectedAddress.fullAddress,
    postalCode: '',
    tag: checkoutStore.selectedAddress.tag || null,
    isDefault: Boolean(checkoutStore.selectedAddress.isDefault),
    sort: 0,
    remark: '',
    createdAt: '',
    updatedAt: '',
  }
}

function resolvePaymentMethod() {
  if (selectedPayment.value === 'wechat')
    return 'WECHAT'
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
  if (!orderSummary.value.orderId) {
    uni.showToast({ title: '订单信息异常', icon: 'none' })
    return
  }

  shouldHandlePaymentCancel.value = false
  paying.value = true
  try {
    const payResult = await (Apis.general as any).MallOrdersController_payOrder({
      pathParams: { id: orderSummary.value.orderId },
      data: { method: resolvePaymentMethod() },
    }).send()
    await requestWechatPayment(payResult?.paymentConfig || null)
    const latestStatus = await queryPaymentStatus(orderSummary.value.orderId)
    if (latestStatus?.payStatus !== 'PAID') {
      throw new Error('支付结果确认中，请稍后在订单列表查看')
    }
    uni.showToast({
      title: `${selectedPaymentMethod.value.name}支付成功`,
      icon: 'success',
    })
    checkoutStore.clear()
    setTimeout(() => {
      router.replace({
        name: 'order-list',
      })
    }, 500)
  }
  catch (error: any) {
    const errMsg = String(error?.errMsg || error?.message || '')
    if (errMsg.includes('cancel')) {
      uni.showToast({
        title: '已取消支付',
        icon: 'none',
      })
      return
    }
    uni.showToast({
      title: error?.message || error?.errMsg || '支付失败',
      icon: 'none',
    })
  }
  finally {
    paying.value = false
  }
}

async function openPaymentPopup() {
  if (creatingOrder.value)
    return

  if (!isExistingOrder.value && !deliveryAddress.value) {
    uni.showToast({ title: '请选择收货地址', icon: 'none' })
    return
  }

  creatingOrder.value = true
  try {
    if (orderSummary.value.source === 'order' && orderSummary.value.orderId) {
      const detail = await (Apis.general as any).MallOrdersController_findOrderDetail({
        pathParams: { id: orderSummary.value.orderId },
      }).send()
      orderSummary.value.orderNo = detail.orderNo
      orderSummary.value.amount = Number(detail.payable || 0)
      orderSummary.value.expireAt = String(detail.expireAt || '')
      syncDiscountFromOrderDetail(detail)
      syncCountdownByExpireAt(orderSummary.value.expireAt)
      startCountdown()
      shouldHandlePaymentCancel.value = true
      paymentPopupVisible.value = true
      return
    }

    const payload = {
      source: (orderSummary.value.source || checkoutStore.source || 'product-detail') as 'cart' | 'product-detail',
      addressId: deliveryAddress.value.id,
      items: orderSummary.value.source === 'cart'
        ? undefined
        : checkoutItems.value.map(item => ({
            skuId: item.skuId,
            quantity: item.quantity,
          })),
      couponReceiveId: discountInfo.value.couponReceiveId || undefined,
    }

    const order = await (Apis.general as any).MallOrdersController_createOrder({
      data: payload,
    }).send()
    orderSummary.value.orderId = Number(order.id || 0)
    orderSummary.value.orderNo = String(order.orderNo || '')
    orderSummary.value.amount = Number(order.payable || 0)
    orderSummary.value.expireAt = String(order.expireAt || '')
    discountInfo.value.amount = Number(order.discount || 0)
    discountInfo.value.couponReceiveId = order.couponReceiveId ? Number(order.couponReceiveId) : null
    discountInfo.value.couponName = order.couponName || null
    discountInfo.value.title = order.couponName || (Number(order.discount || 0) > 0 ? '订单优惠' : '暂无优惠券')
    discountInfo.value.desc = order.couponName ? '已使用优惠券' : Number(order.discount || 0) > 0 ? '已为你减免商品优惠' : '请选择可用优惠券'
    checkoutStore.orderId = orderSummary.value.orderId
    checkoutStore.orderNo = orderSummary.value.orderNo
    checkoutStore.expireAt = orderSummary.value.expireAt
    checkoutStore.totalAmount = orderSummary.value.amount
    syncCountdownByExpireAt(orderSummary.value.expireAt)
    startCountdown()
    shouldHandlePaymentCancel.value = true
    paymentPopupVisible.value = true
  }
  catch (error: any) {
    uni.showToast({
      title: error?.message || '创建订单失败',
      icon: 'none',
    })
  }
  finally {
    creatingOrder.value = false
  }
}

watch(paymentPopupVisible, (visible) => {
  if (visible || !shouldHandlePaymentCancel.value) {
    return
  }

  shouldHandlePaymentCancel.value = false
  router.back()
})

onLoad((options) => {
  if (!checkoutStore.items.length && options?.productName) {
    checkoutStore.setPayload({
      source: (String(options?.source || '') as any) || 'product-detail',
      orderId: Number(options?.orderId || 0),
      orderNo: String(options?.orderNo || `PAY${Date.now()}`),
      expireAt: String(options?.expireAt || ''),
      items: [{
        productId: 0,
        skuId: 0,
        productName: decodeURIComponent(String(options?.productName || '待支付订单')),
        specText: decodeURIComponent(String(options?.specText || '默认规格')),
        image: decodeURIComponent(String(options?.image || '')),
        price: Number(options?.amount || 0),
        quantity: 1,
      }],
      totalAmount: Number(options?.amount || 0),
    })
  }

  orderSummary.value = {
    orderId: Number(options?.orderId || checkoutStore.orderId || 0),
    amount: Number(checkoutStore.totalAmount || 428),
    orderNo: String(checkoutStore.orderNo || 'NO202603250001'),
    source: String(options?.source || checkoutStore.source || ''),
    expireAt: String(options?.expireAt || checkoutStore.expireAt || ''),
  }

  if (checkoutStore.totalAmount) {
    discountInfo.value.amount = goodsAmount.value > checkoutStore.totalAmount
      ? Math.max(0, goodsAmount.value - checkoutStore.totalAmount)
      : 0
    orderSummary.value.amount = Number(checkoutStore.totalAmount)
  }

  syncCountdownByExpireAt(orderSummary.value.expireAt)

  if (checkoutStore.selectedAddress) {
    deliveryAddress.value = {
      id: checkoutStore.selectedAddress.id,
      customerId: 0,
      receiverName: checkoutStore.selectedAddress.receiverName,
      receiverPhone: checkoutStore.selectedAddress.receiverPhone,
      province: '',
      city: '',
      district: '',
      address: checkoutStore.selectedAddress.fullAddress,
      fullAddress: checkoutStore.selectedAddress.fullAddress,
      postalCode: '',
      tag: checkoutStore.selectedAddress.tag || null,
      isDefault: Boolean(checkoutStore.selectedAddress.isDefault),
      sort: 0,
      remark: '',
      createdAt: '',
      updatedAt: '',
    }
  }

  if (orderSummary.value.source === 'order' && orderSummary.value.orderId) {
    ; (Apis.general as any).MallOrdersController_findOrderDetail({
      pathParams: { id: orderSummary.value.orderId },
    }).send().then((detail: any) => {
      checkoutStore.setPayload({
        source: 'order',
        orderId: detail.id,
        orderNo: detail.orderNo,
        expireAt: String(detail.expireAt || ''),
        items: (detail.items || []).map(item => ({
          productId: item.productId,
          skuId: item.skuId,
          productName: item.productName,
          specText: Object.entries(item.specs || {}).map(([key, value]) => `${key}: ${value}`).join(' / ') || '默认规格',
          image: item.image || '',
          price: Number(item.price || 0),
          quantity: Number(item.quantity || 0),
        })),
        totalAmount: Number(detail.payable || 0),
      })

      orderSummary.value.orderNo = detail.orderNo
      orderSummary.value.amount = Number(detail.payable || 0)
      orderSummary.value.expireAt = String(detail.expireAt || '')
      syncDiscountFromOrderDetail(detail)
      deliveryAddress.value = detail.receiverAddress
        ? {
            id: 0,
            customerId: 0,
            receiverName: detail.receiverName || '',
            receiverPhone: detail.receiverPhone || '',
            province: '',
            city: '',
            district: '',
            address: detail.receiverAddress,
            fullAddress: detail.receiverAddress,
            postalCode: '',
            tag: null,
            isDefault: false,
            sort: 0,
            remark: '',
            createdAt: '',
            updatedAt: '',
          }
        : null
      syncCountdownByExpireAt(orderSummary.value.expireAt)
    }).catch(() => { })
  }

  syncSelectedAddressFromStore()
  if (!isExistingOrder.value) {
    loadDefaultAddress()
    loadCouponOptions()
  }
})

onUnload(() => {
  if (timer.value) {
    clearInterval(timer.value)
  }
})

onShow(() => {
  syncSelectedAddressFromStore()
  if (!isExistingOrder.value) {
    loadCouponOptions()
  }
})
</script>

<template>
  <view class="bg-[#fdfaf5] text-slate-900">
    <scroll-view scroll-y class="pb-[220rpx]">
      <view class="mx-auto max-w-[390px] px-5 pb-10">
        <view class="mt-6 border border-orange-50 rounded-3xl bg-white p-5 shadow-sm" @click="openAddressList">
          <view class="flex items-start justify-between gap-3">
            <view class="flex items-start gap-3">
              <view class="mt-1 size-10 flex items-center justify-center rounded-2xl bg-[#efb239]/10">
                <text class="i-material-symbols:location-on text-[22px] text-[#efb239] leading-none" />
              </view>
              <view class="min-w-0 flex-1">
                <view v-if="addressLoading" class="py-2 text-sm text-slate-400">
                  正在加载收货地址...
                </view>
                <template v-else-if="hasSelectedAddress && deliveryAddress">
                  <view class="flex items-center gap-2">
                    <text class="text-sm text-slate-900 font-semibold">
                      {{ deliveryAddress.receiverName }}
                    </text>
                    <text class="text-sm text-[#efb239] font-medium">
                      {{ maskPhone(deliveryAddress.receiverPhone) }}
                    </text>
                    <text
                      v-if="deliveryAddress.tag"
                      class="rounded-full bg-[#efb239]/10 px-2 py-0.5 text-[10px] text-[#c98500] font-bold"
                    >
                      {{ deliveryAddress.tag }}
                    </text>
                  </view>
                  <text class="mt-2 block text-sm text-slate-500 leading-6">
                    {{ deliveryAddress.fullAddress }}
                  </text>
                </template>
                <text v-else class="block py-2 text-sm text-slate-400 leading-6">
                  未选择收货地址
                </text>
              </view>
            </view>
            <text class="i-material-symbols:chevron-right mt-2 text-[18px] text-slate-300 leading-none" />
          </view>
        </view>

        <view class="mt-6 border border-orange-50 rounded-3xl bg-white p-5 shadow-sm">
          <view class="mb-4 flex items-center justify-between text-xs text-slate-400">
            <text>商品信息</text>
            <text>共 {{ itemCount }} 件商品</text>
          </view>
          <view class="space-y-4">
            <view
              v-for="item in checkoutItems" :key="`${item.skuId}-${item.productId}`"
              class="flex items-center gap-4"
            >
              <image :src="item.image" mode="aspectFill" class="size-16 rounded-2xl bg-slate-100" />
              <view class="min-w-0 flex-1">
                <text class="block truncate text-sm text-slate-900 font-semibold">
                  {{ item.productName }}
                </text>
                <text class="mt-1 block text-xs text-slate-400">
                  {{ item.specText }}
                </text>
                <text class="mt-2 block text-[11px] text-slate-400">
                  x{{ item.quantity }}
                </text>
              </view>
              <text class="text-sm text-slate-900 font-bold">
                ¥{{ (item.price * item.quantity).toFixed(2) }}
              </text>
            </view>
          </view>
        </view>

        <view class="mt-6 border border-orange-50 rounded-3xl bg-white p-5 shadow-sm">
          <view class="flex items-center justify-between">
            <view class="flex items-center gap-3">
              <view class="size-10 flex items-center justify-center rounded-2xl bg-sky-50">
                <text class="i-material-symbols:local-shipping text-[22px] text-sky-500 leading-none" />
              </view>
              <view>
                <text class="block text-sm text-slate-900 font-semibold">
                  {{ deliveryOption.label }}
                </text>
                <text class="block text-xs text-slate-400">
                  {{ deliveryOption.desc }}
                </text>
              </view>
            </view>
            <text class="text-sm text-[#efb239] font-medium">
              包邮
            </text>
          </view>
        </view>

        <view class="mt-6 border border-orange-50 rounded-3xl bg-white p-5 shadow-sm" @click="openCouponPopup">
          <view class="flex items-center justify-between">
            <view class="flex items-center gap-3">
              <view class="size-10 flex items-center justify-center rounded-2xl bg-emerald-50">
                <text class="i-material-symbols:confirmation-number text-[22px] text-emerald-500 leading-none" />
              </view>
              <view>
                <text class="block text-sm text-slate-900 font-semibold">
                  {{ discountInfo.title }}
                </text>
                <text class="block text-xs text-slate-400">
                  {{ discountInfo.desc }}
                </text>
              </view>
            </view>
            <view class="flex items-center gap-2">
              <text class="text-sm text-emerald-600 font-bold">
                -¥{{ discountInfo.amount.toFixed(2) }}
              </text>
              <text v-if="!isExistingOrder" class="i-material-symbols:chevron-right text-[18px] text-slate-300 leading-none" />
            </view>
          </view>
        </view>

        <view class="mt-6 border border-orange-50 rounded-3xl bg-white p-5 shadow-sm">
          <view class="text-sm space-y-3">
            <view class="flex items-center justify-between text-slate-500">
              <text>商品金额</text>
              <text>¥{{ goodsAmount.toFixed(2) }}</text>
            </view>
            <view class="flex items-center justify-between text-slate-500">
              <text>配送费用</text>
              <text>¥0.00</text>
            </view>
            <view class="flex items-center justify-between text-slate-500">
              <text>优惠抵扣</text>
              <text>-¥{{ discountInfo.amount.toFixed(2) }}</text>
            </view>
            <view class="h-px bg-slate-50" />
            <view class="flex items-center justify-between">
              <text class="text-slate-900 font-semibold">
                应付金额
              </text>
              <text class="text-xl text-slate-900 font-extrabold">
                ¥{{ payableAmount.toFixed(2) }}
              </text>
            </view>
          </view>
        </view>

        <view class="flex items-center justify-center gap-1.5 py-5">
          <text class="i-material-symbols:verified-user text-[18px] text-slate-400 leading-none" />
          <text class="text-xs text-slate-400 font-medium">
            下单后进入支付确认
          </text>
        </view>
      </view>
    </scroll-view>

    <view
      class="fixed bottom-0 left-0 right-0 z-40 border-t border-orange-50 bg-white/80 p-6 shadow-[0_-10px_30px_rgba(239,178,57,0.08)] backdrop-blur-lg"
    >
      <view class="mx-auto max-w-[390px]">
        <view
          class="flex items-center justify-center gap-2 rounded-full bg-[#efb239] py-4 text-lg text-white font-bold shadow-lg shadow-orange-200 active:scale-[0.99]"
          :class="creatingOrder ? 'opacity-75' : ''" @click="openPaymentPopup"
        >
          <text>{{ creatingOrder ? '创建订单中...' : '立即支付' }}</text>
          <text class="text-white/80 font-normal">
            |
          </text>
          <text>¥{{ payableAmount.toFixed(2) }}</text>
        </view>
      </view>
    </view>

    <wd-popup
      v-model="couponPopupVisible" position="bottom" safe-area-inset-bottom custom-class="order-payment-popup"
      lock-scroll root-portal :z-index="2090"
    >
      <view class="order-payment-popup__panel">
        <view class="order-payment-popup__handle" />
        <view class="order-payment-popup__title">
          选择优惠券
        </view>

        <scroll-view scroll-y class="max-h-[60vh] py-3">
          <view class="coupon-select-card coupon-select-card--none" @click="selectCoupon(null)">
            <view>
              <text class="block text-sm text-slate-900 font-semibold">
                不使用优惠券
              </text>
              <text class="mt-1 block text-xs text-slate-400">
                当前商品金额 ¥{{ goodsAmount.toFixed(2) }}
              </text>
            </view>
            <text v-if="!discountInfo.couponReceiveId" class="i-material-symbols:check-circle text-[20px] text-[#efb239] leading-none" />
          </view>

          <view v-if="couponLoading" class="py-8 text-center text-sm text-slate-400">
            正在加载优惠券...
          </view>

          <view v-else-if="availableCouponOptions.length === 0" class="py-8 text-center text-sm text-slate-400">
            当前没有满足门槛的优惠券
          </view>

          <view
            v-for="item in availableCouponOptions"
            :key="item.id"
            class="coupon-select-card"
            :class="discountInfo.couponReceiveId === item.id ? 'coupon-select-card--active' : ''"
            @click="selectCoupon(item)"
          >
            <view class="coupon-select-card__amount">
              <text class="text-sm font-bold">¥</text>
              <text class="text-[40rpx] font-extrabold leading-none">{{ Number(item.discountAmount || 0).toFixed(Number(item.discountAmount || 0) % 1 === 0 ? 0 : 2) }}</text>
            </view>
            <view class="min-w-0 flex-1">
              <text class="block text-sm text-slate-900 font-semibold">
                {{ item.name }}
              </text>
              <text class="mt-1 block text-xs text-slate-500">
                {{ item.thresholdLabel }}
              </text>
              <text class="mt-1 block text-[22rpx] text-slate-400">
                {{ item.validPeriodText }}
              </text>
            </view>
            <text
              class="text-[20px] leading-none"
              :class="discountInfo.couponReceiveId === item.id ? 'i-material-symbols:check-circle text-[#efb239]' : 'i-material-symbols:radio-button-unchecked text-slate-300'"
            />
          </view>
        </scroll-view>
      </view>
    </wd-popup>

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
              {{ orderSummary.amount.toFixed(2) }}
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
          <text>¥{{ orderSummary.amount.toFixed(2) }}</text>
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<style scoped>
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

.coupon-select-card {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  border: 1px solid rgba(239, 178, 57, 0.1);
  border-radius: 24rpx;
  background: #fff;
  padding: 16px;
}

.coupon-select-card--active {
  border-color: rgba(239, 178, 57, 0.55);
  background: #fffaf0;
}

.coupon-select-card--none {
  justify-content: space-between;
}

.coupon-select-card__amount {
  display: flex;
  min-width: 92rpx;
  align-items: end;
  gap: 4rpx;
  color: #efb239;
}
</style>
