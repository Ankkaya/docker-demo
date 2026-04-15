<script setup lang="ts">
/**
 * 商品评价列表页
 */

definePage({
  name: 'review-list',
  layout: 'default',
  style: {
    navigationBarTitleText: '商品评价',
    navigationStyle: 'custom',
  },
})

const router = useRouter()
const { error: showError } = useGlobalToast()

type ReviewFilterKey = 'all' | 'withImage' | '5' | '4' | '3' | '2' | '1'

interface ReviewItem {
  id: number
  userName: string
  rating: number
  content: string | null
  images: string[]
  replyContent: string | null
  createdAt: string | Date | null
  skuSpecs: Record<string, string> | Array<{ name?: string, value?: string }> | null
}

interface ReviewFilterItem {
  key: ReviewFilterKey
  label: string
}

const reviewFilters: ReviewFilterItem[] = [
  { key: 'all', label: '全部' },
  { key: 'withImage', label: '晒图' },
  // { key: '5', label: '5星' },
  // { key: '4', label: '4星' },
  // { key: '3', label: '3星' },
  // { key: '2', label: '2星' },
  // { key: '1', label: '1星' },
]

const productId = ref<number | null>(null)
const productName = ref('商品评价')
const loading = ref(false)
const loadingMore = ref(false)
const stats = ref<{
  totalCount?: number
  goodCount?: number
  mediumCount?: number
  badCount?: number
  withImageCount?: number
  avgRating?: number
  positiveRate?: number
} | null>(null)
const reviews = ref<ReviewItem[]>([])
const activeFilter = ref<ReviewFilterKey>('all')
const page = ref(1)
const pageSize = 10
const hasMore = ref(true)

const totalCount = computed(() => Number(stats.value?.totalCount ?? 0))
const avgRating = computed(() => Number(stats.value?.avgRating ?? 0))
const positiveRate = computed(() => Number(stats.value?.positiveRate ?? 0))
const withImageCount = computed(() => Number(stats.value?.withImageCount ?? 0))
const ratingSummary = computed(() => {
  const total = totalCount.value
  const good = Number(stats.value?.goodCount ?? 0)
  const medium = Number(stats.value?.mediumCount ?? 0)
  const bad = Number(stats.value?.badCount ?? 0)

  const toPercent = (count: number) => {
    if (!total) {
      return 0
    }
    return Math.round((count / total) * 100)
  }

  return [
    { label: '好评', count: good, percent: toPercent(good) },
    { label: '中评', count: medium, percent: toPercent(medium) },
    { label: '差评', count: bad, percent: toPercent(bad) },
  ]
})

const activeFilterLabel = computed(() => {
  return reviewFilters.find(item => item.key === activeFilter.value)?.label || '全部'
})

function getQueryParams(nextPage: number) {
  const params: Record<string, any> = {
    page: nextPage,
    pageSize,
  }

  if (activeFilter.value === 'withImage') {
    params.hasImage = true
  }
  else if (activeFilter.value !== 'all') {
    params.rating = Number(activeFilter.value)
  }

  return params
}

function normalizeSpecs(specs: ReviewItem['skuSpecs']) {
  if (!specs) {
    return ''
  }

  if (Array.isArray(specs)) {
    return specs
      .filter(item => item?.name && item?.value)
      .map(item => `${item.name}: ${item.value}`)
      .join(' / ')
  }

  return Object.entries(specs)
    .filter(([, value]) => Boolean(value))
    .map(([name, value]) => `${name}: ${value}`)
    .join(' / ')
}

function getReviewInitial(name: string) {
  const normalized = name.trim()
  if (!normalized) {
    return '匿'
  }
  return normalized.slice(0, 1).toUpperCase()
}

function formatDate(value: string | Date | null) {
  if (!value) {
    return ''
  }

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getFilterCount(item: ReviewFilterItem) {
  if (item.key === 'all') {
    return totalCount.value
  }
  if (item.key === 'withImage') {
    return withImageCount.value
  }
  return null
}

async function loadProductName(id: number) {
  try {
    const detail = await Apis.general.MallProductsController_findProductDetail({
      pathParams: { id },
    }).send()
    productName.value = detail?.name || '商品评价'
  }
  catch {
    productName.value = '商品评价'
  }
}

async function loadStats(id: number) {
  try {
    const response = await (Apis.general as any).MallReviewsController_getProductReviewStats({
      pathParams: { id },
    }).send()
    stats.value = response || null
  }
  catch {
    stats.value = null
  }
}

async function loadReviews(reset = false) {
  if (!productId.value) {
    return
  }

  const nextPage = reset ? 1 : page.value
  if (reset) {
    loading.value = true
  }
  else {
    loadingMore.value = true
  }

  try {
    const response = await (Apis.general as any).MallReviewsController_findProductReviews({
      pathParams: { id: productId.value },
      params: getQueryParams(nextPage),
    }).send()

    const list = Array.isArray(response?.list) ? response.list : []
    const totalPages = Number(response?.meta?.totalPages ?? 1)

    reviews.value = reset ? list : [...reviews.value, ...list]
    hasMore.value = nextPage < totalPages
    page.value = nextPage + 1
  }
  catch (error: any) {
    if (reset) {
      reviews.value = []
      hasMore.value = false
    }
  }
  finally {
    loading.value = false
    loadingMore.value = false
  }
}

async function reloadData() {
  if (!productId.value) {
    return
  }

  page.value = 1
  hasMore.value = true

  await Promise.all([
    loadProductName(productId.value),
    loadStats(productId.value),
  ])
  await loadReviews(true)
}

function goBack() {
  router.back()
}

function selectFilter(key: ReviewFilterKey) {
  if (activeFilter.value === key) {
    return
  }
  activeFilter.value = key
  reloadData()
}

function previewImages(images: string[], current: string) {
  if (!images.length) {
    return
  }
  uni.previewImage({
    urls: images,
    current,
  })
}

function handleScrollToLower() {
  if (loading.value || loadingMore.value || !hasMore.value) {
    return
  }
  loadReviews()
}

onLoad((options) => {
  const nextProductId = options?.id ? Number(options.id) : null
  productId.value = nextProductId && !Number.isNaN(nextProductId) ? nextProductId : null

  if (typeof options?.name === 'string' && options.name) {
    productName.value = options.name
  }

  if (!productId.value) {
    showError('缺少商品信息')
    return
  }

  reloadData()
})
</script>

<template>
  <view class="bg-[#f8f7f6] text-slate-900">
    <scroll-view scroll-y class="h-[calc(100vh-112rpx)]" @scrolltolower="handleScrollToLower">
      <view class="px-4 pb-10 pt-4">
        <view class="rounded-[28rpx] from-[#efb239]/8 to-transparent bg-gradient-to-b p-5">
          <view class="flex items-center gap-5">
            <view class="w-[180rpx] shrink-0 text-center">
              <text class="block text-[54rpx] text-slate-900 font-extrabold leading-none">
                {{ avgRating.toFixed(1) }}
              </text>
              <view class="mt-2 flex items-center justify-center gap-0.5">
                <wd-icon
                  v-for="n in 5" :key="n" name="star" size="14"
                  :color="n <= Math.round(avgRating) ? '#efb239' : '#e5e7eb'"
                />
              </view>
              <text class="mt-2 block text-[22rpx] text-slate-500 font-medium">
                {{ totalCount }} 条评价
              </text>
            </view>

            <view class="min-w-0 flex-1 space-y-3">
              <view v-for="item in ratingSummary" :key="item.label" class="flex items-center gap-3">
                <text class="w-[56rpx] text-[24rpx] text-slate-600 font-semibold">
                  {{ item.label }}
                </text>
                <view class="h-2 flex-1 overflow-hidden rounded-full bg-[#efb239]/10">
                  <view class="h-full rounded-full bg-[#efb239]" :style="{ width: `${item.percent}%` }" />
                </view>
                <text class="w-[64rpx] text-right text-[22rpx] text-slate-400">
                  {{ item.percent }}%
                </text>
              </view>
            </view>
          </view>

          <view class="mt-5 flex items-center justify-between rounded-2xl bg-white/80 px-4 py-3">
            <view>
              <text class="block text-sm text-slate-900 font-bold">
                好评率
              </text>
              <text class="mt-1 block text-xs text-slate-500">
                基于已审核公开评价统计
              </text>
            </view>
            <text class="text-xl text-[#efb239] font-extrabold">
              {{ positiveRate.toFixed(0) }}%
            </text>
          </view>
        </view>

        <scroll-view scroll-x class="no-scrollbar mt-4 whitespace-nowrap">
          <view class="flex gap-2 pb-1">
            <view
              v-for="item in reviewFilters" :key="item.key"
              class="inline-flex shrink-0 items-center gap-1 border rounded-full px-4 py-2" :class="activeFilter === item.key
                ? 'border-[#efb239] bg-[#efb239] text-white'
                : 'border-[#efb239]/20 bg-white text-slate-600'" @click="selectFilter(item.key)"
            >
              <text class="text-xs font-semibold">
                {{ item.label }}
              </text>
              <text
                v-if="getFilterCount(item) !== null" class="text-[20rpx]"
                :class="activeFilter === item.key ? 'text-white/90' : 'text-slate-400'"
              >
                {{ getFilterCount(item) }}
              </text>
            </view>
          </view>
        </scroll-view>

        <view v-if="!reviews.length" class="rounded-3xl bg-white px-6 py-14 text-center shadow-sm">
          <view class="mx-auto size-14 flex items-center justify-center rounded-full bg-[#efb239]/10 text-[#c98500]">
            <text class="i-material-symbols:chat-bubble-outline-rounded text-[28px]" />
          </view>
          <text class="mt-4 block text-base font-bold">
            暂无评价
          </text>
          <text class="mt-2 block text-sm text-slate-500 leading-6">
            当前筛选条件下还没有公开评价
          </text>
        </view>

        <view v-else class="mt-4 space-y-4">
          <view
            v-for="item in reviews" :key="item.id"
            class="border border-[#efb239]/6 rounded-3xl bg-white p-4 shadow-sm"
          >
            <view class="mb-3 flex items-center justify-between gap-3">
              <view class="min-w-0 flex items-center gap-3">
                <view
                  class="size-10 flex shrink-0 items-center justify-center rounded-full bg-[#efb239]/12 text-sm text-[#efb239] font-bold"
                >
                  {{ getReviewInitial(item.userName || '匿') }}
                </view>
                <view class="min-w-0">
                  <text class="block truncate text-sm text-slate-900 font-bold">
                    {{ item.userName || '匿名用户' }}
                  </text>
                  <view class="mt-1 flex items-center gap-0.5">
                    <wd-icon
                      v-for="n in 5" :key="n" name="star" size="12"
                      :color="n <= Number(item.rating || 0) ? '#efb239' : '#e2e8f0'"
                    />
                  </view>
                </view>
              </view>
              <text class="shrink-0 text-[22rpx] text-slate-400">
                {{ formatDate(item.createdAt) }}
              </text>
            </view>

            <text v-if="normalizeSpecs(item.skuSpecs)" class="mb-2 block text-[22rpx] text-slate-400">
              {{ normalizeSpecs(item.skuSpecs) }}
            </text>

            <text class="block text-sm text-slate-700 leading-7">
              {{ item.content || '用户未填写文字评价' }}
            </text>

            <scroll-view v-if="item.images?.length" scroll-x class="no-scrollbar mt-4 whitespace-nowrap">
              <view class="flex gap-2 pb-1">
                <image
                  v-for="image in item.images" :key="image" :src="image" mode="aspectFill"
                  class="h-[180rpx] w-[180rpx] shrink-0 rounded-2xl bg-slate-100"
                  @click="previewImages(item.images, image)"
                />
              </view>
            </scroll-view>

            <view
              v-if="item.replyContent"
              class="mt-4 border-l-4 border-[#efb239] rounded-2xl bg-[#efb239]/6 px-4 py-3"
            >
              <text class="block text-xs text-[#efb239] font-bold">
                商家回复
              </text>
              <text class="mt-1 block text-xs text-slate-600 leading-6">
                {{ item.replyContent }}
              </text>
            </view>
          </view>
        </view>

        <view v-if="reviews.length" class="py-6 text-center text-xs text-slate-400">
          {{ loadingMore ? '正在加载更多...' : hasMore ? `当前筛选：${activeFilterLabel}` : '没有更多评价了' }}
        </view>
      </view>
    </scroll-view>
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
</style>
