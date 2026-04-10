<script setup lang="ts">
/**
 * 分类页面 - BabyWhale Kids
 * 左侧分类导航 + 右侧子分类展示
 */
import AppIcon from '@/components/common/AppIcon.vue'

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
const { getTabbarItemValue } = useTabbar()
const { error: showError } = useGlobalToast()

const { topAreaHeight, safeAreaInsetsBottom } = usePlatform()
const apiBaseURL = import.meta.env.VITE_API_BASE_URL || ''
const fallbackCategoryIcons = ['child_care', 'stroller', 'face', 'toys', 'eco', 'local_offer', 'new_releases', 'trending_up']
const fallbackCategoryImage = 'https://images.unsplash.com/photo-1542384701-c0e46e0eda04?w=300&h=300&fit=crop'

interface RawCategory {
  id: number
  name?: string | null
  subtitle?: string | null
  remark?: string | null
  image?: string | null
}

interface CategoryCardItem {
  id: number
  name: string
  icon: string
  description: string
  subCategories: {
    id: number
    name: string
    count: number
    image: string
    style: 'dark' | 'light'
    subTitle?: string
  }[]
}

// 当前选中的分类
const activeCategory = ref(0)

// 分类数据
const categories = ref<CategoryCardItem[]>([])

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

function mapSubCategoryItem(category: RawCategory) {
  const image = resolveAssetUrl(category.image)
  const subTitle = category.subtitle || category.remark || ''
  const hasImage = Boolean(image)

  return {
    id: category.id,
    name: category.name || '未命名分类',
    count: 0,
    image: hasImage ? image : fallbackCategoryImage,
    style: hasImage ? 'dark' as const : 'light' as const,
    subTitle,
  }
}

function mapCategoryItem(category: RawCategory, children: RawCategory[], index: number): CategoryCardItem {
  return {
    id: category.id,
    name: category.name || `分类${index + 1}`,
    icon: fallbackCategoryIcons[index] || fallbackCategoryIcons[fallbackCategoryIcons.length - 1],
    description: category.subtitle || category.remark || '精选分类内容',
    subCategories: children.map(mapSubCategoryItem),
  }
}

async function loadCategories() {
  try {
    const categoryResponse = await Apis.general.MallHomeController_findCategories().send()
    const categoryList = Array.isArray(categoryResponse) ? categoryResponse : []
    const rootList = categoryList.filter((category: RawCategory & { parentId?: number | null }) => category.parentId == null)

    categories.value = rootList.map((category: RawCategory, index: number) => {
      const children = categoryList.filter(
        (item: RawCategory & { parentId?: number | null }) => item.parentId === category.id,
      )
      return mapCategoryItem(category, children, index)
    })

    syncActiveCategory()
  }
  catch { }
}

function syncActiveCategory() {
  const index = getTabbarItemValue('category')
  if (typeof index === 'number' && index >= 0 && index < categories.value.length) {
    activeCategory.value = index
  }
  else {
    activeCategory.value = 0
  }
}

onShow(() => {
  loadCategories()
  syncActiveCategory()
})

// 切换分类
function onCategoryChange(index: number) {
  activeCategory.value = index
}

// 点击子分类
function onSubCategoryClick(subCategory: any) {
  router.push({
    name: 'product-list',
    params: {
      title: subCategory.name.replace('\n', ' '),
      categoryId: String(subCategory.id),
    },
  })
}

// 获取当前分类
const currentCategory = computed(() => {
  return categories.value[activeCategory.value] || categories.value[0] || {
    id: 0,
    name: '',
    icon: fallbackCategoryIcons[0],
    description: '',
    subCategories: [],
  }
})

// 获取当前子分类
const currentSubCategories = computed(() => {
  return currentCategory.value?.subCategories || []
})
</script>

<template>
  <view class="flex flex-col bg-[#f8f7f6]">
    <!-- Category Content -->
    <view
      class="flex overflow-hidden"
      :style="{ height: `calc(100vh - ${topAreaHeight}px - ${safeAreaInsetsBottom}px - 50px)` }"
    >
      <!-- Left Sidebar -->
      <scroll-view scroll-y class="w-24 flex-shrink-0 bg-white">
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
            <app-icon :icon="category.icon" :size="20" :color="activeCategory === index ? '#efb239' : '#94a3b8'" />
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
            {{ currentCategory.name }}
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
                <view class="break-all">
                  <text class="whitespace-pre-line text-lg text-white font-bold leading-tight">
                    {{ sub.name }}
                  </text>
                </view>
                <view>
                  <text class="text-xs text-white/80">
                    {{ sub.count }} 件商品
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
            暂无子分类
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
