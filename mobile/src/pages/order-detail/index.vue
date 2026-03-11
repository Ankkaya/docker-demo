<script setup lang="ts">
/**
 * 订单详情页面 - 参考 Stitch 设计稿
 */

definePage({
  name: 'order-detail',
  layout: 'default',
  style: {
    navigationBarTitleText: '订单详情',
    navigationStyle: 'custom',
  },
})

const router = useRouter()

const orderMap: Record<string, any> = {
  '1001': {
    id: '1001',
    status: '待付款',
    statusDesc: '请在 01:29:46 内完成支付',
    receiver: 'Joyful Parent',
    phone: '138****2409',
    address: '上海市浦东新区世纪大道 100 号 12-903',
    logistics: {
      company: '顺丰速运',
      trackingNo: 'SF1234567890',
      status: '等待揽收',
    },
    items: [
      {
        id: 1,
        name: 'Honey Bear Organic Romper',
        spec: '米杏色 / 66cm',
        price: 129,
        qty: 1,
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBAWaIaKjBwQgnbqplCXR4IQaNVbY0Vo3c9uUBVT5LuEItWSV28FTXuLsiVMUAXu4uWDGXv3F84NECLPsn39bFAXUvZ6jUyrUSdqJ5BtPa48qrrn7gXXImrZoCExrvk4xVDi8KwNVvsqPJbPXWOvEZ_mHxPN_PUG7mdRgJcVt_HJd3lDUveM9HUWBsRQY9UZbgBI6AAMQB4u8ahwd1Tegb07jThalGq4Em-KrAeilUgvtiW-1CwPsZsCcJ274YVJ0Y5CsRKXadyY_xA',
      },
      {
        id: 2,
        name: 'Cotton Bib Set (3pc)',
        spec: '晨雾蓝',
        price: 79,
        qty: 2,
        image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&h=400&fit=crop',
      },
    ],
    summary: {
      subtotal: 287,
      discount: 20,
      freight: 0,
      total: 267,
    },
    info: {
      orderNo: 'NO20260311001',
      createTime: '2026-03-11 09:28:20',
      payMethod: '微信支付',
    },
  },
  '1002': {
    id: '1002',
    status: '待发货',
    statusDesc: '商家正在备货，请耐心等待',
    receiver: 'Joyful Parent',
    phone: '138****2409',
    address: '上海市浦东新区丁香路 88 弄 5 号 602',
    logistics: {
      company: '中通快递',
      trackingNo: 'ZT20260310032',
      status: '仓库处理中',
    },
    items: [
      {
        id: 3,
        name: 'Knit Comfort Sweater',
        spec: '奶油白 / 90cm',
        price: 189,
        qty: 1,
        image: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=400&h=400&fit=crop',
      },
    ],
    summary: {
      subtotal: 189,
      discount: 0,
      freight: 0,
      total: 189,
    },
    info: {
      orderNo: 'NO20260310032',
      createTime: '2026-03-10 16:08:02',
      payMethod: '支付宝',
    },
  },
  '1003': {
    id: '1003',
    status: '待收货',
    statusDesc: '包裹已经发出，记得及时签收',
    receiver: 'Joyful Parent',
    phone: '138****2409',
    address: '上海市黄浦区福州路 268 号 1103',
    logistics: {
      company: '顺丰速运',
      trackingNo: 'SF20260308008',
      status: '运输中',
    },
    items: [
      {
        id: 4,
        name: 'Soft Leather Booties',
        spec: '焦糖棕 / 22码',
        price: 128,
        qty: 1,
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAnbUqWacZuzAdhQaTDNQIPFCOQmDmxvCasJ3WAf-T1GGe-4iap9zN9rNBwwANgtoPhxxVranbxfO823RVrsOeIYCkQgVUnhZGLtS-ebIb6Q6zcieXcuwOW8Yckn53iF5Tc2YeJ1UcHuzpmMl8yPnD8vmvIyouBYdnGojnC0KyLHAT1PRyzqUrR3CikjxeBy8Si4oCJ5pRDeZt92m0ij7VnzHMLxCp0905o42jTHBQDffQp2JtFIfSxtgpmiL4GCjNOdFoHOJbE-WIt',
      },
      {
        id: 5,
        name: 'Petal Floral Dress',
        spec: '粉白花 / 80cm',
        price: 189,
        qty: 1,
        image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop',
      },
      {
        id: 6,
        name: 'Cotton Bib Set (3pc)',
        spec: '晨雾蓝',
        price: 79,
        qty: 1,
        image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&h=400&fit=crop',
      },
    ],
    summary: {
      subtotal: 396,
      discount: 38,
      freight: 0,
      total: 358,
    },
    info: {
      orderNo: 'NO20260308008',
      createTime: '2026-03-08 12:18:45',
      payMethod: '微信支付',
    },
  },
  '1004': {
    id: '1004',
    status: '已完成',
    statusDesc: '订单已完成，期待你再次光临',
    receiver: 'Joyful Parent',
    phone: '138****2409',
    address: '上海市徐汇区天钥桥路 580 号 9-903',
    logistics: {
      company: '圆通速递',
      trackingNo: 'YT20260301016',
      status: '已签收',
    },
    items: [
      {
        id: 7,
        name: 'Linen Sun Suit Set',
        spec: '浅橘色 / 73cm',
        price: 158,
        qty: 1,
        image: 'https://images.unsplash.com/photo-1542384701-c0e46e0eda04?w=400&h=400&fit=crop',
      },
    ],
    summary: {
      subtotal: 158,
      discount: 0,
      freight: 0,
      total: 158,
    },
    info: {
      orderNo: 'NO20260301016',
      createTime: '2026-03-01 10:03:20',
      payMethod: '银行卡',
    },
  },
}

const order = ref({ ...orderMap['1001'] })

const timeline = ref([
  { time: '2026-03-11 09:28', text: '订单提交成功' },
  { time: '2026-03-11 09:29', text: '等待付款' },
])

const statusIconMap: Record<string, string> = {
  '待付款': 'i-material-symbols:account-balance-wallet',
  '待发货': 'i-material-symbols:package-2',
  '待收货': 'i-material-symbols:local-shipping',
  '已完成': 'i-material-symbols:task-alt',
  '已取消': 'i-material-symbols:cancel',
}

function getOrderDetailIconClass(name: string) {
  const map: Record<string, string> = {
    back: 'i-material-symbols:arrow-back',
    support: 'i-material-symbols:support-agent',
    fallback: 'i-material-symbols:receipt',
    address: 'i-material-symbols:location-on',
    shipping: 'i-material-symbols:local-shipping',
    goods: 'i-material-symbols:shopping-bag',
    receipt: 'i-material-symbols:receipt',
  }
  return map[name] || ''
}

onLoad((options) => {
  const id = options?.id ? String(options.id) : '1001'
  order.value = { ...(orderMap[id] || orderMap['1001']) }
  syncTimeline(order.value.status)
})

function goBack() {
  router.back()
}

function contactService() {
  uni.showToast({ title: '联系客服开发中', icon: 'none' })
}

function syncTimeline(status: string) {
  const baseTimeline = [
    { time: order.value.info.createTime.slice(0, 16), text: '订单提交成功' },
  ]

  if (status === '待付款') {
    timeline.value = [
      ...baseTimeline,
      { time: '2026-03-11 09:29', text: '等待付款' },
    ]
    return
  }

  if (status === '待发货') {
    timeline.value = [
      ...baseTimeline,
      { time: '2026-03-10 16:10', text: '支付成功' },
      { time: '2026-03-10 16:18', text: '商家备货中' },
    ]
    return
  }

  if (status === '待收货') {
    timeline.value = [
      ...baseTimeline,
      { time: '2026-03-08 12:20', text: '支付成功' },
      { time: '2026-03-08 17:45', text: '商品已发货' },
      { time: '2026-03-09 08:30', text: '包裹运输中' },
    ]
    return
  }

  timeline.value = [
    ...baseTimeline,
    { time: '2026-03-01 10:05', text: '支付成功' },
    { time: '2026-03-01 15:20', text: '商品已发货' },
    { time: '2026-03-03 18:40', text: '订单已完成' },
  ]
}

function openProduct(item: (typeof order.value.items)[number]) {
  router.push({
    name: 'product-detail',
    query: {
      name: item.name,
      price: item.price.toFixed(2),
      image: encodeURIComponent(item.image),
    },
  })
}

function payNow() {
  if (order.value.status === '待收货') {
    order.value = {
      ...order.value,
      status: '已完成',
      statusDesc: '订单已完成，感谢你的购买',
      logistics: {
        ...order.value.logistics,
        status: '已签收',
      },
    }
    syncTimeline(order.value.status)
    uni.showToast({ title: '已确认收货', icon: 'success' })
    return
  }

  if (order.value.status === '待发货') {
    uni.showToast({ title: '已提醒商家发货', icon: 'none' })
    return
  }

  order.value = {
    ...order.value,
    status: '待发货',
    statusDesc: '支付成功，商家正在备货',
    logistics: {
      ...order.value.logistics,
      status: '仓库处理中',
    },
    info: {
      ...order.value.info,
      payMethod: '微信支付',
    },
  }
  syncTimeline(order.value.status)
  uni.showToast({ title: '订单已支付', icon: 'success' })
}

function cancelOrder() {
  if (order.value.status === '待收货') {
    uni.showToast({ title: '售后申请已提交', icon: 'success' })
    return
  }

  order.value = {
    ...order.value,
    status: '已取消',
    statusDesc: '订单已取消，可返回继续挑选商品',
    logistics: {
      ...order.value.logistics,
      status: '订单已关闭',
    },
  }
  timeline.value = [
    { time: order.value.info.createTime.slice(0, 16), text: '订单提交成功' },
    { time: '2026-03-11 09:35', text: '订单已取消' },
  ]
  uni.showToast({ title: '订单已取消', icon: 'none' })
}
</script>

<template>
  <view class="order-detail-page min-h-screen text-slate-900">
    <view class="sticky top-0 z-40 flex items-center justify-between border-b border-[#efb239]/10 bg-white/92 px-4 py-3 backdrop-blur-md">
      <view class="size-10 flex items-center justify-center rounded-full bg-white/90" @click="goBack">
        <text class="text-[20px] text-slate-900 leading-none" :class="getOrderDetailIconClass('back')" />
      </view>
      <text class="text-base font-bold tracking-[0.02em]">
        订单详情
      </text>
      <view class="size-10 flex items-center justify-center rounded-full bg-white/90" @click="contactService">
        <text class="text-[20px] text-slate-900 leading-none" :class="getOrderDetailIconClass('support')" />
      </view>
    </view>

    <scroll-view scroll-y class="pb-28">
      <view class="px-4 pt-4">
        <view class="status-panel rounded-[28px] p-5">
          <view class="flex items-center justify-between">
            <view>
              <text class="text-[22px] text-slate-900 font-bold">
                {{ order.status }}
              </text>
              <text class="mt-2 block max-w-[480rpx] text-xs leading-5 text-slate-600">
                {{ order.statusDesc }}
              </text>
            </view>
            <view class="size-14 flex items-center justify-center rounded-3xl bg-[#efb239] shadow-[0_10px_20px_rgba(239,178,57,0.24)]">
              <text class="text-[26px] text-white leading-none" :class="statusIconMap[order.status] || getOrderDetailIconClass('fallback')" />
            </view>
          </view>

          <view class="mt-5">
            <view
              v-for="(item, index) in timeline"
              :key="item.time"
              class="grid grid-cols-[26px_1fr] gap-x-3"
            >
              <view class="flex flex-col items-center">
                <view class="size-3 rounded-full border-2 border-[#efb239] bg-white" />
                <view v-if="index !== timeline.length - 1" class="mt-1 h-8 w-px bg-[#efb239]/30" />
              </view>
              <view class="pb-4">
                <text class="block text-sm font-semibold text-slate-800">
                  {{ item.text }}
                </text>
                <text class="mt-1 block text-xs text-slate-500">
                  {{ item.time }}
                </text>
              </view>
            </view>
          </view>
        </view>

        <view class="card-shell mt-4 rounded-2xl bg-white p-4">
          <view class="flex items-start gap-3">
            <view class="mt-0.5 size-10 flex items-center justify-center rounded-2xl bg-[#efb239]/12">
              <text class="text-[20px] text-[#efb239] leading-none" :class="getOrderDetailIconClass('address')" />
            </view>
            <view class="min-w-0 flex-1">
              <view class="text-sm font-semibold">
                收货信息
              </view>
              <view class="mt-3 flex items-center gap-3 text-sm">
                <text class="font-semibold">
                  {{ order.receiver }}
                </text>
                <text class="text-slate-400">
                  {{ order.phone }}
                </text>
              </view>
              <text class="mt-2 block text-sm leading-6 text-slate-600">
                {{ order.address }}
              </text>
            </view>
          </view>
        </view>

        <view class="card-shell mt-4 rounded-2xl bg-white p-4">
          <view class="flex items-start gap-3">
            <view class="mt-0.5 size-10 flex items-center justify-center rounded-2xl bg-[#efb239]/12">
              <text class="text-[20px] text-[#efb239] leading-none" :class="getOrderDetailIconClass('shipping')" />
            </view>
            <view class="min-w-0 flex-1">
              <view class="text-sm font-semibold">
                配送信息
              </view>
              <view class="mt-3 text-sm text-slate-700 font-medium">
                {{ order.logistics.company }} · {{ order.logistics.trackingNo }}
              </view>
              <text class="mt-1 block text-xs text-slate-400">
                {{ order.logistics.status }}
              </text>
            </view>
          </view>
        </view>

        <view class="card-shell mt-4 rounded-2xl bg-white p-4">
          <view class="flex items-center gap-2 text-sm font-semibold">
            <text class="text-[20px] text-[#efb239] leading-none" :class="getOrderDetailIconClass('goods')" />
            商品信息
          </view>
          <view class="mt-4 flex flex-col gap-4">
            <view v-for="item in order.items" :key="item.id" class="flex gap-3" @click="openProduct(item)">
              <image :src="item.image" class="size-20 rounded-xl bg-[#f5efe5]" mode="aspectFill" />
              <view class="min-w-0 flex-1">
                <text class="line-clamp-2 block text-sm font-semibold">
                  {{ item.name }}
                </text>
                <text class="mt-1 block text-xs text-slate-400">
                  {{ item.spec }}
                </text>
                <view class="mt-2 flex items-center justify-between">
                  <text class="text-sm text-[#efb239] font-bold">
                    ￥{{ item.price.toFixed(2) }}
                  </text>
                  <text class="text-xs text-slate-400">
                    x{{ item.qty }}
                  </text>
                </view>
              </view>
            </view>
          </view>
        </view>

        <view class="summary-shell mt-4 rounded-2xl px-4 py-4">
          <view class="flex items-center justify-between text-sm text-slate-600">
            <text>商品小计</text>
            <text>￥{{ order.summary.subtotal.toFixed(2) }}</text>
          </view>
          <view class="mt-2 flex items-center justify-between text-sm text-slate-600">
            <text>优惠</text>
            <text>-￥{{ order.summary.discount.toFixed(2) }}</text>
          </view>
          <view class="mt-2 flex items-center justify-between text-sm text-slate-600">
            <text>运费</text>
            <text>￥{{ order.summary.freight.toFixed(2) }}</text>
          </view>
          <view class="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-base font-semibold">
            <text>实付款</text>
            <text class="text-[22px] text-[#efb239]">
              ￥{{ order.summary.total.toFixed(2) }}
            </text>
          </view>
        </view>

        <view class="card-shell mt-4 rounded-2xl bg-white p-4">
          <view class="flex items-center gap-2 text-sm font-semibold">
            <text class="text-[20px] text-[#efb239] leading-none" :class="getOrderDetailIconClass('receipt')" />
            订单信息
          </view>
          <view class="mt-3 flex flex-col gap-2 text-xs text-slate-500">
            <view class="flex items-center justify-between">
              <text>订单编号</text>
              <text class="text-slate-600">
                {{ order.info.orderNo }}
              </text>
            </view>
            <view class="flex items-center justify-between">
              <text>下单时间</text>
              <text class="text-slate-600">
                {{ order.info.createTime }}
              </text>
            </view>
            <view class="flex items-center justify-between">
              <text>支付方式</text>
              <text class="text-slate-600">
                {{ order.info.payMethod }}
              </text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <view v-if="order.status !== '已取消' && order.status !== '已完成'" class="fixed bottom-0 left-0 right-0 z-40 flex items-center gap-3 border-t border-[#efb239]/8 bg-white/95 p-4 pb-6 backdrop-blur-md">
      <view class="flex-1 rounded-full border border-slate-200 py-3 text-center text-sm text-slate-600 font-semibold" @click="cancelOrder">
        {{ order.status === '待收货' ? '申请售后' : '取消订单' }}
      </view>
      <view class="detail-action flex-[1.2] rounded-full bg-[#efb239] py-3 text-center text-sm text-slate-900 font-bold" @click="payNow">
        {{ order.status === '待付款' ? '立即支付' : order.status === '待发货' ? '提醒发货' : '确认收货' }}
      </view>
    </view>
  </view>
</template>

<style scoped>
.order-detail-page {
  background:
    linear-gradient(180deg, #f8f7f6 0%, #f8f7f6 18%, #f1ede6 100%);
}

.status-panel {
  background: linear-gradient(180deg, rgba(239, 178, 57, 0.14) 0%, rgba(239, 178, 57, 0.05) 100%);
}

.card-shell {
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
}

.summary-shell {
  background: rgba(255, 255, 255, 0.72);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
}

.detail-action {
  box-shadow: 0 14px 28px rgba(239, 178, 57, 0.22);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
