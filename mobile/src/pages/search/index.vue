<script setup lang="ts">
/**
 * 搜索页面 - BabyWhale Kids
 */
import AppIcon from '@/components/common/AppIcon.vue'

definePage({
  name: 'search',
  layout: 'default',
  style: {
    navigationBarTitleText: '搜索',
    navigationStyle: 'custom',
  },
})

const router = useRouter()
const { error: showError } = useGlobalToast()

const SEARCH_HISTORY_STORAGE_KEY = 'mall_search_history'
const HOT_SEARCH_KEYWORDS = [
  '夏季新品',
  '婴儿连体衣',
  '纯棉套装',
  '宝宝裙装',
  '口水巾',
  '新生儿礼盒',
] as const
const fallbackCategoryIcons = ['child_care', 'stroller', 'face', 'toys', 'eco', 'local_offer']

type SearchResultItem = {
  id: number
  tag: string
  name: string
  price: number
  image: string
}

type RecommendCategoryItem = {
  id: number
  name: string
  icon: string
  iconUrl?: string | null
}

const searchKeyword = ref('')
const keywordInResult = ref('')
const isLoading = ref(false)
const hasSearched = ref(false)
const searchHistory = ref<string[]>([])
const searchResults = ref<SearchResultItem[]>([])
const recommendCategories = ref<RecommendCategoryItem[]>([])

const hotSearches = HOT_SEARCH_KEYWORDS
const isSearching = computed(() => isLoading.value || hasSearched.value)
const isResultEmpty = computed(() => hasSearched.value && !isLoading.value && searchResults.value.length === 0)

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
  searchResults.value = list.map(item => ({
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
    icon: typeof item.icon === 'string' && item.icon ? item.icon : fallbackCategoryIcons[index] || fallbackCategoryIcons[0],
    iconUrl: typeof item.iconUrl === 'string' ? item.iconUrl : '',
  }))
}

async function loadRecommendCategories() {
  try {
    const recommendList = await Apis.general.MallHomeController_findCategories({
      params: {
        parentId: '',
        recommendOnly: true,
      },
    }).send()

    const resolvedRecommendList = Array.isArray(recommendList) ? recommendList : []
    if (resolvedRecommendList.length > 0) {
      mapRecommendCategories(resolvedRecommendList)
      return
    }

    const rootCategoryList = await Apis.general.MallHomeController_findCategories({
      params: {
        parentId: '',
      },
    }).send()

    mapRecommendCategories(Array.isArray(rootCategoryList) ? rootCategoryList : [])
  }
  catch (error: any) {
    showError(error?.message || '推荐分类加载失败')
  }
}

async function performSearchByKeyword(keyword: string) {
  const normalizedKeyword = keyword.trim()
  if (!normalizedKeyword) {
    return
  }

  isLoading.value = true
  hasSearched.value = true
  keywordInResult.value = normalizedKeyword

  try {
    const response = await Apis.general.MallProductsController_findProducts({
      params: {
        keyword: normalizedKeyword,
        page: 1,
        pageSize: 20,
        sort: 'new',
      },
    }).send()

    mapSearchResults(response)
    saveSearchHistory(normalizedKeyword)
  }
  catch (error: any) {
    searchResults.value = []
    showError(error?.message || '搜索失败')
  }
  finally {
    isLoading.value = false
  }
}

async function performSearchByCategory(category: RecommendCategoryItem) {
  isLoading.value = true
  hasSearched.value = true
  keywordInResult.value = category.name

  try {
    const response = await Apis.general.MallProductsController_findProducts({
      params: {
        categoryId: category.id,
        page: 1,
        pageSize: 20,
        sort: 'new',
      },
    }).send()

    searchKeyword.value = category.name
    mapSearchResults(response)
  }
  catch (error: any) {
    searchResults.value = []
    showError(error?.message || '搜索失败')
  }
  finally {
    isLoading.value = false
  }
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
  uni.showToast({
    title: `已添加: ${product.name}`,
    icon: 'success',
  })
}

function onProductClick(product: SearchResultItem) {
  router.push({
    name: 'product-detail',
    query: {
      id: String(product.id),
      name: product.name,
      price: product.price.toFixed(2),
      image: encodeURIComponent(product.image || ''),
    },
  })
}

function resetSearchState() {
  isLoading.value = false
  hasSearched.value = false
  keywordInResult.value = ''
  searchResults.value = []
}

onShow(() => {
  loadSearchHistory()
  loadRecommendCategories()
})
</script>

<template>
  <view class=" bg-[#f8f7f6]">
    <view class="sticky top-0 z-50 bg-[#f8f7f6]/80 backdrop-blur-md">
      <view class="flex items-center gap-3 bg-white px-4 py-3">
        <view class="h-11 flex flex-1 items-center border border-[#efb239]/10 rounded-xl bg-[#f1f5f9] shadow-sm">
          <view class="flex items-center justify-center pl-4 text-[#efb239]/60">
            <wd-icon name="search" size="18" />
          </view>
          <input v-model="searchKeyword"
            class="h-full flex-1 border-none bg-transparent px-3 text-sm font-normal placeholder:text-slate-400 focus:outline-none"
            placeholder="搜索商品名称..." confirm-type="search" focus @confirm="onSearch">
          <view v-if="searchKeyword" class="pr-3 text-slate-400" @click="searchKeyword = ''">
            <wd-icon name="close" size="16" />
          </view>
        </view>
      </view>
    </view>

    <view v-if="isSearching" class="px-4 py-2">
      <view class="mb-4 flex items-center justify-between">
        <text class="text-sm text-slate-500">
          搜索结果 "{{ keywordInResult }}"
        </text>
        <text class="text-xs text-[#efb239]" @click="resetSearchState">
          返回
        </text>
      </view>
      <view v-if="isLoading" class="py-12 text-center text-sm text-slate-400">
        搜索中...
      </view>
      <view v-else-if="isResultEmpty" class="py-12 text-center text-sm text-slate-400">
        暂无相关商品
      </view>
      <view v-else class="grid grid-cols-2 gap-4">
        <view v-for="product in searchResults" :key="product.id"
          class="overflow-hidden border border-[#efb239]/5 rounded-xl bg-white shadow-sm"
          @click="onProductClick(product)">
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
              <button
                class="size-7 flex items-center !mx-0 justify-center border-0 rounded-full bg-[#efb239] p-0 text-white"
                @click.stop="addToCart(product)">
                <wd-icon name="add" size="14" color="#fff" />
              </button>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view v-else class="px-4 py-2">
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
          <view v-for="(item, index) in searchHistory" :key="`${item}-${index}`"
            class="flex items-center gap-1 border border-slate-200 rounded-full bg-white px-3 py-2 text-sm text-slate-600 shadow-sm">
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
          <view v-for="(item, index) in hotSearches" :key="item" class="rounded-full bg-white px-4 py-2 text-sm"
            :class="index < 3 ? 'bg-[#efb239]/10 text-[#efb239]' : 'text-slate-600'" @click="onHotSearchClick(item)">
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
          <view v-for="category in recommendCategories" :key="category.id" class="flex flex-col items-center gap-2"
            @click="onRecommendCategoryClick(category)">
            <view class="size-14 flex items-center justify-center rounded-full bg-[#efb239]/10 text-[#efb239]">
              <app-icon :icon="category.icon" :icon-url="category.icon ? '' : category.iconUrl" :size="28"
                color="#efb239" />
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
</style>
