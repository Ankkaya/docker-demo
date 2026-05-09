<template>
  <div class="p-4 supplier-list">
    <n-card class="mb-4 bg-container transition-theme" content-style="padding-bottom: 0;">
      <QueryForm :model="searchForm" @search="handleSearch" class="mb-4">
        <n-form-item label="供应商名称">
          <n-input v-model:value="searchForm.name" placeholder="请输入供应商名称" clearable />
        </n-form-item>
        <n-form-item label="供应商编码">
          <n-input v-model:value="searchForm.code" placeholder="请输入供应商编码" clearable />
        </n-form-item>
        <n-form-item label="联系人">
          <n-input v-model:value="searchForm.contact" placeholder="请输入联系人" clearable />
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

    <n-card class="mb-4 bg-container transition-theme">
      <div class="page-toolbar">
        <n-button type="primary" @click="handleCreate">新增供应商</n-button>
      </div>
    </n-card>

    <n-card class="bg-container transition-theme">
      <n-data-table
        :columns="columns"
        :data="suppliers"
        :loading="loading"
        :scroll-x="tableScrollX"
        striped
      />
    </n-card>

    <!-- 新增/编辑弹窗 -->
    <SmartFormContainer
      v-model:show="dialogVisible"
      :title="isEdit ? '编辑供应商' : '新增供应商'"
      :form-item-count="12"
      modal-width="600px"
      :drawer-width="760"
    >
      <n-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <n-form-item label="供应商名称" path="name">
          <n-input v-model:value="form.name" placeholder="请输入供应商名称" />
        </n-form-item>
        <n-form-item label="供应商编码" path="code">
          <n-input v-model:value="form.code" placeholder="请输入供应商编码" :disabled="isEdit" />
        </n-form-item>
        <n-row :gutter="16">
          <n-col :span="12">
            <n-form-item label="联系人" path="contact">
              <n-input v-model:value="form.contact" placeholder="请输入联系人" />
            </n-form-item>
          </n-col>
          <n-col :span="12">
            <n-form-item label="联系电话" path="phone">
              <n-input v-model:value="form.phone" placeholder="请输入联系电话" />
            </n-form-item>
          </n-col>
        </n-row>
        <n-form-item label="邮箱" path="email">
          <n-input v-model:value="form.email" placeholder="请输入邮箱" />
        </n-form-item>
        <n-form-item label="地址" path="address">
          <n-input v-model:value="form.address" placeholder="请输入地址" />
        </n-form-item>
        <n-row :gutter="16">
          <n-col :span="12">
            <n-form-item label="开户行" path="bankName">
              <n-input v-model:value="form.bankName" placeholder="请输入开户行" />
            </n-form-item>
          </n-col>
          <n-col :span="12">
            <n-form-item label="银行账号" path="bankAccount">
              <n-input v-model:value="form.bankAccount" placeholder="请输入银行账号" />
            </n-form-item>
          </n-col>
        </n-row>
        <n-form-item label="税号" path="taxNo">
          <n-input v-model:value="form.taxNo" placeholder="请输入税号" />
        </n-form-item>
        <n-row :gutter="16">
          <n-col :span="12">
            <n-form-item label="信用额度" path="creditLimit">
              <n-input-number v-model:value="form.creditLimit" :min="0" style="width: 100%" placeholder="0" />
            </n-form-item>
          </n-col>
          <n-col :span="12">
            <n-form-item label="账期(天)" path="period">
              <n-input-number v-model:value="form.period" :min="0" style="width: 100%" />
            </n-form-item>
          </n-col>
        </n-row>
        <n-form-item label="备注" path="remark">
          <n-input v-model:value="form.remark" type="textarea" placeholder="请输入备注" />
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
import { NButton, NSpace, NSelect, NSwitch } from 'naive-ui'
import QueryForm from '@/components/common/QueryForm.vue'
import SmartFormContainer from '@/components/common/SmartFormContainer.vue'
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '@/api/supplier'
import type { Supplier, CreateSupplierDto } from '@/types/basic-data'
import { autoFitTableColumns, createActionColumn, getTableScrollX } from '@/utils/table'

const message = useMessage()
const dialog = useDialog()
const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const suppliers = ref<Supplier[]>([])
const allSuppliers = ref<Supplier[]>([])
const statusUpdatingIds = ref<number[]>([])
const formRef = ref<FormInst>()
const currentId = ref<number>()
const searchForm = reactive<{
  name: string
  code: string
  contact: string
  isEnabled: 'enabled' | 'disabled' | null
}>({
  name: '',
  code: '',
  contact: '',
  isEnabled: null
})
const statusOptions = [
  { label: '启用', value: 'enabled' },
  { label: '禁用', value: 'disabled' }
]

const form = reactive<CreateSupplierDto & { isEnabled: boolean }>({
  name: '',
  code: '',
  contact: '',
  phone: '',
  email: '',
  address: '',
  bankName: '',
  bankAccount: '',
  taxNo: '',
  creditLimit: undefined,
  period: 30,
  remark: '',
  isEnabled: true
})

const rules: FormRules = {
  name: [
    { required: true, message: '请输入供应商名称', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入供应商编码', trigger: 'blur' }
  ]
}

const createColumns = (): DataTableColumns<Supplier> => {
  return autoFitTableColumns([
    { title: '供应商名称', key: 'name' },
    { title: '供应商编码', key: 'code' },
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
      title: '信用额度',
      key: 'creditLimit',
      render: (row) => row.creditLimit?.toLocaleString() || '-'
    },
    {
      title: '账期',
      key: 'period',
      render: (row) => `${row.period}天`
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
    createActionColumn<Supplier>({
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
  const contact = searchForm.contact.trim().toLowerCase()

  suppliers.value = allSuppliers.value.filter(supplier => {
    const matchName = !name || supplier.name.toLowerCase().includes(name)
    const matchCode = !code || supplier.code.toLowerCase().includes(code)
    const matchContact = !contact || (supplier.contact || '').toLowerCase().includes(contact)
    const matchStatus = searchForm.isEnabled === null
      || (searchForm.isEnabled === 'enabled' ? supplier.isEnabled : !supplier.isEnabled)
    return matchName && matchCode && matchContact && matchStatus
  })
}

const fetchSuppliers = async () => {
  loading.value = true
  try {
    allSuppliers.value = await getSuppliers()
    applyFilters()
  } catch (error) {
    message.error('获取供应商列表失败')
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
  searchForm.contact = ''
  searchForm.isEnabled = null
  await fetchSuppliers()
}

const handleToggleStatus = async (supplier: Supplier, isEnabled: boolean) => {
  statusUpdatingIds.value = [...statusUpdatingIds.value, supplier.id]
  try {
    await updateSupplier(supplier.id, { isEnabled })
    message.success(`${supplier.name}已${isEnabled ? '启用' : '禁用'}`)
    await fetchSuppliers()
  } catch (error: any) {
    message.error(error.message || '状态更新失败')
  } finally {
    statusUpdatingIds.value = statusUpdatingIds.value.filter(id => id !== supplier.id)
  }
}

const handleCreate = () => {
  isEdit.value = false
  form.name = ''
  form.code = ''
  form.contact = ''
  form.phone = ''
  form.email = ''
  form.address = ''
  form.bankName = ''
  form.bankAccount = ''
  form.taxNo = ''
  form.creditLimit = undefined
  form.period = 30
  form.remark = ''
  form.isEnabled = true
  dialogVisible.value = true
}

const handleEdit = (supplier: Supplier) => {
  isEdit.value = true
  currentId.value = supplier.id
  form.name = supplier.name
  form.code = supplier.code
  form.contact = supplier.contact || ''
  form.phone = supplier.phone || ''
  form.email = supplier.email || ''
  form.address = supplier.address || ''
  form.bankName = supplier.bankName || ''
  form.bankAccount = supplier.bankAccount || ''
  form.taxNo = supplier.taxNo || ''
  form.creditLimit = supplier.creditLimit ?? undefined
  form.period = supplier.period
  form.remark = supplier.remark || ''
  form.isEnabled = supplier.isEnabled
  dialogVisible.value = true
}

const handleDelete = (supplier: Supplier) => {
  dialog.warning({
    title: '提示',
    content: `确定要删除 "${supplier.name}" 吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await deleteSupplier(supplier.id)
        message.success('删除成功')
        fetchSuppliers()
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
        const data = { ...form }
        if (data.creditLimit === undefined || data.creditLimit === null) {
          delete data.creditLimit
        }
        if (isEdit.value && currentId.value) {
          await updateSupplier(currentId.value, data)
          message.success('更新成功')
        } else {
          await createSupplier(data)
          message.success('创建成功')
        }
        dialogVisible.value = false
        fetchSuppliers()
      } catch (error: any) {
        message.error(error.message || '操作失败')
      } finally {
        submitLoading.value = false
      }
    }
  })
}

onMounted(() => {
  fetchSuppliers()
})
</script>
