<script setup lang="ts">
/**
 * 商品详情页 - 参考 Stitch 设计稿
 */

import { addToCart as addToCartRequest } from '@/api/cart'
import { useUserStore } from '@/store/userStore'

definePage({
  name: 'product-detail',
  layout: 'default',
  style: {
    navigationBarTitleText: '商品详情',
    navigationStyle: 'custom',
  },
})

const router = useRouter()
const userStore = useUserStore()
const { error: showError } = useGlobalToast()

interface ProductOptionGroup {
  name: string
  values: string[]
}

interface ReviewPreview {
  id: number
  userName: string
  rating: number
  content: string | null
}

interface RelatedProduct {
  id: number
  name: string
  price: number
  image: string
}

interface NormalizedSku {
  id: number
  skuCode: string
  salePrice: number
  marketPrice: number
  image: string | null
  barcode: string | null
  isDefault: boolean
  totalStock: number
  specsMap: Record<string, string>
}

interface SkuOptionState {
  exists: boolean
  inStock: boolean
}

interface ProductHighlightItem {
  key: string
  label: string
  value: string
}

const routeProductId = ref<number | null>(null)
const loading = ref(false)
const productDetail = ref<MallProductDetailVo | null>(null)
const reviewStats = ref<{ totalCount?: number, avgRating?: number } | null>(null)
const reviewPreview = ref<ReviewPreview | null>(null)
const relatedProducts = ref<RelatedProduct[]>([])
const currentImage = ref(0)
const liked = ref(true)
const selectedSpecs = ref<Record<string, string>>({})
const lastLoadedProductId = ref<number | null>(null)
const addingToCart = ref(false)

const specGroups = computed<ProductOptionGroup[]>(() => {
  const list = productDetail.value?.specOptions
  return Array.isArray(list) ? list : []
})

const normalizedSkus = computed<NormalizedSku[]>(() => {
  const list = Array.isArray(productDetail.value?.skus) ? productDetail.value.skus : []
  return list.map((sku: any) => {
    const rawSpecs = Array.isArray(sku.specs) ? sku.specs : []
    const specsMap = rawSpecs.reduce((result: Record<string, string>, item: any) => {
      if (item?.name && item?.value) {
        result[item.name] = item.value
      }
      return result
    }, {})

    return {
      id: sku.id,
      skuCode: sku.skuCode,
      salePrice: Number(sku.salePrice || 0),
      marketPrice: Number(sku.marketPrice || 0),
      image: typeof sku.image === 'string' ? sku.image : null,
      barcode: typeof sku.barcode === 'string' ? sku.barcode : null,
      isDefault: Boolean(sku.isDefault),
      totalStock: Number(sku.totalStock || 0),
      specsMap,
    }
  })
})

const gallery = computed(() => {
  const images = Array.isArray(productDetail.value?.images) ? productDetail.value?.images.filter(Boolean) : []
  if (images.length) {
    return images
  }
  if (typeof productDetail.value?.mainImage === 'string' && productDetail.value.mainImage) {
    return [productDetail.value.mainImage]
  }
  return []
})

const selectedSku = computed(() => {
  const skus = normalizedSkus.value
  if (!skus.length) {
    return null
  }

  const optionCount = specGroups.value.length
  if (!optionCount) {
    return skus.find(sku => sku.isDefault) || skus[0]
  }

  const matchedSku = skus.find((sku) => {
    return specGroups.value.every(group => selectedSpecs.value[group.name] === sku.specsMap[group.name])
  })

  return matchedSku || skus.find(sku => sku.isDefault) || skus[0]
})

const productName = computed(() => productDetail.value?.name || '商品详情')
const productPrice = computed(() => Number(selectedSku.value?.salePrice ?? 0))
const productMarketPrice = computed(() => {
  const marketPrice = Number(selectedSku.value?.marketPrice ?? 0)
  return Number.isFinite(marketPrice) && marketPrice > 0 ? marketPrice : null
})
const reviewCount = computed(() => Number(reviewStats.value?.totalCount ?? 0))
const avgRating = computed(() => Number(reviewStats.value?.avgRating ?? 5))
const totalStock = computed(() => Number(selectedSku.value?.totalStock ?? 0))
const isPurchasable = computed(() => Boolean(selectedSku.value) && totalStock.value > 0)
const selectedSpecSummary = computed(() => {
  const values = specGroups.value
    .map(group => selectedSpecs.value[group.name])
    .filter(Boolean)

  return values.length ? values.join(' / ') : '默认规格'
})
const hasReviews = computed(() => reviewCount.value > 0 && Boolean(reviewPreview.value))
const productDetailHtml = computed(() => {
  const detail = productDetail.value?.detail
  return typeof detail === 'string' && detail.trim() ? detail : ''
})
const productDescription = computed(() => {
  const description = productDetail.value?.description
  if (typeof description === 'string' && description.trim()) {
    return description.trim()
  }

  if (productDetailHtml.value) {
    return ''
  }

  return '暂无商品详情'
})
const productHighlights = computed(() => {
  const items: ProductHighlightItem[] = []

  if (productDetail.value?.brand?.name) {
    items.push({
      key: 'brand',
      label: '品牌',
      value: productDetail.value.brand.name,
    })
  }

  if (productDetail.value?.category?.name) {
    items.push({
      key: 'category',
      label: '分类',
      value: productDetail.value.category.name,
    })
  }

  if (productDetail.value?.unit?.name) {
    items.push({
      key: 'unit',
      label: '单位',
      value: productDetail.value.unit.name,
    })
  }

  items.push({
    key: 'stock',
    label: '库存',
    value: totalStock.value > 0 ? `${totalStock.value}` : '暂时缺货',
  })

  return items.slice(0, 4)
})

function getHighlightValueClass(item: ProductHighlightItem) {
  return 'text-slate-900'
}

function getHighlightIconClass(item: ProductHighlightItem) {
  switch (item.key) {
    case 'brand':
      return 'i-material-symbols:storefront-outline-rounded'
    case 'category':
      return 'i-material-symbols:grid-view-outline-rounded'
    case 'unit':
      return 'i-material-symbols:straighten-outline-rounded'
    case 'stock':
      return 'i-material-symbols:inventory-2-outline'
    default:
      return 'i-material-symbols:info-outline-rounded'
  }
}

function getReviewInitial(name: string) {
  const normalized = name.trim()
  if (!normalized) {
    return '匿'
  }

  return normalized.slice(0, 1).toUpperCase()
}

function syncSelectedSpecs(detail: MallProductDetailVo) {
  const defaultSku = normalizedSkus.value.find(sku => sku.isDefault) || normalizedSkus.value[0]
  const nextSelected: Record<string, string> = {}

  for (const group of Array.isArray(detail.specOptions) ? detail.specOptions : []) {
    const fromSku = defaultSku?.specsMap?.[group.name]
    nextSelected[group.name] = fromSku || group.values[0] || ''
  }

  selectedSpecs.value = nextSelected
}

function getCandidateSkus(groupName: string, value: string) {
  return normalizedSkus.value.filter((sku) => {
    if (sku.specsMap[groupName] !== value) {
      return false
    }

    return specGroups.value.every((group) => {
      if (group.name === groupName) {
        return true
      }

      const selectedValue = selectedSpecs.value[group.name]
      return !selectedValue || sku.specsMap[group.name] === selectedValue
    })
  })
}

function getOptionState(groupName: string, value: string): SkuOptionState {
  const candidates = getCandidateSkus(groupName, value)
  return {
    exists: candidates.length > 0,
    inStock: candidates.some(item => Number(item.totalStock || 0) > 0),
  }
}

async function loadReviewStats(productId: number) {
  try {
    const response = await (Apis.general as any).MallReviewsController_getProductReviewStats({
      pathParams: { id: productId },
    }).send()
    reviewStats.value = response || null
  }
  catch {
    reviewStats.value = null
  }
}

async function loadReviewPreview(productId: number) {
  try {
    const response = await (Apis.general as any).MallReviewsController_findProductReviews({
      pathParams: { id: productId },
      params: {
        page: 1,
        pageSize: 1,
      },
    }).send()

    const item = Array.isArray(response?.list) ? response.list[0] : null
    reviewPreview.value = item
      ? {
        id: item.id,
        userName: item.userName || '匿名用户',
        rating: Number(item.rating || 5),
        content: item.content || '用户暂无文字评价',
      }
      : null
  }
  catch {
    reviewPreview.value = null
  }
}

async function loadRelatedProducts(productId: number) {
  try {
    const response = await Apis.general.MallProductsController_findHotProducts({
      params: {
        limit: 6,
      },
    }).send()

    const list = Array.isArray(response?.list) ? response.list : []
    relatedProducts.value = list
      .filter(item => item.id !== productId)
      .slice(0, 4)
      .map(item => ({
        id: item.id,
        name: item.name,
        price: Number(item.minPrice || 0),
        image: typeof item.mainImage === 'string' ? item.mainImage : '',
      }))
  }
  catch {
    relatedProducts.value = []
  }
}

async function loadProductData(productId: number) {
  loading.value = true

  try {
    const detail = await Apis.general.MallProductsController_findProductDetail({
      pathParams: {
        id: productId,
      },
    }).send()

    productDetail.value = detail
    syncSelectedSpecs(detail)

    await Promise.all([
      loadReviewStats(productId),
      loadReviewPreview(productId),
      loadRelatedProducts(productId),
    ])
  }
  catch (error: any) {
    productDetail.value = null
    reviewStats.value = null
    reviewPreview.value = null
    relatedProducts.value = []
  }
  finally {
    loading.value = false
  }
}

function syncRouteState(options?: Record<string, any>, forceLoad = false) {
  const nextOptions = options || {}
  const nextProductId = nextOptions.id ? Number(nextOptions.id) : null
  routeProductId.value = nextProductId && !Number.isNaN(nextProductId) ? nextProductId : null

  if (!routeProductId.value) {
    return
  }

  if (forceLoad || lastLoadedProductId.value !== routeProductId.value || !productDetail.value) {
    lastLoadedProductId.value = routeProductId.value
    loadProductData(routeProductId.value)
  }
}

onLoad((options) => {
  syncRouteState(options as Record<string, any>, true)
})

function onImageChange(e: any) {
  currentImage.value = e.detail.current
}

function selectSpec(groupName: string, value: string) {
  const optionState = getOptionState(groupName, value)
  if (!optionState.exists) {
    return
  }

  selectedSpecs.value = {
    ...selectedSpecs.value,
    [groupName]: value,
  }
}

function toggleLike() {
  liked.value = !liked.value
}

async function addToCart() {
  if (!isPurchasable.value) {
    uni.showToast({ title: '当前规格暂无库存', icon: 'none' })
    return
  }

  if (!userStore.isLoggedIn) {
    userStore.openAuthPopup({
      name: 'product-detail',
      path: '/pages/product-detail/index',
      query: routeProductId.value ? { id: String(routeProductId.value) } : undefined,
    })
    return
  }

  if (!selectedSku.value || addingToCart.value) {
    return
  }

  addingToCart.value = true
  try {
    await addToCartRequest({
      skuId: selectedSku.value.id,
      quantity: 1,
    }).send()
    if (routeProductId.value) {
      await loadProductData(routeProductId.value)
    }
    uni.showToast({ title: '已加入购物车', icon: 'success' })
  }
  catch {}
  finally {
    addingToCart.value = false
  }
}

function buyNow() {
  if (!isPurchasable.value) {
    uni.showToast({ title: '当前规格暂不可购买', icon: 'none' })
    return
  }
  uni.showToast({ title: '立即购买开发中', icon: 'none' })
}

function openRelated(item: typeof relatedProducts.value[number]) {
  router.push({
    name: 'product-detail',
    query: {
      id: String(item.id),
    },
  })
}

function openReviewList() {
  if (!routeProductId.value) {
    return
  }

  router.push({
    name: 'review-list',
    params: {
      id: String(routeProductId.value),
    },
  })
}
</script>

<template>
  <view class="flex flex-col bg-[#f8f7f6] text-slate-900">
    <scroll-view scroll-y class="flex-1">
      <view class="pb-28">
        <view class="relative h-[640rpx] w-full overflow-hidden bg-[#efb239]/10">
          <view v-if="loading"
            class="absolute inset-0 z-10 flex items-center justify-center bg-white/40 text-sm text-slate-500 backdrop-blur-sm">
            加载中...
          </view>
          <swiper class="h-full w-full" :indicator-dots="false" :autoplay="false" :circular="true"
            @change="onImageChange">
            <swiper-item v-for="(img, idx) in gallery" :key="idx">
              <image :src="img" mode="aspectFill" class="h-full w-full" />
            </swiper-item>
          </swiper>

          <view class="absolute bottom-6 left-1/2 flex gap-2 -translate-x-1/2">
            <view v-for="(_, idx) in gallery" :key="idx" class="size-2 rounded-full"
              :class="idx === currentImage ? 'bg-[#efb239]' : 'bg-[#efb239]/30'" />
          </view>

          <view
            class="absolute right-4 top-6 size-10 flex items-center justify-center rounded-full bg-white/90 shadow-md"
            @click="toggleLike">
            <wd-icon :name="liked ? 'heart-filled' : 'heart'" size="18" :color="liked ? '#f43f5e' : '#64748b'" />
          </view>
        </view>

        <view class="px-5 pt-6">
          <view class="mb-2 flex items-center gap-1">
            <view class="flex text-[#efb239]">
              <wd-icon v-for="n in 5" :key="n" name="star" size="14" color="#efb239" />
            </view>
            <text class="text-xs text-slate-500 font-medium">
              ({{ reviewCount }} Reviews · {{ avgRating.toFixed(1) }})
            </text>
          </view>
          <text class="mb-2 block text-2xl text-slate-900 font-bold leading-tight">
            {{ productName }}
          </text>
          <view class="flex items-end gap-3">
            <text class="text-3xl text-[#efb239] font-bold">
              ¥{{ productPrice.toFixed(2) }}
            </text>
            <text v-if="productMarketPrice" class="pb-1 text-sm text-slate-400 line-through">
              ¥{{ productMarketPrice.toFixed(2) }}
            </text>
          </view>
          <view v-if="selectedSku" class="mt-3 flex items-center gap-3 text-xs">
            <text class="rounded-full bg-[#efb239]/10 px-3 py-1 font-semibold text-[#c98500]">
              已选 {{ selectedSpecSummary }}
            </text>
            <text :class="totalStock > 0 ? 'text-emerald-600' : 'text-rose-500'">
              {{ totalStock > 0 ? `库存 ${totalStock}` : '暂时缺货' }}
            </text>
            <text v-if="selectedSku.barcode" class="text-slate-400">
              条码 {{ selectedSku.barcode }}
            </text>
          </view>
        </view>

        <view v-if="specGroups.length" class="mt-8 px-5">
          <view v-for="group in specGroups" :key="group.name" class="mt-6">
            <text class="mb-3 block text-sm text-slate-600 font-bold uppercase">
              {{ group.name }}:
              <text class="text-slate-900">
                {{ selectedSpecs[group.name] }}
              </text>
            </text>
            <view class="flex flex-wrap gap-2">
              <view v-for="value in group.values" :key="`${group.name}-${value}`"
                class="border rounded-lg px-4 py-3 text-center text-sm font-medium" :class="[
                  selectedSpecs[group.name] === value
                    ? 'border-2 border-[#efb239] bg-[#efb239]/10 text-slate-900 font-bold'
                    : 'border-slate-200 bg-white text-slate-700',
                  !getOptionState(group.name, value).exists ? 'cursor-not-allowed opacity-35' : '',
                  getOptionState(group.name, value).exists && !getOptionState(group.name, value).inStock ? 'border-dashed text-slate-400' : '',
                ]" @click="selectSpec(group.name, value)">
                {{ value }}
                <text v-if="getOptionState(group.name, value).exists && !getOptionState(group.name, value).inStock"
                  class="ml-1 text-[10px] text-rose-400">
                  售罄
                </text>
              </view>
            </view>
          </view>
        </view>

        <view v-if="productHighlights.length" class="mt-10 px-5">
          <view class="mb-4 flex items-center gap-3">
            <view class="h-5 w-1 rounded-full bg-[#efb239]" />
            <text class="text-xl text-slate-900 font-bold tracking-[0.02em]">
              商品信息
            </text>
          </view>
          <view class="grid grid-cols-2 gap-3">
            <view v-for="item in productHighlights" :key="item.key"
              class="flex items-center gap-3 rounded-2xl p-4 shadow-sm">
              <view
                class="size-10 flex shrink-0 items-center justify-center rounded-full bg-[#efb239]/10 text-[#efb239]">
                <view class="text-[20px]" :class="getHighlightIconClass(item)" />
              </view>
              <view class="min-w-0 flex-1">
                <text class="block text-xs text-slate-400 font-medium">
                  {{ item.label }}
                </text>
                <text class="mt-1 block text-sm leading-6 font-bold" :class="getHighlightValueClass(item)">
                  {{ item.value }}
                </text>
              </view>
            </view>
          </view>
        </view>

        <view class="mt-10 px-5">
          <view class="mb-4 flex items-center gap-3">
            <view class="h-5 w-1 rounded-full bg-[#efb239]" />
            <text class="text-xl text-slate-900 font-bold tracking-[0.02em]">
              商品详情
            </text>
          </view>
          <view class="rounded-xl bg-[#efb239]/8 p-6">
            <text v-if="productDescription" class="mb-4 block text-sm text-slate-600 leading-6">
              {{ productDescription }}
            </text>
            <view v-if="productDetailHtml" class="overflow-hidden rounded-xl bg-[#efb239]/8">
              <mp-html :content="productDetailHtml" />
            </view>
          </view>
        </view>

        <view class="mt-10 px-5">
          <view class="mb-4">
            <view class="flex items-center justify-between">
              <view class="flex items-center gap-3">
                <view class="h-5 w-1 rounded-full bg-[#efb239]" />
                <text class="text-xl text-slate-900 font-bold tracking-[0.02em]">
                  商品评价
                </text>
              </view>
              <text class="text-sm text-[#efb239] font-bold" @click="openReviewList">
                查看全部
              </text>
            </view>
            <text class="mt-2 block text-sm text-slate-500">
              {{ reviewCount > 0 ? `来自 ${reviewCount} 位用户的真实评价` : '暂无用户评价' }}
            </text>
          </view>
          <view v-if="hasReviews" class="border border-slate-100 rounded-xl bg-white p-4 shadow-sm">
            <view class="mb-2 flex items-center justify-between">
              <view class="flex items-center gap-2">
                <view
                  class="size-8 flex items-center justify-center rounded-full bg-[#efb239]/20 text-xs text-[#efb239] font-bold">
                  {{ getReviewInitial(reviewPreview?.userName || '匿名用户') }}
                </view>
                <text class="text-sm text-slate-900 font-bold">
                  {{ reviewPreview?.userName || '暂时还没有评价' }}
                </text>
              </view>
              <view class="flex">
                <wd-icon v-for="n in 5" :key="n" name="star" size="14"
                  :color="n <= Number(reviewPreview?.rating || 5) ? '#efb239' : '#e2e8f0'" />
              </view>
            </view>
            <text class="text-sm text-slate-600 leading-6">
              {{ reviewPreview?.content || '当前商品还没有公开评价，欢迎成为第一位购买并评价的用户。' }}
            </text>
          </view>
          <view v-else
            class="rounded-xl border border-dashed border-[#efb239]/30 bg-white px-5 py-6 text-center shadow-sm">
            <text class="block text-base text-slate-900 font-bold">
              暂无评价
            </text>
            <text class="mt-2 block text-sm text-slate-500 leading-6">
              还没有用户评价这件商品，欢迎购买后提交第一个真实评价。
            </text>
          </view>
        </view>

        <view v-if="relatedProducts.length" class="mt-10">
          <text class="mb-4 block px-5 text-xl text-slate-900 font-bold">
            相关推荐
          </text>
          <scroll-view scroll-x class="no-scrollbar w-full whitespace-nowrap px-5 pb-4">
            <view v-for="item in relatedProducts" :key="item.id" class="mr-4 inline-block w-[280rpx]"
              @click="openRelated(item)">
              <image :src="item.image" mode="aspectFill" class="h-[280rpx] w-[280rpx] rounded-lg bg-slate-200" />
              <text class="line-clamp-1 mt-2 block text-xs text-slate-900 font-bold">
                {{ item.name }}
              </text>
              <text class="text-sm text-[#efb239] font-bold">
                ¥{{ item.price.toFixed(2) }}
              </text>
            </view>
          </scroll-view>
        </view>
      </view>
    </scroll-view>

    <view
      class="fixed bottom-0 left-0 right-0 z-50 flex items-center gap-4 border-t border-slate-100 bg-white/95 p-4 pb-6 backdrop-blur-md">

      <view class="flex flex-1 gap-3">
        <view class="flex-1 rounded-xl py-3 text-center text-sm font-bold transition"
          :class="isPurchasable ? 'border-[3px] border-[#efb239] bg-white text-[#efb239] shadow-[inset_0_0_0_1px_rgba(239,178,57,0.24)]' : 'border-2 border-slate-200 text-slate-300 bg-slate-50'"
          @click="addToCart">
          {{ addingToCart ? '加入中...' : (isPurchasable ? '加入购物车' : '暂时缺货') }}
        </view>
        <view class="flex-[1.5] rounded-xl py-3 text-center text-sm font-bold transition"
          :class="isPurchasable ? 'bg-[#efb239] text-white' : 'bg-slate-200 text-slate-400'" @click="buyNow">
          {{ isPurchasable ? '立即购买' : '暂无库存' }}
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
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
