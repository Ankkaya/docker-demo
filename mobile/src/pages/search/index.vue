<script setup lang="ts">
/**
 * 搜索页面 - BabyWhale Kids
 */
import PullLoadContainer from '@/components/common/PullLoadContainer.vue'

definePage({
  name: 'search',
  layout: 'default',
  style: {
    navigationBarTitleText: '搜索',
    navigationStyle: 'custom',
  },
})

const router = useRouter()
const toast = useToast()
const { topAreaHeight, safeAreaInsetsBottom } = usePlatform()
const apiBaseURL = import.meta.env.VITE_API_BASE_URL || ''

const SEARCH_HISTORY_STORAGE_KEY = 'mall_search_history'
const SEARCH_BAR_INPUT_HEIGHT = 44
const SEARCH_BAR_VERTICAL_PADDING = 32
const SEARCH_BAR_TOTAL_HEIGHT = SEARCH_BAR_INPUT_HEIGHT + SEARCH_BAR_VERTICAL_PADDING
const fallbackCategoryIcons = ['child_care', 'stroller', 'face', 'toys', 'eco', 'local_offer']
const pageSize = 20

interface SearchResultItem {
  id: number
  tag: string
  name: string
  price: number
  image: string
}

interface RecommendCategoryItem {
  id: number
  name: string
  image?: string | null
  icon: string
  iconUrl?: string | null
}

interface MallSearchInitResponse {
  hotKeywords?: Array<{
    id: number
    keyword: string
    sort: number
    isEnabled: boolean
  }>
  recommendCategories?: CategoryTreeVo[]
}

const searchKeyword = ref('')
const keywordInResult = ref('')
const isLoading = ref(false)
const loadingMore = ref(false)
const hasSearched = ref(false)
const page = ref(1)
const hasMore = ref(true)
const searchHistory = ref<string[]>([])
const searchResults = ref<SearchResultItem[]>([])
const hotSearches = ref<string[]>([])
const recommendCategories = ref<RecommendCategoryItem[]>([])
const activeCategoryId = ref<number | null>(null)
const searchMode = ref<'keyword' | 'category' | null>(null)

const isSearching = computed(() => isLoading.value || hasSearched.value)
const isResultEmpty = computed(() => hasSearched.value && !isLoading.value && searchResults.value.length === 0)
const pageContentHeight = computed(() => `calc(100vh - ${topAreaHeight}px - ${safeAreaInsetsBottom}px)`)
const resultAreaStyle = computed(() => ({
  height: `calc(${pageContentHeight.value} - ${SEARCH_BAR_TOTAL_HEIGHT}px)`,
}))

function resolveAssetUrl(url?: string | null) {
  if (!url) {
    return ''
  }

  if (/^https?:\/\//i.test(url)) {
    return url
  }

  if (!apiBaseURL) {
    return url
  }

  try {
    return new URL(url, apiBaseURL).toString()
  }
  catch {
    return url
  }
}

function loadSearchHistory() {
  const history = uni.getStorageSync(SEARCH_HISTORY_STORAGE_KEY)
  searchHistory.value = Array.isArray(history) ? history.filter(item => typeof item === 'string') : []
}

function persistSearchHistory() {
  uni.setStorageSync(SEARCH_HISTORY_STORAGE_KEY, searchHistory.value)
}

function saveSearchHistory(keyword: string) {
  const normalizedKeyword = keyword.trim()
  if (!normalizedKeyword) {
    return
  }

  searchHistory.value = [
    normalizedKeyword,
    ...searchHistory.value.filter(item => item !== normalizedKeyword),
  ].slice(0, 10)

  persistSearchHistory()
}

function mapSearchResults(response: MallProductListResponseVo) {
  const list = Array.isArray(response?.data) ? response.data : []
  return list.map(item => ({
    id: item.id,
    tag: typeof item.category?.name === 'string' && item.category.name ? item.category.name : '搜索结果',
    name: item.name,
    price: Number(item.minPrice || 0),
    image: typeof item.mainImage === 'string' ? item.mainImage : '',
  }))
}

function mapRecommendCategories(list: CategoryTreeVo[]) {
  const categoryList = Array.isArray(list) ? list.slice(0, 8) : []
  recommendCategories.value = categoryList.map((item, index) => ({
    id: item.id,
    name: item.name,
    image: resolveAssetUrl(typeof item.image === 'string' ? item.image : ''),
    icon: typeof item.icon === 'string' && item.icon ? item.icon : fallbackCategoryIcons[index] || fallbackCategoryIcons[0],
    iconUrl: typeof item.iconUrl === 'string' ? item.iconUrl : '',
  }))
}

async function loadSearchInitData() {
  try {
    const response = await alovaInstance.Get('/mall/search/init').send() as MallSearchInitResponse
    hotSearches.value = Array.isArray(response?.hotKeywords)
      ? response.hotKeywords
          .map(item => item?.keyword?.trim())
          .filter((item): item is string => Boolean(item))
      : []
    mapRecommendCategories(Array.isArray(response?.recommendCategories) ? response.recommendCategories : [])
  }
  catch {}
}

async function loadSearchResults(reset = false) {
  const nextPage = reset ? 1 : page.value

  if (searchMode.value === null) {
    return
  }

  if (reset) {
    isLoading.value = true
  }
  else {
    loadingMore.value = true
  }

  try {
    const response = await Apis.general.MallProductsController_findProducts({
      params: {
        keyword: searchMode.value === 'keyword' ? keywordInResult.value : undefined,
        categoryId: searchMode.value === 'category' ? (activeCategoryId.value || undefined) : undefined,
        page: nextPage,
        pageSize,
        sort: 'new',
      },
    }).send()

    const normalized = mapSearchResults(response)
    searchResults.value = reset ? normalized : [...searchResults.value, ...normalized]
    hasMore.value = nextPage < Number(response?.meta?.totalPages || 1)
    page.value = nextPage + 1
  }
  catch {
    if (reset) {
      searchResults.value = []
    }
    hasMore.value = false
  }
  finally {
    isLoading.value = false
    loadingMore.value = false
  }
}

async function performSearchByKeyword(keyword: string) {
  const normalizedKeyword = keyword.trim()
  if (!normalizedKeyword) {
    return
  }

  hasSearched.value = true
  searchMode.value = 'keyword'
  activeCategoryId.value = null
  keywordInResult.value = normalizedKeyword
  page.value = 1
  hasMore.value = true
  await loadSearchResults(true)
  saveSearchHistory(normalizedKeyword)
}

async function performSearchByCategory(category: RecommendCategoryItem) {
  hasSearched.value = true
  searchMode.value = 'category'
  activeCategoryId.value = category.id
  keywordInResult.value = category.name
  searchKeyword.value = category.name
  page.value = 1
  hasMore.value = true
  await loadSearchResults(true)
}

function onSearch() {
  const keyword = searchKeyword.value.trim()
  if (!keyword) {
    return
  }

  performSearchByKeyword(keyword)
}

function onHistoryClick(keyword: string) {
  searchKeyword.value = keyword
  onSearch()
}

function onHotSearchClick(keyword: string) {
  searchKeyword.value = keyword
  onSearch()
}

function onRecommendCategoryClick(category: RecommendCategoryItem) {
  performSearchByCategory(category)
}

function clearSearchKeyword() {
  searchKeyword.value = ''
  resetSearchState()
}

function handleLoadMore() {
  if (isLoading.value || loadingMore.value || !hasMore.value || !hasSearched.value) {
    return
  }

  loadSearchResults()
}

async function handleRefresh(ctx?: { done: () => void }) {
  try {
    if (hasSearched.value) {
      page.value = 1
      hasMore.value = true
      await loadSearchResults(true)
    }
  }
  finally {
    ctx?.done()
  }
}

async function handleContainerLoadMore(ctx?: { done: () => void }) {
  try {
    await handleLoadMore()
  }
  finally {
    ctx?.done()
  }
}

function clearHistory() {
  uni.showModal({
    title: '提示',
    content: '确定要清除搜索历史吗？',
    success: (res) => {
      if (res.confirm) {
        searchHistory.value = []
        persistSearchHistory()
      }
    },
  })
}

function removeHistory(index: number) {
  searchHistory.value.splice(index, 1)
  persistSearchHistory()
}

function goBack() {
  router.back()
}

function addToCart(product: SearchResultItem) {
  toast.success(`已加入：${product.name}`)
}

function onProductClick(product: SearchResultItem) {
  router.push({
    name: 'product-detail',
    params: {
      id: String(product.id),
    },
  })
}

function resetSearchState() {
  isLoading.value = false
  loadingMore.value = false
  hasSearched.value = false
  page.value = 1
  hasMore.value = true
  searchMode.value = null
  activeCategoryId.value = null
  keywordInResult.value = ''
  searchResults.value = []
}

onShow(() => {
  loadSearchHistory()
  loadSearchInitData()
})
</script>

<template>
  <view class="flex flex-col bg-[#f8f7f6]" :style="{ height: pageContentHeight }">
    <view class="sticky top-0 z-50 bg-[#f8f7f6]/80 backdrop-blur-md">
      <view class="flex items-center gap-3 bg-white px-4 py-4">
        <view
          class="flex flex-1 items-center border border-[#efb239]/10 rounded-xl bg-[#f1f5f9] shadow-sm"
          :style="{ height: `${SEARCH_BAR_INPUT_HEIGHT}px` }"
        >
          <view class="flex items-center justify-center pl-4 text-[#efb239]/60">
            <wd-icon name="search" size="18" />
          </view>
          <input
            v-model="searchKeyword"
            class="h-full flex-1 border-none bg-transparent px-3 text-sm font-normal placeholder:text-slate-400 focus:outline-none"
            placeholder="搜索商品名称..." confirm-type="search" focus @confirm="onSearch"
          >
          <view v-if="searchKeyword" class="pr-3 text-slate-400" @click="clearSearchKeyword">
            <wd-icon name="close" size="16" />
          </view>
        </view>
      </view>
    </view>

    <view v-if="isSearching" class="flex-1 overflow-hidden" :style="resultAreaStyle">
      <PullLoadContainer
        class="h-full"
        :loading-more="loadingMore"
        :has-more="hasMore"
        @refresh="handleRefresh"
        @load-more="handleContainerLoadMore"
      >
        <view class="px-4 py-3">
          <view class="mb-4 flex items-center justify-between">
            <text class="text-sm text-slate-500">
              搜索结果 "{{ keywordInResult }}"
            </text>
            <text class="text-xs text-[#efb239]" @click="resetSearchState">
              返回
            </text>
          </view>
          <view v-if="isResultEmpty" class="py-12 text-center text-sm text-slate-400">
            暂无相关商品
          </view>
          <view v-else-if="searchResults.length > 0" class="grid grid-cols-2 gap-4 pb-6">
            <view
              v-for="product in searchResults" :key="product.id"
              class="overflow-hidden border border-[#efb239]/5 rounded-xl bg-white shadow-sm"
              @click="onProductClick(product)"
            >
              <view class="aspect-square overflow-hidden">
                <image :src="product.image" class="h-full w-full" mode="aspectFill" />
              </view>
              <view class="p-3">
                <text class="mb-1 block text-xs text-slate-400">
                  {{ product.tag }}
                </text>
                <text class="line-clamp-1 block text-sm text-slate-800 font-semibold">
                  {{ product.name }}
                </text>
                <view class="mt-2 flex items-center justify-between">
                  <text class="text-[#efb239] font-bold">
                    ¥{{ product.price.toFixed(2) }}
                  </text>
                  <app-button
                    custom-class="search-result__action"
                    custom-style="padding:0;min-width:0;width:56rpx;height:56rpx;"
                    @click.stop="addToCart(product)"
                  >
                    <wd-icon name="add" size="14" color="#fff" />
                  </app-button>
                </view>
              </view>
            </view>
          </view>
        </view>
        <template #loadMore="{ loadingMore: slotLoadingMore, hasMore: slotHasMore }">
          <view v-if="searchResults.length && !isLoading" class="pb-8 text-center text-xs text-slate-400">
            {{ slotLoadingMore ? '正在加载更多...' : slotHasMore ? '上拉加载更多' : '没有更多商品了' }}
          </view>
        </template>
      </PullLoadContainer>
    </view>

    <view v-else class="flex-1 px-4 py-2 overflow-y-auto" :style="resultAreaStyle">
      <view class="mb-6">
        <view class="mb-3 flex items-center justify-between">
          <text class="text-base text-slate-900 font-bold">
            搜索历史
          </text>
          <view v-if="searchHistory.length > 0" class="flex items-center gap-2 text-slate-400" @click="clearHistory">
            <wd-icon name="delete" size="16" color="#efb239" />
            <text class="text-xs text-[#efb239]">
              清除所有
            </text>
          </view>
        </view>
        <view v-if="searchHistory.length > 0" class="flex flex-wrap gap-2">
          <view
            v-for="(item, index) in searchHistory" :key="`${item}-${index}`"
            class="flex items-center gap-1 border border-slate-200 rounded-full bg-white px-3 py-2 text-sm text-slate-600 shadow-sm"
          >
            <text @click="onHistoryClick(item)">
              {{ item }}
            </text>
            <wd-icon name="close" size="12" class="ml-1 text-slate-400" @click="removeHistory(index)" />
          </view>
        </view>
        <view v-else class="py-4 text-center text-sm text-slate-400">
          暂无搜索历史
        </view>
      </view>

      <view>
        <view class="mb-3 flex items-center justify-between">
          <text class="text-base text-slate-900 font-bold">
            热门搜索
          </text>
          <wd-icon name="fire" size="18" class="text-red-500" />
        </view>
        <view class="flex flex-wrap gap-3">
          <view
            v-for="(item, index) in hotSearches" :key="item" class="rounded-full bg-white px-4 py-2 text-sm"
            :class="index < 3 ? 'bg-[#efb239]/10 text-[#efb239]' : 'text-slate-600'" @click="onHotSearchClick(item)"
          >
            <text class="font-medium">
              {{ index + 1 }}.
            </text>
            <text class="ml-1">
              {{ item }}
            </text>
          </view>
        </view>
      </view>

      <view class="mt-8">
        <text class="mb-4 block text-base text-slate-900 font-bold">
          推荐分类
        </text>
        <view v-if="recommendCategories.length > 0" class="grid grid-cols-4 gap-4">
          <view
            v-for="category in recommendCategories" :key="category.id" class="flex flex-col items-center gap-2"
            @click="onRecommendCategoryClick(category)"
          >
            <view class="size-14 flex items-center justify-center overflow-hidden rounded-full bg-[#efb239]/10 text-[#efb239]">
              <image
                v-if="category.image"
                :src="category.image"
                class="h-full w-full"
                mode="aspectFill"
              />
              <view
                v-else
                class="search-category__placeholder h-full w-full flex items-center justify-center"
              >
                <wd-icon name="picture" size="22" color="#efb239" />
              </view>
            </view>
            <text class="text-center text-[11px] text-slate-600 font-medium leading-4">
              {{ category.name }}
            </text>
          </view>
        </view>
        <view v-else class="py-4 text-center text-sm text-slate-400">
          暂无推荐分类
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

:deep(.search-result__action) {
  margin: 0 !important;
  border: 0;
  border-radius: 9999px;
  background: #efb239;
  color: #fff;
}

.search-category__placeholder {
  background: linear-gradient(135deg, #fff7e6 0%, #fde7b2 100%);
}
</style>
