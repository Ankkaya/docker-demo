<template>
  <div class="p-4">
    <n-card class="mb-4" content-style="padding-bottom: 0;">
      <QueryForm :model="searchForm" @search="handleSearch">
        <n-form-item label="关键词">
          <n-input v-model:value="searchForm.keyword" placeholder="业务单号/商户单号/微信单号" clearable />
        </n-form-item>
        <n-form-item label="支付方式">
          <n-select v-model:value="searchForm.method" :options="methodOptions" placeholder="全部方式" clearable />
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
        :row-key="(row: Payment) => `${row.orderSource}-${row.id}`"
        remote
      />
    </n-card>

    <n-drawer v-model:show="detailVisible" width="760" :mask-closable="false">
      <n-drawer-content title="支付详情" closable>
        <template v-if="currentPayment">
          <div class="mb-4 flex items-center justify-end gap-2">
            <n-button
              v-if="canQueryPayment(currentPayment)"
              type="primary"
              ghost
              :loading="queryingId === currentPayment.id"
              @click="handleQueryPayment(currentPayment)"
            >
              立即查单
            </n-button>
            <n-button
              v-if="canRefundPayment(currentPayment) && authStore.hasPermission('finance:refund:create')"
              type="warning"
              ghost
              @click="openRefundModal"
            >
              发起退款
            </n-button>
          </div>

          <n-descriptions bordered :column="2" label-placement="left">
            <n-descriptions-item label="支付单ID">{{ currentPayment.id }}</n-descriptions-item>
            <n-descriptions-item label="业务单号">{{ currentPayment.orderNo || '-' }}</n-descriptions-item>
            <n-descriptions-item label="业务类型">{{ formatBizType(currentPayment) }}</n-descriptions-item>
            <n-descriptions-item label="支付方式">{{ currentPayment.methodText }}</n-descriptions-item>
            <n-descriptions-item label="支付状态">{{ currentPayment.statusText }}</n-descriptions-item>
            <n-descriptions-item label="确认来源">{{ currentPayment.confirmSourceText }}</n-descriptions-item>
            <n-descriptions-item label="商户单号">{{ currentPayment.outTradeNo || '-' }}</n-descriptions-item>
            <n-descriptions-item label="微信单号">{{ currentPayment.thirdTradeNo || '-' }}</n-descriptions-item>
            <n-descriptions-item label="第三方状态">{{ currentPayment.thirdStatus || '-' }}</n-descriptions-item>
            <n-descriptions-item label="查单次数">{{ currentPayment.queryCount }}</n-descriptions-item>
            <n-descriptions-item label="支付时间">{{ formatDateTime(currentPayment.paidAt) }}</n-descriptions-item>
            <n-descriptions-item label="回调时间">{{ formatDateTime(currentPayment.notifyAt) }}</n-descriptions-item>
            <n-descriptions-item label="最后查单">{{ formatDateTime(currentPayment.lastQueryAt) }}</n-descriptions-item>
            <n-descriptions-item label="交易类型">{{ currentPayment.tradeType || '-' }}</n-descriptions-item>
            <n-descriptions-item label="预支付ID" :span="2">{{ currentPayment.prepayId || '-' }}</n-descriptions-item>
            <n-descriptions-item label="失败原因" :span="2">{{ currentPayment.failReason || '-' }}</n-descriptions-item>
            <n-descriptions-item label="备注" :span="2">{{ currentPayment.remark || '-' }}</n-descriptions-item>
          </n-descriptions>

          <div class="mt-4">
            <div class="mb-2 text-sm font-semibold text-slate-700">退款记录</div>
            <n-data-table
              :columns="refundColumns"
              :data="currentPayment.refunds || []"
              :bordered="false"
              :single-line="false"
              size="small"
              :pagination="false"
            />
            <div v-if="!(currentPayment.refunds || []).length" class="rounded bg-slate-50 px-3 py-3 text-sm text-slate-400">
              暂无退款记录
            </div>
          </div>

          <div class="mt-4">
            <div class="mb-2 text-sm font-semibold text-slate-700">回调报文</div>
            <n-alert v-if="!currentPayment.notifyPayload" type="info" :show-icon="false">
              暂无回调报文，可能尚未收到微信回调，或当前支付由主动查单/手工确认完成。
            </n-alert>
            <n-scrollbar v-else x-scrollable style="max-height: 280px">
              <pre class="rounded bg-slate-950 p-4 text-xs leading-6 text-slate-100">{{ formatPayload(currentPayment.notifyPayload) }}</pre>
            </n-scrollbar>
          </div>
        </template>
      </n-drawer-content>
    </n-drawer>

    <n-modal v-model:show="refundVisible" preset="card" title="发起退款" style="width: 560px">
      <n-form label-placement="top">
        <n-form-item label="退款金额">
          <n-input :value="currentPayment ? `¥${Number(currentPayment.amount).toFixed(2)}` : '-'" disabled />
        </n-form-item>
        <n-form-item label="退款说明">
          <n-input
            v-model:value="refundReason"
            type="textarea"
            :rows="4"
            maxlength="200"
            show-count
            placeholder="请输入退款原因，默认会记录为后台发起退款"
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
import { useAuthStore } from '@/store'
import {
  createPaymentRefund,
  getPayment,
  getPayments,
  queryPaymentRefund,
  queryWechatPayment,
} from '@/api/purchase'
import type {
  Payment,
  PaymentMethod,
  PaymentRefund,
  PaymentStatus,
} from '@/types/purchase'

const message = useMessage()
const authStore = useAuthStore()
const loading = ref(false)
const tableData = ref<Payment[]>([])
const detailVisible = ref(false)
const refundVisible = ref(false)
const refundSubmitting = ref(false)
const currentPayment = ref<Payment | null>(null)
const queryingId = ref<number | null>(null)
const refundQueryingId = ref<number | null>(null)
const refundReason = ref('')

const searchForm = reactive<{
  keyword: string
  orderSource: 'SHOPPING' | 'RECHARGE' | null
  method: PaymentMethod | null
  status: PaymentStatus | null
}>({
  keyword: '',
  orderSource: null,
  method: 'WECHAT',
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

const orderSourceOptions = [
  { label: '购物', value: 'SHOPPING' },
  { label: '充值', value: 'RECHARGE' },
]

const columns: DataTableColumns<Payment> = [
  { title: 'ID', key: 'id', width: 80 },
  { title: '业务单号', key: 'orderNo', width: 160, render: row => row.orderNo || '-' },
  { title: '商户单号', key: 'outTradeNo', width: 220, render: row => row.outTradeNo || '-' },
  {
    title: '微信单号',
    key: 'thirdTradeNo',
    width: 220,
    render: row => h(
      'span',
      { style: 'white-space: nowrap;' },
      row.thirdTradeNo || '-',
    ),
  },
  { title: '订单来源', key: 'orderSourceText', width: 100 },
  {
    title: '业务类型',
    key: 'bizType',
    width: 120,
    render: row => formatBizType(row),
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
  {
    title: '确认来源',
    key: 'confirmSource',
    width: 120,
    render: row => h(
      NTag,
      {
        size: 'small',
        type: row.confirmSource === 'NOTIFY'
          ? 'success'
          : row.confirmSource === 'QUERY'
            ? 'warning'
            : row.confirmSource === 'MANUAL'
              ? 'info'
              : 'default',
      },
      { default: () => row.confirmSourceText },
    ),
  },
  { title: '第三方状态', key: 'thirdStatus', width: 140, render: row => row.thirdStatus || '-' },
  { title: '查单次数', key: 'queryCount', width: 100 },
  { title: '回调时间', key: 'notifyAt', width: 180, render: row => formatDateTime(row.notifyAt) },
  { title: '支付时间', key: 'paidAt', width: 180, render: row => formatDateTime(row.paidAt) },
  { title: '创建时间', key: 'createdAt', width: 180, render: row => formatDateTime(row.createdAt) },
  {
    title: '操作',
    key: 'actions',
    width: 120,
    fixed: 'right',
    render: row => h(NSpace, { wrap: false }, {
      default: () => [
        h(NButton, {
          text: true,
          type: 'info',
          onClick: () => handleViewDetail(row),
        }, { default: () => '详情' }),
      ],
    }),
  },
]

const refundColumns: DataTableColumns<PaymentRefund> = [
  { title: '退款单号', key: 'refundNo', minWidth: 180 },
  {
    title: '金额',
    key: 'amount',
    width: 90,
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
  { title: '退款原因', key: 'reason', minWidth: 160, render: row => row.reason || '-' },
  { title: '申请时间', key: 'createdAt', width: 180, render: row => formatDateTime(row.createdAt) },
  { title: '成功时间', key: 'successAt', width: 180, render: row => formatDateTime(row.successAt) },
  {
    title: '操作',
    key: 'actions',
    width: 120,
    render: row => row.status === 'PROCESSING'
      ? h(NButton, {
        text: true,
        type: 'primary',
        loading: refundQueryingId.value === row.id,
        onClick: () => handleQueryRefund(row.id),
      }, { default: () => '查询状态' })
      : '-',
  },
]

async function loadData() {
  loading.value = true
  try {
    const res = await getPayments({
      keyword: searchForm.keyword || undefined,
      orderSource: searchForm.orderSource || undefined,
      method: searchForm.method || undefined,
      status: searchForm.status || undefined,
      page: pagination.page,
      pageSize: pagination.pageSize,
    })
    tableData.value = res.data
    pagination.itemCount = res.meta.total
  }
  catch (error: any) {
    message.error(error.message || '加载支付记录失败')
  }
  finally {
    loading.value = false
  }
}

async function refreshCurrentPayment() {
  if (!currentPayment.value) {
    return
  }

  currentPayment.value = await getPayment(currentPayment.value.id, currentPayment.value.orderSource)
}

async function handleViewDetail(row: Payment) {
  try {
    currentPayment.value = await getPayment(row.id, row.orderSource)
    detailVisible.value = true
  }
  catch (error: any) {
    message.error(error.message || '加载支付详情失败')
  }
}

async function handleQueryPayment(row: Payment) {
  queryingId.value = row.id
  try {
    const result = await queryWechatPayment(row.id)
    message.success(result.status === 'COMPLETED' ? '查单成功，支付状态已更新' : '已完成查单')
    await loadData()
    if (currentPayment.value?.id === row.id) {
      await refreshCurrentPayment()
    }
  }
  catch (error: any) {
    message.error(error.message || '查单失败')
  }
  finally {
    queryingId.value = null
  }
}

function openRefundModal() {
  refundReason.value = ''
  refundVisible.value = true
}

async function handleCreateRefund() {
  if (!currentPayment.value) {
    return
  }

  refundSubmitting.value = true
  try {
    await createPaymentRefund(currentPayment.value.id, {
      reason: refundReason.value.trim() || undefined,
    }, currentPayment.value.orderSource)
    message.success('退款申请已提交')
    refundVisible.value = false
    await loadData()
    await refreshCurrentPayment()
  }
  catch (error: any) {
    message.error(error.message || '发起退款失败')
  }
  finally {
    refundSubmitting.value = false
  }
}

async function handleQueryRefund(refundId: number) {
  refundQueryingId.value = refundId
  try {
    const result = await queryPaymentRefund(refundId)
    message.success(result.status === 'SUCCESS' ? '退款成功' : '已刷新退款状态')
    await loadData()
    await refreshCurrentPayment()
  }
  catch (error: any) {
    message.error(error.message || '查询退款状态失败')
  }
  finally {
    refundQueryingId.value = null
  }
}

function handleSearch() {
  pagination.page = 1
  loadData()
}

function handleReset() {
  searchForm.keyword = ''
  searchForm.orderSource = null
  searchForm.method = 'WECHAT'
  searchForm.status = null
  pagination.page = 1
  loadData()
}

function formatDateTime(value?: string | null) {
  return value ? new Date(value).toLocaleString('zh-CN') : '-'
}

function formatBizType(payment: Payment) {
  if (payment.orderSource === 'RECHARGE') {
    return '余额充值'
  }

  return payment.orderType === 'MALL' ? '商城订单' : payment.bizType
}

function canQueryPayment(payment: Payment) {
  return payment.orderSource === 'SHOPPING' && payment.method === 'WECHAT' && !!payment.outTradeNo && payment.status !== 'CANCELLED'
}

function canRefundPayment(payment: Payment) {
  const refunds = payment.refunds || []
  return payment.method === 'WECHAT'
    && payment.type === 'RECEIPT'
    && payment.status === 'COMPLETED'
    && !refunds.some(item => item.status === 'PROCESSING' || item.status === 'SUCCESS')
}

function formatPayload(payload: unknown) {
  try {
    return JSON.stringify(payload, null, 2)
  }
  catch {
    return String(payload)
  }
}

onMounted(loadData)
</script>
