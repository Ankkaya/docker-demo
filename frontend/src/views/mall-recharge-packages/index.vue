<template>
  <div class="p-4">
    <n-card class="mb-4" content-style="padding-bottom: 0;">
      <QueryForm :model="searchForm">
        <n-form-item label="关键词">
          <n-input v-model:value="searchForm.keyword" placeholder="套餐名称/标签" clearable />
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
          <n-button type="primary" @click="openCreateModal">新增套餐</n-button>
        </n-space>
      </div>
    </n-card>

    <n-card>
      <n-data-table
        :columns="columns"
        :data="tableData"
        :loading="loading"
        :pagination="pagination"
        :row-key="(row: MallRechargePackage) => row.id"
        remote
      />
    </n-card>

    <n-modal v-model:show="modalVisible" preset="card" :title="editingId ? '编辑充值套餐' : '新增充值套餐'" style="width: 820px">
      <n-form ref="formRef" :model="formData" :rules="rules" label-width="110">
        <n-grid :cols="2" :x-gap="16">
          <n-form-item-gi label="套餐名称" path="name">
            <n-input v-model:value="formData.name" placeholder="请输入套餐名称" />
          </n-form-item-gi>
          <n-form-item-gi label="套餐标签" path="tag">
            <n-input v-model:value="formData.tag" placeholder="如：推荐" />
          </n-form-item-gi>
          <n-form-item-gi label="充值金额" path="rechargeAmount">
            <n-input-number v-model:value="formData.rechargeAmount" :min="0.01" :precision="2" class="w-full" />
          </n-form-item-gi>
          <n-form-item-gi label="排序号" path="sort">
            <n-input-number v-model:value="formData.sort" :min="0" :precision="0" class="w-full" />
          </n-form-item-gi>
          <n-form-item-gi label="绑定活动" path="activityIds" span="2">
            <n-select
              v-model:value="formData.activityIds"
              multiple
              filterable
              clearable
              :options="activityOptions"
              placeholder="可选择多个充值活动"
            />
          </n-form-item-gi>
          <n-form-item-gi label="套餐说明" path="description" span="2">
            <n-input v-model:value="formData.description" type="textarea" :rows="3" placeholder="商城端展示说明，可选" />
          </n-form-item-gi>
          <n-form-item-gi label="启用状态" path="isEnabled">
            <n-switch v-model:value="formData.isEnabled" />
          </n-form-item-gi>
          <n-form-item-gi label="备注" path="remark">
            <n-input v-model:value="formData.remark" placeholder="后台备注，可选" />
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
import { computed, h, onMounted, reactive, ref } from 'vue'
import type { DataTableColumns, FormInst, FormRules } from 'naive-ui'
import { NButton, NSpace, NTag, useDialog, useMessage } from 'naive-ui'
import QueryForm from '@/components/common/QueryForm.vue'
import {
  createMallRechargePackage,
  deleteMallRechargePackage,
  getMallRechargePackages,
  updateMallRechargePackage,
} from '@/api/mall-recharge-package'
import { getMallRechargeActivities } from '@/api/mall-recharge-activity'
import type { MallRechargeActivity } from '@/types/mall-recharge-activity'
import type { MallRechargePackage } from '@/types/mall-recharge-package'

const message = useMessage()
const dialog = useDialog()
const formRef = ref<FormInst | null>(null)
const loading = ref(false)
const submitting = ref(false)
const modalVisible = ref(false)
const editingId = ref<number | null>(null)
const tableData = ref<MallRechargePackage[]>([])
const activityList = ref<MallRechargeActivity[]>([])

const searchForm = reactive({
  keyword: '',
  isEnabled: null as boolean | null,
})

const formData = reactive({
  name: '',
  rechargeAmount: 100,
  tag: '',
  description: '',
  sort: 0,
  isEnabled: true,
  remark: '',
  activityIds: [] as number[],
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

const activityOptions = computed(() => activityList.value.map(item => ({
  label: `${item.name}（赠送 ${formatAmount(item.bonusAmount)}）`,
  value: item.id,
})))

const rules: FormRules = {
  name: [{ required: true, message: '请输入套餐名称', trigger: 'blur' }],
  rechargeAmount: [{ required: true, type: 'number', message: '请输入充值金额', trigger: 'change' }],
}

const columns: DataTableColumns<MallRechargePackage> = [
  { title: '套餐名称', key: 'name', width: 160 },
  {
    title: '充值金额',
    key: 'rechargeAmount',
    width: 120,
    render: row => `¥${formatAmount(row.rechargeAmount)}`,
  },
  {
    title: '标签',
    key: 'tag',
    width: 100,
    render: row => row.tag ? h(NTag, { type: 'warning', size: 'small' }, { default: () => row.tag || '' }) : '-',
  },
  {
    title: '绑定活动',
    key: 'activities',
    render: row => row.activities?.length
      ? row.activities.map(item => item.name).join(' / ')
      : '未绑定',
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
    const res = await getMallRechargePackages({
      keyword: searchForm.keyword || undefined,
      isEnabled: searchForm.isEnabled === null ? undefined : searchForm.isEnabled,
      page: pagination.page,
      pageSize: pagination.pageSize,
    })
    tableData.value = res.data
    pagination.itemCount = res.meta.total
  } catch (error: any) {
    message.error(error.message || '加载充值套餐失败')
  } finally {
    loading.value = false
  }
}

async function loadActivities() {
  try {
    const res = await getMallRechargeActivities({ page: 1, pageSize: 100 })
    activityList.value = res.data
  } catch (error: any) {
    activityList.value = []
    message.error(error.message || '加载充值活动失败')
  }
}

function resetForm() {
  editingId.value = null
  formData.name = ''
  formData.rechargeAmount = 100
  formData.tag = ''
  formData.description = ''
  formData.sort = 0
  formData.isEnabled = true
  formData.remark = ''
  formData.activityIds = []
}

function openCreateModal() {
  resetForm()
  modalVisible.value = true
}

function openEditModal(row: MallRechargePackage) {
  editingId.value = row.id
  formData.name = row.name
  formData.rechargeAmount = Number(row.rechargeAmount || 0)
  formData.tag = row.tag || ''
  formData.description = row.description || ''
  formData.sort = row.sort || 0
  formData.isEnabled = row.isEnabled
  formData.remark = row.remark || ''
  formData.activityIds = (row.activities || []).map(item => item.id)
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
      rechargeAmount: formData.rechargeAmount,
      tag: formData.tag || undefined,
      description: formData.description || undefined,
      sort: formData.sort,
      isEnabled: formData.isEnabled,
      remark: formData.remark || undefined,
      activityIds: formData.activityIds,
    }

    if (editingId.value) {
      await updateMallRechargePackage(editingId.value, payload)
      message.success('充值套餐已更新')
    } else {
      await createMallRechargePackage(payload)
      message.success('充值套餐已创建')
    }
    modalVisible.value = false
    loadData()
  } catch (error: any) {
    message.error(error.message || '保存充值套餐失败')
  } finally {
    submitting.value = false
  }
}

function handleDelete(row: MallRechargePackage) {
  dialog.warning({
    title: '删除充值套餐',
    content: `确认删除套餐“${row.name}”吗？`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await deleteMallRechargePackage(row.id)
        message.success('充值套餐已删除')
        loadData()
      } catch (error: any) {
        message.error(error.message || '删除充值套餐失败')
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

onMounted(async () => {
  await Promise.all([loadData(), loadActivities()])
})
</script>
