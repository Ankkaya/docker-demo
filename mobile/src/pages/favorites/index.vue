<script setup lang="ts">
/**
 * 我的收藏页面 - 参考 Stitch 设计稿
 */
import PullLoadContainer from '@/components/common/PullLoadContainer.vue'

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
const toast = useToast()
const { topAreaHeight, safeAreaInsetsBottom } = usePlatform()

type MallFavoriteItem = any & {
  ratio?: string
  estimatedHeight?: number
}
const DEFAULT_FAVORITES_TABS_HEIGHT = 52

const favorites = ref<MallFavoriteItem[]>([])
const loading = ref(false)
const clearingFavorites = ref(false)
const favoritesTabsHeight = ref(DEFAULT_FAVORITES_TABS_HEIGHT)

const favoriteCount = computed(() => favorites.value.length)
const pageContentHeight = computed(() => `calc(100vh - ${topAreaHeight}px - ${safeAreaInsetsBottom}px)`)
const listAreaStyle = computed(() => ({
  height: `calc(${pageContentHeight.value} - ${favoritesTabsHeight.value}px)`,
}))

function getEstimatedFavoriteHeight(item: MallFavoriteItem) {
  const ratio = typeof item?.ratio === 'string' && item.ratio ? item.ratio : '3/3.6'
  const name = typeof item?.name === 'string' ? item.name : ''
  const specText = getVariantText(item)
  const [width, height] = ratio.split('/').map(value => Number(value))
  const safeWidth = width > 0 ? width : 1
  const safeHeight = height > 0 ? height : 1
  const imageHeight = (safeHeight / safeWidth) * 180
  const nameLines = Math.min(2, Math.max(1, Math.ceil(name.length / 9)))
  const specLines = Math.min(2, Math.max(1, Math.ceil(specText.length / 14)))

  return imageHeight + nameLines * 22 + specLines * 16 + 96
}

function getCardRatio(index: number) {
  const ratios = ['3/3.9', '3/3.1', '3/3.5', '1/1', '3/3.2', '3/3.7']
  return ratios[index % ratios.length]
}

function normalizeFavoriteItem(item: MallFavoriteItem, index: number): MallFavoriteItem {
  const ratio = getCardRatio(index)

  return {
    ...item,
    ratio,
    estimatedHeight: getEstimatedFavoriteHeight({
      ...item,
      ratio,
    }),
  }
}

const waterfallColumns = computed(() => {
  const left: MallFavoriteItem[] = []
  const right: MallFavoriteItem[] = []
  let leftHeight = 0
  let rightHeight = 0

  favorites.value.forEach((item) => {
    const estimatedHeight = item.estimatedHeight || getEstimatedFavoriteHeight(item)

    if (leftHeight <= rightHeight) {
      left.push(item)
      leftHeight += estimatedHeight
    }
    else {
      right.push(item)
      rightHeight += estimatedHeight
    }
  })

  return { left, right }
})
const leftColumnFavorites = computed(() => waterfallColumns.value.left)
const rightColumnFavorites = computed(() => waterfallColumns.value.right)

function measureFavoritesTabsHeight() {
  nextTick(() => {
    const query = uni.createSelectorQuery()
    query
      .select('.favorites-tabs')
      .boundingClientRect((rect) => {
        if (rect?.height) {
          favoritesTabsHeight.value = Math.ceil(rect.height)
        }
      })
      .exec()
  })
}

function getDefaultSku(item: MallFavoriteItem) {
  const skus = Array.isArray(item.skus) ? item.skus : []
  return skus.find(sku => sku.isDefault) || skus[0] || null
}

function getVariantText(item: MallFavoriteItem) {
  const sku = getDefaultSku(item)
  const specs = sku?.specs

  if (Array.isArray(specs)) {
    const values = specs
      .map((spec: any) => spec?.value || '')
      .filter(Boolean)
    return values.length ? values.join(' / ') : '默认规格'
  }

  if (specs && typeof specs === 'object') {
    const values = Object.values(specs)
      .map(value => typeof value === 'string' || typeof value === 'number' ? String(value) : '')
      .filter(Boolean)
    return values.length ? values.join(' / ') : '默认规格'
  }

  return '默认规格'
}

function getDisplayImage(item: MallFavoriteItem) {
  const sku = getDefaultSku(item)

  if (typeof sku?.image === 'string' && sku.image) {
    return sku.image
  }

  if (typeof item?.mainImage === 'string' && item.mainImage) {
    return item.mainImage
  }

  if (Array.isArray(item?.images) && typeof item.images[0] === 'string' && item.images[0]) {
    return item.images[0]
  }

  return ''
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
    const list = Array.isArray(result?.data) ? result.data : []
    favorites.value = list.map((item, index) => normalizeFavoriteItem(item, index))
  }
  catch {
    favorites.value = []
  }
  finally {
    loading.value = false
  }
}

async function handleRefresh(ctx?: { done: () => void }) {
  try {
    await loadFavorites()
  }
  finally {
    ctx?.done()
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
    toast.success('已取消收藏')
  }
  catch {}
}

async function clearAllFavorites() {
  if (!favoriteCount.value || clearingFavorites.value) {
    return
  }

  const { confirm } = await uni.showModal({
    title: '清空收藏',
    content: '确定清空当前收藏的所有商品吗？',
    confirmText: '清空',
    confirmColor: '#efb239',
  })

  if (!confirm) {
    return
  }

  clearingFavorites.value = true
  try {
    const currentFavorites = [...favorites.value]
    await Promise.all(
      currentFavorites.map(item =>
        (Apis.general as any).MallFavoritesController_removeFavorite({
          pathParams: { productId: item.id },
        }).send()),
    )
    favorites.value = []
    toast.success('已清空收藏')
  }
  catch {
    toast.error('清空失败，请稍后重试')
  }
  finally {
    clearingFavorites.value = false
  }
}

onShow(() => {
  measureFavoritesTabsHeight()
  loadFavorites()
})
</script>

<template>
  <view class="favorites-page flex flex-col overflow-hidden bg-[#f8f7f6] text-slate-900" :style="{ height: pageContentHeight }">
    <view class="favorites-tabs z-40 mt-px bg-white px-4 pt-3">
      <view class="favorites-toolbar">
        <view class="favorites-toolbar__summary">
          <text class="favorites-toolbar__title">
            全部收藏
          </text>
          <text class="favorites-toolbar__count">
            {{ favoriteCount }} 件商品
          </text>
        </view>
        <view class="favorites-toolbar__actions">
          <view
            v-if="favoriteCount > 0"
            class="favorites-toolbar__clear"
            :class="{ 'favorites-toolbar__clear--disabled': clearingFavorites }"
            @click="clearAllFavorites"
          >
            {{ clearingFavorites ? '清空中...' : '清空收藏' }}
          </view>
        </view>
      </view>
    </view>

    <view class="min-h-0 mt-px flex-1 overflow-hidden bg-white" :style="listAreaStyle">
      <PullLoadContainer
        class="h-full"
        :loading-more="false"
        :has-more="false"
        @refresh="handleRefresh"
      >
        <template #loadMore="{ status }">
          <view v-if="favoriteCount > 0" class="py-6 text-center text-xs text-slate-400">
            {{ status === 'no-more' ? '没有更多了' : '上拉加载更多' }}
          </view>
        </template>
        <view class="px-4 pt-4">
          <view
            v-if="favoriteCount === 0"
            class="favorites-empty-state mt-6 border border-[#efb239]/10 rounded-3xl bg-white/80 px-6 py-12 text-center text-slate-400"
          >
            暂无收藏商品
          </view>

          <template v-else>
            <view class="flex items-start gap-3">
              <view class="min-w-0 flex flex-1 flex-col gap-4">
                <view
                  v-for="item in leftColumnFavorites" :key="item.id"
                  class="favorite-card overflow-hidden border border-[#efb239]/8 rounded-[28rpx] bg-[linear-gradient(180deg,#fffdf9_0%,#fff8ee_100%)]"
                  @click="openProduct(item)"
                >
                  <view
                    class="favorite-card__image-wrap favorite-card__image-wrap--waterfall"
                    :style="`aspect-ratio:${item.ratio || '3/3.6'}`"
                  >
                    <image
                      v-if="getDisplayImage(item)"
                      :src="getDisplayImage(item)"
                      class="favorite-card__image"
                      mode="aspectFill"
                    />
                    <view v-else class="favorite-card__image-placeholder">
                      <wd-icon name="picture" size="28" color="#c7a96b" />
                    </view>
                    <view
                      class="favorite-card__close favorite-card__close--overlay"
                      @click.stop="removeFavorite(item)"
                    >
                      <text class="text-[14px] text-slate-400 leading-none" :class="getFavoriteIconClass('close')" />
                    </view>
                  </view>
                  <view class="p-4 pt-3">
                    <text class="line-clamp-2 block text-[28rpx] font-bold leading-[1.4]">
                      {{ item.name }}
                    </text>
                    <text class="mt-2 block text-xs text-slate-400">
                      {{ getVariantText(item) }}
                    </text>
                    <view class="mt-3 flex items-center gap-2">
                      <text class="text-[34rpx] text-[#efb239] font-bold leading-none">
                        ￥{{ getPrice(item).toFixed(2) }}
                      </text>
                      <text v-if="getOldPrice(item)" class="text-xs text-slate-400 line-through">
                        ￥{{ getOldPrice(item)?.toFixed(2) }}
                      </text>
                    </view>
                  </view>
                </view>
              </view>
              <view class="min-w-0 flex flex-1 flex-col gap-4">
                <view
                  v-for="item in rightColumnFavorites" :key="item.id"
                  class="favorite-card overflow-hidden border border-[#efb239]/8 rounded-[28rpx] bg-[linear-gradient(180deg,#fffdf9_0%,#fff8ee_100%)]"
                  @click="openProduct(item)"
                >
                  <view
                    class="favorite-card__image-wrap favorite-card__image-wrap--waterfall"
                    :style="`aspect-ratio:${item.ratio || '3/3.6'}`"
                  >
                    <image
                      v-if="getDisplayImage(item)"
                      :src="getDisplayImage(item)"
                      class="favorite-card__image"
                      mode="aspectFill"
                    />
                    <view v-else class="favorite-card__image-placeholder">
                      <wd-icon name="picture" size="28" color="#c7a96b" />
                    </view>
                    <view
                      class="favorite-card__close favorite-card__close--overlay"
                      @click.stop="removeFavorite(item)"
                    >
                      <text class="text-[14px] text-slate-400 leading-none" :class="getFavoriteIconClass('close')" />
                    </view>
                  </view>
                  <view class="p-4 pt-3">
                    <text class="line-clamp-2 block text-[28rpx] font-bold leading-[1.4]">
                      {{ item.name }}
                    </text>
                    <text class="mt-2 block text-xs text-slate-400">
                      {{ getVariantText(item) }}
                    </text>
                    <view class="mt-3 flex items-center gap-2">
                      <text class="text-[34rpx] text-[#efb239] font-bold leading-none">
                        ￥{{ getPrice(item).toFixed(2) }}
                      </text>
                      <text v-if="getOldPrice(item)" class="text-xs text-slate-400 line-through">
                        ￥{{ getOldPrice(item)?.toFixed(2) }}
                      </text>
                    </view>
                  </view>
                </view>
              </view>
            </view>
          </template>
        </view>
      </PullLoadContainer>
    </view>
  </view>
</template>

<style scoped>
.favorites-page {
  background: #f8f7f6;
}

.favorites-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  padding-bottom: 18rpx;
}

.favorites-toolbar__summary {
  min-width: 0;
  flex: 1;
}

.favorites-toolbar__title {
  color: #0f172a;
  font-size: 30rpx;
  font-weight: 700;
  line-height: 1;
}

.favorites-toolbar__count {
  margin-left: 12rpx;
  color: #64748b;
  font-size: 24rpx;
  line-height: 1.4;
}

.favorites-toolbar__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.favorites-toolbar__clear {
  color: #d69411;
  font-size: 24rpx;
  font-weight: 700;
  line-height: 1.4;
}

.favorites-toolbar__clear--disabled {
  opacity: 0.7;
}

.favorite-card {
  box-shadow:
    0 18px 36px rgba(120, 93, 47, 0.12),
    0 6px 14px rgba(120, 93, 47, 0.08);
}

.favorite-card__image-wrap {
  height: 232rpx;
  width: 232rpx;
  flex: none;
  overflow: hidden;
  border-radius: 24rpx;
  background: linear-gradient(135deg, #f6efe0 0%, #efe4ce 100%);
  position: relative;
}

.favorite-card__image-wrap--waterfall {
  width: 100%;
  height: auto;
  border-radius: 0;
}

.favorite-card__image {
  display: block;
  height: 100%;
  width: 100%;
}

.favorite-card__image-placeholder {
  display: flex;
  height: 100%;
  width: 100%;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5efe5 0%, #efe7d8 100%);
}

.favorite-card__close {
  display: flex;
  height: 52rpx;
  width: 52rpx;
  flex: none;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 9999rpx;
  background: rgba(255, 255, 255, 0.92);
}

.favorite-card__close--overlay {
  position: absolute;
  right: 16rpx;
  top: 16rpx;
}

.favorites-empty-state {
  box-shadow: inset 0 0 0 1px rgba(239, 178, 57, 0.04);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
