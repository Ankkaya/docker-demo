<template>
  <div class="customer-list">
    <n-card class="bg-container transition-theme">
      <template #header>
        <div class="flex justify-between items-center">
          <span class="text-base-text">客户管理</span>
          <n-button type="primary" @click="handleCreate">新增客户</n-button>
        </div>
      </template>

      <n-data-table
        :columns="columns"
        :data="customers"
        :loading="loading"
        striped
      />
    </n-card>

    <!-- 新增/编辑弹窗 -->
    <n-modal
      v-model:show="dialogVisible"
      :title="isEdit ? '编辑客户' : '新增客户'"
      preset="card"
      style="width: 600px"
    >
      <n-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <n-form-item label="客户名称" path="name">
          <n-input v-model:value="form.name" placeholder="请输入客户名称" />
        </n-form-item>
        <n-form-item label="客户编码" path="code">
          <n-input v-model:value="form.code" placeholder="请输入客户编码" :disabled="isEdit" />
        </n-form-item>
        <n-form-item label="客户类型" path="type">
          <n-radio-group v-model:value="form.type">
            <n-radio-button value="INDIVIDUAL">个人</n-radio-button>
            <n-radio-button value="COMPANY">企业</n-radio-button>
          </n-radio-group>
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
        <n-form-item label="关联用户" path="userId">
          <n-input-number v-model:value="form.userId" :min="1" style="width: 100%" placeholder="输入系统用户ID（可选）" />
        </n-form-item>
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
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, h } from 'vue'
import type { DataTableColumns, FormInst, FormRules } from 'naive-ui'
import { useMessage, useDialog } from 'naive-ui'
import { NButton, NSpace, NSwitch, NTag } from 'naive-ui'
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '@/api/customer'
import type { Customer, CreateCustomerDto, CustomerType } from '@/types/basic-data'

const message = useMessage()
const dialog = useDialog()
const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const customers = ref<Customer[]>([])
const formRef = ref<FormInst>()
const currentId = ref<number>()

const form = reactive<CreateCustomerDto & { isEnabled: boolean }>({
  name: '',
  code: '',
  type: 'INDIVIDUAL' as CustomerType,
  contact: '',
  phone: '',
  email: '',
  address: '',
  creditLimit: undefined,
  period: 0,
  remark: '',
  userId: undefined,
  isEnabled: true
})

const rules: FormRules = {
  name: [
    { required: true, message: '请输入客户名称', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入客户编码', trigger: 'blur' }
  ]
}

const createColumns = (): DataTableColumns<Customer> => {
  return [
    { title: '客户名称', key: 'name' },
    { title: '客户编码', key: 'code' },
    {
      title: '类型',
      key: 'type',
      width: 100,
      render: (row) => {
        const typeMap = {
          INDIVIDUAL: { label: '个人', type: 'default' },
          COMPANY: { label: '企业', type: 'info' }
        }
        const { label, type } = typeMap[row.type]
        return h(NTag, { type: type as any, size: 'small' }, { default: () => label })
      }
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
      width: 100,
      render: (row) => {
        return h(NSwitch, {
          value: row.isEnabled,
          disabled: true
        })
      }
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
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
    }
  ]
}

const columns = createColumns()

const fetchCustomers = async () => {
  loading.value = true
  try {
    customers.value = await getCustomers()
  } catch (error) {
    message.error('获取客户列表失败')
  } finally {
    loading.value = false
  }
}

const handleCreate = () => {
  isEdit.value = false
  form.name = ''
  form.code = ''
  form.type = 'INDIVIDUAL'
  form.contact = ''
  form.phone = ''
  form.email = ''
  form.address = ''
  form.creditLimit = undefined
  form.period = 0
  form.remark = ''
  form.userId = undefined
  form.isEnabled = true
  dialogVisible.value = true
}

const handleEdit = (customer: Customer) => {
  isEdit.value = true
  currentId.value = customer.id
  form.name = customer.name
  form.code = customer.code
  form.type = customer.type
  form.contact = customer.contact || ''
  form.phone = customer.phone || ''
  form.email = customer.email || ''
  form.address = customer.address || ''
  form.creditLimit = customer.creditLimit ?? undefined
  form.period = customer.period
  form.remark = customer.remark || ''
  form.userId = customer.userId
  form.isEnabled = customer.isEnabled
  dialogVisible.value = true
}

const handleDelete = (customer: Customer) => {
  dialog.warning({
    title: '提示',
    content: `确定要删除 "${customer.name}" 吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await deleteCustomer(customer.id)
        message.success('删除成功')
        fetchCustomers()
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
        if (data.userId === undefined || data.userId === null) {
          delete data.userId
        }
        if (isEdit.value && currentId.value) {
          await updateCustomer(currentId.value, data)
          message.success('更新成功')
        } else {
          await createCustomer(data)
          message.success('创建成功')
        }
        dialogVisible.value = false
        fetchCustomers()
      } catch (error: any) {
        message.error(error.message || '操作失败')
      } finally {
        submitLoading.value = false
      }
    }
  })
}

onMounted(() => {
  fetchCustomers()
})
</script>
