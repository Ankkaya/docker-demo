<template>
  <div class="p-4">
    <n-card class="mb-4" content-style="padding-bottom: 0;">
      <QueryForm :model="searchForm">
        <n-form-item label="关键词">
          <n-input v-model:value="searchForm.keyword" placeholder="活动名称/标签" clearable />
        </n-form-item>
        <n-form-item label="状态">
          <n-select v-model:value="searchForm.isEnabled" :options="enabledOptions" placeholder="全部状态" clearable />
        </n-form-item>
        <n-form-item>
          <n-space>
            <n-button type="primary" @click="handleSearch">查询</n-button>
            <n-button @click="handleReset">重置</n-button>
          </n-space>
        </n-form-item>
      </QueryForm>
    </n-card>

    <n-card class="mb-4">
      <div>
        <n-space>
          <n-button type="primary" @click="openCreateModal">新增活动</n-button>
        </n-space>
      </div>
    </n-card>

    <n-card>
      <n-data-table
        :columns="columns"
        :data="tableData"
        :loading="loading"
        :pagination="pagination"
        :row-key="(row: MallRechargeActivity) => row.id"
        remote
      />
    </n-card>

    <n-modal v-model:show="modalVisible" preset="card" :title="editingId ? '编辑充值活动' : '新增充值活动'" style="width: 760px">
      <n-form ref="formRef" :model="formData" :rules="rules" label-width="110">
        <n-grid :cols="2" :x-gap="16">
          <n-form-item-gi label="活动名称" path="name">
            <n-input v-model:value="formData.name" placeholder="请输入活动名称" />
          </n-form-item-gi>
          <n-form-item-gi label="活动标签" path="tag">
            <n-input v-model:value="formData.tag" placeholder="如：限时加赠" />
          </n-form-item-gi>
          <n-form-item-gi label="赠送金额" path="bonusAmount">
            <n-input-number v-model:value="formData.bonusAmount" :min="0" :precision="2" class="w-full" />
          </n-form-item-gi>
          <n-form-item-gi label="排序号" path="sort">
            <n-input-number v-model:value="formData.sort" :min="0" :precision="0" class="w-full" />
          </n-form-item-gi>
          <n-form-item-gi label="开始时间" path="startTime">
            <n-date-picker v-model:value="formData.startTime" type="datetime" clearable class="w-full" />
          </n-form-item-gi>
          <n-form-item-gi label="结束时间" path="endTime">
            <n-date-picker v-model:value="formData.endTime" type="datetime" clearable class="w-full" />
          </n-form-item-gi>
          <n-form-item-gi label="仅首充可用" path="firstRechargeOnly">
            <n-switch v-model:value="formData.firstRechargeOnly" />
          </n-form-item-gi>
          <n-form-item-gi label="启用状态" path="isEnabled">
            <n-switch v-model:value="formData.isEnabled" />
          </n-form-item-gi>
          <n-form-item-gi span="2" label="活动说明" path="description">
            <n-input v-model:value="formData.description" type="textarea" :rows="3" placeholder="商城端展示说明，可选" />
          </n-form-item-gi>
          <n-form-item-gi span="2" label="备注" path="remark">
            <n-input v-model:value="formData.remark" type="textarea" :rows="2" placeholder="后台备注，可选" />
          </n-form-item-gi>
        </n-grid>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="modalVisible = false">取消</n-button>
          <n-button type="primary" :loading="submitting" @click="handleSubmit">保存</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { h, onMounted, reactive, ref } from 'vue'
import type { DataTableColumns, FormInst, FormRules } from 'naive-ui'
import { NButton, NSpace, NSwitch, NTag, useDialog, useMessage } from 'naive-ui'
import QueryForm from '@/components/common/QueryForm.vue'
import {
  createMallRechargeActivity,
  deleteMallRechargeActivity,
  getMallRechargeActivities,
  updateMallRechargeActivity,
} from '@/api/mall-recharge-activity'
import type { MallRechargeActivity } from '@/types/mall-recharge-activity'

const message = useMessage()
const dialog = useDialog()
const formRef = ref<FormInst | null>(null)
const loading = ref(false)
const submitting = ref(false)
const modalVisible = ref(false)
const editingId = ref<number | null>(null)
const tableData = ref<MallRechargeActivity[]>([])

const searchForm = reactive({
  keyword: '',
  isEnabled: null as boolean | null,
})

const formData = reactive({
  name: '',
  bonusAmount: 0,
  tag: '',
  description: '',
  startTime: null as number | null,
  endTime: null as number | null,
  sort: 0,
  isEnabled: true,
  firstRechargeOnly: false,
  remark: '',
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

const enabledOptions = [
  { label: '启用', value: true },
  { label: '停用', value: false },
]

const rules: FormRules = {
  name: [{ required: true, message: '请输入活动名称', trigger: 'blur' }],
  bonusAmount: [{ required: true, type: 'number', message: '请输入赠送金额', trigger: 'change' }],
  endTime: [{
    validator: () => {
      if (formData.startTime && formData.endTime && formData.endTime <= formData.startTime) {
        return new Error('结束时间必须晚于开始时间')
      }
      return true
    },
    trigger: 'change',
  }],
}

const columns: DataTableColumns<MallRechargeActivity> = [
  { title: '活动名称', key: 'name', width: 180 },
  {
    title: '赠送规则',
    key: 'bonusAmount',
    width: 180,
    render: row => `赠送 ${formatAmount(row.bonusAmount)}`,
  },
  {
    title: '标签',
    key: 'tag',
    width: 110,
    render: row => row.tag ? h(NTag, { type: 'warning', size: 'small' }, { default: () => row.tag || '' }) : '-',
  },
  {
    title: '限制',
    key: 'firstRechargeOnly',
    width: 110,
    render: row => row.firstRechargeOnly ? '仅首充' : '不限',
  },
  {
    title: '有效期',
    key: 'dateRange',
    width: 280,
    render: row => `${formatDateTime(row.startTime)} ~ ${formatDateTime(row.endTime)}`,
  },
  {
    title: '状态',
    key: 'isEnabled',
    width: 100,
    render: row => h(
      NTag,
      { type: row.isEnabled ? 'success' : 'default', size: 'small' },
      { default: () => row.isEnabled ? '启用' : '停用' },
    ),
  },
  { title: '排序', key: 'sort', width: 80 },
  {
    title: '操作',
    key: 'actions',
    width: 180,
    render: row => h(NSpace, null, {
      default: () => [
        h(NButton, { size: 'small', type: 'primary', onClick: () => openEditModal(row) }, { default: () => '编辑' }),
        h(NButton, { size: 'small', type: 'error', onClick: () => handleDelete(row) }, { default: () => '删除' }),
      ],
    }),
  },
]

async function loadData() {
  loading.value = true
  try {
    const res = await getMallRechargeActivities({
      keyword: searchForm.keyword || undefined,
      isEnabled: searchForm.isEnabled === null ? undefined : searchForm.isEnabled,
      page: pagination.page,
      pageSize: pagination.pageSize,
    })
    tableData.value = res.data
    pagination.itemCount = res.meta.total
  } catch (error: any) {
    message.error(error.message || '加载充值活动失败')
  } finally {
    loading.value = false
  }
}

function resetForm() {
  editingId.value = null
  formData.name = ''
  formData.bonusAmount = 0
  formData.tag = ''
  formData.description = ''
  formData.startTime = null
  formData.endTime = null
  formData.sort = 0
  formData.isEnabled = true
  formData.firstRechargeOnly = false
  formData.remark = ''
}

function openCreateModal() {
  resetForm()
  modalVisible.value = true
}

function openEditModal(row: MallRechargeActivity) {
  editingId.value = row.id
  formData.name = row.name
  formData.bonusAmount = Number(row.bonusAmount || 0)
  formData.tag = row.tag || ''
  formData.description = row.description || ''
  formData.startTime = row.startTime ? new Date(row.startTime).getTime() : null
  formData.endTime = row.endTime ? new Date(row.endTime).getTime() : null
  formData.sort = row.sort || 0
  formData.isEnabled = row.isEnabled
  formData.firstRechargeOnly = row.firstRechargeOnly
  formData.remark = row.remark || ''
  modalVisible.value = true
}

async function handleSubmit() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  submitting.value = true
  try {
    const payload = {
      name: formData.name,
      bonusAmount: formData.bonusAmount,
      tag: formData.tag || undefined,
      description: formData.description || undefined,
      startTime: formData.startTime ? new Date(formData.startTime).toISOString() : undefined,
      endTime: formData.endTime ? new Date(formData.endTime).toISOString() : undefined,
      sort: formData.sort,
      isEnabled: formData.isEnabled,
      firstRechargeOnly: formData.firstRechargeOnly,
      remark: formData.remark || undefined,
    }

    if (editingId.value) {
      await updateMallRechargeActivity(editingId.value, payload)
      message.success('充值活动已更新')
    } else {
      await createMallRechargeActivity(payload)
      message.success('充值活动已创建')
    }
    modalVisible.value = false
    loadData()
  } catch (error: any) {
    message.error(error.message || '保存充值活动失败')
  } finally {
    submitting.value = false
  }
}

function handleDelete(row: MallRechargeActivity) {
  dialog.warning({
    title: '删除充值活动',
    content: `确认删除活动“${row.name}”吗？`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await deleteMallRechargeActivity(row.id)
        message.success('充值活动已删除')
        loadData()
      } catch (error: any) {
        message.error(error.message || '删除充值活动失败')
      }
    },
  })
}

function handleSearch() {
  pagination.page = 1
  loadData()
}

function handleReset() {
  searchForm.keyword = ''
  searchForm.isEnabled = null
  pagination.page = 1
  loadData()
}

function formatAmount(value?: string | number | null) {
  return Number(value || 0).toFixed(2)
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return '长期有效'
  }
  return new Date(value).toLocaleString('zh-CN')
}

onMounted(loadData)
</script>
