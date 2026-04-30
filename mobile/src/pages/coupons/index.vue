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
  scopeText?: string
  sceneTypeText?: string
  useScopeTypeText?: string
  endTime?: string
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
const { topAreaHeight } = usePlatform()
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
const pageContentHeight = computed(() => `calc(100vh - ${topAreaHeight}px)`)

const currentCount = computed(() => {
  if (currentTab.value === 'USED') {
    return summary.value.usedCount
  }
  if (currentTab.value === 'EXPIRED') {
    return summary.value.expiredCount
  }
  return summary.value.unusedCount
})

function getCardClass(status: CouponTab) {
  return status === 'UNUSED'
    ? 'coupon-card--active'
    : 'coupon-card--muted'
}

function openCouponCenter() {
  router.push({ name: 'coupon-center' })
}

function useCoupon() {
  router.pushTab({ name: 'home' })
}

function formatDateTime(value?: string) {
  if (!value) {
    return ''
  }

  const rangeParts = value.split(' - ')
  const target = rangeParts.length > 1 ? rangeParts[1] : value
  return target.trim()
}

function getExpireText(item: CouponItem) {
  const endTimeText = formatDateTime(item.validPeriodText)
  return endTimeText ? `${endTimeText} 前使用有效` : item.validPeriodText
}

function getSceneType(item: CouponItem) {
  return item.sceneTypeText || '通用活动'
}

function getLeftRuleText(item: CouponItem) {
  return item.discountAmount > 0
    ? `¥${Number(item.discountAmount || 0).toFixed(Number(item.discountAmount || 0) % 1 === 0 ? 0 : 2)}`
    : item.discountLabel || item.thresholdLabel
}

function openCouponDetail(item: CouponItem) {
  router.push({
    name: 'coupon-center-detail',
    params: {
      id: String(item.id),
      source: 'wallet',
      status: item.status,
    },
  })
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
  <view class="coupon-page flex flex-col overflow-hidden text-slate-900" :style="{ height: pageContentHeight }">
    <scroll-view class="h-full min-h-0 flex-1" scroll-y>
      <view class="px-4 pt-4">
        <view class="summary-card">
          <view class="relative z-10">
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

        <view
          v-if="coupons.length === 0"
          class="mt-4 rounded-[32rpx] border border-[#efb239]/10 bg-white/75 px-8 py-12 text-center"
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
            <view class="coupon-card__left">
              <text class="coupon-card__rule">
                {{ getLeftRuleText(item) }}
              </text>
              <text class="coupon-card__threshold">
                {{ item.thresholdAmount > 0 ? `满${Number(item.thresholdAmount || 0).toFixed(0)}可用` : '无门槛可用' }}
              </text>
            </view>

            <view class="coupon-card__divider" />
            <view class="coupon-card__cutout coupon-card__cutout--top" />
            <view class="coupon-card__cutout coupon-card__cutout--bottom" />

            <view class="coupon-card__right">
              <view class="min-w-0 flex-1">
                <view class="flex items-center gap-2 min-w-0">
                  <text class="line-clamp-1 min-w-0 flex-1 text-[28rpx] font-bold leading-[1.35] text-slate-900">
                    {{ item.name }}
                  </text>
                  <text class="coupon-card__scene-tag">{{ getSceneType(item) }}</text>
                </view>
                <text class="coupon-card__expire">
                  有效期至 {{ getExpireText(item).replace(' 前使用有效', '') }}
                </text>
              </view>

              <view class="coupon-card__bottom">
                <view class="flex-1" />
                <view class="coupon-card__actions">
                  <view class="coupon-card__ghost-action" @click="openCouponDetail(item)">
                    查看详情
                  </view>
                  <view
                    v-if="item.status === 'UNUSED'"
                    class="coupon-card__primary-action"
                    @click="useCoupon"
                  >
                    去使用
                  </view>
                </view>
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
  right: 12rpx;
  bottom: 10rpx;
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
  align-items: stretch;
  margin-top: 24rpx;
  overflow: hidden;
  border-radius: 34rpx;
  background: #fff;
  box-shadow:
    0 18px 38px rgba(243, 146, 57, 0.12),
    0 4px 14px rgba(15, 23, 42, 0.05);
}

.coupon-card--active {
  border: 1px solid rgba(251, 146, 60, 0.22);
}

.coupon-card--muted {
  border: 1px solid rgba(203, 213, 225, 0.7);
  background: #fff;
}

.coupon-card__left {
  position: relative;
  display: flex;
  width: 240rpx;
  flex-shrink: 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 34rpx 20rpx;
  text-align: center;
  background: linear-gradient(135deg, rgba(255, 241, 228, 0.98) 0%, rgba(255, 249, 243, 1) 100%);
}

.coupon-card__rule {
  display: block;
  color: #ff7a00;
  font-size: 68rpx;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.04em;
  word-break: break-word;
}

.coupon-card__threshold {
  display: block;
  margin-top: 14rpx;
  color: #ff7a00;
  font-size: 20rpx;
  font-weight: 700;
  line-height: 1.45;
}

.coupon-card__divider {
  position: relative;
  z-index: 1;
  width: 0;
  flex-shrink: 0;
  border-right: 2rpx dashed rgba(251, 146, 60, 0.32);
}

.coupon-card__cutout {
  position: absolute;
  left: 240rpx;
  z-index: 2;
  width: 38rpx;
  height: 38rpx;
  border-radius: 9999px;
  background: #f8f7f6;
  transform: translateX(-50%);
}

.coupon-card__cutout--top {
  top: -19rpx;
}

.coupon-card__cutout--bottom {
  bottom: -19rpx;
}

.coupon-card__right {
  min-width: 0;
  flex: 1;
  padding: 26rpx 24rpx 22rpx 28rpx;
}

.coupon-card__scene-tag {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  max-width: 180rpx;
  overflow: hidden;
  border-radius: 9999px;
  background: #fff1e8;
  padding: 8rpx 16rpx;
  color: #ff7a00;
  font-size: 20rpx;
  font-weight: 700;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.coupon-card__expire {
  display: block;
  margin-top: 14rpx;
  color: #94a3b8;
  font-size: 20rpx;
  line-height: 1.35;
}

.coupon-card__bottom {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24rpx;
  margin-top: 24rpx;
  padding-top: 20rpx;
  border-top: 1px dashed rgba(251, 146, 60, 0.22);
}

.coupon-card__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12rpx;
}

.coupon-card__ghost-action,
.coupon-card__primary-action {
  border-radius: 9999px;
  padding: 12rpx 20rpx;
  font-size: 20rpx;
  font-weight: 700;
  line-height: 1;
  text-align: center;
}

.coupon-card__ghost-action {
  border: 1px solid rgba(245, 158, 11, 0.22);
  background: #fff;
  color: #f59e0b;
}

.coupon-card__primary-action {
  min-width: auto;
  background: linear-gradient(135deg, #ff8f2a 0%, #ff7a00 100%);
  color: #fff;
  box-shadow: 0 10px 20px rgba(255, 122, 0, 0.18);
}

.line-clamp-1 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  overflow: hidden;
}
</style>
