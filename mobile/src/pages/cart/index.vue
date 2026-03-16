<script setup lang="ts">
/**
 * 购物车页面 - 参考 Stitch 设计稿
 */

definePage({
  name: 'cart',
  layout: 'default',
  style: {
    navigationBarTitleText: '购物车',
    navigationStyle: 'custom',
  },
})

const router = useRouter()

interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
  sizeLabel: string
  image: string
}

const promoCode = ref('')
const shippingFee = ref(0)

const cartItems = ref<CartItem[]>([
  {
    id: 1,
    name: 'Linen Sun Suit Set',
    price: 48,
    quantity: 1,
    sizeLabel: 'Size: 12-18 Months',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCLQsZ4RmhxjAVeQCKGSDIVcQQrkMJYI66kJOUZmHOweXR5Wz-5ROcyJ-kZJa_T8rxkpVOx1DD_mPZu1PRvfR0e0-wEZLgmqgA_on3nv6pFajdjkK041rRuPzoCmXI0M972Ly9BRqJrTvfxxc4W_iJhkwdxsXtEXecZgG64XMWi6p2LzTU0xHnKZ412bUwUs6Cz2rIV1kZb4bkVTTtc8obLkdEhdg1fKuhruDPP2fut7HPogAgrCx_X4VQVyxahMmWigwflDSF7phLK',
  },
  {
    id: 2,
    name: 'Organic Cotton Romper',
    price: 32,
    quantity: 2,
    sizeLabel: 'Size: 6-12 Months',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAxihXOoPL73_oH7OcexZ9JD8BxJ7jBMjmfqsREV6tcwjshAyD7l8STDh4pKq-EhOhBrlOPV_eQ1sW7syNvBaihEQiacicu3t2AfTA7_QgVlnmKtKvi9smJcVwzLgXcFiC0kgogNgkM4CprFQdZpBBphVoIHH3qAyO3lxRXFF_Ml429IIKgEp_wMsjC0fKEar-hh-MYRF8RxXvRVKBr2ap0vR70RTomxkXt6J8S01t9LNllhGVQ3AV5dWWXN6L9XD1O8Km_YB50VQJ9',
  },
  {
    id: 3,
    name: 'Hand-Knit Bonnet',
    price: 24,
    quantity: 1,
    sizeLabel: 'Size: Small',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCxWj16qwOvPgEUtu-v-DY19ynVfRGnMSczgj4VmF3AzgPsMp2P_5QIZFfBkeAlMJnC6KzYoZn8By6CIEJqIPJu9ya36Cu32cH-Loy8po_oTmOnjP_nPHfHWJXTQd7TPfqgWKkYhhqZtEX4OkXfUfw3zsih21lLX-8rH_CTjgD6fFDXwqW3_odsHTWtoO2zI1Vfc-IxFFvzJm4Z9JzcMU8quSF0n8ZVWgLAHpgpv3lmTkGArhSIcpPzzu_mkB0pDUrJpPPHTQ5Urq6-',
  },
])

const subtotal = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
})

const totalAmount = computed(() => {
  return subtotal.value + shippingFee.value
})

const cartCount = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + item.quantity, 0)
})

function goBack() {
  router.back()
}

function increaseQty(item: CartItem) {
  item.quantity += 1
}

function decreaseQty(item: CartItem) {
  if (item.quantity <= 1)
    return
  item.quantity -= 1
}

function removeItem(id: number) {
  cartItems.value = cartItems.value.filter(item => item.id !== id)
}

function applyPromoCode() {
  const code = promoCode.value.trim()
  if (!code) {
    uni.showToast({ title: '请输入优惠码', icon: 'none' })
    return
  }

  uni.showToast({ title: `优惠码 ${code} 已应用`, icon: 'success' })
}

function checkout() {
  if (cartItems.value.length === 0) {
    uni.showToast({ title: '购物车为空', icon: 'none' })
    return
  }

  uni.showToast({ title: '结算功能开发中', icon: 'none' })
}

function goHome() {
  router.push({ name: 'home' })
}

function goCategory() {
  router.push({ name: 'category' })
}

function goProfile() {
  uni.showToast({ title: '个人中心开发中', icon: 'none' })
}
</script>

<template>
  <view class="
   flex flex-col overflow-x-hidden bg-[#f8f7f6] text-slate-900">

    <scroll-view scroll-y class="flex-1">
      <view class="overflow-x-hidden px-4 py-6">
        <view v-for="(item, index) in cartItems" :key="item.id"
          class="box-border w-full flex gap-4 border border-[#efb239]/5 rounded-xl bg-white p-4 shadow-sm"
          :class="index > 0 ? 'mt-4' : ''">
          <image :src="item.image" mode="aspectFill" class="size-24 rounded-lg" />
          <view class="min-w-0 flex flex-1 flex-col justify-between">
            <view>
              <view class="flex items-start justify-between gap-2">
                <text class="line-clamp-1 min-w-0 flex-1 text-base text-slate-900 font-semibold">
                  {{ item.name }}
                </text>
                <view class="shrink-0 text-slate-400" @click="removeItem(item.id)">
                  <wd-icon name="close" size="14" color="#94a3b8" />
                </view>
              </view>
              <text class="mt-1 block text-sm text-[#efb239] font-medium">
                ${{ item.price.toFixed(2) }}
              </text>
              <text class="mt-1 block text-xs text-slate-500">
                {{ item.sizeLabel }}
              </text>
            </view>

            <view class="mt-2">
              <view class="inline-flex items-center gap-3 rounded-full bg-[#f8f7f6] px-2 py-1">
                <view class="size-6 flex items-center justify-center rounded-full bg-white shadow-sm"
                  @click="decreaseQty(item)">
                  <wd-icon name="remove" size="14" color="#0f172a" />
                </view>
                <text class="w-4 text-center text-sm font-bold">
                  {{ item.quantity }}
                </text>
                <view class="size-6 flex items-center justify-center rounded-full bg-[#efb239]"
                  @click="increaseQty(item)">
                  <wd-icon name="add" size="14" color="#fff" />
                </view>
              </view>
            </view>
          </view>
        </view>

        <view class="mt-8 box-border min-w-0 w-full flex gap-2">
          <input v-model="promoCode"
            class="h-10 min-w-0 flex-1 border border-[#efb239]/20 rounded-lg bg-white px-3 text-sm"
            placeholder="Promo code">
          <view class="h-10 flex shrink-0 items-center rounded-lg bg-[#efb239]/20 px-4 text-sm text-[#efb239] font-bold"
            @click="applyPromoCode">
            Apply
          </view>
        </view>
      </view>
    </scroll-view>

    <view class="rounded-t-xl bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <view class="border-b border-[#efb239]/5 px-6 py-6">
        <view class="flex justify-between text-slate-500">
          <text>Subtotal</text>
          <text>${{ subtotal.toFixed(2) }}</text>
        </view>
        <view class="mt-3 flex justify-between text-slate-500">
          <text>Shipping</text>
          <text>${{ shippingFee.toFixed(2) }}</text>
        </view>
        <view class="mt-3 flex items-center justify-between pt-2">
          <text class="text-lg font-bold">
            Total Amount
          </text>
          <text class="text-2xl text-[#efb239] font-bold">
            ${{ totalAmount.toFixed(2) }}
          </text>
        </view>
        <view
          class="mt-4 h-12 flex items-center justify-center gap-1 rounded-xl bg-[#efb239] text-base text-slate-900 font-bold"
          @click="checkout">
          <text>Checkout Now</text>
          <wd-icon name="arrow-right" size="16" color="#0f172a" />
        </view>
      </view>

      <view class="flex gap-2 bg-white px-4 pb-6 pt-3">
        <view class="tab-item text-slate-400" @click="goHome">
          <wd-icon name="home" size="20" color="#94a3b8" />
          <text class="tab-text">
            Home
          </text>
        </view>
        <view class="tab-item text-slate-400" @click="goCategory">
          <wd-icon name="grid_view" size="20" color="#94a3b8" />
          <text class="tab-text">
            Shop
          </text>
        </view>
        <view class="tab-item text-[#efb239]">
          <view class="relative">
            <wd-icon name="shopping_cart" size="20" color="#efb239" />
            <view
              class="absolute h-4 min-w-4 flex items-center justify-center rounded-full bg-[#efb239] px-1 text-[8px] text-white font-bold -right-2 -top-1">
              {{ cartCount }}
            </view>
          </view>
          <text class="tab-text text-[#efb239] font-bold">
            Cart
          </text>
        </view>
        <view class="tab-item text-slate-400" @click="goProfile">
          <wd-icon name="person" size="20" color="#94a3b8" />
          <text class="tab-text">
            Profile
          </text>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
}

.tab-text {
  font-size: 10px;
  line-height: 1;
}
</style>
