<script setup lang="ts">
/**
 * 搜索页面 - BabyWhale Kids
 */

definePage({
  name: 'search',
  layout: 'default',
  style: {
    navigationBarTitleText: '搜索',
    navigationStyle: 'custom',
  },
})

// 使用路由系统
const router = useRouter()

// 搜索关键词
const searchKeyword = ref('')
const isSearching = ref(false)

// 搜索历史
const searchHistory = ref([
  'organic cotton',
  'baby romper',
  'summer dress',
  'newborn set',
])

// 热门搜索
const hotSearches = ref([
  'Organic Cotton',
  'Summer Sale',
  'Newborn Essentials',
  'Baby Girl Dress',
  'Baby Boy Suit',
  'Soft Blanket',
])

// 搜索结果
const searchResults = ref([
  {
    id: 1,
    tag: 'Organic Collection',
    name: 'Linen Sun Suit Set',
    price: 24.00,
    image: 'https://images.unsplash.com/photo-1542384701-c0e46e0eda04?w=400&h=400&fit=crop',
  },
  {
    id: 2,
    tag: 'Spring Sale',
    name: 'Petal Floral Dress',
    price: 18.50,
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop',
  },
  {
    id: 3,
    tag: 'Cozy Wear',
    name: 'Knit Comfort Sweater',
    price: 32.00,
    image: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=400&h=400&fit=crop',
  },
])

// 执行搜索
function onSearch() {
  if (!searchKeyword.value.trim())
    return
  isSearching.value = true
  // 添加到历史记录
  if (!searchHistory.value.includes(searchKeyword.value)) {
    searchHistory.value.unshift(searchKeyword.value)
    if (searchHistory.value.length > 10) {
      searchHistory.value.pop()
    }
  }
}

// 点击历史记录
function onHistoryClick(keyword: string) {
  searchKeyword.value = keyword
  onSearch()
}

// 点击热门搜索
function onHotSearchClick(keyword: string) {
  searchKeyword.value = keyword
  onSearch()
}

// 清除历史
function clearHistory() {
  uni.showModal({
    title: '提示',
    content: '确定要清除搜索历史吗？',
    success: (res) => {
      if (res.confirm) {
        searchHistory.value = []
      }
    },
  })
}

// 删除单个历史
function removeHistory(index: number) {
  searchHistory.value.splice(index, 1)
}

// 返回上一页
function goBack() {
  router.back()
}

// 添加到购物车
function addToCart(product: typeof searchResults.value[0]) {
  uni.showToast({
    title: `已添加: ${product.name}`,
    icon: 'success',
  })
}

// 点击商品
function onProductClick(product: typeof searchResults.value[0]) {
  uni.showToast({
    title: product.name,
    icon: 'none',
  })
}
</script>

<template>
  <view class="min-h-screen bg-[#f8f7f6]">
    <!-- Header & Search Bar -->
    <view class="sticky top-0 z-50 bg-[#f8f7f6]/80 backdrop-blur-md">
      <view class="flex items-center gap-3 bg-white px-4 py-3">
        <!-- Search Input -->
        <view class="h-11 flex flex-1 items-center border border-[#efb239]/10 rounded-xl bg-[#f1f5f9] shadow-sm">
          <view class="flex items-center justify-center pl-4 text-[#efb239]/60">
            <wd-icon name="search" size="18" />
          </view>
          <input
            v-model="searchKeyword"
            class="h-full flex-1 border-none bg-transparent px-3 text-sm font-normal placeholder:text-slate-400 focus:outline-none"
            placeholder="Search for organic cotton onesies..." confirm-type="search" focus @confirm="onSearch"
          >
          <view v-if="searchKeyword" class="pr-3 text-slate-400" @click="searchKeyword = ''">
            <wd-icon name="close" size="16" />
          </view>
        </view>
      </view>
    </view>

    <!-- Search Results -->
    <view v-if="isSearching" class="px-4 py-2">
      <view class="mb-4 flex items-center justify-between">
        <text class="text-sm text-slate-500">
          搜索结果 "{{ searchKeyword }}"
        </text>
        <text class="text-xs text-[#efb239]" @click="isSearching = false">
          返回
        </text>
      </view>
      <view class="grid grid-cols-2 gap-4">
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
                ${{ product.price.toFixed(2) }}
              </text>
              <button
                class="size-7 flex items-center justify-center border-0 rounded-full bg-[#efb239] p-0 text-white"
                @click.stop="addToCart(product)"
              >
                <wd-icon name="add" size="14" color="#fff" />
              </button>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- Search History & Hot -->
    <view v-else class="px-4 py-2">
      <!-- Search History -->
      <view class="mb-6">
        <view class="mb-3 flex items-center justify-between">
          <text class="text-base text-slate-900 font-bold">
            搜索历史
          </text>
          <view class="flex items-center gap-2 text-slate-400" @click="clearHistory">
            <wd-icon name="delete" size="16" color="#efb239" />
            <text class="text-xs text-[#efb239]">
              清除所有
            </text>
          </view>
        </view>
        <view v-if="searchHistory.length > 0" class="flex flex-wrap gap-2">
          <view
            v-for="(item, index) in searchHistory" :key="index"
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

      <!-- Hot Searches -->
      <view>
        <view class="mb-3 flex items-center justify-between">
          <text class="text-base text-slate-900 font-bold">
            热门搜索
          </text>
          <wd-icon name="fire" size="18" class="text-red-500" />
        </view>
        <view class="flex flex-wrap gap-3">
          <view
            v-for="(item, index) in hotSearches" :key="index" class="rounded-full bg-white px-4 py-2 text-sm"
            :class="index < 3 ? 'text-[#efb239] bg-[#efb239]/10' : 'text-slate-600'" @click="onHotSearchClick(item)"
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

      <!-- Recommended Categories -->
      <view class="mt-8">
        <text class="mb-4 block text-base text-slate-900 font-bold">
          推荐分类
        </text>
        <view class="grid grid-cols-4 gap-4">
          <view class="flex flex-col items-center gap-2" @click="onHotSearchClick('Newborn')">
            <view class="size-14 flex items-center justify-center rounded-full bg-[#efb239]/10 text-[#efb239]">
              <wd-icon name="child-care" size="28" />
            </view>
            <text class="text-[11px] text-slate-600 font-medium">
              Newborn
            </text>
          </view>
          <view class="flex flex-col items-center gap-2" @click="onHotSearchClick('Toddler')">
            <view class="size-14 flex items-center justify-center rounded-full bg-[#efb239]/10 text-[#efb239]">
              <wd-icon name="stroller" size="28" />
            </view>
            <text class="text-[11px] text-slate-600 font-medium">
              Toddler
            </text>
          </view>
          <view class="flex flex-col items-center gap-2" @click="onHotSearchClick('Kids')">
            <view class="size-14 flex items-center justify-center rounded-full bg-[#efb239]/10 text-[#efb239]">
              <wd-icon name="face" size="28" />
            </view>
            <text class="text-[11px] text-slate-600 font-medium">
              Kids
            </text>
          </view>
          <view class="flex flex-col items-center gap-2" @click="onHotSearchClick('Accessory')">
            <view class="size-14 flex items-center justify-center rounded-full bg-[#efb239]/10 text-[#efb239]">
              <wd-icon name="toys" size="28" />
            </view>
            <text class="text-[11px] text-slate-600 font-medium">
              Accessory
            </text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
/* 行数限制 */
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
