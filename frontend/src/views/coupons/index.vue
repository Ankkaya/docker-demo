<template>
  <div class="page-container">
    <n-card title="优惠券管理" class="page-card">
      <n-tabs type="line" animated>
        <n-tab-pane name="templates" tab="优惠券模板">
          <QueryForm :model="couponSearchForm">
            <n-form-item label="关键词">
              <n-input v-model:value="couponSearchForm.keyword" placeholder="名称/编码" clearable />
            </n-form-item>
            <n-form-item label="状态">
              <n-select v-model:value="couponSearchForm.isEnabled" :options="enabledOptions" placeholder="全部状态" clearable />
            </n-form-item>
            <n-form-item>
              <n-space>
                <n-button type="primary" @click="handleCouponSearch">查询</n-button>
                <n-button @click="handleCouponReset">重置</n-button>
              </n-space>
            </n-form-item>
          </QueryForm>

          <div class="page-toolbar">
            <n-space>
              <n-button type="primary" @click="handleCreate">新增优惠券</n-button>
              <n-button @click="loadCoupons">刷新</n-button>
            </n-space>
          </div>

          <n-data-table :columns="couponColumns" :data="couponList" :loading="couponLoading" :row-key="(row: CouponItem) => row.id" />
        </n-tab-pane>

        <n-tab-pane name="receives" tab="发放记录">
          <QueryForm :model="receiveSearchForm">
            <n-form-item label="关键词">
              <n-input v-model:value="receiveSearchForm.keyword" placeholder="客户/券名/券码" clearable />
            </n-form-item>
            <n-form-item label="优惠券">
              <n-select v-model:value="receiveSearchForm.couponId" :options="couponOptions" placeholder="全部优惠券" clearable filterable />
            </n-form-item>
            <n-form-item label="状态">
              <n-select v-model:value="receiveSearchForm.status" :options="receiveStatusOptions" placeholder="全部状态" clearable />
            </n-form-item>
            <n-form-item>
              <n-space>
                <n-button type="primary" @click="handleReceiveSearch">查询</n-button>
                <n-button @click="handleReceiveReset">重置</n-button>
              </n-space>
            </n-form-item>
          </QueryForm>

          <n-data-table
            :columns="receiveColumns"
            :data="receiveList"
            :loading="receiveLoading"
            :pagination="receivePagination"
            :row-key="(row: CouponReceiveItem) => row.id"
            remote
          />
        </n-tab-pane>
      </n-tabs>
    </n-card>

    <SmartFormContainer
      v-model:show="couponDialogVisible"
      :title="editingCouponId ? '编辑优惠券' : '新增优惠券'"
      :form-item-count="10"
      modal-width="720px"
      :drawer-width="820"
    >
      <n-form ref="couponFormRef" :model="couponForm" :rules="couponRules" label-width="110">
        <n-grid :cols="2" :x-gap="16">
          <n-form-item-gi label="优惠券名称" path="name">
            <n-input v-model:value="couponForm.name" placeholder="请输入优惠券名称" />
          </n-form-item-gi>
          <n-form-item-gi label="优惠券编码" path="code">
            <n-input v-model:value="couponForm.code" placeholder="留空自动生成" />
          </n-form-item-gi>
          <n-form-item-gi label="使用门槛" path="thresholdAmount">
            <n-input-number v-model:value="couponForm.thresholdAmount" :min="0" :precision="2" class="w-full" />
          </n-form-item-gi>
          <n-form-item-gi label="优惠金额" path="discountAmount">
            <n-input-number v-model:value="couponForm.discountAmount" :min="0.01" :precision="2" class="w-full" />
          </n-form-item-gi>
          <n-form-item-gi label="发放总量" path="totalCount">
            <n-input-number v-model:value="couponForm.totalCount" :min="1" :precision="0" class="w-full" />
          </n-form-item-gi>
          <n-form-item-gi label="每人限领" path="perLimit">
            <n-input-number v-model:value="couponForm.perLimit" :min="1" :precision="0" class="w-full" />
          </n-form-item-gi>
          <n-form-item-gi label="开始时间" path="startTime">
            <n-date-picker v-model:value="couponForm.startTime" type="datetime" clearable class="w-full" />
          </n-form-item-gi>
          <n-form-item-gi label="结束时间" path="endTime">
            <n-date-picker v-model:value="couponForm.endTime" type="datetime" clearable class="w-full" />
          </n-form-item-gi>
          <n-form-item-gi label="排序号" path="sort">
            <n-input-number v-model:value="couponForm.sort" :min="0" :precision="0" class="w-full" />
          </n-form-item-gi>
          <n-form-item-gi label="启用状态" path="isEnabled">
            <n-switch v-model:value="couponForm.isEnabled" />
          </n-form-item-gi>
          <n-form-item-gi span="2" label="说明" path="description">
            <n-input v-model:value="couponForm.description" type="textarea" :rows="3" placeholder="可选，填写适用说明" />
          </n-form-item-gi>
        </n-grid>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="couponDialogVisible = false">取消</n-button>
          <n-button type="primary" :loading="couponSubmitting" @click="handleSubmitCoupon">保存</n-button>
        </n-space>
      </template>
    </SmartFormContainer>

    <SmartFormContainer
      v-model:show="issueDialogVisible"
      title="发放优惠券"
      :form-item-count="4"
      modal-width="640px"
      :drawer-width="760"
    >
      <n-form ref="issueFormRef" :model="issueForm" :rules="issueRules" label-width="100">
        <n-form-item label="优惠券">
          <n-input :value="issueCouponTitle" disabled />
        </n-form-item>
        <n-form-item label="选择客户" path="customerIds">
          <n-select
            v-model:value="issueForm.customerIds"
            multiple
            filterable
            clearable
            :options="customerOptions"
            placeholder="请选择要发券的客户"
          />
        </n-form-item>
        <n-form-item label="备注" path="remark">
          <n-input v-model:value="issueForm.remark" type="textarea" :rows="3" placeholder="可选，填写发券说明" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="issueDialogVisible = false">取消</n-button>
          <n-button type="primary" :loading="issueSubmitting" @click="handleSubmitIssue">确认发放</n-button>
        </n-space>
      </template>
    </SmartFormContainer>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, reactive, ref } from 'vue'
import type { DataTableColumns, FormInst, FormRules } from 'naive-ui'
import { NButton, NSpace, NSwitch, NTag, useDialog, useMessage } from 'naive-ui'
import QueryForm from '@/components/common/QueryForm.vue'
import SmartFormContainer from '@/components/common/SmartFormContainer.vue'
import { getCoupons, getCouponReceives, createCoupon, updateCoupon, deleteCoupon, issueCoupon } from '@/api/coupon'
import type { CouponItem, CouponPayload, CouponReceiveItem } from '@/api/coupon'
import { getCustomers } from '@/api/customer'

const message = useMessage()
const dialog = useDialog()

const couponLoading = ref(false)
const couponSubmitting = ref(false)
const receiveLoading = ref(false)
const issueSubmitting = ref(false)
const couponDialogVisible = ref(false)
const issueDialogVisible = ref(false)
const editingCouponId = ref<number | null>(null)
const issueCouponId = ref<number | null>(null)
const couponFormRef = ref<FormInst | null>(null)
const issueFormRef = ref<FormInst | null>(null)
const couponList = ref<CouponItem[]>([])
const receiveList = ref<CouponReceiveItem[]>([])
const customerOptions = ref<{ label: string; value: number }[]>([])

const couponSearchForm = reactive({
  keyword: '',
  isEnabled: null as boolean | null,
})

const receiveSearchForm = reactive({
  keyword: '',
  couponId: null as number | null,
  status: null as 'UNUSED' | 'USED' | 'EXPIRED' | 'INVALID' | null,
})

const couponForm = reactive({
  name: '',
  code: '',
  thresholdAmount: 0,
  discountAmount: 10,
  totalCount: null as number | null,
  perLimit: 1,
  startTime: null as number | null,
  endTime: null as number | null,
  description: '',
  sort: 0,
  isEnabled: true,
})

const issueForm = reactive({
  customerIds: [] as number[],
  remark: '',
})

const enabledOptions = [
  { label: '启用', value: true },
  { label: '停用', value: false },
]

const receiveStatusOptions = [
  { label: '未使用', value: 'UNUSED' },
  { label: '已使用', value: 'USED' },
  { label: '已过期', value: 'EXPIRED' },
  { label: '已作废', value: 'INVALID' },
]

const couponOptions = computed(() => couponList.value.map(item => ({
  label: `${item.name} (${item.code})`,
  value: item.id,
})))

const issueCouponTitle = computed(() => couponList.value.find(item => item.id === issueCouponId.value)?.name || '')

const receivePagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
  onUpdatePage: (page: number) => {
    receivePagination.page = page
    loadReceives()
  },
  onUpdatePageSize: (pageSize: number) => {
    receivePagination.pageSize = pageSize
    receivePagination.page = 1
    loadReceives()
  },
})

const couponRules: FormRules = {
  name: [{ required: true, message: '请输入优惠券名称', trigger: 'blur' }],
  discountAmount: [{ required: true, type: 'number', message: '请输入优惠金额', trigger: 'change' }],
  startTime: [{ required: true, type: 'number', message: '请选择开始时间', trigger: 'change' }],
  endTime: [{
    validator: () => {
      if (!couponForm.startTime || !couponForm.endTime) {
        return new Error('请选择有效期')
      }
      if (couponForm.endTime <= couponForm.startTime) {
        return new Error('结束时间必须晚于开始时间')
      }
      return true
    },
    trigger: 'change',
  }],
}

const issueRules: FormRules = {
  customerIds: [{
    validator: () => issueForm.customerIds.length > 0 || new Error('请选择至少一个客户'),
    trigger: 'change',
  }],
}

const couponColumns: DataTableColumns<CouponItem> = [
  { title: '名称', key: 'name', minWidth: 160 },
  { title: '编码', key: 'code', width: 180 },
  { title: '类型', key: 'typeText', width: 100 },
  {
    title: '优惠规则',
    key: 'rule',
    minWidth: 180,
    render: row => `满${formatMoney(row.thresholdAmount)}减${formatMoney(row.discountAmount)}`,
  },
  {
    title: '发放情况',
    key: 'count',
    width: 170,
    render: row => `${row.receivedCount}/${row.totalCount ?? '不限'} · 每人${row.perLimit}张`,
  },
  {
    title: '有效期',
    key: 'period',
    minWidth: 220,
    render: row => `${formatDateTime(row.startTime)} - ${formatDateTime(row.endTime)}`,
  },
  {
    title: '状态',
    key: 'statusText',
    width: 100,
    render: row => h(
      NTag,
      { size: 'small', type: row.statusText === '进行中' ? 'success' : row.statusText === '未开始' ? 'info' : 'warning' },
      { default: () => row.statusText },
    ),
  },
  {
    title: '启用',
    key: 'isEnabled',
    width: 80,
    render: row => h(NSwitch, { value: row.isEnabled, disabled: true }),
  },
  {
    title: '操作',
    key: 'actions',
    width: 180,
    render: row => h(NSpace, null, {
      default: () => [
        h(NButton, { text: true, type: 'primary', onClick: () => handleEdit(row) }, { default: () => '编辑' }),
        h(NButton, { text: true, type: 'info', disabled: !row.isEnabled, onClick: () => handleOpenIssue(row) }, { default: () => '发券' }),
        h(NButton, { text: true, type: 'error', onClick: () => handleDelete(row) }, { default: () => '删除' }),
      ],
    }),
  },
]

const receiveColumns: DataTableColumns<CouponReceiveItem> = [
  { title: '优惠券', key: 'couponName', minWidth: 160 },
  { title: '券码', key: 'couponCode', width: 180 },
  { title: '客户', key: 'customerName', width: 150 },
  { title: '客户编码', key: 'customerCode', width: 120, render: row => row.customerCode || '-' },
  {
    title: '状态',
    key: 'statusText',
    width: 100,
    render: row => h(
      NTag,
      { size: 'small', type: row.status === 'UNUSED' ? 'success' : row.status === 'USED' ? 'info' : 'warning' },
      { default: () => row.statusText },
    ),
  },
  {
    title: '有效期',
    key: 'period',
    minWidth: 220,
    render: row => `${formatDateTime(row.validFrom)} - ${formatDateTime(row.validTo)}`,
  },
  { title: '发放时间', key: 'receivedAt', width: 180, render: row => formatDateTime(row.receivedAt) },
  { title: '来源', key: 'source', width: 90, render: row => row.source || '-' },
  { title: '备注', key: 'remark', minWidth: 140, render: row => row.remark || '-' },
]

async function loadCoupons() {
  couponLoading.value = true
  try {
    couponList.value = await getCoupons({
      keyword: couponSearchForm.keyword || undefined,
      isEnabled: couponSearchForm.isEnabled === null ? undefined : couponSearchForm.isEnabled,
    })
  } catch (error: any) {
    message.error(error.message || '加载优惠券失败')
  } finally {
    couponLoading.value = false
  }
}

async function loadReceives() {
  receiveLoading.value = true
  try {
    const res = await getCouponReceives({
      keyword: receiveSearchForm.keyword || undefined,
      couponId: receiveSearchForm.couponId || undefined,
      status: receiveSearchForm.status || undefined,
      page: receivePagination.page,
      pageSize: receivePagination.pageSize,
    })
    receiveList.value = res.data
    receivePagination.itemCount = res.meta.total
  } catch (error: any) {
    message.error(error.message || '加载发放记录失败')
  } finally {
    receiveLoading.value = false
  }
}

async function loadCustomers() {
  try {
    const res: any = await getCustomers()
    const list = Array.isArray(res) ? res : (res?.data || [])
    customerOptions.value = list.map((item: any) => ({
      label: `${item.name}${item.code ? ` (${item.code})` : ''}`,
      value: item.id,
    }))
  } catch (error: any) {
    message.error(error.message || '加载客户列表失败')
  }
}

function resetCouponForm() {
  editingCouponId.value = null
  couponForm.name = ''
  couponForm.code = ''
  couponForm.thresholdAmount = 0
  couponForm.discountAmount = 10
  couponForm.totalCount = null
  couponForm.perLimit = 1
  couponForm.startTime = null
  couponForm.endTime = null
  couponForm.description = ''
  couponForm.sort = 0
  couponForm.isEnabled = true
}

function handleCreate() {
  resetCouponForm()
  couponDialogVisible.value = true
}

function handleEdit(row: CouponItem) {
  editingCouponId.value = row.id
  couponForm.name = row.name
  couponForm.code = row.code
  couponForm.thresholdAmount = Number(row.thresholdAmount)
  couponForm.discountAmount = Number(row.discountAmount)
  couponForm.totalCount = row.totalCount
  couponForm.perLimit = row.perLimit
  couponForm.startTime = new Date(row.startTime).getTime()
  couponForm.endTime = new Date(row.endTime).getTime()
  couponForm.description = row.description || ''
  couponForm.sort = row.sort
  couponForm.isEnabled = row.isEnabled
  couponDialogVisible.value = true
}

function handleOpenIssue(row: CouponItem) {
  issueCouponId.value = row.id
  issueForm.customerIds = []
  issueForm.remark = ''
  issueDialogVisible.value = true
}

function handleDelete(row: CouponItem) {
  dialog.warning({
    title: '删除确认',
    content: `确定删除优惠券 "${row.name}" 吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await deleteCoupon(row.id)
        message.success('删除成功')
        await loadCoupons()
      } catch (error: any) {
        message.error(error.message || '删除失败')
      }
    },
  })
}

async function handleSubmitCoupon() {
  await couponFormRef.value?.validate()

  couponSubmitting.value = true
  try {
    const payload: CouponPayload = {
      name: couponForm.name,
      code: couponForm.code || undefined,
      type: 'CASH',
      thresholdAmount: couponForm.thresholdAmount,
      discountAmount: couponForm.discountAmount,
      totalCount: couponForm.totalCount,
      perLimit: couponForm.perLimit,
      startTime: new Date(couponForm.startTime as number).toISOString(),
      endTime: new Date(couponForm.endTime as number).toISOString(),
      description: couponForm.description || undefined,
      sort: couponForm.sort,
      isEnabled: couponForm.isEnabled,
    }

    if (editingCouponId.value) {
      await updateCoupon(editingCouponId.value, payload)
      message.success('更新成功')
    } else {
      await createCoupon(payload)
      message.success('创建成功')
    }

    couponDialogVisible.value = false
    await loadCoupons()
  } catch (error: any) {
    message.error(error.message || '保存失败')
  } finally {
    couponSubmitting.value = false
  }
}

async function handleSubmitIssue() {
  await issueFormRef.value?.validate()
  if (!issueCouponId.value) {
    return
  }

  issueSubmitting.value = true
  try {
    const res = await issueCoupon(issueCouponId.value, {
      customerIds: issueForm.customerIds,
      remark: issueForm.remark || undefined,
    })
    message.success(res.message || '发放成功')
    issueDialogVisible.value = false
    await Promise.all([loadCoupons(), loadReceives()])
  } catch (error: any) {
    message.error(error.message || '发放失败')
  } finally {
    issueSubmitting.value = false
  }
}

function handleCouponSearch() {
  loadCoupons()
}

function handleCouponReset() {
  couponSearchForm.keyword = ''
  couponSearchForm.isEnabled = null
  loadCoupons()
}

function handleReceiveSearch() {
  receivePagination.page = 1
  loadReceives()
}

function handleReceiveReset() {
  receiveSearchForm.keyword = ''
  receiveSearchForm.couponId = null
  receiveSearchForm.status = null
  receivePagination.page = 1
  loadReceives()
}

function formatMoney(value: number | string) {
  return Number(value || 0).toFixed(2)
}

function formatDateTime(value: string) {
  return value ? new Date(value).toLocaleString('zh-CN') : '-'
}

onMounted(async () => {
  await Promise.all([loadCoupons(), loadReceives(), loadCustomers()])
})
</script>
