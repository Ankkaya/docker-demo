<script setup lang="ts">
/**
 * 分类页面 - BabyWhale Kids
 * 左侧分类导航 + 右侧子分类展示
 */

definePage({
  name: 'category',
  layout: 'default',
  style: {
    navigationBarTitleText: '分类',
    navigationStyle: 'custom',
  },
})

// 使用路由系统
const router = useRouter()

// 当前选中的分类
const activeCategory = ref(0)

// 搜索关键词
const searchKeyword = ref('')

// 分类数据
const categories = ref([
  {
    id: 1,
    name: 'Newborn',
    icon: 'child_care',
    description: 'Soft, organic fabrics for your little ones.',
    subCategories: [
      { id: 101, name: 'Onesies &\nBodysuits', count: 24, image: 'https://images.unsplash.com/photo-1542384701-c0e46e0eda04?w=300&h=300&fit=crop', style: 'dark' },
      { id: 102, name: 'Sleepwear', count: 18, image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=300&h=300&fit=crop', style: 'dark' },
      { id: 103, name: 'Outdoor', count: 12, image: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=300&h=300&fit=crop', style: 'dark' },
      { id: 104, name: 'Accessories', count: 45, image: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=300&h=300&fit=crop', style: 'dark' },
      { id: 105, name: 'Bedding', count: 16, image: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=300&h=300&fit=crop', style: 'dark' },
      { id: 106, name: 'Gift Bundles', count: 0, image: '', style: 'light', subTitle: 'Perfect for baby showers and new arrivals' },
    ],
  },
  {
    id: 2,
    name: 'Toddler',
    icon: 'stroller',
    description: 'Comfortable clothes for active toddlers.',
    subCategories: [
      { id: 201, name: 'Tops & Tees', count: 32, image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=300&h=300&fit=crop', style: 'dark' },
      { id: 202, name: 'Bottoms', count: 28, image: 'https://images.unsplash.com/photo-1560506840-ec148e82a604?w=300&h=300&fit=crop', style: 'dark' },
      { id: 203, name: 'Dresses', count: 24, image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=300&h=300&fit=crop', style: 'dark' },
      { id: 204, name: 'Outerwear', count: 15, image: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=300&h=300&fit=crop', style: 'dark' },
      { id: 205, name: 'Pajamas', count: 20, image: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=300&h=300&fit=crop', style: 'dark' },
      { id: 206, name: 'New Arrivals', count: 0, image: '', style: 'light', subTitle: 'Check out our latest collection' },
    ],
  },
  {
    id: 3,
    name: 'Kids',
    icon: 'face',
    description: 'Stylish outfits for growing kids.',
    subCategories: [
      { id: 301, name: 'Casual Wear', count: 45, image: 'https://images.unsplash.com/photo-1542384701-c0e46e0eda04?w=300&h=300&fit=crop', style: 'dark' },
      { id: 302, name: 'School Uniform', count: 30, image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=300&h=300&fit=crop', style: 'dark' },
      { id: 303, name: 'Sportswear', count: 25, image: 'https://images.unsplash.com/photo-1560506840-ec148e82a604?w=300&h=300&fit=crop', style: 'dark' },
      { id: 304, name: 'Party Wear', count: 18, image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=300&h=300&fit=crop', style: 'dark' },
      { id: 305, name: 'Seasonal', count: 22, image: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=300&h=300&fit=crop', style: 'dark' },
      { id: 306, name: 'Sale Items', count: 0, image: '', style: 'light', subTitle: 'Up to 50% off selected items' },
    ],
  },
  {
    id: 4,
    name: 'Accessory',
    icon: 'toys',
    description: 'Cute accessories for your little ones.',
    subCategories: [
      { id: 401, name: 'Hats & Caps', count: 35, image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=300&h=300&fit=crop', style: 'dark' },
      { id: 402, name: 'Socks & Shoes', count: 42, image: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=300&h=300&fit=crop', style: 'dark' },
      { id: 403, name: 'Bibs', count: 28, image: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=300&h=300&fit=crop', style: 'dark' },
      { id: 404, name: 'Hair Accessories', count: 56, image: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=300&h=300&fit=crop', style: 'dark' },
      { id: 405, name: 'Bags', count: 15, image: 'https://images.unsplash.com/photo-1542384701-c0e46e0eda04?w=300&h=300&fit=crop', style: 'dark' },
      { id: 406, name: 'Gift Sets', count: 0, image: '', style: 'light', subTitle: 'Perfect presents for any occasion' },
    ],
  },
  {
    id: 5,
    name: 'Organic',
    icon: 'eco',
    description: '100% organic and eco-friendly products.',
    subCategories: [
      { id: 501, name: 'Organic Cotton', count: 38, image: 'https://images.unsplash.com/photo-1542384701-c0e46e0eda04?w=300&h=300&fit=crop', style: 'dark' },
      { id: 502, name: 'Bamboo Fabric', count: 22, image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=300&h=300&fit=crop', style: 'dark' },
      { id: 503, name: 'Natural Dye', count: 16, image: 'https://images.unsplash.com/photo-1560506840-ec148e82a604?w=300&h=300&fit=crop', style: 'dark' },
      { id: 504, name: 'Eco Toys', count: 30, image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=300&h=300&fit=crop', style: 'dark' },
    ],
  },
  {
    id: 6,
    name: 'Sale',
    icon: 'local_offer',
    description: 'Great deals on baby essentials.',
    subCategories: [
      { id: 601, name: 'Clearance', count: 55, image: 'https://images.unsplash.com/photo-1542384701-c0e46e0eda04?w=300&h=300&fit=crop', style: 'dark' },
      { id: 602, name: 'Seasonal Sale', count: 42, image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=300&h=300&fit=crop', style: 'dark' },
      { id: 603, name: 'Bundle Deals', count: 18, image: 'https://images.unsplash.com/photo-1560506840-ec148e82a604?w=300&h=300&fit=crop', style: 'dark' },
      { id: 604, name: 'Last Chance', count: 24, image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=300&h=300&fit=crop', style: 'dark' },
    ],
  },
  {
    id: 7,
    name: 'New',
    icon: 'new_releases',
    description: 'Check out our latest arrivals.',
    subCategories: [
      { id: 701, name: 'Newborn New', count: 28, image: 'https://images.unsplash.com/photo-1542384701-c0e46e0eda04?w=300&h=300&fit=crop', style: 'dark' },
      { id: 702, name: 'Toddler New', count: 35, image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=300&h=300&fit=crop', style: 'dark' },
      { id: 703, name: 'Kids New', count: 42, image: 'https://images.unsplash.com/photo-1560506840-ec148e82a604?w=300&h=300&fit=crop', style: 'dark' },
      { id: 704, name: 'Accessories New', count: 25, image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=300&h=300&fit=crop', style: 'dark' },
    ],
  },
  {
    id: 8,
    name: 'Bestseller',
    icon: 'trending_up',
    description: 'Our most popular products.',
    subCategories: [
      { id: 801, name: 'Top Rated', count: 48, image: 'https://images.unsplash.com/photo-1542384701-c0e46e0eda04?w=300&h=300&fit=crop', style: 'dark' },
      { id: 802, name: 'Most Loved', count: 52, image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=300&h=300&fit=crop', style: 'dark' },
      { id: 803, name: 'Customer Favs', count: 38, image: 'https://images.unsplash.com/photo-1560506840-ec148e82a604?w=300&h=300&fit=crop', style: 'dark' },
      { id: 804, name: 'Trending', count: 45, image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=300&h=300&fit=crop', style: 'dark' },
    ],
  },
])

// 页面加载时获取参数
onLoad((options) => {
  if (options?.activeIndex !== undefined) {
    const index = Number.parseInt(options.activeIndex, 10)
    if (index >= 0 && index < categories.value.length) {
      activeCategory.value = index
    }
  }
})

// 切换分类
function onCategoryChange(index: number) {
  activeCategory.value = index
}

// 搜索
function onSearch() {
  router.push({
    name: 'search',
  })
}

// 点击子分类
function onSubCategoryClick(subCategory: any) {
  router.push({
    name: 'product-list',
    query: {
      title: subCategory.name.replace('\n', ' '),
    },
  })
}

// 获取当前分类
const currentCategory = computed(() => {
  return categories.value[activeCategory.value] || categories.value[0]
})

// 获取当前子分类
const currentSubCategories = computed(() => {
  return currentCategory.value?.subCategories || []
})
</script>

<template>
  <view class="h-screen flex flex-col bg-[#f8f7f6]">
    <!-- Header & Search -->
    <view class="z-50 bg-[#f8f7f6]/80 backdrop-blur-md">
      <!-- Search Bar -->
      <view class="px-4 pb-3">
        <view
          class="h-11 w-full flex items-center border border-[#efb239]/10 rounded-xl bg-white shadow-sm"
          @click="onSearch"
        >
          <view class="flex items-center justify-center pl-4 text-[#efb239]/60">
            <wd-icon name="search" size="18" />
          </view>
          <view class="h-full w-full flex items-center px-3 text-sm text-slate-400">
            Search products...
          </view>
        </view>
      </view>
    </view>

    <!-- Category Content -->
    <view class="flex flex-1 overflow-hidden">
      <!-- Left Sidebar -->
      <scroll-view scroll-y class="w-24 bg-white">
        <view
          v-for="(category, index) in categories" :key="category.id"
          class="relative flex flex-col items-center justify-center px-2 py-4 transition-all duration-200"
          :class="activeCategory === index ? 'bg-[#f8f7f6]' : 'bg-white'" @click="onCategoryChange(index)"
        >
          <!-- Active Indicator -->
          <view
            v-if="activeCategory === index"
            class="absolute left-0 top-1/2 h-8 w-1 rounded-r-full bg-[#efb239] -translate-y-1/2"
          />
          <!-- Icon -->
          <view
            class="mb-2 size-10 flex items-center justify-center rounded-full transition-all duration-200"
            :class="activeCategory === index ? 'bg-[#efb239]/20 text-[#efb239]' : 'bg-slate-100 text-slate-400'"
          >
            <wd-icon :name="category.icon" size="20" />
          </view>
          <!-- Name -->
          <text
            class="text-center text-[11px] font-medium"
            :class="activeCategory === index ? 'text-[#efb239]' : 'text-slate-600'"
          >
            {{ category.name }}
          </text>
        </view>
      </scroll-view>

      <!-- Right Content - Sub Categories Grid -->
      <scroll-view scroll-y class="flex-1 p-4">
        <!-- Category Header -->
        <view class="mb-5">
          <text class="block text-2xl text-slate-900 font-bold">
            {{ currentCategory.name }} Essentials
          </text>
          <text class="mt-1 block text-sm text-slate-500">
            {{ currentCategory.description }}
          </text>
        </view>

        <!-- Sub Categories Grid -->
        <view class="grid grid-cols-2 gap-3">
          <view
            v-for="sub in currentSubCategories" :key="sub.id" class="relative overflow-hidden rounded-2xl"
            :class="sub.style === 'light' ? 'bg-[#f5e6c8]' : 'bg-slate-400'"
            :style="sub.style === 'dark' ? `background-image: url(${sub.image}); background-size: cover; background-position: center;` : ''"
            @click="onSubCategoryClick(sub)"
          >
            <!-- Dark Style Card -->
            <view v-if="sub.style === 'dark'" class="relative aspect-[4/5]">
              <!-- Gradient Overlay -->
              <view class="from-black-30 via-black-20 absolute inset-0 to-transparent bg-gradient-to-br" />
              <!-- Content -->
              <view class="absolute inset-0 flex flex-col justify-between p-4">
                <view>
                  <text class="whitespace-pre-line text-lg text-white font-bold leading-tight">
                    {{ sub.name }}
                  </text>
                </view>
                <view>
                  <text class="text-xs text-white/80">
                    {{ sub.count }} items
                  </text>
                </view>
              </view>
            </view>

            <!-- Light Style Card -->
            <view v-else class="relative aspect-[4/5] flex flex-col justify-end p-4">
              <view>
                <text class="mb-2 block text-lg text-slate-900 font-bold leading-tight">
                  {{ sub.name }}
                </text>
                <text class="block text-xs text-slate-600 leading-relaxed">
                  {{ sub.subTitle }}
                </text>
              </view>
            </view>
          </view>
        </view>

        <!-- Empty State -->
        <view v-if="currentSubCategories.length === 0" class="flex flex-col items-center justify-center py-20">
          <wd-icon name="inventory_2" size="48" class="mb-4 text-slate-300" />
          <text class="text-sm text-slate-400">
            No sub categories found
          </text>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<style scoped>
/* 渐变背景 */
.bg-gradient-to-br {
  background: linear-gradient(to bottom right, var(--tw-gradient-stops));
}

.from-black-30 {
  --tw-gradient-from: rgba(0, 0, 0, 0.3);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(0, 0, 0, 0));
}

.via-black-20 {
  --tw-gradient-stops: var(--tw-gradient-from), rgba(0, 0, 0, 0.2), var(--tw-gradient-to, rgba(0, 0, 0, 0));
}

.to-transparent {
  --tw-gradient-to: transparent;
}

/* 保留换行符 */
.whitespace-pre-line {
  white-space: pre-line;
}
</style>
