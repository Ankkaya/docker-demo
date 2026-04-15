<script setup lang="ts">
/**
 * 商品列表页 - 参考 Stitch 设计稿
 */

definePage({
  name: 'product-list',
  layout: 'default',
  style: {
    navigationBarTitleText: '商品列表',
    navigationStyle: 'custom',
  },
})

const router = useRouter()
const pageTitle = ref('连体衣与包屁衣')
const activeFilter = ref('recommended')
const priceSortDirection = ref<'asc' | 'desc'>('asc')
const categoryId = ref<number | null>(null)
const keyword = ref('')
const loading = ref(false)
const loadingMore = ref(false)
const page = ref(1)
const pageSize = 20
const hasMore = ref(true)
const defaultPageTitle = '全部商品'

const filters = [
  { key: 'recommended', label: '推荐', sort: true },
  { key: 'sales', label: '销量', sort: false },
  { key: 'price', label: '价格', sort: true },
  { key: 'new', label: '新品', sort: false },
]

interface ProductListItem {
  id: number
  name: string
  price: number
  image: string
  ratio: string
  offset: string
  skuId: number | null
}

const products = ref<ProductListItem[]>([])
const hasCategoryFilter = computed(() => categoryId.value !== null)
const hasKeywordFilter = computed(() => Boolean(keyword.value))
const hasActiveContext = computed(() => hasCategoryFilter.value || hasKeywordFilter.value)

const contextTags = computed(() => {
  const tags: { key: string, label: string, removable?: boolean }[] = []

  if (hasCategoryFilter.value) {
    tags.push({
      key: 'category',
      label: `分类: ${pageTitle.value || defaultPageTitle}`,
      removable: true,
    })
  }

  if (hasKeywordFilter.value) {
    tags.push({
      key: 'keyword',
      label: `搜索: ${keyword.value}`,
    })
  }

  return tags
})

function decodeRouteText(value: unknown) {
  if (typeof value !== 'string') {
    return ''
  }

  try {
    return decodeURIComponent(value)
  }
  catch {
    return value
  }
}

function getCardOffset(index: number) {
  const offsets = ['', 'pt-8', '-mt-4', '', '-mt-6', 'pt-6']
  return offsets[index % offsets.length]
}

function getCardRatio(index: number) {
  const ratios = ['3/4.5', '3/3.5', '3/3.8', '3/4.2', '1/1', '3/4']
  return ratios[index % ratios.length]
}

function normalizeProduct(item: any, index: number): ProductListItem {
  const skus = Array.isArray(item?.skus) ? item.skus : []
  const defaultSku = skus.find((sku: any) => sku.isDefault) || skus[0] || null

  return {
    id: Number(item?.id || 0),
    name: item?.name || '未命名商品',
    price: Number(item?.minPrice || 0),
    image: typeof item?.mainImage === 'string' ? item.mainImage : '',
    ratio: getCardRatio(index),
    offset: getCardOffset(index),
    skuId: defaultSku?.id ? Number(defaultSku.id) : null,
  }
}

function resolveSort() {
  if (activeFilter.value === 'sales') {
    return 'sales'
  }
  if (activeFilter.value === 'price') {
    return priceSortDirection.value === 'asc' ? 'price_asc' : 'price_desc'
  }
  return 'new'
}

async function loadProducts(reset = false) {
  const nextPage = reset ? 1 : page.value
  if (reset) {
    loading.value = true
  }
  else {
    loadingMore.value = true
  }

  try {
    const response = await Apis.general.MallProductsController_findProducts({
      params: {
        categoryId: categoryId.value || undefined,
        keyword: keyword.value || undefined,
        sort: resolveSort(),
        page: nextPage,
        pageSize,
      },
    }).send()

    const list = Array.isArray(response?.data) ? response.data : []
    const normalized = list.map((item: any, index: number) =>
      normalizeProduct(item, (nextPage - 1) * pageSize + index),
    )

    products.value = reset ? normalized : [...products.value, ...normalized]
    hasMore.value = nextPage < Number(response?.meta?.totalPages || 1)
    page.value = nextPage + 1
  }
  catch {
    if (reset) {
      products.value = []
    }
    hasMore.value = false
  }
  finally {
    loading.value = false
    loadingMore.value = false
  }
}

onLoad((options) => {
  if (options?.title) {
    pageTitle.value = decodeRouteText(options.title)
  }
  else {
    pageTitle.value = defaultPageTitle
  }

  const nextCategoryId = Number(options?.categoryId || 0)
  categoryId.value = !Number.isNaN(nextCategoryId) && nextCategoryId > 0 ? nextCategoryId : null
  keyword.value = decodeRouteText(options?.keyword)

  if (keyword.value && !options?.title) {
    pageTitle.value = keyword.value
  }

  loadProducts(true)
})

function setFilter(key: string) {
  if (key === 'price' && activeFilter.value === 'price') {
    priceSortDirection.value = priceSortDirection.value === 'asc' ? 'desc' : 'asc'
  }
  else if (key !== 'price') {
    priceSortDirection.value = 'asc'
  }

  activeFilter.value = key
  loadProducts(true)
}

function goBack() {
  router.back()
}

function goSearch() {
  router.push({ name: 'search' })
}

function onProductClick(product: ProductListItem) {
  router.push({
    name: 'product-detail',
    params: {
      id: String(product.id),
    },
  })
}

async function addToCart(product: ProductListItem) {
  onProductClick(product)
}

function handleScrollToLower() {
  if (loading.value || loadingMore.value || !hasMore.value) {
    return
  }
  loadProducts()
}

function clearCategoryFilter() {
  if (!hasCategoryFilter.value) {
    return
  }

  categoryId.value = null
  pageTitle.value = keyword.value || defaultPageTitle
  router.replace({
    name: 'product-list',
    params: {
      title: pageTitle.value,
      keyword: keyword.value || '',
    },
  })
  loadProducts(true)
}
</script>

<template>
  <view class="flex flex-col bg-[#f8f7f6]">
    <scroll-view scroll-y class="flex-1" @scrolltolower="handleScrollToLower">
      <view class="no-scrollbar flex gap-3 overflow-x-auto px-4 py-4">
        <view
          v-for="item in filters" :key="item.key"
          class="h-9 flex shrink-0 items-center gap-1 border rounded-full px-4" :class="activeFilter === item.key
            ? 'border-[#efb239] bg-[#efb239] text-white'
            : 'border-slate-200 bg-white text-slate-600'" @click="setFilter(item.key)"
        >
          <text class="text-sm" :class="activeFilter === item.key ? 'font-semibold' : 'font-medium'">
            {{ item.label }}
          </text>
          <wd-icon
            v-if="item.sort" :name="activeFilter === item.key && item.key === 'price'
              ? (priceSortDirection === 'asc' ? 'arrow-up' : 'arrow-down')
              : 'switch-horizontal'" size="14" :color="activeFilter === item.key ? '#fff' : '#64748b'"
          />
        </view>
      </view>

      <view v-if="hasActiveContext" class="flex flex-wrap items-center gap-2 px-4 pb-3">
        <view
          v-for="tag in contextTags" :key="tag.key"
          class="flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs text-slate-600 shadow-sm"
        >
          <text>{{ tag.label }}</text>
          <wd-icon v-if="tag.removable" name="close" size="14" color="#94a3b8" @click.stop="clearCategoryFilter" />
        </view>
      </view>

      <view v-if="loading" class="px-4 py-12 text-center text-sm text-slate-400">
        正在加载商品...
      </view>
      <view v-else-if="products.length === 0" class="px-4 py-12 text-center text-sm text-slate-400">
        暂无商品
      </view>
      <view v-else class="grid grid-cols-2 gap-4 px-4 pb-24">
        <view
          v-for="product in products" :key="product.id" class="flex flex-col gap-2" :class="product.offset"
          @click="onProductClick(product)"
        >
          <view
            class="relative overflow-hidden border border-slate-100 rounded-2xl bg-slate-200 shadow-sm"
            :style="`aspect-ratio:${product.ratio}`"
          >
            <image :src="product.image" mode="aspectFill" class="h-full w-full" />
            <view
              class="absolute bottom-3 right-3 size-10 flex items-center justify-center rounded-full bg-[#efb239] shadow-lg"
              @click.stop="addToCart(product)"
            >
              <wd-icon name="cart" size="16" color="#fff" />
            </view>
          </view>
          <view class="px-1">
            <text class="line-clamp-1 block text-sm text-slate-800 font-semibold">
              {{ product.name }}
            </text>
            <text class="text-base text-[#efb239] font-bold">
              ¥{{ product.price.toFixed(2) }}
            </text>
          </view>
        </view>
        <view v-if="loadingMore" class="col-span-2 py-6 text-center text-sm text-slate-400">
          正在加载更多...
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

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
