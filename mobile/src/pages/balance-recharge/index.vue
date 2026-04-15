<script setup lang="ts">
definePage({
  name: 'balance-recharge',
  layout: 'default',
  style: {
    navigationBarTitleText: '余额充值',
    navigationStyle: 'custom',
  },
  needLogin: true,
})

const router = useRouter()
const toast = useToast()

const quickAmounts = [50, 100, 200, 300, 500, 1000]
const paymentMethods = [
  { key: 'WECHAT', name: '微信支付', desc: '推荐使用微信快速充值', icon: 'i-material-symbols:account-balance-wallet', tone: 'bg-emerald-50 text-emerald-500' },
] as const

const summary = ref({
  availableBalance: '0.00',
})
const selectedAmount = ref(100)
const customAmount = ref('')
const selectedMethod = ref<'WECHAT'>('WECHAT')
const submitting = ref(false)

const finalAmount = computed(() => {
  const custom = Number(customAmount.value || 0)
  if (custom > 0)
    return custom
  return selectedAmount.value
})

function formatAmount(value?: string | number | null) {
  return Number(value || 0).toFixed(2)
}

async function loadSummary() {
  try {
    const data = await (Apis.general as any).MallBalanceController_getSummary({}).send()
    summary.value.availableBalance = data.availableBalance || '0.00'
  }
  catch {}
}

async function queryRechargeStatus(rechargeId: number) {
  return alovaInstance.Get(`/mall/balance/recharges/${rechargeId}/status`).send() as Promise<any>
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

function pickAmount(amount: number) {
  selectedAmount.value = amount
  customAmount.value = ''
}

async function submitRecharge() {
  if (!finalAmount.value || finalAmount.value <= 0) {
    toast.show('请输入正确的充值金额')
    return
  }

  submitting.value = true
  try {
    const result = await (Apis.general as any).MallBalanceController_recharge({
      data: {
        amount: finalAmount.value,
        method: selectedMethod.value,
      },
    }).send()
    await requestWechatPayment(result?.paymentConfig || null)
    const latest = await queryRechargeStatus(Number(result?.id || 0))
    if (latest?.status !== 'COMPLETED') {
      throw new Error('充值结果确认中，请稍后刷新余额')
    }
    uni.showToast({
      title: '充值成功',
      icon: 'success',
    })
    await loadSummary()
    setTimeout(() => {
      router.replace({
        name: 'balance',
      })
    }, 400)
    console.log('balance recharge result', result)
  }
  catch (error: any) {
    const errMsg = String(error?.errMsg || error?.message || '')
    if (errMsg.includes('cancel')) {
      toast.show('已取消支付')
      return
    }
    toast.show(error?.message || error?.errMsg || '充值失败')
  }
  finally {
    submitting.value = false
  }
}

onShow(() => {
  loadSummary()
})
</script>

<template>
  <view class="recharge-page text-slate-900">
    <scroll-view scroll-y class="pb-24">
      <view class="px-4 pb-8 pt-4">
        <view class="rounded-[30rpx] bg-white px-5 py-5 shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
          <text class="block text-sm text-slate-400">
            当前余额
          </text>
          <view class="mt-3 flex items-end gap-2">
            <text class="text-xl text-slate-900 font-700">
              ¥
            </text>
            <text class="text-[44rpx] text-slate-900 font-800 leading-none">
              {{ formatAmount(summary.availableBalance) }}
            </text>
          </view>
        </view>

        <view class="mt-5 rounded-[30rpx] bg-white px-5 py-5 shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
          <text class="block text-base font-700">
            选择充值金额
          </text>
          <view class="grid grid-cols-3 mt-4 gap-3">
            <view
              v-for="amount in quickAmounts" :key="amount"
              class="amount-card"
              :class="selectedAmount === amount && !customAmount ? 'amount-card--active' : 'amount-card--idle'"
              @click="pickAmount(amount)"
            >
              <text class="text-base font-700">
                ¥{{ amount }}
              </text>
            </view>
          </view>

          <view class="mt-4 rounded-[24rpx] bg-[#f8f7f6] px-4 py-3">
            <text class="mb-2 block text-xs text-slate-400">
              自定义金额
            </text>
            <input v-model="customAmount" type="digit" class="text-sm text-slate-900 font-600" placeholder="输入充值金额">
          </view>
        </view>

        <view class="mt-5 rounded-[30rpx] bg-white px-5 py-5 shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
          <text class="block text-base font-700">
            支付方式
          </text>
          <view class="grid mt-4 gap-3">
            <view
              v-for="item in paymentMethods" :key="item.key"
              class="payment-card"
              :class="selectedMethod === item.key ? 'payment-card--active' : 'payment-card--idle'"
              @click="selectedMethod = item.key"
            >
              <view class="flex items-center gap-3">
                <view class="size-10 flex items-center justify-center rounded-[20rpx]" :class="item.tone">
                  <text class="text-[22px] leading-none" :class="item.icon" />
                </view>
                <view>
                  <text class="block text-sm text-slate-900 font-700">
                    {{ item.name }}
                  </text>
                  <text class="block text-xs text-slate-400">
                    {{ item.desc }}
                  </text>
                </view>
              </view>
              <view
                class="size-6 flex items-center justify-center border rounded-full"
                :class="selectedMethod === item.key ? 'border-solid border-[#efb239] bg-[#efb239]' : 'border-solid border-[#d9d1bf] bg-white'"
              >
                <text v-if="selectedMethod === item.key" class="i-material-symbols:check text-[16px] text-white leading-none" />
              </view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <view class="fixed bottom-0 left-0 right-0 z-40 bg-[#f8f7f6]/92 p-4 pb-6 backdrop-blur-md">
      <view
        class="rounded-[28rpx] bg-[#efb239] py-4 text-center text-sm text-slate-900 font-700 shadow-[0_18px_34px_rgba(239,178,57,0.26)]"
        :class="submitting ? 'opacity-75' : ''"
        @click="submitRecharge"
      >
        立即充值 ¥{{ formatAmount(finalAmount) }}
      </view>
    </view>
  </view>
</template>

<style scoped>
.recharge-page {
  background:
    radial-gradient(circle at top right, rgba(239, 178, 57, 0.12), transparent 25%),
    linear-gradient(180deg, #f8f7f6 0%, #f3efe7 100%);
}

.amount-card {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 24rpx;
  padding: 24rpx 0;
  transition: all 0.2s ease;
}

.amount-card--active {
  border: 2px solid #efb239;
  background: #fff8eb;
  color: #c98500;
}

.amount-card--idle {
  border: 1px solid rgba(239, 178, 57, 0.1);
  background: #fff;
  color: #0f172a;
}

.payment-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 26rpx;
  padding: 28rpx 24rpx;
}

.payment-card--active {
  border: 2px solid #efb239;
  background: #fffdfa;
}

.payment-card--idle {
  border: 1px solid rgba(239, 178, 57, 0.08);
  background: #fff;
}
</style>
