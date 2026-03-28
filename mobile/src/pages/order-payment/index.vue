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
}

const router = useRouter()
const checkoutStore = useCheckoutStore()
const { safeAreaInsetsBottom } = usePlatform()

const remainingSeconds = ref(29 * 60 + 59)
const selectedPayment = ref('wechat')
const timer = ref<ReturnType<typeof setInterval> | null>(null)
const addressLoading = ref(false)
const creatingOrder = ref(false)
const paymentPopupVisible = ref(false)
const shouldHandlePaymentCancel = ref(false)

const paymentMethods: PaymentMethod[] = [
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
    desc: '当前余额：¥1,250.00',
    iconClass: 'i-material-symbols:savings',
    iconToneClass: 'bg-orange-50 text-[#efb239]',
  },
  {
    key: 'card',
    name: '国际银行卡',
    desc: '支持 Visa、Mastercard、JCB',
    iconClass: 'i-material-symbols:credit-card',
    iconToneClass: 'bg-blue-50 text-blue-500',
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
  title: '春日满减优惠',
  desc: '已为你减免商品优惠',
  amount: 20,
})

const checkoutItems = computed(() => checkoutStore.items)
const itemCount = computed(() => checkoutStore.itemCount)
const goodsAmount = computed(() => {
  return checkoutItems.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
})
const payableAmount = computed(() => Math.max(0, goodsAmount.value - discountInfo.value.amount))
const hasSelectedAddress = computed(() => Boolean(deliveryAddress.value))
const isExistingOrder = computed(() => orderSummary.value.source === 'order' && orderSummary.value.orderId > 0)

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
  if (selectedPayment.value === 'balance')
    return 'CREDIT'
  return 'BANK'
}

async function payNow() {
  if (!orderSummary.value.orderId) {
    uni.showToast({ title: '订单信息异常', icon: 'none' })
    return
  }

  shouldHandlePaymentCancel.value = false
  try {
    await (Apis.general as any).MallOrdersController_payOrder({
      pathParams: { id: orderSummary.value.orderId },
      data: { method: resolvePaymentMethod() },
    }).send()
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
    uni.showToast({
      title: error?.message || '支付失败',
      icon: 'none',
    })
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
    }

    const order = await (Apis.general as any).MallOrdersController_createOrder({
      data: payload,
    }).send()
    orderSummary.value.orderId = Number(order.id || 0)
    orderSummary.value.orderNo = String(order.orderNo || '')
    orderSummary.value.amount = Number(order.payable || 0)
    orderSummary.value.expireAt = String(order.expireAt || '')
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
  }
})

onUnload(() => {
  if (timer.value) {
    clearInterval(timer.value)
  }
})

onShow(() => {
  syncSelectedAddressFromStore()
})
</script>

<template>
  <view class=" bg-[#fdfaf5] text-slate-900">
    <scroll-view scroll-y class="pb-[220rpx]">
      <view class="mx-auto max-w-[390px] px-5 pb-10">
        <view class="rounded-3xl border border-orange-50 bg-white p-5 shadow-sm mt-6" @click="openAddressList">
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
                    <text class="text-sm font-semibold text-slate-900">
                      {{ deliveryAddress.receiverName }}
                    </text>
                    <text class="text-sm font-medium text-[#efb239]">
                      {{ maskPhone(deliveryAddress.receiverPhone) }}
                    </text>
                    <text v-if="deliveryAddress.tag"
                      class="rounded-full bg-[#efb239]/10 px-2 py-0.5 text-[10px] font-bold text-[#c98500]">
                      {{ deliveryAddress.tag }}
                    </text>
                  </view>
                  <text class="mt-2 block text-sm leading-6 text-slate-500">
                    {{ deliveryAddress.fullAddress }}
                  </text>
                </template>
                <text v-else class="block py-2 text-sm leading-6 text-slate-400">
                  未选择收货地址
                </text>
              </view>
            </view>
            <text class="i-material-symbols:chevron-right mt-2 text-[18px] text-slate-300 leading-none" />
          </view>
        </view>

        <view class="mt-6 rounded-3xl border border-orange-50 bg-white p-5 shadow-sm">
          <view class="mb-4 flex items-center justify-between text-xs text-slate-400">
            <text>商品信息</text>
            <text>共 {{ itemCount }} 件商品</text>
          </view>
          <view class="space-y-4">
            <view v-for="item in checkoutItems" :key="`${item.skuId}-${item.productId}`"
              class="flex items-center gap-4">
              <image :src="item.image" mode="aspectFill" class="size-16 rounded-2xl bg-slate-100" />
              <view class="min-w-0 flex-1">
                <text class="block truncate text-sm font-semibold text-slate-900">
                  {{ item.productName }}
                </text>
                <text class="mt-1 block text-xs text-slate-400">
                  {{ item.specText }}
                </text>
                <text class="mt-2 block text-[11px] text-slate-400">
                  x{{ item.quantity }}
                </text>
              </view>
              <text class="text-sm font-bold text-slate-900">
                ¥{{ (item.price * item.quantity).toFixed(2) }}
              </text>
            </view>
          </view>
        </view>

        <view class="mt-6 rounded-3xl border border-orange-50 bg-white p-5 shadow-sm">
          <view class="flex items-center justify-between">
            <view class="flex items-center gap-3">
              <view class="size-10 flex items-center justify-center rounded-2xl bg-sky-50">
                <text class="i-material-symbols:local-shipping text-[22px] text-sky-500 leading-none" />
              </view>
              <view>
                <text class="block text-sm font-semibold text-slate-900">
                  {{ deliveryOption.label }}
                </text>
                <text class="block text-xs text-slate-400">
                  {{ deliveryOption.desc }}
                </text>
              </view>
            </view>
            <text class="text-sm font-medium text-[#efb239]">
              包邮
            </text>
          </view>
        </view>

        <view class="mt-6 rounded-3xl border border-orange-50 bg-white p-5 shadow-sm">
          <view class="flex items-center justify-between">
            <view class="flex items-center gap-3">
              <view class="size-10 flex items-center justify-center rounded-2xl bg-emerald-50">
                <text class="i-material-symbols:confirmation-number text-[22px] text-emerald-500 leading-none" />
              </view>
              <view>
                <text class="block text-sm font-semibold text-slate-900">
                  {{ discountInfo.title }}
                </text>
                <text class="block text-xs text-slate-400">
                  {{ discountInfo.desc }}
                </text>
              </view>
            </view>
            <text class="text-sm font-bold text-emerald-600">
              -¥{{ discountInfo.amount.toFixed(2) }}
            </text>
          </view>
        </view>

        <view class="mt-6 rounded-3xl border border-orange-50 bg-white p-5 shadow-sm">
          <view class="space-y-3 text-sm">
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
              <text class="font-semibold text-slate-900">
                应付金额
              </text>
              <text class="text-xl font-extrabold text-slate-900">
                ¥{{ payableAmount.toFixed(2) }}
              </text>
            </view>
          </view>
        </view>

        <view class="flex items-center justify-center gap-1.5 py-5">
          <text class="i-material-symbols:verified-user text-[18px] text-slate-400 leading-none" />
          <text class="text-xs font-medium text-slate-400">
            下单后进入支付确认
          </text>
        </view>
      </view>
    </scroll-view>

    <view
      class="fixed bottom-0 left-0 right-0 z-40 border-t border-orange-50 bg-white/80 p-6 backdrop-blur-lg shadow-[0_-10px_30px_rgba(239,178,57,0.08)]">
      <view class="mx-auto max-w-[390px]">
        <view
          class="flex items-center justify-center gap-2 rounded-full bg-[#efb239] py-4 text-lg font-bold text-white shadow-lg shadow-orange-200 active:scale-[0.99]"
          :class="creatingOrder ? 'opacity-75' : ''" @click="openPaymentPopup">
          <text>{{ creatingOrder ? '创建订单中...' : '立即支付' }}</text>
          <text class="font-normal text-white/80">|</text>
          <text>¥{{ payableAmount.toFixed(2) }}</text>
        </view>
      </view>
    </view>

    <wd-popup v-model="paymentPopupVisible" position="bottom" safe-area-inset-bottom custom-class="order-payment-popup"
      lock-scroll root-portal :z-index="2100">
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
            <text class="text-2xl font-bold text-slate-900">¥</text>
            <text class="text-5xl font-extrabold tracking-tight text-slate-900">
              {{ orderSummary.amount.toFixed(2) }}
            </text>
          </view>
        </view>

        <view class="order-payment-popup__methods">
          <view v-for="item in paymentMethods" :key="item.key" class="order-payment-popup__method"
            :class="selectedPayment === item.key ? 'order-payment-popup__method--active' : 'order-payment-popup__method--idle'"
            @click="selectedPayment = item.key">
            <view class="flex items-center gap-3">
              <view class="size-10 flex items-center justify-center rounded-2xl" :class="item.iconToneClass">
                <text class="text-[22px] leading-none" :class="item.iconClass" />
              </view>
              <view>
                <text class="block text-sm font-semibold text-slate-900">
                  {{ item.name }}
                </text>
                <text class="block text-[10px] text-slate-400">
                  {{ item.desc }}
                </text>
              </view>
            </view>
            <view class="size-6 flex items-center justify-center rounded-full border border-solid"
              :class="selectedPayment === item.key ? 'border-[#efb239] bg-[#efb239]' : 'border-[#d6c7a1] bg-white'">
              <text v-if="selectedPayment === item.key"
                class="i-material-symbols:check text-[16px] text-white leading-none" />
            </view>
          </view>
        </view>

        <view class="order-payment-popup__submit" @click="payNow">
          <text>立即支付</text>
          <text class="font-normal text-white/80">|</text>
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
</style>
