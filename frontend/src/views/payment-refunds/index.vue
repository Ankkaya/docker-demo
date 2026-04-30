<template>
  <div class="p-4">
    <n-card class="mb-4" content-style="padding-bottom: 0;">
      <QueryForm :model="searchForm">
        <n-form-item label="关键词">
          <n-input v-model:value="searchForm.keyword" placeholder="退款单号/业务单号/商户单号" clearable />
        </n-form-item>
        <n-form-item label="订单来源">
          <n-select v-model:value="searchForm.orderSource" :options="orderSourceOptions" placeholder="全部来源" clearable />
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
        :row-key="(row: PaymentRefund) => row.id"
        remote
      />
    </n-card>

    <n-drawer v-model:show="detailVisible" width="720" :mask-closable="false">
      <n-drawer-content title="退款详情" closable>
        <template v-if="currentRefund">
          <n-descriptions bordered :column="2" label-placement="left">
            <n-descriptions-item label="退款单号">{{ currentRefund.refundNo }}</n-descriptions-item>
            <n-descriptions-item label="订单来源">{{ currentRefund.orderSourceText }}</n-descriptions-item>
            <n-descriptions-item label="业务单号">{{ currentRefund.orderNo || '-' }}</n-descriptions-item>
            <n-descriptions-item label="原商户单号">{{ currentRefund.outTradeNo || '-' }}</n-descriptions-item>
            <n-descriptions-item label="退款金额">¥{{ Number(currentRefund.amount).toFixed(2) }}</n-descriptions-item>
            <n-descriptions-item label="退款状态">{{ currentRefund.statusText }}</n-descriptions-item>
            <n-descriptions-item label="微信退款单号">{{ currentRefund.thirdRefundNo || '-' }}</n-descriptions-item>
            <n-descriptions-item label="第三方状态">{{ currentRefund.thirdStatus || '-' }}</n-descriptions-item>
            <n-descriptions-item label="退款原因" :span="2">{{ currentRefund.reason || '-' }}</n-descriptions-item>
            <n-descriptions-item label="失败原因" :span="2">{{ currentRefund.failReason || '-' }}</n-descriptions-item>
            <n-descriptions-item label="申请时间">{{ formatDateTime(currentRefund.createdAt) }}</n-descriptions-item>
            <n-descriptions-item label="成功时间">{{ formatDateTime(currentRefund.successAt) }}</n-descriptions-item>
            <n-descriptions-item label="回调时间">{{ formatDateTime(currentRefund.notifyAt) }}</n-descriptions-item>
          </n-descriptions>

          <div class="mt-4">
            <div class="mb-2 flex items-center justify-between">
              <div class="text-sm font-semibold text-slate-700">回调报文</div>
              <n-button
                v-if="currentRefund.status === 'PROCESSING'"
                type="primary"
                size="small"
                ghost
                :loading="queryingId === currentRefund.id"
                @click="handleQueryRefund(currentRefund)"
              >
                查询状态
              </n-button>
            </div>
            <n-alert v-if="!currentRefund.notifyPayload" type="info" :show-icon="false">
              暂无退款回调报文。
            </n-alert>
            <n-scrollbar v-else x-scrollable style="max-height: 280px">
              <pre class="rounded bg-slate-950 p-4 text-xs leading-6 text-slate-100">{{ formatPayload(currentRefund.notifyPayload) }}</pre>
            </n-scrollbar>
          </div>
        </template>
      </n-drawer-content>
    </n-drawer>
  </div>
</template>

<script setup lang="ts">
import { h, onMounted, reactive, ref } from 'vue'
import type { DataTableColumns } from 'naive-ui'
import { NButton, NTag, useMessage } from 'naive-ui'
import QueryForm from '@/components/common/QueryForm.vue'
import { getPaymentRefund, getPaymentRefunds, queryPaymentRefund } from '@/api/purchase'
import type { PaymentRefund, PaymentRefundStatus } from '@/types/purchase'

const message = useMessage()
const loading = ref(false)
const detailVisible = ref(false)
const queryingId = ref<number | null>(null)
const tableData = ref<PaymentRefund[]>([])
const currentRefund = ref<PaymentRefund | null>(null)

const searchForm = reactive<{
  keyword: string
  orderSource: 'SHOPPING' | 'RECHARGE' | null
  status: PaymentRefundStatus | null
}>({
  keyword: '',
  orderSource: null,
  status: null,
})

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

const orderSourceOptions = [
  { label: '购物', value: 'SHOPPING' },
  { label: '充值', value: 'RECHARGE' },
]

const statusOptions = [
  { label: '退款处理中', value: 'PROCESSING' },
  { label: '退款成功', value: 'SUCCESS' },
  { label: '退款关闭', value: 'CLOSED' },
  { label: '退款异常', value: 'ABNORMAL' },
]

const columns: DataTableColumns<PaymentRefund> = [
  { title: '退款单号', key: 'refundNo', width: 180 },
  { title: '订单来源', key: 'orderSourceText', width: 100 },
  { title: '业务单号', key: 'orderNo', width: 160, render: row => row.orderNo || '-' },
  { title: '原商户单号', key: 'outTradeNo', width: 220, render: row => row.outTradeNo || '-' },
  {
    title: '退款金额',
    key: 'amount',
    width: 100,
    render: row => `¥${Number(row.amount).toFixed(2)}`,
  },
  {
    title: '状态',
    key: 'status',
    width: 110,
    render: row => h(
      NTag,
      {
        size: 'small',
        type: row.status === 'SUCCESS'
          ? 'success'
          : row.status === 'PROCESSING'
            ? 'warning'
            : row.status === 'ABNORMAL'
              ? 'error'
              : 'default',
      },
      { default: () => row.statusText },
    ),
  },
  { title: '退款原因', key: 'reason', minWidth: 180, render: row => row.reason || '-' },
  { title: '申请时间', key: 'createdAt', width: 180, render: row => formatDateTime(row.createdAt) },
  { title: '成功时间', key: 'successAt', width: 180, render: row => formatDateTime(row.successAt) },
  {
    title: '操作',
    key: 'actions',
    width: 140,
    render: row => h('div', { class: 'flex items-center gap-2' }, [
      h(NButton, {
        text: true,
        type: 'info',
        onClick: () => handleViewDetail(row.id),
      }, { default: () => '详情' }),
      row.status === 'PROCESSING'
        ? h(NButton, {
          text: true,
          type: 'primary',
          loading: queryingId.value === row.id,
          onClick: () => handleQueryRefund(row),
        }, { default: () => '查询状态' })
        : null,
    ]),
  },
]

async function loadData() {
  loading.value = true
  try {
    const res = await getPaymentRefunds({
      keyword: searchForm.keyword || undefined,
      orderSource: searchForm.orderSource || undefined,
      status: searchForm.status || undefined,
      page: pagination.page,
      pageSize: pagination.pageSize,
    })
    tableData.value = res.data
    pagination.itemCount = res.meta.total
  } catch (error: any) {
    message.error(error.message || '加载退款记录失败')
  } finally {
    loading.value = false
  }
}

async function handleViewDetail(id: number) {
  try {
    currentRefund.value = await getPaymentRefund(id)
    detailVisible.value = true
  } catch (error: any) {
    message.error(error.message || '加载退款详情失败')
  }
}

async function handleQueryRefund(row: PaymentRefund) {
  queryingId.value = row.id
  try {
    const result = await queryPaymentRefund(row.id)
    message.success(result.status === 'SUCCESS' ? '退款成功' : '已刷新退款状态')
    await loadData()
    if (currentRefund.value?.id === row.id) {
      currentRefund.value = await getPaymentRefund(row.id)
    }
  } catch (error: any) {
    message.error(error.message || '查询退款状态失败')
  } finally {
    queryingId.value = null
  }
}

function handleSearch() {
  pagination.page = 1
  loadData()
}

function handleReset() {
  searchForm.keyword = ''
  searchForm.orderSource = null
  searchForm.status = null
  pagination.page = 1
  loadData()
}

function formatDateTime(value?: string | null) {
  return value ? new Date(value).toLocaleString('zh-CN') : '-'
}

function formatPayload(payload: unknown) {
  try {
    return JSON.stringify(payload, null, 2)
  } catch {
    return String(payload)
  }
}

onMounted(loadData)
</script>
