<script setup lang="ts">
/**
 * 领券中心页面 - 参考 Stitch 设计稿
 */

interface CouponSummary {
  unusedCount: number
  usedCount: number
  expiredCount: number
  claimableCount: number
}

interface CouponCenterItem {
  id: number
  name: string
  discountAmount: number
  thresholdAmount: number
  discountLabel: string
  thresholdLabel: string
  remainingCount: number | null
  claimedCount: number
  canClaim: boolean
  actionText: string
  tagText: string | null
  validPeriodText: string
  description: string | null
}

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
const summary = ref<CouponSummary>({
  unusedCount: 0,
  usedCount: 0,
  expiredCount: 0,
  claimableCount: 0,
})
const coupons = ref<CouponCenterItem[]>([])
const loading = ref(false)
const claimingId = ref<number | null>(null)

const availableCount = computed(() => coupons.value.filter(item => item.canClaim).length)

function getAmountText(item: CouponCenterItem) {
  return Number(item.discountAmount || 0).toFixed(Number(item.discountAmount || 0) % 1 === 0 ? 0 : 2)
}

function openWallet() {
  router.back()
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

async function claimCoupon(item: CouponCenterItem) {
  if (!item.canClaim || claimingId.value) {
    return
  }

  claimingId.value = item.id
  try {
    const result = await alovaInstance.Post(`/mall/coupons/${item.id}/claim`).send() as { message?: string }
    uni.showToast({ title: result?.message || '领取成功', icon: 'success' })
    await Promise.all([loadSummary(), loadCoupons()])
  }
  catch (error: any) {
    uni.showToast({ title: error?.message || '领取失败', icon: 'none' })
  }
  finally {
    claimingId.value = null
  }
}

onShow(() => {
  loadSummary()
  loadCoupons()
})
</script>

<template>
  <view class="coupon-center-page min-h-screen text-slate-900">
    <scroll-view scroll-y class="h-screen">
      <view class="px-4 pb-12 pt-4">
        <view class="hero-card">
          <view class="relative z-10">
            <text class="block text-[22rpx] text-[#8b5c11] font-bold tracking-[0.28em]">
              REWARD CENTER
            </text>
            <view class="mt-4 flex items-end gap-2">
              <text class="text-[64rpx] text-[#8b5c11] font-extrabold leading-none">
                {{ summary.unusedCount }}
              </text>
              <text class="pb-1 text-sm text-[#8b5c11]/80 font-semibold">
                张已入券包
              </text>
            </view>
            <text class="mt-3 block max-w-[500rpx] text-xs text-[#8b5c11]/80 leading-5">
              限时活动券和新人券会集中展示在这里，领取后自动同步到“我的优惠券”。
            </text>

            <view class="mt-5 flex flex-wrap gap-3">
              <view class="hero-pill">
                当前可领 {{ availableCount }}
              </view>
              <view class="hero-pill">
                待使用 {{ summary.unusedCount }}
              </view>
              <view class="hero-pill">
                累计已用 {{ summary.usedCount }}
              </view>
            </view>

            <view class="mt-5 inline-flex items-center gap-2 rounded-full bg-white/80 px-5 py-3 text-sm text-[#8b5c11] font-bold" @click="openWallet">
              查看我的优惠券
              <text class="i-material-symbols:arrow-forward text-[18px] leading-none" />
            </view>
          </view>
          <view class="hero-card__icon">
            <text class="i-material-symbols:redeem text-[128rpx] text-[#8b5c11] leading-none" />
          </view>
        </view>

        <view class="mt-6 flex items-center justify-between px-1">
          <text class="text-lg font-bold">
            可领取优惠券
          </text>
          <text class="text-xs text-[#c98500] font-semibold">
            共 {{ coupons.length }} 张活动券
          </text>
        </view>

        <view v-if="loading" class="mt-10 text-center text-sm text-slate-400">
          加载中...
        </view>

        <view
          v-else-if="coupons.length === 0"
          class="mt-8 rounded-[32rpx] border border-[#efb239]/10 bg-white/80 px-8 py-12 text-center"
        >
          <text class="i-material-symbols:redeem text-[72rpx] text-[#efb239]/35 leading-none" />
          <text class="mt-4 block text-base font-bold">
            暂无可领取优惠券
          </text>
          <text class="mt-2 block text-sm text-slate-400">
            活动券上新后会第一时间出现在这里
          </text>
        </view>

        <view v-for="item in coupons" :key="item.id" class="offer-card">
          <view class="flex items-start justify-between gap-3">
            <view class="offer-card__icon">
              <text class="i-material-symbols:local-mall text-[34rpx] text-[#efb239] leading-none" />
            </view>
            <view v-if="item.tagText" class="rounded-full bg-[#fef1cf] px-3 py-1 text-[20rpx] text-[#c98500] font-bold">
              {{ item.tagText }}
            </view>
          </view>

          <view class="mt-4">
            <text class="block text-lg font-bold">
              {{ item.name }}
            </text>
            <text class="mt-2 block text-[54rpx] text-[#8b5c11] font-extrabold leading-none">
              {{ item.discountLabel }}
            </text>
            <text class="mt-2 block text-sm text-slate-500 leading-6">
              {{ item.thresholdLabel }}
            </text>
          </view>

          <view class="mt-4 rounded-2xl bg-[#f8f7f6] px-4 py-3 text-[24rpx] text-slate-500 leading-5">
            {{ item.description || '活动券数量有限，领取后在有效期内下单即可使用。' }}
          </view>

          <view class="mt-5 flex items-center justify-between gap-4 border-t border-dashed border-[#e2ddd3] pt-4">
            <view class="min-w-0">
              <text class="block text-[22rpx] text-slate-400">
                有效期 {{ item.validPeriodText }}
              </text>
              <text class="mt-1 block text-[22rpx] text-slate-500">
                {{ item.remainingCount === null ? '不限量发放' : `剩余 ${item.remainingCount} 张` }} · 已领 {{ item.claimedCount }} 次
              </text>
            </view>
            <view
              class="shrink-0 rounded-full px-5 py-3 text-sm font-bold"
              :class="item.canClaim ? 'bg-[#efb239] text-white shadow-[0_10px_20px_rgba(239,178,57,0.28)]' : 'bg-slate-200 text-slate-500'"
              @click="claimCoupon(item)"
            >
              {{ claimingId === item.id ? '领取中...' : item.actionText }}
            </view>
          </view>
        </view>
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

.hero-card {
  position: relative;
  overflow: hidden;
  border-radius: 40rpx;
  background: linear-gradient(135deg, #fde9be 0%, #f6d47f 100%);
  padding: 36rpx;
  box-shadow: 0 18px 34px rgba(174, 118, 14, 0.12);
}

.hero-card__icon {
  position: absolute;
  right: -14rpx;
  bottom: -10rpx;
  opacity: 0.12;
}

.hero-pill {
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.68);
  padding: 12rpx 22rpx;
  color: #8b5c11;
  font-size: 22rpx;
  font-weight: 700;
}

.offer-card {
  margin-top: 24rpx;
  border: 1px solid rgba(239, 178, 57, 0.08);
  border-radius: 32rpx;
  background: #fff;
  padding: 28rpx;
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.05);
}

.offer-card__icon {
  display: flex;
  width: 88rpx;
  height: 88rpx;
  align-items: center;
  justify-content: center;
  border-radius: 28rpx;
  background: rgba(239, 178, 57, 0.1);
}
</style>
