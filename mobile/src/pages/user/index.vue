<script setup lang="ts">
/**
 * 个人中心页面 - 参考 Stitch 设计稿
 */

definePage({
  name: 'user',
  layout: 'default',
  style: {
    navigationBarTitleText: '个人中心',
    navigationStyle: 'custom',
  },
})

const router = useRouter()
const userStore = useUserStore()
const toast = useToast()
const message = useMessage()
const isLoggedIn = computed(() => userStore.isLoggedIn)
const balanceSummary = ref({
  availableBalance: '0.00',
})

const userInfo = computed(() => ({
  name: userStore.displayName,
  level: userStore.isLoggedIn ? '商城会员' : '未登录',
  avatar: userStore.displayAvatar,
}))

const balanceAmountText = computed(() => {
  if (!isLoggedIn.value)
    return '-'

  return `¥${Number(balanceSummary.value.availableBalance || 0).toFixed(2)}`
})

const orderMenus = ref([
  { key: 'pay', label: '待付款', icon: 'account_balance_wallet', badge: '' },
  { key: 'ship', label: '待发货', icon: 'package_2', badge: '' },
  { key: 'receive', label: '待收货', icon: 'local_shipping', badge: '' },
  { key: 'afterSale', label: '售后', icon: 'chat_error', badge: '' },
])

const serviceMenus = ref([
  { key: 'favorites', label: '我的收藏', icon: 'favorite', iconBg: 'bg-[#fce7f3]', iconColor: '#ec4899', extra: '12件商品' },
  { key: 'history', label: '浏览历史', icon: 'history', iconBg: 'bg-[#dbeafe]', iconColor: '#3b82f6', extra: '' },
  { key: 'address', label: '地址管理', icon: 'location_on', iconBg: 'bg-[#dcfce7]', iconColor: '#22c55e', extra: '' },
  { key: 'coupon', label: '优惠券', icon: 'confirmation_number', iconBg: 'bg-[#ffedd5]', iconColor: '#f97316', extra: '3张新券' },
  { key: 'service', label: '客服中心', icon: 'support_agent', iconBg: 'bg-[#f3e8ff]', iconColor: '#a855f7', extra: '' },
])

function openSettings() {
  toast.info('设置开发中')
}

function openLogin() {
  userStore.openAuthPopup()
}

function viewAllOrders() {
  router.push({ name: 'order-list', params: { status: 'all' } })
}

function openBalance() {
  if (!isLoggedIn.value) {
    openLogin()
    return
  }

  router.push({ name: 'balance' })
}

function openRecharge() {
  if (!isLoggedIn.value) {
    openLogin()
    return
  }

  router.push({ name: 'balance-recharge' })
}

function onOrderMenuClick(item: typeof orderMenus.value[number]) {
  const statusMap: Record<string, string> = {
    pay: 'pending',
    ship: 'shipping',
    receive: 'receiving',
    afterSale: 'all',
  }
  router.push({
    name: 'order-list',
    params: { status: statusMap[item.key] || 'all' },
  })
}

function onServiceMenuClick(item: typeof serviceMenus.value[number]) {
  const routeMap: Record<string, string> = {
    favorites: 'favorites',
    history: 'history',
    address: 'address',
    coupon: 'coupons',
  }
  const routeName = routeMap[item.key]
  if (routeName) {
    router.push({ name: routeName })
    return
  }
  toast.info(`${item.label}开发中`)
}

function contactSupport() {
  toast.info('客服功能开发中')
}

function onContactServiceError() {
  toast.error('暂时无法打开客服')
}

function handleLogout() {
  userStore.logout()
  toast.success('已退出登录')
  router.pushTab({ name: 'home' })
}

function confirmLogout() {
  message.show({
    type: 'confirm',
    title: '退出登录',
    msg: '确定要退出当前账号吗？',
    showCancelButton: true,
    cancelButtonText: '取消',
    confirmButtonText: '退出',
    cancelButtonProps: {
      round: false,
    },
    confirmButtonProps: {
      round: false,
    },
  }).then(({ action }) => {
    if (action === 'confirm') {
      handleLogout()
    }
  }).catch(() => {})
}

async function loadBalanceSummary() {
  if (!isLoggedIn.value) {
    balanceSummary.value.availableBalance = '0.00'
    return
  }

  try {
    const result = await (Apis.general as any).MallBalanceController_getSummary({}).send()
    balanceSummary.value.availableBalance = result.availableBalance || '0.00'
  }
  catch {
    balanceSummary.value.availableBalance = userStore.user?.customer?.availableBalance || '0.00'
  }
}

function setOrderMenuBadge(key: string, count: number) {
  const menu = orderMenus.value.find(item => item.key === key)
  if (!menu) {
    return
  }
  menu.badge = count > 0 ? String(count) : ''
}

function resolvePagedTotal(result: any) {
  const metaTotal = Number(result?.meta?.total || 0)
  if (metaTotal > 0) {
    return metaTotal
  }

  return Array.isArray(result?.data) ? result.data.length : 0
}

async function loadOrderMenuStats() {
  if (!isLoggedIn.value) {
    orderMenus.value.forEach((item) => {
      item.badge = ''
    })
    return
  }

  try {
    const [pendingOrders, shippingOrders, receivingOrders] = await Promise.all([
      (Apis.general as any).MallOrdersController_findOrders({
        params: { status: 'pending' },
      }).send(),
      (Apis.general as any).MallOrdersController_findOrders({
        params: { status: 'shipping' },
      }).send(),
      (Apis.general as any).MallOrdersController_findOrders({
        params: { status: 'receiving' },
      }).send(),
    ])

    setOrderMenuBadge('pay', resolvePagedTotal(pendingOrders))
    setOrderMenuBadge('ship', resolvePagedTotal(shippingOrders))
    setOrderMenuBadge('receive', resolvePagedTotal(receivingOrders))
    setOrderMenuBadge('afterSale', 0)
  }
  catch {
    orderMenus.value.forEach((item) => {
      item.badge = ''
    })
  }
}

async function loadServiceMenuStats() {
  const favoriteMenu = serviceMenus.value.find(item => item.key === 'favorites')
  const historyMenu = serviceMenus.value.find(item => item.key === 'history')
  const couponMenu = serviceMenus.value.find(item => item.key === 'coupon')

  if (!isLoggedIn.value) {
    if (favoriteMenu) {
      favoriteMenu.extra = ''
    }
    if (historyMenu) {
      historyMenu.extra = ''
    }
    if (couponMenu) {
      couponMenu.extra = ''
    }
    return
  }

  try {
    const [favoriteResult, historyResult, couponSummary] = await Promise.all([
      (Apis.general as any).MallFavoritesController_findFavorites({
        params: { page: 1, pageSize: 1 },
      }).send(),
      (Apis.general as any).MallBrowseHistoriesController_findHistories({
        params: { page: 1, pageSize: 1 },
      }).send(),
      alovaInstance.Get('/mall/coupons/summary').send() as Promise<any>,
    ])

    if (favoriteMenu) {
      favoriteMenu.extra = `${favoriteResult?.meta?.total || 0}件商品`
    }
    if (historyMenu) {
      const total = Number(historyResult?.meta?.total || 0)
      historyMenu.extra = total > 0 ? `${total}条记录` : ''
    }
    if (couponMenu) {
      const claimableCount = Number(couponSummary?.claimableCount || 0)
      const unusedCount = Number(couponSummary?.unusedCount || 0)
      couponMenu.extra = claimableCount > 0 ? `${claimableCount}张可领` : unusedCount > 0 ? `${unusedCount}张待用` : ''
    }
  }
  catch {
    if (favoriteMenu) {
      favoriteMenu.extra = ''
    }
    if (historyMenu) {
      historyMenu.extra = ''
    }
    if (couponMenu) {
      couponMenu.extra = ''
    }
  }
}

// 订单菜单图标: i-material-symbols:account-balance-wallet i-material-symbols:package-2 i-material-symbols:local-shipping i-material-symbols:chat-error
// 服务菜单图标: i-material-symbols:favorite i-material-symbols:history i-material-symbols:location-on i-material-symbols:confirmation-number i-material-symbols:support-agent

function getOrderIconClass(key: string) {
  const map: Record<string, string> = {
    pay: 'i-material-symbols:account-balance-wallet',
    ship: 'i-material-symbols:package-2',
    receive: 'i-material-symbols:local-shipping',
    afterSale: 'i-material-symbols:chat-error',
  }
  return map[key] || ''
}

function getServiceIconClass(key: string) {
  const map: Record<string, string> = {
    favorites: 'i-material-symbols:favorite',
    history: 'i-material-symbols:history',
    address: 'i-material-symbols:location-on',
    coupon: 'i-material-symbols:confirmation-number',
    service: 'i-material-symbols:support-agent',
  }
  return map[key] || ''
}

onShow(() => {
  loadBalanceSummary()
  loadOrderMenuStats()
  loadServiceMenuStats()
})
</script>

<template>
  <view class="flex flex-col overflow-hidden bg-[#f8f7f6] text-slate-900">
    <scroll-view scroll-y class="flex-1 pb-6">
      <view class="p-6">
        <view class="flex items-center justify-between gap-3">
          <view class="min-w-0 flex items-center gap-4">
            <view
              class="size-20 flex items-center justify-center border-4 rounded-full bg-white"
              :class="isLoggedIn ? 'border-[#efb239]/20' : 'border-white/60 shadow-[0_8px_24px_rgba(15,23,42,0.08)]'"
            >
              <image v-if="userInfo.avatar" :src="userInfo.avatar" class="size-full rounded-full" mode="aspectFill" />
              <text
                v-else class="i-material-symbols:account-circle text-[64px] leading-none"
                :class="isLoggedIn ? 'text-[#efb239]' : 'text-slate-300'"
              />
            </view>
            <view class="min-w-0">
              <template v-if="isLoggedIn">
                <view class="flex items-center gap-1">
                  <text class="max-w-[180px] truncate text-xl font-bold">
                    {{ userInfo.name }}
                  </text>
                  <text class="i-material-symbols:verified text-[16px] text-[#efb239] leading-none" />
                </view>
                <view class="mt-2 inline-flex items-center gap-1 rounded-full bg-[#efb239]/10 px-2 py-1">
                  <text class="i-material-symbols:star text-[12px] text-[#efb239] leading-none" />
                  <text class="text-xs text-[#efb239] font-semibold">
                    {{ userInfo.level }}
                  </text>
                </view>
              </template>

              <template v-else>
                <text class="block text-xl font-bold">
                  未登录
                </text>
                <view class="mt-2 inline-flex items-center gap-1 rounded-full bg-slate-100 py-1">
                  <text class="text-xs text-slate-500 font-medium">
                    登录后可同步购物车、收藏等信息
                  </text>
                </view>
              </template>
            </view>
          </view>

          <template v-if="!isLoggedIn">
            <view
              class="flex shrink-0 items-center rounded-full bg-[#efb239] px-5 py-3 text-sm text-white font-bold shadow-[0_10px_24px_rgba(239,178,57,0.28)]"
              @click="openLogin"
            >
              立即登录
            </view>
          </template>
        </view>
      </view>

      <view class="px-4 pb-2">
        <view class="balance-card" @click="openBalance">
          <view class="flex items-center gap-3">
            <view class="balance-card__icon-wrap">
              <text class="i-material-symbols:account-balance-wallet text-[24px] text-[#efb239] leading-none" />
            </view>
            <view class="min-w-0 flex-1">
              <text class="block text-xs text-slate-400 font-medium">
                我的余额
              </text>
              <text class="mt-2 block text-[30rpx] text-slate-900 font-bold">
                {{ balanceAmountText }}
              </text>
            </view>
          </view>
          <view class="flex items-center gap-3">
            <view class="balance-card__recharge" @click.stop="openRecharge">
              去充值
            </view>
            <text class="i-material-symbols:chevron-right text-[18px] text-slate-300 leading-none" />
          </view>
        </view>
      </view>

      <view class="px-4 py-2">
        <view class="border border-[#efb239]/5 rounded-xl bg-white p-4 shadow-sm">
          <view class="mb-4 flex items-center justify-between">
            <text class="text-base font-bold">
              我的订单
            </text>
            <view class="flex items-center text-xs text-[#efb239]" @click="viewAllOrders">
              全部订单
              <text class="i-material-symbols:chevron-right text-[14px] text-[#efb239] leading-none" />
            </view>
          </view>

          <view class="grid grid-cols-4 gap-2">
            <view
              v-for="item in orderMenus" :key="item.key" class="relative flex flex-col items-center gap-2 py-2"
              @click="onOrderMenuClick(item)"
            >
              <view class="relative rounded-full bg-[#efb239]/10 p-3">
                <text class="text-[20px] text-[#efb239] leading-none" :class="getOrderIconClass(item.key)" />
              </view>
              <text class="text-xs text-slate-600">
                {{ item.label }}
              </text>
              <view
                v-if="isLoggedIn && item.badge"
                class="absolute right-3 top-0 h-4 min-w-4 flex items-center justify-center rounded-full bg-red-500 px-1 text-[10px] text-white font-bold"
              >
                {{ item.badge }}
              </view>
            </view>
          </view>
        </view>
      </view>

      <view class="px-4 py-4">
        <view class="overflow-hidden border border-[#efb239]/5 rounded-xl bg-white shadow-sm">
          <template v-for="item in serviceMenus" :key="item.key">
            <!-- #ifdef MP-WEIXIN -->
            <AppButton
              v-if="item.key === 'service'"
              class="service-row service-row-button"
              custom-class="service-row-button__inner"
              custom-style="display: block; width: 100%; padding: 0; border: 0; border-radius: 0; background: transparent; line-height: inherit; color: inherit;"
              open-type="contact"
              plain
              @error="onContactServiceError"
            >
              <view class="flex items-center justify-between text-slate-900">
                <view class="flex items-center gap-4">
                  <view class="rounded-lg p-2" :class="item.iconBg">
                    <text
                      class="text-[20px] leading-none" :class="getServiceIconClass(item.key)"
                      :style="{ color: item.iconColor }"
                    />
                  </view>
                  <text class="text-sm font-medium">
                    {{ item.label }}
                  </text>
                </view>
                <view class="flex items-center gap-1">
                  <text
                    v-if="item.extra" class="text-xs"
                    :class="item.key === 'coupon' ? 'text-red-500 font-semibold' : 'text-slate-400'"
                  >
                    {{ item.extra }}
                  </text>
                  <text class="i-material-symbols:chevron-right text-[16px] text-slate-400 leading-none" />
                </view>
              </view>
            </AppButton>
            <!-- #endif -->

            <!-- #ifndef MP-WEIXIN -->
            <view v-if="item.key === 'service'" class="service-row" @click="contactSupport">
              <view class="flex items-center gap-4">
                <view class="rounded-lg p-2" :class="item.iconBg">
                  <text
                    class="text-[20px] leading-none" :class="getServiceIconClass(item.key)"
                    :style="{ color: item.iconColor }"
                  />
                </view>
                <text class="text-sm font-medium">
                  {{ item.label }}
                </text>
              </view>
              <view class="flex items-center gap-1">
                <text
                  v-if="item.extra" class="text-xs"
                  :class="item.key === 'coupon' ? 'text-red-500 font-semibold' : 'text-slate-400'"
                >
                  {{ item.extra }}
                </text>
                <text class="i-material-symbols:chevron-right text-[16px] text-slate-400 leading-none" />
              </view>
            </view>
            <!-- #endif -->

            <view v-if="item.key !== 'service'" class="service-row" @click="onServiceMenuClick(item)">
              <view class="flex items-center gap-4">
                <view class="rounded-lg p-2" :class="item.iconBg">
                  <text
                    class="text-[20px] leading-none" :class="getServiceIconClass(item.key)"
                    :style="{ color: item.iconColor }"
                  />
                </view>
                <text class="text-sm font-medium">
                  {{ item.label }}
                </text>
              </view>
              <view class="flex items-center gap-1">
                <text
                  v-if="item.extra" class="text-xs"
                  :class="item.key === 'coupon' ? 'text-red-500 font-semibold' : 'text-slate-400'"
                >
                  {{ item.extra }}
                </text>
                <text class="i-material-symbols:chevron-right text-[16px] text-slate-400 leading-none" />
              </view>
            </view>
          </template>
        </view>
      </view>

      <view v-if="isLoggedIn" class="px-4 pb-4">
        <view
          class="flex items-center justify-center border border-red-100 rounded-xl bg-white py-4 text-sm text-red-500 font-semibold shadow-sm"
          @click="confirmLogout"
        >
          退出登录
        </view>
      </view>

      <view class="px-4 pb-10">
        <view class="relative overflow-hidden border border-[#efb239]/20 rounded-xl bg-[#efb239]/20 p-4">
          <view class="relative z-10 flex items-center justify-between">
            <view>
              <text class="text-base font-bold">
                需要帮助？
              </text>
              <text class="mt-1 block text-xs text-slate-600">
                我们的穿搭顾问全天在线
              </text>
            </view>
            <!-- #ifdef MP-WEIXIN -->
            <AppButton
              class="contact-service-button"
              custom-class="contact-service-button__inner"
              custom-style="padding: 0 16rpx; border: 0; background: #ffffff; line-height: 72rpx;"
              open-type="contact"
              plain
              @error="onContactServiceError"
            >
              联系我们
            </AppButton>
            <!-- #endif -->

            <!-- #ifndef MP-WEIXIN -->
            <view class="rounded-lg bg-white px-4 py-2 text-xs font-bold" @click="contactSupport">
              联系我们
            </view>
            <!-- #endif -->
          </view>
          <view class="absolute opacity-10 -bottom-4 -right-4">
            <text class="i-material-symbols:child-care text-[88px] text-[#0f172a] leading-none" />
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<style scoped>
.service-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid rgba(239, 178, 57, 0.08);
}

.service-row:last-child {
  border-bottom: 0;
}

.service-row-button {
  display: block;
}

:deep(.service-row-button__inner) {
  display: block;
  width: 100%;
  min-height: 0;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: inherit;
  text-align: left;
  box-shadow: none;
}

:deep(.service-row-button__inner .wd-button__text) {
  width: 100%;
}

:deep(.contact-service-button__inner) {
  min-height: 0;
  border-radius: 16rpx;
  font-size: 24rpx;
  font-weight: 700;
  color: #0f172a;
}

.balance-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  overflow: hidden;
  border: 1px solid rgba(239, 178, 57, 0.08);
  border-radius: 24rpx;
  background:
    radial-gradient(circle at top right, rgba(239, 178, 57, 0.16), transparent 30%),
    linear-gradient(135deg, #fffdf8 0%, #fff 100%);
  box-shadow: 0 12px 26px rgba(15, 23, 42, 0.04);
  padding: 24rpx 28rpx;
}

.balance-card__icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 88rpx;
  height: 88rpx;
  border-radius: 24rpx;
  background: rgba(239, 178, 57, 0.12);
}

.balance-card__recharge {
  border-radius: 9999px;
  background: #efb239;
  color: #fff;
  font-size: 24rpx;
  font-weight: 700;
  line-height: 1;
  padding: 16rpx 24rpx;
}
</style>
