<script setup lang="ts">
definePage({
  name: 'balance',
  layout: 'default',
  style: {
    navigationBarTitleText: '我的余额',
    navigationStyle: 'custom',
  },
  needLogin: true,
})

const router = useRouter()
const toast = useToast()

const loading = ref(false)
const summaryLoading = ref(false)
const summary = ref({
  availableBalance: '0.00',
  frozenBalance: '0.00',
  totalRecharged: '0.00',
  totalConsumed: '0.00',
  totalRefunded: '0.00',
  updatedAt: '',
})
const logs = ref<any[]>([])

const statCards = computed(() => [
  { label: '累计充值', value: summary.value.totalRecharged, tone: 'text-[#efb239]' },
  { label: '累计消费', value: summary.value.totalConsumed, tone: 'text-slate-900' },
  { label: '累计退款', value: summary.value.totalRefunded, tone: 'text-emerald-600' },
  { label: '冻结金额', value: summary.value.frozenBalance, tone: 'text-slate-500' },
])

function formatAmount(value?: string | number | null) {
  return Number(value || 0).toFixed(2)
}

function formatDateTime(value?: string) {
  if (!value)
    return ''
  return new Date(value).toLocaleString('zh-CN')
}

function formatLogDateMeta(value?: string) {
  if (!value) {
    return {
      date: '',
      period: '',
      time: '',
    }
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return {
      date: '',
      period: '',
      time: '',
    }
  }

  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  const hour = date.getHours()
  const minute = `${date.getMinutes()}`.padStart(2, '0')

  let period = '凌晨'
  if (hour >= 6 && hour < 12)
    period = '上午'
  else if (hour >= 12 && hour < 18)
    period = '下午'
  else if (hour >= 18)
    period = '晚上'

  return {
    date: `${year}-${month}-${day}`,
    period,
    time: `${`${hour}`.padStart(2, '0')}:${minute}`,
  }
}

function resolveLogTone(type: string) {
  if (type === 'RECHARGE' || type === 'REFUND' || type === 'ADJUST_INCREASE')
    return 'text-emerald-600'
  return 'text-slate-900'
}

function resolveLogPrefix(type: string) {
  if (type === 'RECHARGE' || type === 'REFUND' || type === 'ADJUST_INCREASE')
    return '+'
  return '-'
}

async function loadSummary() {
  summaryLoading.value = true
  try {
    const data = await (Apis.general as any).MallBalanceController_getSummary({}).send()
    summary.value = {
      availableBalance: data.availableBalance || '0.00',
      frozenBalance: data.frozenBalance || '0.00',
      totalRecharged: data.totalRecharged || '0.00',
      totalConsumed: data.totalConsumed || '0.00',
      totalRefunded: data.totalRefunded || '0.00',
      updatedAt: data.updatedAt || '',
    }
  }
  finally {
    summaryLoading.value = false
  }
}

async function loadLogs() {
  loading.value = true
  try {
    const result = await (Apis.general as any).MallBalanceController_getLogs({
      params: { page: 1, pageSize: 20 },
    }).send()
    logs.value = Array.isArray(result.data) ? result.data : []
  }
  catch (error: any) {
    toast.show(error?.message || '加载余额流水失败')
    logs.value = []
  }
  finally {
    loading.value = false
  }
}

function goRecharge() {
  router.push({ name: 'balance-recharge' })
}

onShow(async () => {
  await loadSummary()
  await loadLogs()
})
</script>

<template>
  <view class="balance-page text-slate-900">
    <scroll-view scroll-y class="pb-24">
      <view class="px-4 pb-10 pt-4">
        <view class="balance-hero overflow-hidden rounded-[32rpx] px-5 py-5">
          <view class="relative z-10 flex items-start justify-between gap-4">
            <view>
              <text class="block text-sm text-white/80 font-600">
                当前可用余额
              </text>
              <view class="mt-3 flex items-end gap-2">
                <text class="text-2xl text-white font-700">
                  ¥
                </text>
                <text class="text-[42rpx] text-white font-800 leading-none">
                  {{ formatAmount(summary.availableBalance) }}
                </text>
              </view>
              <text class="mt-3 block text-[22rpx] text-white/70">
                最近更新 {{ formatDateTime(summary.updatedAt) || '刚刚' }}
              </text>
            </view>
            <view class="rounded-full bg-white/14 px-4 py-2 text-xs text-white font-700" @click="goRecharge">
              去充值
            </view>
          </view>
          <view class="absolute right-[-30rpx] top-[-30rpx] size-[180rpx] rounded-full bg-white/10" />
          <view class="absolute bottom-[-60rpx] right-[70rpx] size-[200rpx] rounded-full bg-white/6" />
        </view>

        <view class="grid grid-cols-2 mt-4 gap-3">
          <view
            v-for="item in statCards" :key="item.label"
            class="border border-[#efb239]/8 rounded-[26rpx] bg-white px-4 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]"
          >
            <text class="block text-xs text-slate-400">
              {{ item.label }}
            </text>
            <text class="mt-2 block text-lg font-700" :class="item.tone">
              ¥{{ formatAmount(item.value) }}
            </text>
          </view>
        </view>

        <view
          class="mt-6 border border-[#efb239]/8 rounded-[28rpx] bg-white px-4 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]"
        >
          <view class="mb-4 flex items-center justify-between">
            <text class="text-base font-700">
              余额流水
            </text>
            <text class="text-xs text-slate-400">
              最近 20 条
            </text>
          </view>

          <view v-if="!logs.length" class="py-8 text-center text-sm text-slate-400">
            暂无余额流水
          </view>
          <template v-else>
            <view v-for="item in logs" :key="item.id" class="balance-log-row">
              <view class="min-w-0 flex-1">
                <view class="flex items-center justify-between gap-3">
                  <text class="truncate text-sm text-slate-900 font-700">
                    {{ item.typeText }}
                  </text>
                  <text class="shrink-0 text-sm font-700" :class="resolveLogTone(item.type)">
                    {{ resolveLogPrefix(item.type) }}¥{{ formatAmount(item.changeAmount) }}
                  </text>
                </view>
                <text class="mt-1 block text-xs text-slate-400">
                  余额：¥{{ formatAmount(item.balanceBefore) }} → ¥{{ formatAmount(item.balanceAfter) }}
                </text>
                <text v-if="item.bizNo || item.remark" class="mt-1 block text-xs text-slate-400">
                  {{ item.bizNo || item.remark }}
                </text>
                <view class="balance-log-time mt-2">
                  <text>{{ formatLogDateMeta(item.createdAt).date }}</text>
                  <text class="balance-log-time-dot" />
                  <text>{{ formatLogDateMeta(item.createdAt).period }}</text>
                  <text class="balance-log-time-dot" />
                  <text>{{ formatLogDateMeta(item.createdAt).time }}</text>
                </view>
              </view>
            </view>
          </template>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<style scoped>
.balance-page {
  background:
    radial-gradient(circle at top right, rgba(239, 178, 57, 0.15), transparent 28%),
    linear-gradient(180deg, #f8f7f6 0%, #f3efe7 100%);
}

.balance-hero {
  position: relative;
  background: linear-gradient(135deg, #efb239 0%, #d99319 100%);
  box-shadow: 0 18px 40px rgba(239, 178, 57, 0.3);
}

.balance-log-row {
  border-top: 1px solid rgba(239, 178, 57, 0.08);
  padding: 28rpx 0;
}

.balance-log-row:first-of-type {
  border-top: 0;
  padding-top: 0;
}

.balance-log-row:last-of-type {
  padding-bottom: 0;
}

.balance-log-time {
  display: flex;
  align-items: center;
  gap: 12rpx;
  color: #94a3b8;
  font-size: 22rpx;
  line-height: 1.2;
}

.balance-log-time-dot {
  width: 6rpx;
  height: 6rpx;
  flex: none;
  border-radius: 9999rpx;
  background: rgba(148, 163, 184, 0.65);
}
</style>
