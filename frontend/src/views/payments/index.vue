<template>
  <div class="page-container">
    <n-card title="收款记录" class="page-card">
      <QueryForm :model="searchForm">
        <n-form-item label="关键词">
          <n-input v-model:value="searchForm.keyword" placeholder="订单号/商户单号/微信单号" clearable />
        </n-form-item>
        <n-form-item label="支付方式">
          <n-select v-model:value="searchForm.method" :options="methodOptions" placeholder="全部方式" clearable />
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

      <div class="page-toolbar">
        <n-checkbox v-model:checked="searchForm.mallOnly" @update:checked="handleSearch">
          仅看商城订单支付
        </n-checkbox>
      </div>

      <n-data-table
        :columns="columns"
        :data="tableData"
        :loading="loading"
        :pagination="pagination"
        :row-key="(row: Payment) => row.id"
        remote
        />
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { h, onMounted, reactive, ref } from 'vue'
import type { DataTableColumns } from 'naive-ui'
import { NTag, useMessage } from 'naive-ui'
import QueryForm from '@/components/common/QueryForm.vue'
import { getPayments } from '@/api/purchase'
import type { Payment, PaymentMethod, PaymentStatus } from '@/types/purchase'

const message = useMessage()
const loading = ref(false)
const tableData = ref<Payment[]>([])

const searchForm = reactive<{
  keyword: string
  method: PaymentMethod | null
  status: PaymentStatus | null
  mallOnly: boolean
}>({
  keyword: '',
  method: 'WECHAT',
  status: null,
  mallOnly: true,
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

const methodOptions = [
  { label: '微信支付', value: 'WECHAT' },
  { label: '支付宝', value: 'ALIPAY' },
  { label: '银行转账', value: 'BANK' },
  { label: '现金', value: 'CASH' },
  { label: '余额支付', value: 'BALANCE' },
  { label: '挂账', value: 'CREDIT' },
]

const statusOptions = [
  { label: '待确认', value: 'PENDING' },
  { label: '已完成', value: 'COMPLETED' },
  { label: '已取消', value: 'CANCELLED' },
]

const columns: DataTableColumns<Payment> = [
  { title: 'ID', key: 'id', width: 80 },
  { title: '订单号', key: 'orderNo', width: 160, render: row => row.orderNo || '-' },
  { title: '商户单号', key: 'outTradeNo', width: 220, render: row => row.outTradeNo || '-' },
  { title: '微信单号', key: 'thirdTradeNo', width: 220, render: row => row.thirdTradeNo || '-' },
  {
    title: '业务类型',
    key: 'bizType',
    width: 120,
    render: row => row.orderType === 'MALL' ? '商城订单' : row.bizType,
  },
  {
    title: '金额',
    key: 'amount',
    width: 100,
    render: row => `¥${Number(row.amount).toFixed(2)}`,
  },
  { title: '支付方式', key: 'methodText', width: 120 },
  {
    title: '状态',
    key: 'status',
    width: 110,
    render: row => h(
      NTag,
      { size: 'small', type: row.status === 'COMPLETED' ? 'success' : row.status === 'CANCELLED' ? 'warning' : 'default' },
      { default: () => row.statusText },
    ),
  },
  { title: '第三方状态', key: 'thirdStatus', width: 140, render: row => row.thirdStatus || '-' },
  { title: '支付时间', key: 'paidAt', width: 180, render: row => formatDateTime(row.paidAt || '') },
  { title: '创建时间', key: 'createdAt', width: 180, render: row => formatDateTime(row.createdAt) },
]

async function loadData() {
  loading.value = true
  try {
    const res = await getPayments({
      keyword: searchForm.keyword || undefined,
      method: searchForm.method || undefined,
      status: searchForm.status || undefined,
      mallOnly: searchForm.mallOnly,
      page: pagination.page,
      pageSize: pagination.pageSize,
    })
    tableData.value = res.data
    pagination.itemCount = res.meta.total
  } catch (error: any) {
    message.error(error.message || '加载收款记录失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.page = 1
  loadData()
}

function handleReset() {
  searchForm.keyword = ''
  searchForm.method = 'WECHAT'
  searchForm.status = null
  searchForm.mallOnly = true
  pagination.page = 1
  loadData()
}

function formatDateTime(value: string) {
  return value ? new Date(value).toLocaleString('zh-CN') : '-'
}

onMounted(loadData)
</script>
