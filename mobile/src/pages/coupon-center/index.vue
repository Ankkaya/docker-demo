<script setup lang="ts">
/**
 * 领券中心列表页
 */

interface CouponCenterItem {
  id: number
  name: string
  sceneType?: string
  sceneTypeText?: string
  endTime?: string
  validPeriodText: string
  useScopeType?: string
  useScopeTypeText?: string
  scopeText: string
  issueScopeText: string
  channelScope: string[]
}

const COUPON_CENTER_DETAIL_CACHE_KEY = 'coupon-center-detail-cache'

definePage({
  name: 'coupon-center',
  layout: 'default',
  style: {
    navigationBarTitleText: '领券中心',
    navigationStyle: 'custom',
  },
  needLogin: true,
})

const router = useRouter()
const { topAreaHeight } = usePlatform()
const coupons = ref<CouponCenterItem[]>([])
const loading = ref(false)
const pageContentHeight = computed(() => `calc(100vh - ${topAreaHeight}px)`)

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

function openCouponDetail(item: CouponCenterItem) {
  uni.setStorageSync(COUPON_CENTER_DETAIL_CACHE_KEY, item)
  router.push({
    name: 'coupon-center-detail',
    params: {
      id: String(item.id),
    },
  })
}

async function loadCoupons() {
  loading.value = true
  try {
    const result = await alovaInstance.Get('/mall/coupons/center', {
      params: {
        page: 1,
        pageSize: 50,
      },
    }).send() as { data?: CouponCenterItem[] }
    coupons.value = Array.isArray(result?.data) ? result.data : []
  }
  catch {
    coupons.value = []
  }
  finally {
    loading.value = false
  }
}

onShow(() => {
  loadCoupons()
})
</script>

<template>
  <view class="coupon-center-page flex flex-col overflow-hidden text-slate-900" :style="{ height: pageContentHeight }">
    <scroll-view scroll-y class="h-full min-h-0 flex-1">
      <view class="px-4 pb-12 pt-4">
        <view
          v-if="coupons.length === 0 && !loading"
          class="rounded-[32rpx] border border-[#efb239]/10 bg-white/80 px-8 py-12 text-center"
        >
          <text class="i-material-symbols:redeem text-[72rpx] text-[#efb239]/35 leading-none" />
          <text class="mt-4 block text-base font-bold">
            暂无可领取优惠券
          </text>
          <text class="mt-2 block text-sm text-slate-400">
            活动券上新后会第一时间出现在这里
          </text>
        </view>

        <template v-else>
          <view v-for="item in coupons" :key="item.id" class="coupon-list-card">
            <view class="min-w-0 flex-1">
              <view class="flex items-center gap-2.5">
                <text class="coupon-list-card__tag">
                  {{ getSceneType(item) }}
                </text>
                <text class="line-clamp-1 min-w-0 flex-1 text-[30rpx] font-bold leading-[1.4]">
                  {{ item.name }}
                </text>
              </view>
              <text class="mt-3 block text-[22rpx] text-slate-500">
                {{ getExpireText(item) }}
              </text>
            </view>

            <view class="coupon-list-card__action" @click="openCouponDetail(item)">
              去查看
            </view>
          </view>
        </template>
      </view>
    </scroll-view>
  </view>
</template>

<style scoped>
.coupon-center-page {
  background:
    radial-gradient(circle at top right, rgba(239, 178, 57, 0.14), transparent 28%),
    linear-gradient(180deg, #f8f7f6 0%, #f3eee7 100%);
}

.coupon-list-card {
  display: flex;
  align-items: center;
  gap: 24rpx;
  margin-top: 24rpx;
  border: 1px solid rgba(239, 178, 57, 0.1);
  border-radius: 32rpx;
  background: rgba(255, 255, 255, 0.96);
  padding: 28rpx;
  box-shadow: 0 12px 26px rgba(15, 23, 42, 0.05);
}

.coupon-list-card__action {
  flex-shrink: 0;
  min-width: 144rpx;
  border-radius: 9999px;
  background: #efb239;
  padding: 18rpx 24rpx;
  color: #fff;
  font-size: 24rpx;
  font-weight: 700;
  line-height: 1;
  text-align: center;
  box-shadow: 0 10px 20px rgba(239, 178, 57, 0.22);
}

.coupon-list-card__tag {
  flex-shrink: 0;
  max-width: 220rpx;
  overflow: hidden;
  border-radius: 9999px;
  background: #fff4d8;
  padding: 8rpx 18rpx;
  color: #c98500;
  font-size: 20rpx;
  font-weight: 700;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.line-clamp-1 {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
}
</style>
