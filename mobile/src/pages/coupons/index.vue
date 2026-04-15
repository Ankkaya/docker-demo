<script setup lang="ts">
/**
 * 我的优惠券页面 - 参考 Stitch 设计稿
 */

type CouponTab = 'UNUSED' | 'USED' | 'EXPIRED'

interface CouponSummary {
  unusedCount: number
  usedCount: number
  expiredCount: number
  claimableCount: number
}

interface CouponItem {
  id: number
  couponId: number
  name: string
  discountAmount: number
  thresholdAmount: number
  discountLabel: string
  thresholdLabel: string
  status: CouponTab
  statusText: string
  sourceText: string
  validPeriodText: string
  description: string | null
  isExpiringSoon: boolean
}

definePage({
  name: 'coupons',
  layout: 'default',
  style: {
    navigationBarTitleText: '我的优惠券',
    navigationStyle: 'custom',
  },
  needLogin: true,
})

const router = useRouter()
const currentTab = ref<CouponTab>('UNUSED')
const summary = ref<CouponSummary>({
  unusedCount: 0,
  usedCount: 0,
  expiredCount: 0,
  claimableCount: 0,
})
const coupons = ref<CouponItem[]>([])
const loading = ref(false)

const tabs = [
  { key: 'UNUSED' as CouponTab, label: '待使用' },
  { key: 'USED' as CouponTab, label: '已使用' },
  { key: 'EXPIRED' as CouponTab, label: '已过期' },
]

const currentCount = computed(() => {
  if (currentTab.value === 'USED') {
    return summary.value.usedCount
  }
  if (currentTab.value === 'EXPIRED') {
    return summary.value.expiredCount
  }
  return summary.value.unusedCount
})

function getAmountText(item: CouponItem) {
  return Number(item.discountAmount || 0).toFixed(Number(item.discountAmount || 0) % 1 === 0 ? 0 : 2)
}

function getStatusBadgeClass(status: CouponTab) {
  const map: Record<CouponTab, string> = {
    UNUSED: 'bg-[#efb239]/12 text-[#c98500]',
    USED: 'bg-slate-200 text-slate-500',
    EXPIRED: 'bg-slate-200 text-slate-500',
  }
  return map[status]
}

function getCardClass(status: CouponTab) {
  return status === 'UNUSED'
    ? 'border-[#efb239]/10 bg-white shadow-[0_14px_28px_rgba(15,23,42,0.05)]'
    : 'border-slate-200/80 bg-[#f3efe8] opacity-78'
}

function openCouponCenter() {
  router.push({ name: 'coupon-center' })
}

function useCoupon() {
  router.pushTab({ name: 'home' })
}

async function loadSummary() {
  try {
    const result = await alovaInstance.Get('/mall/coupons/summary').send() as CouponSummary
    summary.value = {
      unusedCount: Number(result?.unusedCount || 0),
      usedCount: Number(result?.usedCount || 0),
      expiredCount: Number(result?.expiredCount || 0),
      claimableCount: Number(result?.claimableCount || 0),
    }
  }
  catch {
    summary.value = {
      unusedCount: 0,
      usedCount: 0,
      expiredCount: 0,
      claimableCount: 0,
    }
  }
}

async function loadCoupons() {
  loading.value = true
  try {
    const result = await alovaInstance.Get('/mall/coupons', {
      params: {
        status: currentTab.value,
        page: 1,
        pageSize: 50,
      },
    }).send() as { data?: CouponItem[] }
    coupons.value = Array.isArray(result?.data) ? result.data : []
  }
  catch {
    coupons.value = []
  }
  finally {
    loading.value = false
  }
}

async function switchTab(tab: CouponTab) {
  if (currentTab.value === tab) {
    return
  }
  currentTab.value = tab
  await loadCoupons()
}

onShow(() => {
  loadSummary()
  loadCoupons()
})
</script>

<template>
  <view class="coupon-page min-h-screen text-slate-900">
    <scroll-view scroll-y class="h-screen">
      <view class="px-4 pb-10 pt-4">
        <view class="summary-card">
          <view class="relative z-10">
            <text class="block text-[22rpx] text-[#8b5c11] font-bold tracking-[0.3em]">
              COUPON WALLET
            </text>
            <view class="mt-4 flex items-end gap-2">
              <text class="text-[64rpx] text-[#8b5c11] font-extrabold leading-none">
                {{ summary.unusedCount }}
              </text>
              <text class="pb-1 text-sm text-[#8b5c11]/80 font-semibold">
                张待使用
              </text>
            </view>
            <text class="mt-3 block max-w-[460rpx] text-xs text-[#8b5c11]/80 leading-5">
              已领取的券都会保存在这里，支付前可自动查看门槛和有效期。
            </text>

            <view class="mt-5 flex flex-wrap gap-3">
              <view class="stat-pill">
                可领 {{ summary.claimableCount }}
              </view>
              <view class="stat-pill">
                已使用 {{ summary.usedCount }}
              </view>
              <view class="stat-pill">
                已过期 {{ summary.expiredCount }}
              </view>
            </view>

            <view class="mt-5 inline-flex items-center gap-2 rounded-full bg-[#efb239] px-5 py-3 text-sm text-white font-bold" @click="openCouponCenter">
              去领券中心
              <text class="i-material-symbols:arrow-forward text-[18px] leading-none" />
            </view>
          </view>
          <view class="summary-card__stars">
            <text class="i-material-symbols:redeem text-[116rpx] text-[#8b5c11] leading-none" />
          </view>
        </view>

        <view class="mt-5 flex rounded-full bg-[#ebe2d6] p-1.5">
          <view
            v-for="tab in tabs"
            :key="tab.key"
            class="flex-1 rounded-full px-2 py-2.5 text-center text-sm font-bold transition-all"
            :class="currentTab === tab.key ? 'bg-[#efb239] text-white shadow-[0_10px_20px_rgba(239,178,57,0.28)]' : 'text-slate-500'"
            @click="switchTab(tab.key)"
          >
            {{ tab.label }}
          </view>
        </view>

        <view class="mt-4 flex items-center justify-between px-1">
          <text class="text-sm text-slate-500">
            共 {{ currentCount }} 张
          </text>
          <text v-if="currentTab === 'UNUSED'" class="text-xs text-[#c98500]">
            先用快过期的券更划算
          </text>
        </view>

        <view
          v-if="coupons.length === 0"
          class="mt-8 rounded-[32rpx] border border-[#efb239]/10 bg-white/75 px-8 py-12 text-center"
        >
          <text class="i-material-symbols:confirmation-number text-[72rpx] text-[#efb239]/35 leading-none" />
          <text class="mt-4 block text-base font-bold">
            暂无优惠券
          </text>
          <text class="mt-2 block text-sm text-slate-400">
            去领券中心看看有没有适合你的活动券
          </text>
          <view class="mt-5 inline-flex rounded-full bg-[#efb239] px-5 py-3 text-sm text-white font-bold" @click="openCouponCenter">
            立即领券
          </view>
        </view>

        <template v-else>
          <view v-for="item in coupons" :key="item.id" class="coupon-card" :class="getCardClass(item.status)">
          <view class="coupon-card__left" :class="item.status === 'UNUSED' ? 'bg-[#efb239]/8' : 'bg-white/50'">
            <text class="i-material-symbols:confirmation-number text-[40rpx] leading-none" :class="item.status === 'UNUSED' ? 'text-[#efb239]' : 'text-slate-400'" />
            <view class="mt-3 flex items-end gap-1">
              <text class="text-sm font-bold" :class="item.status === 'UNUSED' ? 'text-[#8b5c11]' : 'text-slate-500'">
                ¥
              </text>
              <text class="text-[52rpx] font-extrabold leading-none" :class="item.status === 'UNUSED' ? 'text-[#8b5c11]' : 'text-slate-500'">
                {{ getAmountText(item) }}
              </text>
            </view>
            <text class="mt-2 text-[22rpx] font-bold tracking-[0.25em]" :class="item.status === 'UNUSED' ? 'text-[#c98500]' : 'text-slate-400'">
              OFF
            </text>
          </view>

          <view class="coupon-card__cutout" />

          <view class="min-w-0 flex-1 px-5 py-4">
            <view class="flex items-start justify-between gap-3">
              <view class="min-w-0">
                <text class="line-clamp-1 block text-base font-bold">
                  {{ item.name }}
                </text>
                <text class="mt-1 block text-xs text-slate-500">
                  {{ item.thresholdLabel }}
                </text>
              </view>
              <view class="rounded-full px-3 py-1 text-[20rpx] font-bold" :class="getStatusBadgeClass(item.status)">
                {{ item.statusText }}
              </view>
            </view>

            <view class="mt-4 rounded-2xl bg-[#f8f7f6] px-3 py-2 text-[22rpx] text-slate-500 leading-5">
              {{ item.description || '指定商品可用，不与其他满减叠加。' }}
            </view>

            <view class="mt-4 flex items-center justify-between gap-3">
              <view class="min-w-0">
                <text class="block text-[22rpx] text-slate-400">
                  {{ item.sourceText }}
                </text>
                <text class="mt-1 block text-[22rpx] text-slate-500">
                  {{ item.validPeriodText }}
                </text>
                <text v-if="item.isExpiringSoon" class="mt-1 block text-[22rpx] text-[#ef4444] font-semibold">
                  即将到期，请尽快使用
                </text>
              </view>
              <view
                v-if="item.status === 'UNUSED'"
                class="shrink-0 rounded-full bg-[#efb239] px-4 py-2 text-xs text-white font-bold"
                @click="useCoupon"
              >
                去使用
              </view>
            </view>
          </view>
        </template>
      </view>
    </scroll-view>
  </view>
</template>

<style scoped>
.coupon-page {
  background:
    radial-gradient(circle at top right, rgba(239, 178, 57, 0.14), transparent 28%),
    linear-gradient(180deg, #f8f7f6 0%, #f5f0e8 100%);
}

.summary-card {
  position: relative;
  overflow: hidden;
  border-radius: 36rpx;
  background: linear-gradient(135deg, #fde9be 0%, #f7d786 100%);
  padding: 36rpx;
  box-shadow: 0 18px 34px rgba(174, 118, 14, 0.12);
}

.summary-card__stars {
  position: absolute;
  right: -10rpx;
  bottom: -8rpx;
  opacity: 0.12;
}

.stat-pill {
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.7);
  padding: 12rpx 22rpx;
  color: #8b5c11;
  font-size: 22rpx;
  font-weight: 700;
}

.coupon-card {
  position: relative;
  display: flex;
  margin-top: 24rpx;
  overflow: hidden;
  border: 1px solid;
  border-radius: 32rpx;
}

.coupon-card__left {
  display: flex;
  width: 200rpx;
  flex-shrink: 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-right: 1px dashed rgba(148, 163, 184, 0.35);
  padding: 28rpx 18rpx;
}

.coupon-card__cutout {
  position: absolute;
  left: 200rpx;
  top: 50%;
  width: 28rpx;
  height: 28rpx;
  transform: translate(-50%, -50%);
  border-radius: 9999px;
  background: #f5f0e8;
}

.line-clamp-1 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  overflow: hidden;
}
</style>
