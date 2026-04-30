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

interface RechargePlan {
  id: number
  name: string
  rechargeAmount: string
  tag?: string | null
  description?: string | null
  activities: Array<{
    id: number
    name: string
    bonusAmount: string
    tag?: string | null
    description?: string | null
    firstRechargeOnly?: boolean
    startTime?: string | null
    endTime?: string | null
  }>
}

const router = useRouter()
const toast = useToast()

const paymentMethods = [
  { key: 'WECHAT', name: '微信支付', desc: '推荐使用微信快速充值', icon: 'i-material-symbols:account-balance-wallet', tone: 'bg-emerald-50 text-emerald-500' },
] as const

const summary = ref({
  availableBalance: '0.00',
})
const activityLoading = ref(false)
const rechargePlans = ref<RechargePlan[]>([])
const selectedPlanIndex = ref(0)
const selectedActivityId = ref<number | null>(null)
const expandedActivityId = ref<number | null>(null)
const customAmount = ref('')
const selectedMethod = ref<'WECHAT'>('WECHAT')
const submitting = ref(false)

const hasRechargeActivities = computed(() => rechargePlans.value.length > 0)
const usingCustomAmount = computed(() => Number(customAmount.value || 0) > 0)
const selectedPlan = computed(() => {
  const plans = rechargePlans.value
  if (!plans.length) {
    return null
  }
  return plans[selectedPlanIndex.value] || plans[0]
})

const currentActivities = computed(() => selectedPlan.value?.activities || [])
const selectedActivity = computed(() => {
  const activities = currentActivities.value
  if (!activities.length) {
    return null
  }
  if (selectedActivityId.value === null) {
    return null
  }
  return activities.find(item => item.id === selectedActivityId.value) || null
})

const finalAmount = computed(() => {
  if (usingCustomAmount.value) {
    return Number(customAmount.value || 0)
  }
  return Number(selectedPlan.value?.rechargeAmount || 0)
})

const bonusAmount = computed(() => {
  if (usingCustomAmount.value) {
    return 0
  }
  return Number(selectedActivity.value?.bonusAmount || 0)
})

const arrivalAmount = computed(() => finalAmount.value + bonusAmount.value)

function formatAmount(value?: string | number | null) {
  return Number(value || 0).toFixed(2)
}

function syncSelectedActivity() {
  const activities = currentActivities.value
  if (!activities.length) {
    selectedActivityId.value = null
    expandedActivityId.value = null
    return
  }

  const selectedExists = selectedActivityId.value !== null && activities.some(item => item.id === selectedActivityId.value)
  if (!selectedExists) {
    selectedActivityId.value = activities[0].id
  }

  const expandedExists = expandedActivityId.value !== null && activities.some(item => item.id === expandedActivityId.value)
  if (!expandedExists) {
    expandedActivityId.value = null
  }
}

async function loadSummary() {
  try {
    const data = await (Apis.general as any).MallBalanceController_getSummary({}).send()
    summary.value.availableBalance = data.availableBalance || '0.00'
  }
  catch {}
}

async function loadRechargePackages() {
  activityLoading.value = true
  try {
    const result = await alovaInstance.Get('/mall/balance/recharge-packages').send() as { data?: RechargePlan[] }
    rechargePlans.value = Array.isArray(result?.data) ? result.data : []
    selectedPlanIndex.value = 0
    syncSelectedActivity()
  }
  catch {
    rechargePlans.value = []
    selectedPlanIndex.value = 0
    selectedActivityId.value = null
    expandedActivityId.value = null
  }
  finally {
    activityLoading.value = false
  }
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

function pickPlan(index: number) {
  selectedPlanIndex.value = index
  customAmount.value = ''
  syncSelectedActivity()
}

function pickActivity(activityId: number) {
  selectedActivityId.value = selectedActivityId.value === activityId ? null : activityId
}

function toggleActivity(activityId: number) {
  expandedActivityId.value = expandedActivityId.value === activityId ? null : activityId
}

async function submitRecharge() {
  if (!finalAmount.value || finalAmount.value <= 0) {
    toast.error('请输入正确的充值金额')
    return
  }

  const selectedPackageId = !usingCustomAmount.value && selectedPlan.value && selectedPlan.value.id > 0
    ? selectedPlan.value.id
    : undefined

  submitting.value = true
  try {
    const result = await alovaInstance.Post('/mall/balance/recharge', {
      amount: finalAmount.value,
      method: selectedMethod.value,
      packageId: selectedPackageId,
      activityId: selectedPackageId ? selectedActivity.value?.id : undefined,
    }).send() as any
    await requestWechatPayment(result?.paymentConfig || null)
    const latest = await queryRechargeStatus(Number(result?.id || 0))
    if (latest?.status !== 'COMPLETED') {
      throw new Error('充值结果确认中，请稍后刷新余额')
    }
    toast.success(`充值成功，到账 ¥${formatAmount(latest?.arrivalAmount || arrivalAmount.value)}`)
    await loadSummary()
    setTimeout(() => {
      router.replace({
        name: 'balance',
      })
    }, 400)
  }
  catch (error: any) {
    const errMsg = String(error?.errMsg || error?.message || '')
    if (errMsg.includes('cancel')) {
      toast.info('已取消支付')
      return
    }
    if (!error?.handled) {
      toast.error(error?.message || error?.errMsg || '充值失败')
    }
  }
  finally {
    submitting.value = false
  }
}

onShow(() => {
  loadSummary()
  loadRechargePackages()
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
          <view class="flex items-center justify-between gap-3">
            <text class="block text-base font-700">
              选择充值金额
            </text>
            <text v-if="activityLoading" class="text-xs text-slate-400">
              活动加载中...
            </text>
          </view>

          <view v-if="hasRechargeActivities" class="grid grid-cols-2 mt-4 gap-3">
            <view
              v-for="(plan, index) in rechargePlans" :key="`${plan.id}-${plan.rechargeAmount}-${index}`"
              class="plan-card"
              :class="selectedPlanIndex === index && !usingCustomAmount ? 'plan-card--active' : 'plan-card--idle'"
              @click="pickPlan(index)"
            >
              <view class="flex items-start justify-between gap-2">
                <text class="block text-lg font-700 leading-tight">
                  ¥{{ formatAmount(plan.rechargeAmount) }}
                </text>
                <text v-if="plan.tag" class="plan-card__tag">
                  {{ plan.tag }}
                </text>
              </view>
            </view>
          </view>

          <view class="mt-4 rounded-[24rpx] bg-[#f8f7f6] px-4 py-3">
            <text class="mb-2 block text-xs text-slate-400">
              自定义金额
            </text>
            <input v-model="customAmount" type="digit" class="text-sm text-slate-900 font-600" placeholder="输入充值金额，不参与套餐活动">
          </view>

          <view v-if="currentActivities.length" class="mt-4 rounded-[24rpx] bg-[#fff8eb] px-4 py-4">
            <view class="flex items-center justify-between gap-3">
              <text class="block text-xs text-[#b7791f] font-700">
                活动列表
              </text>
              <text v-if="!usingCustomAmount" class="text-[22rpx] text-[#8a6320]">
                充值 ¥{{ formatAmount(finalAmount) }}，到账 ¥{{ formatAmount(arrivalAmount) }}
              </text>
            </view>
            <view v-if="usingCustomAmount" class="mt-3 rounded-[20rpx] bg-white/60 px-3 py-3 text-xs text-[#8a6320] leading-5">
              自定义金额暂不参与固定充值活动，若有其他规则请以后端结算结果为准。
            </view>
            <view v-else class="mt-3 flex flex-col gap-3">
              <view
                v-for="activity in currentActivities"
                :key="activity.id"
                class="activity-item"
                :class="selectedActivity?.id === activity.id ? 'activity-item--active' : ''"
                @tap="pickActivity(activity.id)"
              >
                <view class="activity-item__header">
                  <view class="mt-[2rpx] flex-1">
                    <view class="flex items-center gap-2">
                      <view class="activity-item__arrow-wrap" @tap.stop="toggleActivity(activity.id)">
                        <view
                          class="activity-item__arrow-rotate"
                          :class="expandedActivityId === activity.id ? 'activity-item__arrow-rotate--expanded' : ''"
                        >
                        <wd-icon
                          name="arrow-right"
                          custom-class="activity-item__arrow"
                        />
                        </view>
                      </view>
                      <text class="text-sm text-slate-900 font-700">
                        {{ activity.name }}
                      </text>
                      <text v-if="activity.tag" class="activity-item__tag">
                        {{ activity.tag }}
                      </text>
                    </view>
                    <text class="mt-2 block text-xs text-[#8a6320] leading-5">
                      赠送 ¥{{ formatAmount(activity.bonusAmount) }}<text v-if="activity.firstRechargeOnly"> · 仅首充</text>
                    </text>
                  </view>
                  <wd-checkbox
                    :model-value="selectedActivity?.id === activity.id"
                    :true-value="true"
                    :false-value="false"
                    shape="square"
                    checked-color="#efb239"
                    custom-class="activity-item__checkbox"
                    @click.stop
                    @tap.stop
                    @update:model-value="pickActivity(activity.id)"
                  />
                </view>
                <view v-if="expandedActivityId === activity.id" class="activity-item__content">
                  <text class="text-xs text-slate-500 leading-5">
                    {{ activity.description || '暂无内容' }}
                  </text>
                </view>
              </view>
            </view>
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
        立即充值 ¥{{ formatAmount(finalAmount) }}，到账 ¥{{ formatAmount(arrivalAmount) }}
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

.plan-card {
  border-radius: 24rpx;
  padding: 24rpx;
  transition: all 0.2s ease;
}

.plan-card--active {
  border: 2px solid #efb239;
  background: #fff8eb;
  color: #0f172a;
}

.plan-card--idle {
  border: 1px solid rgba(239, 178, 57, 0.1);
  background: #fff;
  color: #0f172a;
}

.plan-card__tag {
  max-width: 160rpx;
  display: inline-block;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  border-radius: 9999rpx;
  background: #fff3d6;
  padding: 8rpx 16rpx;
  font-size: 20rpx;
  line-height: 1.2;
  color: #c98500;
  font-weight: 700;
  flex-shrink: 0;
}

.activity-item {
  border: 1px solid rgba(239, 178, 57, 0.18);
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.72);
  padding: 22rpx 24rpx;
}

.activity-item--active {
  border-color: #efb239;
  background: #fffdf6;
  box-shadow: 0 10rpx 24rpx rgba(239, 178, 57, 0.12);
}

.activity-item__header {
  display: flex;
  align-items: flex-start;
  gap: 24rpx;
}

.activity-item__arrow-wrap {
  width: 40rpx;
  height: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.activity-item__arrow-rotate {
  display: flex;
  align-items: center;
  justify-content: center;
  transform: rotate(0deg);
  transform-origin: center;
  transition: transform 0.24s ease;
  will-change: transform;
}

.activity-item__arrow-rotate--expanded {
  transform: rotate(90deg);
}

.activity-item__arrow {
  font-size: 36rpx;
  line-height: 1;
  color: #c98500;
  transition: color 0.2s ease;
}

.activity-item__tag {
  max-width: 180rpx;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  border-radius: 9999rpx;
  background: #fff1c2;
  padding: 6rpx 14rpx;
  font-size: 20rpx;
  line-height: 1.2;
  color: #b7791f;
  font-weight: 700;
}

.activity-item__checkbox {
  flex-shrink: 0;
  padding-top: 4rpx;
}

.activity-item__content {
  margin-top: 18rpx;
  padding-top: 18rpx;
  border-top: 1px solid rgba(148, 163, 184, 0.14);
}

:deep(.activity-item__checkbox .wd-checkbox__label) {
  display: none;
}

:deep(.activity-item__checkbox .wd-checkbox__shape) {
  margin-right: 0;
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
