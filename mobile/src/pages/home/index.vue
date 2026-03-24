<script setup lang="ts">
/**
 * 商城首页 - BabyWhale Kids
 * 包含：搜索栏、轮播图、分类、热销商品
 */
import AppIcon from '@/components/common/AppIcon.vue'

definePage({
  name: 'home',
  layout: 'tabbar',
  type: 'home',
  style: {
    navigationBarTitleText: 'BabyWhale',
    navigationStyle: 'custom',
  },
})

const router = useRouter()
const { setTabbarItem, setTabbarItemActive } = useTabbar()

const { navigationBarHeight, statusBarHeight } = usePlatform()
const { error: showError } = useGlobalToast()

type HomeBannerItem = {
  id: number
  tag?: string | null
  title: string
  subtitle?: string | null
  image: string
}

type HomeCategoryItem = {
  id: number
  name: string
  icon?: string | null
  iconUrl?: string | null
}

type HomeHotProductItem = {
  id: number
  name: string
  hotLabel: string
  minPrice: number
  mainImage?: string | null
}

const fallbackCategoryIcons = ['child_care', 'stroller', 'face', 'toys']

// 轮播图数据
const banners = ref<HomeBannerItem[]>([
  {
    id: 1,
    tag: 'New Arrival',
    title: 'Summer Sparkle',
    subtitle: 'Up to 40% off on all rompers',
    image: 'https://images.unsplash.com/photo-1560506840-ec148e82a604?w=800&h=450&fit=crop',
  },
  {
    id: 2,
    tag: 'Hot Sale',
    title: 'Organic Cotton',
    subtitle: 'Soft & safe for your baby',
    image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=800&h=450&fit=crop',
  },
  {
    id: 3,
    tag: 'Limited',
    title: 'Newborn Essentials',
    subtitle: 'Everything you need',
    image: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=800&h=450&fit=crop',
  },
])

// 当前轮播索引
const currentBanner = ref(0)

// 分类数据
const categories = ref<HomeCategoryItem[]>([
  { id: 1, name: 'Newborn', icon: 'child_care' },
  { id: 2, name: 'Toddler', icon: 'stroller' },
  { id: 3, name: 'Kids', icon: 'face' },
  { id: 4, name: 'Accessory', icon: 'toys' },
])

// 热销商品数据
const hotProducts = ref<HomeHotProductItem[]>([
  {
    id: 1,
    name: 'Linen Sun Suit Set',
    hotLabel: 'Organic Collection',
    minPrice: 24.00,
    mainImage: 'https://images.unsplash.com/photo-1542384701-c0e46e0eda04?w=400&h=400&fit=crop',
  },
  {
    id: 2,
    name: 'Petal Floral Dress',
    hotLabel: 'Spring Sale',
    minPrice: 18.50,
    mainImage: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop',
  },
  {
    id: 3,
    name: 'Knit Comfort Sweater',
    hotLabel: 'Cozy Wear',
    minPrice: 32.00,
    mainImage: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=400&h=400&fit=crop',
  },
  {
    id: 4,
    name: 'Cotton Bib Set (3pc)',
    hotLabel: 'Essentials',
    minPrice: 12.99,
    mainImage: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&h=400&fit=crop',
  },
])

function mapBanners(list: BannerVo[]) {
  if (!list.length) {
    return
  }

  banners.value = list.map(item => ({
    id: item.id,
    tag: typeof item.tag === 'string' ? item.tag : '',
    title: item.title,
    subtitle: typeof item.subtitle === 'string' ? item.subtitle : '',
    image: item.image,
  }))
}

function mapCategories(list: CategoryTreeVo[]) {
  const rootCategories = list.filter(item => item.parentId == null).slice(0, 4)
  if (!rootCategories.length) {
    return
  }

  categories.value = rootCategories.map((item, index) => ({
    id: item.id,
    name: item.name,
    icon: typeof item.icon === 'string' && item.icon ? item.icon : fallbackCategoryIcons[index] || fallbackCategoryIcons[0],
    iconUrl: typeof item.iconUrl === 'string' ? item.iconUrl : '',
  }))
}

function mapHotProducts(response: MallHotProductListResponseVo) {
  const list = Array.isArray(response?.list) ? response.list.slice(0, 4) : []
  if (!list.length) {
    return
  }

  hotProducts.value = list.map(item => ({
    id: item.id,
    name: item.name,
    hotLabel: item.hotLabel || '热门商品',
    minPrice: item.minPrice,
    mainImage: typeof item.mainImage === 'string' ? item.mainImage : '',
  }))
}

async function loadHomeData() {
  try {
    const [bannerList, categoryList, hotProductResponse] = await Promise.all([
      Apis.general.MallHomeController_findBanners().send(),
      Apis.general.MallHomeController_findCategories().send(),
      Apis.general.MallProductsController_findHotProducts({
        params: {
          limit: 4,
        },
      }).send(),
    ])

    mapBanners(Array.isArray(bannerList) ? bannerList : [])
    mapCategories(Array.isArray(categoryList) ? categoryList : [])
    mapHotProducts(hotProductResponse)
  }
  catch {}
}

onShow(() => {
  loadHomeData()
})

// 轮播图变化事件
function onBannerChange(e: any) {
  currentBanner.value = e.detail.current
}

// 点击搜索栏
function onSearchClick() {
  router.push({
    name: 'search',
  })
}

function onCartClick() {
  router.push({
    name: 'cart',
  })
}

// 点击分类 - 跳转到分类页面并激活对应分类
function onCategoryClick(category: typeof categories.value[0]) {
  const index = categories.value.findIndex(c => c.id === category.id)
  setTabbarItem('category', index)
  setTabbarItemActive('category')
  router.pushTab({
    name: 'category',
  })
}

// 查看全部分类 - 跳转到分类页面，默认选中第一个
function onViewAllCategories() {
  setTabbarItem('category', 0)
  setTabbarItemActive('category')
  router.pushTab({
    name: 'category',
  })
}

// 添加到购物车
function addToCart(product: typeof hotProducts.value[0]) {
  onProductClick(product)
}

// 点击商品
function onProductClick(product: typeof hotProducts.value[0]) {
  router.push({
    name: 'product-detail',
    params: {
      id: String(product.id),
    },
  })
}
</script>

<template>
  <view class="min-h-screen bg-[#f8f7f6]">
    <view :style="{ height: `${statusBarHeight}px` }" width="w-full" />
    <view class="flex items-center justify-center" :style="{ height: `${navigationBarHeight}px` }">
      桃喜·童品
    </view>
    <!-- Header & Search -->
    <view class="bg-[#f8f7f6]/80 backdrop-blur-md">
      <!-- Search Bar -->
      <view class="flex items-center gap-2 px-4 pb-4">
        <view class="h-11 flex flex-1 items-center border border-[#efb239]/10 rounded-xl bg-white shadow-sm"
          @click="onSearchClick">
          <view class="flex items-center justify-center pl-4 text-[#efb239]/60">
            <wd-icon name="search" size="18" />
          </view>
          <view class="h-full w-full flex items-center px-3 text-sm text-slate-400">
            Search for organic cotton onesies...
          </view>
        </view>
      </view>
    </view>

    <scroll-view scroll-y class="pb-10">
      <!-- Hero Banner Carousel -->
      <view class="px-4 pb-2">
        <swiper class="h-44 w-full overflow-hidden rounded-xl" :indicator-dots="false" :autoplay="true" :interval="3000"
          :duration="500" :circular="true" @change="onBannerChange">
          <swiper-item v-for="banner in banners" :key="banner.id">
            <view class="relative h-full w-full">
              <image :src="banner.image" class="absolute inset-0 h-full w-full" mode="aspectFill" />
              <view
                class="from-black-50 absolute inset-0 flex flex-col justify-center to-transparent bg-gradient-to-r p-6">
                <text
                  class="mb-2 w-fit rounded-full bg-[#efb239] px-3 py-1 text-[10px] text-white font-bold tracking-widest uppercase">
                  {{ banner.tag }}
                </text>
                <text class="mb-1 text-2xl text-white font-bold leading-tight">
                  {{ banner.title }}
                </text>
                <text class="mb-4 text-sm text-white/90">
                  {{ banner.subtitle }}
                </text>
                <button class="w-fit border-0 rounded-lg bg-white px-4 py-2 text-xs text-[#efb239] font-bold">
                  Shop Now
                </button>
              </view>
            </view>
          </swiper-item>
        </swiper>
        <!-- Pagination Dots -->
        <view class="mt-3 flex justify-center gap-1.5">
          <view v-for="(banner, index) in banners" :key="banner.id"
            class="h-1.5 rounded-full transition-all duration-300"
            :class="currentBanner === index ? 'w-4 bg-[#efb239]' : 'w-1.5 bg-slate-300'" />
        </view>
      </view>

      <!-- Categories Grid -->
      <view class="px-4 pt-4">
        <view class="mb-4 flex items-center justify-between">
          <text class="text-base text-slate-900 font-bold">
            Categories
          </text>
          <text class="text-xs text-[#efb239] font-medium" @click="onViewAllCategories">
            View All
          </text>
        </view>
        <view class="grid grid-cols-4 gap-4">
          <view v-for="category in categories" :key="category.id" class="flex flex-col items-center gap-2"
            @click="onCategoryClick(category)">
            <view class="size-14 flex items-center justify-center rounded-full bg-[#efb239]/10 text-[#efb239]">
              <app-icon :icon="category.icon" :icon-url="category.icon ? '' : category.iconUrl" :size="28"
                color="#efb239" />
            </view>
            <text class="text-[11px] text-slate-600 font-medium">
              {{ category.name }}
            </text>
          </view>
        </view>
      </view>

      <!-- Hot Picks Section -->
      <view class="px-4 pt-8">
        <view class="mb-4 flex items-center justify-between">
          <text class="text-base text-slate-900 font-bold">
            Hot Picks
          </text>
          <wd-icon name="fire" size="18" class="text-red-500" />
        </view>
        <view class="grid grid-cols-2 gap-4">
          <!-- Product Card -->
          <view v-for="product in hotProducts" :key="product.id"
            class="overflow-hidden border border-[#efb239]/5 rounded-xl bg-white shadow-sm"
            @click="onProductClick(product)">
            <view class="aspect-square overflow-hidden">
              <image :src="product.mainImage || ''" class="h-full w-full" mode="aspectFill" />
            </view>
            <view class="p-3">
              <text class="mb-1 block text-xs text-slate-400">
                {{ product.hotLabel }}
              </text>
              <text class="line-clamp-1 block text-sm text-slate-800 font-semibold">
                {{ product.name }}
              </text>
              <view class="mt-2 flex items-center justify-between">
                <text class="text-[#efb239] font-bold">
                  ${{ product.minPrice.toFixed(2) }}
                </text>
                <button
                  class="size-7 flex items-center justify-center border-0 rounded-full bg-[#efb239] p-0 text-white !m-0"
                  @click.stop="addToCart(product)">
                  <wd-icon name="add" size="14" color="#fff" />
                </button>
              </view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<style scoped>
/* 渐变背景 */
.bg-gradient-to-r {
  background: linear-gradient(to right, var(--tw-gradient-stops));
}

.from-black-50 {
  --tw-gradient-from: rgba(0, 0, 0, 0.5);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(0, 0, 0, 0));
}

.to-transparent {
  --tw-gradient-to: transparent;
}

/* 行数限制 */
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
