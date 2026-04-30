<template>
  <div class="p-4">
    <n-card class="mb-4" content-style="padding-bottom: 0;">
      <QueryForm :model="searchForm">
        <n-form-item label="关键词">
          <n-input v-model:value="searchForm.keyword" placeholder="评价单号/订单号/商品名" clearable />
        </n-form-item>
        <n-form-item label="状态">
          <n-select v-model:value="searchForm.status" :options="statusOptions" placeholder="全部状态" clearable />
        </n-form-item>
        <n-form-item>
          <n-space>
            <n-button type="primary" @click="handleSearch">查询</n-button>
            <n-button @click="handleReset">重置</n-button>
          </n-space>
        </n-form-item>
      </QueryForm>
    </n-card>

    <n-card>
      <n-data-table
        :columns="columns"
        :data="tableData"
        :loading="loading"
        :pagination="pagination"
        :row-key="(row: ReviewItem) => row.id"
        remote
      />
    </n-card>

    <n-modal v-model:show="detailVisible" preset="card" title="评价详情" style="width: 880px">
      <template v-if="currentReview">
        <n-descriptions bordered :column="2" label-placement="left">
          <n-descriptions-item label="评价单号">{{ currentReview.reviewNo }}</n-descriptions-item>
          <n-descriptions-item label="订单ID">{{ currentReview.orderId }}</n-descriptions-item>
          <n-descriptions-item label="商品">{{ currentReview.productName }}</n-descriptions-item>
          <n-descriptions-item label="SKU">{{ currentReview.skuCode }}</n-descriptions-item>
          <n-descriptions-item label="用户">{{ currentReview.userName }}</n-descriptions-item>
          <n-descriptions-item label="评分">{{ currentReview.rating }} 星</n-descriptions-item>
          <n-descriptions-item label="状态">{{ statusLabelMap[currentReview.status] }}</n-descriptions-item>
          <n-descriptions-item label="评价时间">{{ formatDateTime(currentReview.createdAt) }}</n-descriptions-item>
          <n-descriptions-item label="匿名评价">{{ currentReview.isAnonymous ? '是' : '否' }}</n-descriptions-item>
          <n-descriptions-item label="审核时间">{{ formatDateTime(currentReview.reviewedAt) }}</n-descriptions-item>
        </n-descriptions>

        <div class="mt-4">
          <div class="mb-2 text-sm font-semibold text-slate-700">规格</div>
          <div class="rounded bg-slate-50 px-3 py-2 text-sm text-slate-600">
            {{ formatSpecs(currentReview.skuSpecs) }}
          </div>
        </div>

        <div class="mt-4">
          <div class="mb-2 text-sm font-semibold text-slate-700">评价内容</div>
          <div class="rounded bg-slate-50 px-3 py-3 text-sm text-slate-700 whitespace-pre-wrap">
            {{ currentReview.content || '用户未填写文字评价' }}
          </div>
        </div>

        <div class="mt-4">
          <div class="mb-2 text-sm font-semibold text-slate-700">评价图片</div>
          <div v-if="currentReview.images.length" class="flex flex-wrap gap-3">
            <n-image
              v-for="image in currentReview.images"
              :key="image"
              :src="image"
              width="92"
              height="92"
              object-fit="cover"
              class="rounded"
            />
          </div>
          <div v-else class="text-sm text-slate-400">无图片</div>
        </div>

        <div class="mt-4">
          <div class="mb-2 text-sm font-semibold text-slate-700">商家回复</div>
          <div class="rounded bg-slate-50 px-3 py-3 text-sm text-slate-700 whitespace-pre-wrap">
            {{ currentReview.replyContent || '暂无回复' }}
          </div>
        </div>
      </template>
    </n-modal>

    <n-modal v-model:show="replyVisible" preset="card" title="回复评价" style="width: 640px">
      <n-form ref="replyFormRef" :model="replyForm" :rules="replyRules" label-placement="top">
        <n-form-item label="回复内容" path="replyContent">
          <n-input
            v-model:value="replyForm.replyContent"
            type="textarea"
            :rows="5"
            maxlength="1000"
            show-count
            placeholder="请输入商家回复内容"
          />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="replyVisible = false">取消</n-button>
          <n-button type="primary" :loading="replySubmitting" @click="handleSubmitReply">提交回复</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { h, onMounted, reactive, ref } from 'vue'
import type { DataTableColumns, FormInst, FormRules } from 'naive-ui'
import { NButton, NImage, NSpace, NTag, useDialog, useMessage } from 'naive-ui'
import QueryForm from '@/components/common/QueryForm.vue'
import {
  auditReview,
  deleteReview,
  getReview,
  getReviews,
  replyReview,
  type ReviewItem,
  type ReviewStatus,
} from '@/api/review'

const message = useMessage()
const dialog = useDialog()

const loading = ref(false)
const tableData = ref<ReviewItem[]>([])
const detailVisible = ref(false)
const replyVisible = ref(false)
const replySubmitting = ref(false)
const currentReview = ref<ReviewItem | null>(null)
const replyTargetId = ref<number | null>(null)
const replyFormRef = ref<FormInst | null>(null)

const searchForm = reactive<{
  keyword: string
  status: ReviewStatus | null
}>({
  keyword: '',
  status: null,
})

const replyForm = reactive({
  replyContent: '',
})

const statusOptions = [
  { label: '待审核', value: 'PENDING' },
  { label: '已通过', value: 'APPROVED' },
  { label: '已拒绝', value: 'REJECTED' },
  { label: '已隐藏', value: 'HIDDEN' },
]

const statusLabelMap: Record<ReviewStatus, string> = {
  PENDING: '待审核',
  APPROVED: '已通过',
  REJECTED: '已拒绝',
  HIDDEN: '已隐藏',
}

const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
  onUpdatePage: (page: number) => {
    pagination.page = page
    loadData()
  },
  onUpdatePageSize: (pageSize: number) => {
    pagination.pageSize = pageSize
    pagination.page = 1
    loadData()
  },
})

const replyRules: FormRules = {
  replyContent: [{ required: true, message: '请输入回复内容', trigger: 'blur' }],
}

const columns: DataTableColumns<ReviewItem> = [
  { title: '评价单号', key: 'reviewNo', width: 180 },
  { title: '商品', key: 'productName', minWidth: 180 },
  { title: '用户', key: 'userName', width: 120 },
  { title: '评分', key: 'rating', width: 80, render: row => `${row.rating} 星` },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render: row => h(
      NTag,
      {
        size: 'small',
        type: row.status === 'APPROVED' ? 'success' : row.status === 'PENDING' ? 'warning' : 'default',
      },
      { default: () => statusLabelMap[row.status] },
    ),
  },
  { title: '商家回复', key: 'replyContent', minWidth: 180, render: row => row.replyContent || '-' },
  { title: '评价时间', key: 'createdAt', width: 180, render: row => formatDateTime(row.createdAt) },
  {
    title: '操作',
    key: 'actions',
    width: 300,
    render: row => h(NSpace, { wrap: false }, {
      default: () => [
        h(NButton, { text: true, type: 'info', onClick: () => handleViewDetail(row.id) }, { default: () => '详情' }),
        h(NButton, {
          text: true,
          type: 'success',
          disabled: row.status === 'APPROVED',
          onClick: () => handleAudit(row.id, 'APPROVED'),
        }, { default: () => '通过' }),
        h(NButton, {
          text: true,
          type: 'warning',
          disabled: row.status === 'REJECTED',
          onClick: () => handleAudit(row.id, 'REJECTED'),
        }, { default: () => '拒绝' }),
        h(NButton, {
          text: true,
          type: 'primary',
          onClick: () => openReply(row),
        }, { default: () => row.replyContent ? '修改回复' : '回复' }),
        h(NButton, {
          text: true,
          type: 'error',
          onClick: () => handleDelete(row),
        }, { default: () => '删除' }),
      ],
    }),
  },
]

async function loadData() {
  loading.value = true
  try {
    const res = await getReviews({
      keyword: searchForm.keyword || undefined,
      status: searchForm.status || undefined,
      page: pagination.page,
      pageSize: pagination.pageSize,
    })
    tableData.value = res.data
    pagination.itemCount = res.meta.total
  }
  catch (error: any) {
    message.error(error.message || '加载评价列表失败')
  }
  finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.page = 1
  loadData()
}

function handleReset() {
  searchForm.keyword = ''
  searchForm.status = null
  pagination.page = 1
  loadData()
}

async function handleViewDetail(id: number) {
  try {
    currentReview.value = await getReview(id)
    detailVisible.value = true
  }
  catch (error: any) {
    message.error(error.message || '加载评价详情失败')
  }
}

async function handleAudit(id: number, status: ReviewStatus) {
  try {
    await auditReview(id, status)
    message.success(`评价已${statusLabelMap[status]}`)
    await loadData()
    if (currentReview.value?.id === id) {
      currentReview.value = await getReview(id)
    }
  }
  catch (error: any) {
    message.error(error.message || '审核失败')
  }
}

function openReply(row: ReviewItem) {
  replyTargetId.value = row.id
  replyForm.replyContent = row.replyContent || ''
  replyVisible.value = true
}

async function handleSubmitReply() {
  await replyFormRef.value?.validate()
  if (!replyTargetId.value) {
    return
  }

  replySubmitting.value = true
  try {
    await replyReview(replyTargetId.value, replyForm.replyContent.trim())
    message.success('回复成功')
    replyVisible.value = false
    await loadData()
    if (currentReview.value?.id === replyTargetId.value) {
      currentReview.value = await getReview(replyTargetId.value)
    }
  }
  catch (error: any) {
    message.error(error.message || '回复失败')
  }
  finally {
    replySubmitting.value = false
  }
}

function handleDelete(row: ReviewItem) {
  dialog.warning({
    title: '删除评价',
    content: `确定删除评价“${row.reviewNo}”吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await deleteReview(row.id)
        message.success('删除成功')
        await loadData()
        if (currentReview.value?.id === row.id) {
          detailVisible.value = false
          currentReview.value = null
        }
      }
      catch (error: any) {
        message.error(error.message || '删除失败')
      }
    },
  })
}

function formatDateTime(value?: string | null) {
  return value ? new Date(value).toLocaleString('zh-CN') : '-'
}

function formatSpecs(specs: Record<string, string> | null) {
  if (!specs || !Object.keys(specs).length) {
    return '默认规格'
  }

  return Object.entries(specs)
    .map(([key, value]) => `${key}: ${value}`)
    .join(' / ')
}

onMounted(loadData)
</script>
