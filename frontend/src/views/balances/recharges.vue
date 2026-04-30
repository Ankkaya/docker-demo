<template>
  <div class="p-4">
    <n-card class="mb-4" content-style="padding-bottom: 0;">
      <QueryForm :model="searchForm">
        <n-form-item label="关键词">
          <n-input v-model:value="searchForm.keyword" placeholder="充值单号/商户单号/微信单号/客户信息" clearable />
        </n-form-item>
        <n-form-item label="状态">
          <n-select v-model:value="searchForm.status" :options="statusOptions" placeholder="全部状态" clearable />
        </n-form-item>
        <n-form-item label="支付方式">
          <n-select v-model:value="searchForm.method" :options="methodOptions" placeholder="全部方式" clearable />
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
        :row-key="(row: BalanceRechargeOrder) => row.id"
        remote
      />
    </n-card>

    <n-modal v-model:show="refundVisible" preset="card" title="发起充值退款" style="width: 560px">
      <n-form label-placement="top">
        <n-form-item label="退款金额">
          <n-input :value="currentRow ? `¥${Number(currentRow.amount).toFixed(2)}` : '-'" disabled />
        </n-form-item>
        <n-form-item v-if="currentRow && Number(currentRow.bonusAmount || 0) > 0" label="回退到账金额">
          <n-input :value="`¥${Number(currentRow.arrivalAmount).toFixed(2)}（含赠送金额）`" disabled />
        </n-form-item>
        <n-form-item label="退款说明">
          <n-input
            v-model:value="refundReason"
            type="textarea"
            :rows="4"
            maxlength="200"
            show-count
            placeholder="请输入退款原因，默认会记录为后台发起充值退款"
          />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="refundVisible = false">取消</n-button>
          <n-button type="warning" :loading="refundSubmitting" @click="handleCreateRefund">确认退款</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { h, onMounted, reactive, ref } from 'vue'
import type { DataTableColumns } from 'naive-ui'
import { NButton, NSpace, NTag, useMessage } from 'naive-ui'
import QueryForm from '@/components/common/QueryForm.vue'
import { getBalanceRechargeOrders } from '@/api/balance'
import { createPaymentRefund } from '@/api/purchase'
import type { BalanceRechargeOrder } from '@/types/balance'
import type { PaymentMethod, PaymentStatus } from '@/types/purchase'

const message = useMessage()
const loading = ref(false)
const tableData = ref<BalanceRechargeOrder[]>([])
const refundVisible = ref(false)
const refundSubmitting = ref(false)
const currentRow = ref<BalanceRechargeOrder | null>(null)
const refundReason = ref('')

const searchForm = reactive<{
  keyword: string
  status: PaymentStatus | null
  method: PaymentMethod | null
}>({
  keyword: '',
  status: null,
  method: 'WECHAT',
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

const statusOptions = [
  { label: '待支付', value: 'PENDING' },
  { label: '已完成', value: 'COMPLETED' },
  { label: '已取消', value: 'CANCELLED' },
]

const methodOptions = [
  { label: '微信支付', value: 'WECHAT' },
]

const columns: DataTableColumns<BalanceRechargeOrder> = [
  { title: '充值单号', key: 'rechargeNo', width: 170 },
  {
    title: '客户信息',
    key: 'customerName',
    width: 180,
    render: row => h('div', [
      h('div', { style: 'font-weight: 600;' }, row.customerName),
      h('div', { style: 'color: #999; font-size: 12px;' }, `编码: ${row.customerCode}`),
      h('div', { style: 'color: #999; font-size: 12px;' }, row.customerPhone || '-'),
    ]),
  },
  { title: '实充金额', key: 'amount', width: 100, render: row => `¥${Number(row.amount).toFixed(2)}` },
  { title: '赠送金额', key: 'bonusAmount', width: 100, render: row => Number(row.bonusAmount || 0) > 0 ? `¥${Number(row.bonusAmount).toFixed(2)}` : '-' },
  { title: '到账金额', key: 'arrivalAmount', width: 100, render: row => `¥${Number(row.arrivalAmount).toFixed(2)}` },
  { title: '活动名称', key: 'activityName', width: 160, render: row => row.activityName || '-' },
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
  { title: '商户单号', key: 'outTradeNo', width: 220, render: row => row.outTradeNo || '-' },
  { title: '微信单号', key: 'thirdTradeNo', width: 220, render: row => row.thirdTradeNo || '-' },
  { title: '第三方状态', key: 'thirdStatus', width: 140, render: row => row.thirdStatus || '-' },
  {
    title: '退款状态',
    key: 'refundStatus',
    width: 120,
    render: row => row.refundStatusText
      ? h(
        NTag,
        {
          size: 'small',
          type: row.refundStatus === 'SUCCESS'
            ? 'success'
            : row.refundStatus === 'PROCESSING'
              ? 'warning'
              : row.refundStatus === 'ABNORMAL'
                ? 'error'
                : 'default',
        },
        { default: () => row.refundStatusText || '-' },
      )
      : '-',
  },
  { title: '支付时间', key: 'paidAt', width: 180, render: row => formatDateTime(row.paidAt || '') },
  { title: '创建时间', key: 'createdAt', width: 180, render: row => formatDateTime(row.createdAt) },
  {
    title: '操作',
    key: 'actions',
    width: 120,
    fixed: 'right',
    render: row => h(NSpace, { wrap: false }, {
      default: () => [
        row.canRefund
          ? h(NButton, {
            text: true,
            type: 'warning',
            onClick: () => openRefundModal(row),
          }, { default: () => '退款' })
          : null,
      ],
    }),
  },
]

async function loadData() {
  loading.value = true
  try {
    const res = await getBalanceRechargeOrders({
      keyword: searchForm.keyword || undefined,
      status: searchForm.status || undefined,
      method: searchForm.method || undefined,
      page: pagination.page,
      pageSize: pagination.pageSize,
    })
    tableData.value = res.data
    pagination.itemCount = res.meta.total
  } catch (error: any) {
    message.error(error.message || '加载余额充值单失败')
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
  searchForm.status = null
  searchForm.method = 'WECHAT'
  pagination.page = 1
  loadData()
}

function openRefundModal(row: BalanceRechargeOrder) {
  currentRow.value = row
  refundReason.value = ''
  refundVisible.value = true
}

async function handleCreateRefund() {
  if (!currentRow.value) {
    return
  }

  refundSubmitting.value = true
  try {
    await createPaymentRefund(
      currentRow.value.id,
      { reason: refundReason.value.trim() || undefined },
      'RECHARGE',
    )
    message.success('充值退款申请已提交')
    refundVisible.value = false
    await loadData()
  } catch (error: any) {
    message.error(error.message || '发起充值退款失败')
  } finally {
    refundSubmitting.value = false
  }
}

function formatDateTime(value: string) {
  return value ? new Date(value).toLocaleString('zh-CN') : '-'
}

onMounted(loadData)
</script>
