<template>
  <div class="p-4 warehouse-list">
    <n-card class="mb-4 bg-container transition-theme" content-style="padding-bottom: 0;">
      <QueryForm :model="searchForm" class="mb-4">
        <n-form-item label="仓库名称">
          <n-input v-model:value="searchForm.name" placeholder="请输入仓库名称" clearable />
        </n-form-item>
        <n-form-item label="仓库编码">
          <n-input v-model:value="searchForm.code" placeholder="请输入仓库编码" clearable />
        </n-form-item>
        <n-form-item label="启用状态">
          <n-select v-model:value="searchForm.isEnabled" :options="statusOptions" placeholder="全部状态" clearable />
        </n-form-item>
        <n-form-item>
          <n-space>
            <n-button type="primary" @click="handleSearch">查询</n-button>
            <n-button @click="handleReset">重置</n-button>
          </n-space>
        </n-form-item>
      </QueryForm>
    </n-card>

    <n-card class="bg-container transition-theme">
      <div class="page-toolbar mb-4">
        <n-button type="primary" @click="handleCreate">新增仓库</n-button>
      </div>
      <n-data-table
        :columns="columns"
        :data="warehouses"
        :loading="loading"
        :scroll-x="tableScrollX"
        striped
      />
    </n-card>

    <!-- 新增/编辑弹窗 -->
    <SmartFormContainer
      v-model:show="dialogVisible"
      :title="isEdit ? '编辑仓库' : '新增仓库'"
      :form-item-count="7"
      modal-width="500px"
      :drawer-width="680"
    >
      <n-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
      >
        <n-form-item label="仓库名称" path="name">
          <n-input v-model:value="form.name" placeholder="请输入仓库名称" />
        </n-form-item>
        <n-form-item label="仓库编码" path="code">
          <n-input v-model:value="form.code" placeholder="请输入仓库编码" :disabled="isEdit" />
        </n-form-item>
        <n-form-item label="仓库地址" path="address">
          <n-input v-model:value="form.address" placeholder="请输入仓库地址" />
        </n-form-item>
        <n-form-item label="联系人" path="contact">
          <n-input v-model:value="form.contact" placeholder="请输入联系人" />
        </n-form-item>
        <n-form-item label="联系电话" path="phone">
          <n-input v-model:value="form.phone" placeholder="请输入联系电话" />
        </n-form-item>
        <n-form-item label="默认仓库" path="isDefault">
          <n-switch v-model:value="form.isDefault" />
        </n-form-item>
        <n-form-item label="启用状态" path="isEnabled">
          <n-switch v-model:value="form.isEnabled" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="dialogVisible = false">取消</n-button>
          <n-button type="primary" :loading="submitLoading" @click="handleSubmit">
            确定
          </n-button>
        </n-space>
      </template>
    </SmartFormContainer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, h } from 'vue'
import type { DataTableColumns, FormInst, FormRules } from 'naive-ui'
import { useMessage, useDialog } from 'naive-ui'
import { NButton, NSpace, NSelect, NSwitch, NTag } from 'naive-ui'
import QueryForm from '@/components/common/QueryForm.vue'
import SmartFormContainer from '@/components/common/SmartFormContainer.vue'
import { getWarehouses, createWarehouse, updateWarehouse, deleteWarehouse } from '@/api/warehouse'
import type { Warehouse, CreateWarehouseDto } from '@/types/basic-data'
import { autoFitTableColumns, createActionColumn, getTableScrollX } from '@/utils/table'

const message = useMessage()
const dialog = useDialog()
const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const warehouses = ref<Warehouse[]>([])
const allWarehouses = ref<Warehouse[]>([])
const statusUpdatingIds = ref<number[]>([])
const formRef = ref<FormInst>()
const currentId = ref<number>()
const searchForm = reactive<{
  name: string
  code: string
  isEnabled: 'enabled' | 'disabled' | null
}>({
  name: '',
  code: '',
  isEnabled: null
})
const statusOptions = [
  { label: '启用', value: 'enabled' },
  { label: '禁用', value: 'disabled' }
]

const form = reactive<CreateWarehouseDto & { isEnabled: boolean }>({
  name: '',
  code: '',
  address: '',
  contact: '',
  phone: '',
  isDefault: false,
  isEnabled: true
})

const rules: FormRules = {
  name: [
    { required: true, message: '请输入仓库名称', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入仓库编码', trigger: 'blur' }
  ]
}

const createColumns = (): DataTableColumns<Warehouse> => {
  return autoFitTableColumns([
    { title: 'ID', key: 'id' },
    { title: '仓库名称', key: 'name' },
    { title: '仓库编码', key: 'code' },
    {
      title: '地址',
      key: 'address',
      ellipsis: { tooltip: true },
      render: (row) => row.address || '-'
    },
    {
      title: '联系人',
      key: 'contact',
      render: (row) => row.contact || '-'
    },
    {
      title: '电话',
      key: 'phone',
      render: (row) => row.phone || '-'
    },
    {
      title: '默认',
      key: 'isDefault',
      render: (row) => {
        if (row.isDefault) {
          return h(NTag, { type: 'success', size: 'small' }, { default: () => '是' })
        }
        return h(NTag, { type: 'default', size: 'small' }, { default: () => '否' })
      }
    },
    {
      title: '状态',
      key: 'isEnabled',
      render: (row) => {
        return h(NSwitch, {
          value: row.isEnabled,
          loading: statusUpdatingIds.value.includes(row.id),
          onUpdateValue: (value: boolean) => handleToggleStatus(row, value)
        })
      }
    },
    createActionColumn<Warehouse>({
      title: '操作',
      key: 'actions',
      render: (row) => {
        return h(NSpace, null, {
          default: () => [
            h(NButton, {
              text: true,
              type: 'primary',
              onClick: () => handleEdit(row)
            }, { default: () => '编辑' }),
            h(NButton, {
              text: true,
              type: 'error',
              onClick: () => handleDelete(row)
            }, { default: () => '删除' })
          ]
        })
      }
    }, 2)
  ])
}

const columns = createColumns()
const tableScrollX = getTableScrollX(columns)

const applyFilters = () => {
  const name = searchForm.name.trim().toLowerCase()
  const code = searchForm.code.trim().toLowerCase()

  warehouses.value = allWarehouses.value.filter(warehouse => {
    const matchName = !name || warehouse.name.toLowerCase().includes(name)
    const matchCode = !code || warehouse.code.toLowerCase().includes(code)
    const matchStatus = searchForm.isEnabled === null
      || (searchForm.isEnabled === 'enabled' ? warehouse.isEnabled : !warehouse.isEnabled)
    return matchName && matchCode && matchStatus
  })
}

const fetchWarehouses = async () => {
  loading.value = true
  try {
    allWarehouses.value = await getWarehouses()
    applyFilters()
  } catch (error) {
    message.error('获取仓库列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  applyFilters()
}

const handleReset = async () => {
  searchForm.name = ''
  searchForm.code = ''
  searchForm.isEnabled = null
  await fetchWarehouses()
}

const handleToggleStatus = async (warehouse: Warehouse, isEnabled: boolean) => {
  statusUpdatingIds.value = [...statusUpdatingIds.value, warehouse.id]
  try {
    await updateWarehouse(warehouse.id, { isEnabled })
    message.success(`${warehouse.name}已${isEnabled ? '启用' : '禁用'}`)
    await fetchWarehouses()
  } catch (error: any) {
    message.error(error.message || '状态更新失败')
  } finally {
    statusUpdatingIds.value = statusUpdatingIds.value.filter(id => id !== warehouse.id)
  }
}

const handleCreate = () => {
  isEdit.value = false
  form.name = ''
  form.code = ''
  form.address = ''
  form.contact = ''
  form.phone = ''
  form.isDefault = false
  form.isEnabled = true
  dialogVisible.value = true
}

const handleEdit = (warehouse: Warehouse) => {
  isEdit.value = true
  currentId.value = warehouse.id
  form.name = warehouse.name
  form.code = warehouse.code
  form.address = warehouse.address || ''
  form.contact = warehouse.contact || ''
  form.phone = warehouse.phone || ''
  form.isDefault = warehouse.isDefault
  form.isEnabled = warehouse.isEnabled
  dialogVisible.value = true
}

const handleDelete = (warehouse: Warehouse) => {
  dialog.warning({
    title: '提示',
    content: `确定要删除 "${warehouse.name}" 吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await deleteWarehouse(warehouse.id)
        message.success('删除成功')
        fetchWarehouses()
      } catch (error: any) {
        message.error(error.message || '删除失败')
      }
    }
  })
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (errors) => {
    if (!errors) {
      submitLoading.value = true
      try {
        if (isEdit.value && currentId.value) {
          await updateWarehouse(currentId.value, form)
          message.success('更新成功')
        } else {
          await createWarehouse(form)
          message.success('创建成功')
        }
        dialogVisible.value = false
        fetchWarehouses()
      } catch (error: any) {
        message.error(error.message || '操作失败')
      } finally {
        submitLoading.value = false
      }
    }
  })
}

onMounted(() => {
  fetchWarehouses()
})
</script>
