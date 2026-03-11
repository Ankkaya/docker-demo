<script setup lang="ts">
/**
 * 我的收藏页面 - 参考 Stitch 设计稿
 */

definePage({
  name: 'favorites',
  layout: 'default',
  style: {
    navigationBarTitleText: '我的收藏',
    navigationStyle: 'custom',
  },
})

const router = useRouter()

const favorites = ref([
  {
    id: 1,
    name: 'Honey Bear Organic Romper',
    tag: '新品 · 7天退换',
    variant: '米杏色 / 66cm',
    price: 129,
    oldPrice: 169,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBAWaIaKjBwQgnbqplCXR4IQaNVbY0Vo3c9uUBVT5LuEItWSV28FTXuLsiVMUAXu4uWDGXv3F84NECLPsn39bFAXUvZ6jUyrUSdqJ5BtPa48qrrn7gXXImrZoCExrvk4xVDi8KwNVvsqPJbPXWOvEZ_mHxPN_PUG7mdRgJcVt_HJd3lDUveM9HUWBsRQY9UZbgBI6AAMQB4u8ahwd1Tegb07jThalGq4Em-KrAeilUgvtiW-1CwPsZsCcJ274YVJ0Y5CsRKXadyY_xA',
  },
  {
    id: 2,
    name: 'Linen Sun Suit Set',
    tag: '热卖 · 限时8折',
    variant: '浅橘色 / 73cm',
    price: 158,
    oldPrice: 198,
    image: 'https://images.unsplash.com/photo-1542384701-c0e46e0eda04?w=400&h=400&fit=crop',
  },
  {
    id: 3,
    name: 'Knit Comfort Sweater',
    tag: '人气 · 轻薄透气',
    variant: '奶油白 / 90cm',
    price: 189,
    oldPrice: 229,
    image: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=400&h=400&fit=crop',
  },
])

function getFavoriteIconClass(name: string) {
  const map: Record<string, string> = {
    back: 'i-material-symbols:arrow-back',
    search: 'i-material-symbols:search',
    close: 'i-material-symbols:close',
    cart: 'i-material-symbols:shopping-cart',
  }
  return map[name] || ''
}

function goBack() {
  router.back()
}

function onSearch() {
  router.push({ name: 'search' })
}

function openProduct(item: typeof favorites.value[number]) {
  router.push({
    name: 'product-detail',
    query: {
      name: item.name,
      price: item.price.toFixed(2),
      image: encodeURIComponent(item.image),
    },
  })
}

function removeFavorite(item: typeof favorites.value[number]) {
  favorites.value = favorites.value.filter(f => f.id !== item.id)
  uni.showToast({ title: '已取消收藏', icon: 'none' })
}

function addToCart(item: typeof favorites.value[number]) {
  uni.showToast({ title: `已加入：${item.name}`, icon: 'success' })
}
</script>

<template>
  <view class="favorites-page min-h-screen text-slate-900">
    <view class="sticky top-0 z-40 border-b border-[#efb239]/10 bg-[#f8f7f6]/92 px-4 py-3 backdrop-blur-md">
      <view class="flex items-center justify-between">
        <view class="size-10 flex items-center justify-center rounded-full bg-white/90" @click="goBack">
          <text class="text-[20px] text-slate-900 leading-none" :class="getFavoriteIconClass('back')" />
        </view>
        <text class="text-base font-bold tracking-[0.02em]">
          我的收藏
        </text>
        <view class="relative size-10 flex items-center justify-center rounded-full bg-white/90" @click="onSearch">
          <text class="text-[20px] text-slate-900 leading-none" :class="getFavoriteIconClass('search')" />
          <view class="absolute right-1.5 top-1.5 min-w-4 rounded-full bg-[#efb239] px-1 text-center text-[10px] text-white font-bold">
            {{ Math.min(favorites.length, 9) }}
          </view>
        </view>
      </view>

      <view class="mt-3 flex items-center gap-6 overflow-x-auto whitespace-nowrap text-sm">
        <text class="border-b-2 border-[#efb239] pb-2 text-slate-900 font-bold">
          全部宝贝 ({{ favorites.length }})
        </text>
        <text class="pb-2 text-slate-500">
          婴童服饰
        </text>
        <text class="pb-2 text-slate-500">
          配饰用品
        </text>
        <text class="pb-2 text-slate-500">
          限时特惠
        </text>
      </view>
    </view>

    <scroll-view scroll-y class="pb-28">
      <view class="px-4 pt-4">
        <view class="px-1 text-center text-sm text-slate-400">
          你还有 <text class="text-[#efb239] font-bold">{{ favorites.length }}</text> 件心动好物待带回家
        </view>

        <view
          v-for="item in favorites"
          :key="item.id"
          class="favorite-card mt-4 flex gap-4 rounded-2xl border border-[#efb239]/8 bg-white p-3"
          @click="openProduct(item)"
        >
          <image :src="item.image" class="h-28 w-28 shrink-0 rounded-xl bg-[#f6efe0]" mode="aspectFill" />
          <view class="min-w-0 flex-1 py-1">
            <view class="flex items-start justify-between gap-3">
              <text class="line-clamp-2 block text-[30rpx] font-bold leading-[1.35]">
                {{ item.name }}
              </text>
              <view
              class="size-8 flex shrink-0 items-center justify-center rounded-full bg-white/90 text-slate-400"
                @click.stop="removeFavorite(item)"
              >
                <text class="text-[18px] text-slate-400 leading-none" :class="getFavoriteIconClass('close')" />
              </view>
            </view>

            <text class="mt-1 block text-xs text-slate-400">
              {{ item.variant }}
            </text>

            <view class="mt-2 inline-flex rounded-full bg-[#efb239]/10 px-2.5 py-1 text-[11px] text-[#c98500] font-semibold">
              {{ item.tag }}
            </view>

            <view class="mt-3 flex items-center gap-2">
              <text class="text-base text-[#efb239] font-bold">
                ￥{{ item.price.toFixed(2) }}
              </text>
              <text class="text-xs text-slate-400 line-through">
                ￥{{ item.oldPrice.toFixed(2) }}
              </text>
            </view>

            <view
              class="mt-3 h-9 flex items-center justify-center gap-1 rounded-xl bg-[#efb239] text-xs text-slate-900 font-bold"
              @click.stop="addToCart(item)"
            >
              <text class="text-[16px] text-slate-900 leading-none" :class="getFavoriteIconClass('cart')" />
              加入购物车
            </view>
          </view>
        </view>

        <view class="px-2 pb-8 pt-6 text-center text-sm text-slate-400">
          还有更多好物正在等你发现
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<style scoped>
.favorites-page {
  background:
    linear-gradient(180deg, #f8f7f6 0%, #f8f7f6 18%, #f4f1ea 100%);
}

.favorite-card {
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
