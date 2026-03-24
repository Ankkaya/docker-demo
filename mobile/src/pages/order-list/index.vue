<script setup lang="ts">
/**
 * 订单列表页面 - 参考 Stitch 设计稿
 */

definePage({
  name: 'order-list',
  layout: 'default',
  style: {
    navigationBarTitleText: '订单列表',
    navigationStyle: 'custom',
  },
  needLogin: true,
})

const router = useRouter()

const statusTabs = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待付款' },
  { key: 'shipping', label: '待发货' },
  { key: 'receiving', label: '待收货' },
  { key: 'completed', label: '已完成' },
]

const activeStatus = ref('all')

const orders = ref([
  {
    id: 1001,
    no: 'NO20260311001',
    status: 'pending',
    statusLabel: '待付款',
    total: 287,
    count: 2,
    items: [
      {
        id: 1,
        name: 'Honey Bear Organic Romper',
        price: 129,
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBAWaIaKjBwQgnbqplCXR4IQaNVbY0Vo3c9uUBVT5LuEItWSV28FTXuLsiVMUAXu4uWDGXv3F84NECLPsn39bFAXUvZ6jUyrUSdqJ5BtPa48qrrn7gXXImrZoCExrvk4xVDi8KwNVvsqPJbPXWOvEZ_mHxPN_PUG7mdRgJcVt_HJd3lDUveM9HUWBsRQY9UZbgBI6AAMQB4u8ahwd1Tegb07jThalGq4Em-KrAeilUgvtiW-1CwPsZsCcJ274YVJ0Y5CsRKXadyY_xA',
      },
      {
        id: 2,
        name: 'Cotton Bib Set (3pc)',
        price: 79,
        image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&h=400&fit=crop',
      },
    ],
  },
  {
    id: 1002,
    no: 'NO20260310032',
    status: 'shipping',
    statusLabel: '待发货',
    total: 189,
    count: 1,
    items: [
      {
        id: 3,
        name: 'Knit Comfort Sweater',
        price: 189,
        image: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=400&h=400&fit=crop',
      },
    ],
  },
  {
    id: 1003,
    no: 'NO20260308008',
    status: 'receiving',
    statusLabel: '待收货',
    total: 358,
    count: 3,
    items: [
      {
        id: 4,
        name: 'Soft Leather Booties',
        price: 128,
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAnbUqWacZuzAdhQaTDNQIPFCOQmDmxvCasJ3WAf-T1GGe-4iap9zN9rNBwwANgtoPhxxVranbxfO823RVrsOeIYCkQgVUnhZGLtS-ebIb6Q6zcieXcuwOW8Yckn53iF5Tc2YeJ1UcHuzpmMl8yPnD8vmvIyouBYdnGojnC0KyLHAT1PRyzqUrR3CikjxeBy8Si4oCJ5pRDeZt92m0ij7VnzHMLxCp0905o42jTHBQDffQp2JtFIfSxtgpmiL4GCjNOdFoHOJbE-WIt',
      },
      {
        id: 5,
        name: 'Petal Floral Dress',
        price: 189,
        image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop',
      },
      {
        id: 6,
        name: 'Cotton Bib Set (3pc)',
        price: 79,
        image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&h=400&fit=crop',
      },
    ],
  },
  {
    id: 1004,
    no: 'NO20260301016',
    status: 'completed',
    statusLabel: '已完成',
    total: 158,
    count: 1,
    items: [
      {
        id: 7,
        name: 'Linen Sun Suit Set',
        price: 158,
        image: 'https://images.unsplash.com/photo-1542384701-c0e46e0eda04?w=400&h=400&fit=crop',
      },
    ],
  },
])

const filteredOrders = computed(() => {
  if (activeStatus.value === 'all')
    return orders.value
  return orders.value.filter(order => order.status === activeStatus.value)
})

function statusTone(status: string) {
  if (status === 'pending')
    return 'text-orange-500'
  if (status === 'receiving')
    return 'text-[#efb239]'
  if (status === 'completed')
    return 'text-slate-400'
  return 'text-[#efb239]'
}

function headerTone(status: string) {
  if (status === 'completed')
    return 'bg-slate-100'
  return 'bg-[#efb239]/6'
}

function getOrderListIconClass(name: string) {
  const map: Record<string, string> = {
    back: 'i-material-symbols:arrow-back',
    search: 'i-material-symbols:search',
  }
  return map[name] || ''
}

onLoad((options) => {
  const status = options?.status ? String(options.status) : 'all'
  const valid = statusTabs.some(tab => tab.key === status)
  activeStatus.value = valid ? status : 'all'
})

function goBack() {
  router.back()
}

function switchStatus(key: string) {
  activeStatus.value = key
}

function openDetail(orderId: number) {
  router.push({
    name: 'order-detail',
    query: { id: String(orderId) },
  })
}

function payOrder(orderId: number) {
  orders.value = orders.value.map(order => order.id === orderId
    ? { ...order, status: 'shipping', statusLabel: '待发货' }
    : order)
  uni.showToast({ title: '订单已支付', icon: 'success' })
}

function cancelOrder(orderId: number) {
  orders.value = orders.value.filter(order => order.id !== orderId)
  uni.showToast({ title: '订单已取消', icon: 'none' })
}

function confirmReceive(orderId: number) {
  orders.value = orders.value.map(order => order.id === orderId
    ? { ...order, status: 'completed', statusLabel: '已完成' }
    : order)
  uni.showToast({ title: '已确认收货', icon: 'success' })
}

function buyAgain(order: typeof orders.value[number]) {
  const firstItem = order.items[0]
  router.push({
    name: 'product-detail',
    query: {
      name: firstItem.name,
      price: firstItem.price.toFixed(2),
      image: encodeURIComponent(firstItem.image),
    },
  })
}
</script>

<template>
  <view class="orders-page min-h-screen text-slate-900">
    <view class="sticky top-0 z-40 border-b border-[#efb239]/10 bg-white/92 px-4 pt-3 backdrop-blur-md">

      <scroll-view scroll-x class="no-scrollbar whitespace-nowrap">
        <view class="flex gap-7">
          <view v-for="tab in statusTabs" :key="tab.key" class="border-b-[3px] px-0.5 pb-3 pt-1 text-sm font-semibold"
            :class="activeStatus === tab.key ? 'border-[#efb239] text-[#efb239]' : 'border-transparent text-slate-500'"
            @click="switchStatus(tab.key)">
            {{ tab.label }}
          </view>
        </view>
      </scroll-view>
    </view>

    <scroll-view scroll-y class="pb-24">
      <view class="px-4 pt-4">
        <view v-for="order in filteredOrders" :key="order.id"
          class="order-card mb-4 overflow-hidden rounded-2xl border border-[#efb239]/8 bg-white"
          @click="openDetail(order.id)">
          <view class="flex items-center justify-between border-b border-[#efb239]/8 px-4 py-3.5"
            :class="headerTone(order.status)">
            <text class="text-xs text-slate-400">
              订单号 {{ order.no }}
            </text>
            <text class="text-sm font-bold" :class="statusTone(order.status)">
              {{ order.statusLabel }}
            </text>
          </view>

          <view class="flex flex-col gap-3 px-4 py-4">
            <view v-for="item in order.items.slice(0, 2)" :key="item.id" class="flex items-center gap-3">
              <image :src="item.image" class="size-20 rounded-xl bg-[#f5efe5]" mode="aspectFill" />
              <view class="min-w-0 flex-1">
                <text class="line-clamp-1 block text-sm font-semibold">
                  {{ item.name }}
                </text>
                <text class="mt-1 block text-xs text-slate-400">
                  默认规格
                </text>
                <view class="mt-2 flex items-end justify-between">
                  <text class="text-sm text-slate-900 font-bold">
                    ￥{{ item.price.toFixed(2) }}
                  </text>
                  <text class="text-xs text-slate-400">
                    x1
                  </text>
                </view>
              </view>
            </view>
          </view>

          <view v-if="order.count > 2" class="px-4 text-xs text-slate-400">
            还有 {{ order.count - 2 }} 件商品
          </view>

          <view class="px-4 py-4">
            <view class="flex items-center justify-end text-xs text-slate-500">
              <text>
                共 {{ order.count }} 件商品 合计
                <text class="ml-1 text-base text-slate-900 font-bold">￥{{ order.total.toFixed(2) }}</text>
              </text>
            </view>
          </view>

          <view class="flex flex-wrap justify-end gap-2 border-t border-[#efb239]/8 bg-[#faf9f7] px-4 py-3">
            <view v-if="order.status === 'pending'"
              class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs text-slate-600 font-bold"
              @click.stop="cancelOrder(order.id)">
              取消订单
            </view>
            <view v-if="order.status === 'pending'"
              class="rounded-lg bg-[#efb239] px-5 py-2 text-xs text-slate-900 font-bold"
              @click.stop="payOrder(order.id)">
              去支付
            </view>
            <view v-if="order.status === 'receiving'"
              class="rounded-lg border border-[#efb239]/20 bg-[#efb239]/20 px-4 py-2 text-xs text-[#c98500] font-bold"
              @click.stop>
              查看物流
            </view>
            <view v-if="order.status === 'receiving'"
              class="rounded-lg bg-[#efb239] px-5 py-2 text-xs text-slate-900 font-bold"
              @click.stop="confirmReceive(order.id)">
              确认收货
            </view>
            <view v-if="order.status === 'completed'"
              class="rounded-lg bg-[#efb239]/10 px-4 py-2 text-xs text-[#c98500] font-bold"
              @click.stop="buyAgain(order)">
              再次购买
            </view>
            <view v-if="order.status === 'completed'"
              class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs text-slate-600 font-bold"
              @click.stop>
              评价商品
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<style scoped>
.orders-page {
  background:
    linear-gradient(180deg, #f8f7f6 0%, #f8f7f6 24%, #f2eee7 100%);
}

.order-card {
  box-shadow: 0 12px 26px rgba(15, 23, 42, 0.05);
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}

.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
