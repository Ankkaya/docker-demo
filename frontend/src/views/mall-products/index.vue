<template>
  <div class="p-4">
    <n-card class="mb-4">
      <QueryForm :model="searchForm">
        <n-form-item label="关键词">
          <n-input v-model:value="searchForm.keyword" placeholder="商品名称/SPU编码" clearable />
        </n-form-item>
        <n-form-item label="分类">
          <n-select v-model:value="searchForm.categoryId" :options="categoryOptions" placeholder="选择分类" clearable style="width: 180px" />
        </n-form-item>
        <n-form-item label="品牌">
          <n-select v-model:value="searchForm.brandId" :options="brandOptions" placeholder="选择品牌" clearable style="width: 180px" />
        </n-form-item>
        <n-form-item label="商城状态">
          <n-select v-model:value="searchForm.mallStatus" :options="mallStatusOptions" placeholder="全部状态" clearable style="width: 160px" />
        </n-form-item>
        <n-form-item label="库存">
          <n-switch v-model:value="searchForm.hasStock" />
        </n-form-item>
        <n-form-item>
          <n-space>
            <n-button type="primary" @click="handleSearch">搜索</n-button>
            <n-button @click="handleReset">重置</n-button>
          </n-space>
        </n-form-item>
      </QueryForm>
    </n-card>

    <n-card>
      <div class="mb-4 flex flex-wrap gap-3 text-sm text-gray-600">
        <span>待完善 {{ summary.pendingInfo }}</span>
        <span>待上架 {{ summary.ready }}</span>
        <span>已上架 {{ summary.listed }}</span>
        <span>无库存 {{ summary.noStock }}</span>
        <span>已禁用 {{ summary.disabled }}</span>
      </div>
      <n-data-table
        :columns="columns"
        :data="productList"
        :loading="loading"
        :pagination="pagination"
        :scroll-x="tableScrollX"
        remote
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
      />
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { h, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { NButton, NImage, NSpace, NSwitch, NTag, useMessage } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import QueryForm from '@/components/common/QueryForm.vue'
import { getProducts, updateProductMallInfo } from '@/api/product'
import { getBrands } from '@/api/brand'
import { getCategories } from '@/api/category'
import type { Brand, Category } from '@/types/basic-data'
import type { Product } from '@/types/product'
import { autoFitTableColumns, createActionColumn, getTableScrollX } from '@/utils/table'

const router = useRouter()
const message = useMessage()

const searchForm = reactive({
  keyword: '',
  categoryId: null as number | null,
  brandId: null as number | null,
  mallStatus: null as Product['mallStatus'] | null,
  hasStock: true,
})

const categoryOptions = ref<{ label: string; value: number }[]>([])
const brandOptions = ref<{ label: string; value: number }[]>([])
const mallStatusOptions = [
  { label: '已上架', value: 'LISTED' },
  { label: '待上架', value: 'READY' },
  { label: '待完善', value: 'PENDING_INFO' },
  { label: '无库存', value: 'NO_STOCK' },
  { label: '已禁用', value: 'DISABLED' },
]

const loading = ref(false)
const productList = ref<Product[]>([])
const togglingIds = ref<number[]>([])
const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
})

const summary = reactive({
  pendingInfo: 0,
  ready: 0,
  listed: 0,
  noStock: 0,
  disabled: 0,
})

const isMallInfoComplete = (row: Product) => {
  const mallName = row.mallInfo?.name || row.name
  const mallImage = row.mallInfo?.mainImage || row.mainImage
  const hasSkuPrice = (row.skus || []).some((sku) => Number(sku.mallInfo?.salePrice ?? sku.salePrice ?? 0) > 0)
  return Boolean(mallName && mallImage && hasSkuPrice)
}

const resolveMallStatus = (row: Product): NonNullable<Product['mallStatus']> => {
  if (!row.isEnabled) return 'DISABLED'
  if ((row.totalAvailable || 0) <= 0) return 'NO_STOCK'
  if (row.mallEnabled) return 'LISTED'
  if (!isMallInfoComplete(row)) return 'PENDING_INFO'
  return 'READY'
}

const getMallStatusTag = (status: NonNullable<Product['mallStatus']>) => {
  switch (status) {
    case 'LISTED':
      return { type: 'success' as const, label: '已上架' }
    case 'READY':
      return { type: 'info' as const, label: '待上架' }
    case 'PENDING_INFO':
      return { type: 'warning' as const, label: '待完善' }
    case 'NO_STOCK':
      return { type: 'error' as const, label: '无库存' }
    case 'DISABLED':
      return { type: 'default' as const, label: '已禁用' }
  }
}

const columns: DataTableColumns<Product> = autoFitTableColumns([
  {
    title: '商城商品',
    key: 'name',
    render: (row) => h('div', { class: 'flex items-center gap-3' }, [
      h(NImage, {
        width: 56,
        height: 56,
        objectFit: 'cover',
        src: row.mallInfo?.mainImage || row.mainImage || '/placeholder.png',
        fallbackSrc: '/placeholder.png',
      }),
      h('div', [
        h('div', { class: 'font-medium' }, row.mallInfo?.name || row.name),
        h('div', { class: 'text-xs text-gray-500 mt-1' }, `SPU: ${row.spuCode}`),
      ]),
    ]),
  },
  {
    title: '分类/品牌',
    key: 'category',
    render: (row) => `${row.category?.name || '-'} / ${row.brand?.name || '-'}`,
  },
  {
    title: 'SKU',
    key: 'skus',
    render: (row) => h(NTag, { size: 'small' }, { default: () => String(row.skus?.length || 0) }),
  },
  {
    title: '可用库存',
    key: 'totalAvailable',
    render: (row) => h(NTag, { type: (row.totalAvailable || 0) > 0 ? 'success' : 'default', size: 'small' }, {
      default: () => String(row.totalAvailable || 0),
    }),
  },
  {
    title: '运营状态',
    key: 'mallStatus',
    render: (row) => {
      const status = getMallStatusTag(row.mallStatus || resolveMallStatus(row))
      return h(NTag, { type: status.type, size: 'small' }, {
        default: () => status.label,
      })
    },
  },
  {
    title: '商城上架',
    key: 'mallEnabled',
    render: (row) => h(NSpace, { align: 'center', size: 8 }, {
      default: () => [
        h(NSwitch, {
          value: row.mallEnabled,
          loading: togglingIds.value.includes(row.id),
          onUpdateValue: (value: boolean) => handleToggleMall(row, value),
        }),
        h(NTag, { type: row.mallEnabled ? 'success' : 'default', size: 'small' }, {
          default: () => row.mallEnabled ? '已上架' : '未上架',
        }),
      ],
    }),
  },
  {
    title: '完善度',
    key: 'mallInfo',
    render: (row) => h(NTag, { type: isMallInfoComplete(row) ? 'success' : 'warning', size: 'small' }, {
      default: () => isMallInfoComplete(row) ? '已完善' : '待补全',
    }),
  },
  {
    title: '商品状态',
    key: 'isEnabled',
    render: (row) => h(NTag, { type: row.isEnabled ? 'success' : 'warning', size: 'small' }, {
      default: () => row.isEnabled ? '启用' : '禁用',
    }),
  },
  createActionColumn<Product>({
    title: '操作',
    key: 'actions',
    fixed: 'right',
    render: (row) => h(NSpace, null, {
      default: () => [
        h(NButton, { size: 'small', type: 'primary', ghost: true, onClick: () => handleEdit(row) }, { default: () => '商城信息' }),
        h(NButton, { size: 'small', onClick: () => router.push(`/products/edit/${row.id}`) }, { default: () => '母体档案' }),
      ],
    }),
  }, 2),
])
const tableScrollX = getTableScrollX(columns)

const loadOptions = async () => {
  const [categories, brands] = await Promise.all([getCategories(), getBrands()])
  categoryOptions.value = categories.map((item: Category) => ({ label: item.name, value: item.id }))
  brandOptions.value = brands.map((item: Brand) => ({ label: item.name, value: item.id }))
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await getProducts({
      keyword: searchForm.keyword || undefined,
      categoryId: searchForm.categoryId || undefined,
      brandId: searchForm.brandId || undefined,
      hasStock: searchForm.hasStock,
      page: pagination.page,
      pageSize: pagination.pageSize,
    })
    const rows = res.data.map((item) => ({
      ...item,
      mallStatus: resolveMallStatus(item),
    }))
    productList.value = searchForm.mallStatus
      ? rows.filter((item) => item.mallStatus === searchForm.mallStatus)
      : rows
    summary.pendingInfo = rows.filter((item) => item.mallStatus === 'PENDING_INFO').length
    summary.ready = rows.filter((item) => item.mallStatus === 'READY').length
    summary.listed = rows.filter((item) => item.mallStatus === 'LISTED').length
    summary.noStock = rows.filter((item) => item.mallStatus === 'NO_STOCK').length
    summary.disabled = rows.filter((item) => item.mallStatus === 'DISABLED').length
    pagination.itemCount = searchForm.mallStatus ? productList.value.length : res.meta.total
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  if (searchForm.mallStatus === 'NO_STOCK' || searchForm.mallStatus === 'DISABLED') {
    searchForm.hasStock = false
  }
  pagination.page = 1
  loadData()
}

const handleReset = () => {
  searchForm.keyword = ''
  searchForm.categoryId = null
  searchForm.brandId = null
  searchForm.mallStatus = null
  searchForm.hasStock = true
  handleSearch()
}

const handlePageChange = (page: number) => {
  pagination.page = page
  loadData()
}

const handlePageSizeChange = (pageSize: number) => {
  pagination.pageSize = pageSize
  pagination.page = 1
  loadData()
}

const handleEdit = (row: Product) => {
  router.push(`/products/mall-edit/${row.id}`)
}

const handleToggleMall = async (row: Product, nextValue: boolean) => {
  if (row.mallEnabled === nextValue || togglingIds.value.includes(row.id)) {
    return
  }

  if (nextValue && !row.isEnabled) {
    message.warning('母体商品未启用，不能上架商城')
    return
  }

  if (nextValue && (row.totalAvailable || 0) <= 0) {
    message.warning('当前无可用库存，不能上架商城')
    return
  }

  if (nextValue && !isMallInfoComplete(row)) {
    message.warning('请先完善商城名称、主图和售价')
    return
  }

  try {
    togglingIds.value = [...togglingIds.value, row.id]
    await updateProductMallInfo(row.id, {
      mallEnabled: nextValue,
    })
    message.success(nextValue ? '已上架' : '已下架')
    loadData()
  } catch (error) {
    message.error(nextValue ? '上架失败' : '下架失败')
  } finally {
    togglingIds.value = togglingIds.value.filter((id) => id !== row.id)
  }
}

onMounted(async () => {
  await loadOptions()
  await loadData()
})
</script>
