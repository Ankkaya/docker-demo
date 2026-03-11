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

const userInfo = ref({
  name: 'JoyfulParent88',
  level: '黄金会员 Lv.2',
  avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC7HQbD7l74qP4KY_mYzh7eti9QrX6NRRQpFmz2llc7Z6dKA19_7T7LCPm6ouvrUZQ6vHW6G4ASP0CwVCy6rfMN5buevPI2sn_7HJqA3woR9r9m_WI42q9DQ7oP4f3g4Fhwf3fwXuhG4SJY78nhi4G0QS5J_BfzqKtIeQBcg9rxMGGoSWIiEvYmbIdkTFFzd9O9qw0lOkAXFUQxNUJEGBWOVCxBapArUgviBq5T3_WK4tV8o2ywuVB7Gy6sEtOKf1swca_wBrHUY44g',
})

const orderMenus = ref([
  { key: 'pay', label: '待付款', icon: 'account_balance_wallet', badge: '' },
  { key: 'ship', label: '待发货', icon: 'package_2', badge: '2' },
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
  uni.showToast({ title: '设置开发中', icon: 'none' })
}

function checkIn() {
  uni.showToast({ title: '签到成功', icon: 'success' })
}

function viewAllOrders() {
  router.push({ name: 'order-list', query: { status: 'all' } })
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
    query: { status: statusMap[item.key] || 'all' },
  })
}

function onServiceMenuClick(item: typeof serviceMenus.value[number]) {
  const routeMap: Record<string, string> = {
    favorites: 'favorites',
    history: 'history',
    address: 'address',
  }
  const routeName = routeMap[item.key]
  if (routeName) {
    router.push({ name: routeName })
    return
  }
  uni.showToast({ title: `${item.label}开发中`, icon: 'none' })
}

function contactSupport() {
  uni.showToast({ title: '客服功能开发中', icon: 'none' })
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
</script>

<template>
  <view class="h-screen flex flex-col overflow-hidden bg-[#f8f7f6] text-slate-900">
    <scroll-view scroll-y class="flex-1 pb-6">
      <view class="p-6">
        <view class="flex items-center justify-between gap-3">
          <view class="min-w-0 flex items-center gap-4">
            <image :src="userInfo.avatar" class="size-20 border-4 border-[#efb239]/20 rounded-full" mode="aspectFill" />
            <view class="min-w-0">
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
            </view>
          </view>
          <view class="h-10 flex shrink-0 items-center rounded-full bg-[#efb239] px-5 text-sm text-white font-bold" @click="checkIn">
            签到
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
              v-for="item in orderMenus"
              :key="item.key"
              class="relative flex flex-col items-center gap-2 py-2"
              @click="onOrderMenuClick(item)"
            >
              <view class="relative rounded-full bg-[#efb239]/10 p-3">
                <text
                  class="text-[20px] text-[#efb239] leading-none"
                  :class="getOrderIconClass(item.key)"
                />
              </view>
              <text class="text-xs text-slate-600">
                {{ item.label }}
              </text>
              <view
                v-if="item.badge"
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
          <view
            v-for="item in serviceMenus"
            :key="item.key"
            class="service-row"
            @click="onServiceMenuClick(item)"
          >
            <view class="flex items-center gap-4">
              <view class="rounded-lg p-2" :class="item.iconBg">
                <text
                  class="text-[20px] leading-none"
                  :class="getServiceIconClass(item.key)"
                  :style="{ color: item.iconColor }"
                />
              </view>
              <text class="text-sm font-medium">
                {{ item.label }}
              </text>
            </view>
            <view class="flex items-center gap-1">
              <text v-if="item.extra" class="text-xs" :class="item.key === 'coupon' ? 'text-red-500 font-semibold' : 'text-slate-400'">
                {{ item.extra }}
              </text>
              <text class="i-material-symbols:chevron-right text-[16px] text-slate-400 leading-none" />
            </view>
          </view>
        </view>
      </view>

      <view class="px-4 pb-28">
        <view class="relative overflow-hidden border border-[#efb239]/20 rounded-xl bg-[#efb239]/20 p-4">
          <view class="relative z-10 flex items-center justify-between">
            <view>
              <text class="text-base font-bold">
                需要帮助？
              </text>
              <text class="mt-1 block text-xs text-slate-600">
                我们的穿搭顾问 24/7 在线
              </text>
            </view>
            <view class="rounded-lg bg-white px-4 py-2 text-xs font-bold" @click="contactSupport">
              联系我们
            </view>
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
</style>
