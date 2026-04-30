<script setup lang="ts">
/**
 * 优惠券详情页
 */

interface CouponCenterItem {
  id: number
  couponId?: number
  name: string
  sceneType?: string
  sceneTypeText?: string
  code: string
  discountAmount: number
  thresholdAmount: number
  discountLabel: string
  thresholdLabel: string
  remainingCount: number | null
  claimedCount: number
  canClaim: boolean
  actionText: string
  tagText: string | null
  startTime: string
  endTime: string
  validPeriodText: string
  description: string | null
  useScopeType?: string
  useScopeTypeText?: string
  scopeText: string
  scopeDetailText?: string | null
  issueScopeText: string
  channelScope: string[]
  status?: string
  statusText?: string
}

type CouponDetailSource = 'center' | 'wallet'

definePage({
  name: 'coupon-center-detail',
  layout: 'default',
  style: {
    navigationBarTitleText: '优惠券详情',
    navigationStyle: 'custom',
  },
  needLogin: true,
})

const router = useRouter()
const toast = useToast()
const { topAreaHeight } = usePlatform()
const couponId = ref(0)
const detail = ref<CouponCenterItem | null>(null)
const detailSource = ref<CouponDetailSource>('center')
const walletStatus = ref('UNUSED')
const loading = ref(false)
const claiming = ref(false)
const loadError = ref('')
const pageContentHeight = computed(() => `calc(100vh - ${topAreaHeight}px)`)
const footerActionText = computed(() => detailSource.value === 'wallet' ? '去使用' : detail.value?.actionText || '立即领取')
const footerActionDisabled = computed(() => {
  if (!detail.value) {
    return true
  }
  if (detailSource.value === 'wallet') {
    return detail.value.status !== 'UNUSED'
  }
  return !detail.value.canClaim
})

function getSceneType(item: CouponCenterItem) {
  const sceneTypeText = typeof item.sceneTypeText === 'string' ? item.sceneTypeText.trim() : ''
  const scopeText = typeof item.scopeText === 'string' ? item.scopeText.trim() : ''
  const issueScopeText = typeof item.issueScopeText === 'string' ? item.issueScopeText.trim() : ''

  if (sceneTypeText) {
    return sceneTypeText
  }

  if (scopeText) {
    return scopeText
  }

  if (issueScopeText) {
    return issueScopeText
  }

  if (Array.isArray(item.channelScope) && item.channelScope.length) {
    return item.channelScope.join(' / ')
  }

  return '通用场景'
}

function getUseScopeTypeText(item: CouponCenterItem) {
  const useScopeTypeText = typeof item.useScopeTypeText === 'string' ? item.useScopeTypeText.trim() : ''
  if (useScopeTypeText) {
    return useScopeTypeText
  }

  const scopeText = typeof item.scopeText === 'string' ? item.scopeText.trim() : ''
  return scopeText || '全场通用'
}

function formatDateTime(value?: string) {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mi = String(date.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`
}

function getExpireText(item: CouponCenterItem) {
  const endTimeText = formatDateTime(item.endTime)
  if (endTimeText) {
    return `${endTimeText} 前使用有效`
  }

  return item.validPeriodText
}

function getDisplayDescription(item: CouponCenterItem) {
  return item.description || '领取后可在有效期内按门槛使用，具体以下单结算页展示规则为准。'
}

async function loadCouponDetail() {
  if (!couponId.value) {
    loadError.value = '缺少优惠券ID'
    detail.value = null
    return
  }

  loading.value = true
  loadError.value = ''
  try {
    detail.value = await alovaInstance.Get(`/mall/coupons/${couponId.value}`, {
      params: {
        source: detailSource.value,
        ...(detailSource.value === 'wallet' ? { status: walletStatus.value } : {}),
      },
      showLoading: false,
    }).send() as CouponCenterItem
  }
  catch {
    detail.value = null
    loadError.value = '加载优惠券详情失败'
  }
  finally {
    loading.value = false
  }
}

async function claimCoupon() {
  if (!detail.value?.canClaim || claiming.value) {
    return
  }

  claiming.value = true
  try {
    const result = await (Apis.general as any).MallCouponsController_claimCoupon({
      pathParams: { id: detail.value.id },
    }).send() as { message?: string }
    toast.success(result?.message || '领取成功')
    const nextRemainingCount = detail.value.remainingCount === null
      ? null
      : Math.max(Number(detail.value.remainingCount || 0) - 1, 0)
    const nextClaimedCount = Number(detail.value.claimedCount || 0) + 1
    const nextCanClaim = nextRemainingCount !== 0

    detail.value = {
      ...detail.value,
      claimedCount: nextClaimedCount,
      remainingCount: nextRemainingCount,
      canClaim: nextCanClaim,
      actionText: nextCanClaim ? '立即领取' : '已领完',
      tagText: '已入券包',
    }
  }
  catch {
  }
  finally {
    claiming.value = false
  }
}

function useCoupon() {
  if (footerActionDisabled.value) {
    return
  }
  router.pushTab({ name: 'home' })
}

onLoad((options) => {
  detailSource.value = (options?.source || options?.params?.source || 'center') as CouponDetailSource
  walletStatus.value = String(options?.status || options?.params?.status || 'UNUSED')
  couponId.value = Number(options?.id || options?.params?.id || 0)
  loadCouponDetail()
})
</script>

<template>
  <view class="coupon-detail-page flex flex-col overflow-hidden text-slate-900" :style="{ height: pageContentHeight }">
    <scroll-view scroll-y class="h-full min-h-0 flex-1">
      <view class="px-4 pb-8 pt-4">
        <view v-if="loadError" class="coupon-detail-empty">
          <text class="block text-base font-bold">
            {{ loadError }}
          </text>
          <view class="coupon-detail-empty__action" @click="loadCouponDetail">
            重新加载
          </view>
        </view>

        <template v-else-if="detail">
          <view class="coupon-detail-hero">
            <view class="flex items-start justify-between gap-3">
              <view class="min-w-0 flex-1">
                <text class="block text-[34rpx] font-bold leading-[1.4]">
                  {{ detail.name }}
                </text>
                <text class="mt-2 block text-[22rpx] text-[#8b5c11]/75">
                  券码：{{ detail.code }}
                </text>
              </view>
              <view v-if="detail.tagText" class="coupon-detail-hero__tag">
                {{ detail.tagText }}
              </view>
            </view>

            <view class="mt-6 flex items-end gap-2">
              <text class="text-[64rpx] text-[#8b5c11] font-extrabold leading-none">
                {{ detail.discountLabel }}
              </text>
            </view>
            <text class="mt-3 block text-[24rpx] text-[#8b5c11]/85 leading-6">
              {{ detail.thresholdLabel }}
            </text>
          </view>

          <view class="coupon-detail-section">
            <view class="coupon-detail-row">
              <text class="coupon-detail-row__label">过期时间</text>
              <text class="coupon-detail-row__value">{{ getExpireText(detail) }}</text>
            </view>
            <view class="coupon-detail-row">
              <text class="coupon-detail-row__label">场景类型</text>
              <text class="coupon-detail-row__value">{{ getSceneType(detail) }}</text>
            </view>
            <view class="coupon-detail-row">
              <text class="coupon-detail-row__label">使用范围</text>
              <text class="coupon-detail-row__value">{{ getUseScopeTypeText(detail) }}</text>
            </view>
            <view class="coupon-detail-row">
              <text class="coupon-detail-row__label">范围说明</text>
              <text class="coupon-detail-row__value">{{ detail.scopeDetailText || '-' }}</text>
            </view>
            <view class="coupon-detail-row">
              <text class="coupon-detail-row__label">剩余数量</text>
              <text class="coupon-detail-row__value">{{ detail.remainingCount === null ? '不限量' : `${detail.remainingCount} 张` }}</text>
            </view>
            <view class="coupon-detail-row">
              <text class="coupon-detail-row__label">已领取次数</text>
              <text class="coupon-detail-row__value">{{ detail.claimedCount }} 次</text>
            </view>
          </view>

          <view class="coupon-detail-section">
            <text class="coupon-detail-section__title">
              优惠券说明
            </text>
            <text class="coupon-detail-section__desc">
              {{ getDisplayDescription(detail) }}
            </text>
          </view>
        </template>

        <view v-else-if="loading" class="coupon-detail-empty">
          <text class="block text-base font-bold">
            加载中...
          </text>
        </view>
      </view>
    </scroll-view>

    <view v-if="detail" class="coupon-detail-footer">
      <view
        class="coupon-detail-footer__action"
        :class="footerActionDisabled ? 'coupon-detail-footer__action--disabled' : 'coupon-detail-footer__action--active'"
        @click="detailSource === 'wallet' ? useCoupon() : claimCoupon()"
      >
        {{ detailSource === 'wallet' ? footerActionText : (claiming ? '领取中...' : footerActionText) }}
      </view>
    </view>
  </view>
</template>

<style scoped>
.coupon-detail-page {
  background:
    radial-gradient(circle at top right, rgba(239, 178, 57, 0.14), transparent 28%),
    linear-gradient(180deg, #f8f7f6 0%, #f3eee7 100%);
}

.coupon-detail-hero {
  overflow: hidden;
  border-radius: 36rpx;
  background: linear-gradient(135deg, #fde9be 0%, #f7d786 100%);
  padding: 34rpx;
  box-shadow: 0 18px 34px rgba(174, 118, 14, 0.12);
}

.coupon-detail-hero__tag {
  flex-shrink: 0;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.7);
  padding: 10rpx 20rpx;
  color: #8b5c11;
  font-size: 20rpx;
  font-weight: 700;
}

.coupon-detail-section {
  margin-top: 24rpx;
  border-radius: 32rpx;
  background: rgba(255, 255, 255, 0.96);
  padding: 28rpx;
  box-shadow: 0 12px 26px rgba(15, 23, 42, 0.05);
}

.coupon-detail-section__title {
  display: block;
  color: #0f172a;
  font-size: 28rpx;
  font-weight: 700;
  line-height: 1.4;
}

.coupon-detail-section__desc {
  display: block;
  margin-top: 16rpx;
  color: #64748b;
  font-size: 24rpx;
  line-height: 1.7;
}

.coupon-detail-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24rpx;
}

.coupon-detail-row + .coupon-detail-row {
  margin-top: 22rpx;
  padding-top: 22rpx;
  border-top: 1px solid rgba(226, 232, 240, 0.7);
}

.coupon-detail-row__label {
  flex-shrink: 0;
  color: #94a3b8;
  font-size: 24rpx;
  line-height: 1.6;
}

.coupon-detail-row__value {
  min-width: 0;
  flex: 1;
  color: #334155;
  font-size: 24rpx;
  line-height: 1.6;
  text-align: right;
  word-break: break-word;
}

.coupon-detail-empty {
  border: 1px solid rgba(239, 178, 57, 0.1);
  border-radius: 32rpx;
  background: rgba(255, 255, 255, 0.88);
  padding: 80rpx 40rpx;
  color: #64748b;
  text-align: center;
}

.coupon-detail-empty__action {
  display: inline-flex;
  margin-top: 28rpx;
  border-radius: 9999px;
  background: #efb239;
  padding: 18rpx 28rpx;
  color: #fff;
  font-size: 24rpx;
  font-weight: 700;
  line-height: 1;
}

.coupon-detail-footer {
  border-top: 1px solid rgba(239, 178, 57, 0.08);
  background: rgba(255, 255, 255, 0.96);
  padding: 20rpx 24rpx 32rpx;
}

.coupon-detail-footer__action {
  border-radius: 9999px;
  padding: 24rpx;
  font-size: 28rpx;
  font-weight: 700;
  line-height: 1;
  text-align: center;
}

.coupon-detail-footer__action--active {
  background: #efb239;
  color: #fff;
  box-shadow: 0 14px 28px rgba(239, 178, 57, 0.24);
}

.coupon-detail-footer__action--disabled {
  background: #e2e8f0;
  color: #64748b;
}
</style>
