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
  needLogin: true,
})

const router = useRouter()
type MallFavoriteItem = any

const favorites = ref<MallFavoriteItem[]>([])
const loading = ref(false)

const favoriteCount = computed(() => favorites.value.length)

function getDefaultSku(item: MallFavoriteItem) {
  const skus = Array.isArray(item.skus) ? item.skus : []
  return skus.find(sku => sku.isDefault) || skus[0] || null
}

function getVariantText(item: MallFavoriteItem) {
  const sku = getDefaultSku(item)
  const specs = sku?.specs && typeof sku.specs === 'object' ? Object.values(sku.specs) : []
  return specs.length ? specs.join(' / ') : '默认规格'
}

function getPrice(item: MallFavoriteItem) {
  const sku = getDefaultSku(item)
  const price = Number(sku?.salePrice ?? item.minPrice ?? 0)
  return Number.isFinite(price) ? price : 0
}

function getOldPrice(item: MallFavoriteItem) {
  const sku = getDefaultSku(item)
  const oldPrice = Number(sku?.marketPrice ?? 0)
  return Number.isFinite(oldPrice) && oldPrice > 0 ? oldPrice : null
}

async function loadFavorites() {
  loading.value = true
  try {
    const result = await (Apis.general as any).MallFavoritesController_findFavorites({
      params: {
        page: 1,
        pageSize: 50,
      },
    }).send()
    favorites.value = Array.isArray(result?.data) ? result.data : []
  }
  catch {
    favorites.value = []
  }
  finally {
    loading.value = false
  }
}

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

function openProduct(item: MallFavoriteItem) {
  router.push({
    name: 'product-detail',
    query: {
      id: String(item.id),
    },
  })
}

async function removeFavorite(item: MallFavoriteItem) {
  try {
    await (Apis.general as any).MallFavoritesController_removeFavorite({
      pathParams: { productId: item.id },
    }).send()
    favorites.value = favorites.value.filter(f => f.id !== item.id)
    uni.showToast({ title: '已取消收藏', icon: 'none' })
  }
  catch {}
}

async function addFavoriteToCart(item: MallFavoriteItem) {
  const sku = getDefaultSku(item)
  if (!sku) {
    uni.showToast({ title: '当前商品暂无可用规格', icon: 'none' })
    return
  }

  try {
    await (Apis.general as any).MallCartController_addToCart({
      data: {
        skuId: sku.id,
        quantity: 1,
      },
    }).send()
    uni.showToast({ title: `已加入：${item.name}`, icon: 'success' })
  }
  catch {}
}

onShow(() => {
  loadFavorites()
})
</script>

<template>
  <view class="favorites-page text-slate-900">
    <view class="sticky top-0 z-40 border-b border-[#efb239]/10 bg-[#f8f7f6]/92 px-4 py-3 backdrop-blur-md">
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
          你还有 <text class="text-[#efb239] font-bold">
            {{ favoriteCount }}
          </text> 件心动好物待带回家
        </view>

        <view v-if="loading" class="mt-8 text-center text-sm text-slate-400">
          加载中...
        </view>

        <view
          v-else-if="favoriteCount === 0"
          class="mt-8 border border-[#efb239]/10 rounded-3xl bg-white/80 px-6 py-12 text-center text-slate-400"
        >
          暂无收藏商品
        </view>

        <view
          v-for="item in favorites" :key="item.id"
          class="favorite-card mt-4 flex gap-4 border border-[#efb239]/8 rounded-2xl bg-white p-3"
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
              {{ getVariantText(item) }}
            </text>

            <view
              class="mt-2 inline-flex rounded-full bg-[#efb239]/10 px-2.5 py-1 text-[11px] text-[#c98500] font-semibold"
            >
              已收藏
            </view>

            <view class="mt-3 flex items-center gap-2">
              <text class="text-base text-[#efb239] font-bold">
                ￥{{ getPrice(item).toFixed(2) }}
              </text>
              <text v-if="getOldPrice(item)" class="text-xs text-slate-400 line-through">
                ￥{{ getOldPrice(item)?.toFixed(2) }}
              </text>
            </view>

            <view
              class="mt-3 h-9 flex items-center justify-center gap-1 rounded-xl bg-[#efb239] text-xs text-slate-900 font-bold"
              @click.stop="addFavoriteToCart(item)"
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
