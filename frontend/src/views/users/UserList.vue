<template>
  <div class="user-list">
    <n-card class="bg-container transition-theme">
      <template #header>
        <div class="flex justify-between items-center">
          <span class="text-base-text">用户列表</span>
          <n-button type="primary" @click="handleCreate">新增用户</n-button>
        </div>
      </template>

      <n-data-table
        :columns="columns"
        :data="users"
        :loading="loading"
        striped
      />

      <div class="mt-4 flex justify-end">
        <n-pagination
          v-model:page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :item-count="pagination.total"
          show-size-picker
          @update:page="fetchUsers"
          @update:page-size="handlePageSizeChange"
        />
      </div>
    </n-card>

    <!-- 新增/编辑弹窗 -->
    <n-modal
      v-model:show="dialogVisible"
      :title="isEdit ? '编辑用户' : '新增用户'"
      preset="card"
      style="width: 500px"
    >
      <n-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
      >
        <n-form-item label="用户名" path="username">
          <n-input v-model:value="form.username" :disabled="isEdit" />
        </n-form-item>
        <n-form-item label="邮箱" path="email">
          <n-input v-model:value="form.email" />
        </n-form-item>
        <n-form-item label="密码" path="password" v-if="!isEdit">
          <n-input v-model:value="form.password" type="password" show-password-on="click" />
        </n-form-item>
        <n-form-item label="姓名" path="name">
          <n-input v-model:value="form.name" />
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
import { NButton, NSpace } from 'naive-ui'
import dayjs from 'dayjs'
import { getUsers, createUser, deleteUser } from '@/api/user'
import type { User, CreateUserDto } from '@/types'

const message = useMessage()
const dialog = useDialog()
const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const users = ref<User[]>([])
const formRef = ref<FormInst>()
const currentUserId = ref<number>()

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const form = reactive<CreateUserDto>({
  username: '',
  email: '',
  password: '',
  name: ''
})

const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, message: '用户名至少3位', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ]
}

// 表格列定义
const createColumns = (): DataTableColumns<User> => {
  return [
    { title: 'ID', key: 'id', width: 80 },
    { title: '用户名', key: 'username' },
    {
      title: '邮箱',
      key: 'email',
      render: (row) => row.email || '-'
    },
    {
      title: '姓名',
      key: 'name',
      render: (row) => row.name || '-'
    },
    {
      title: '创建时间',
      key: 'createdAt',
      render: (row) => formatDate(row.createdAt)
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

const fetchUsers = async () => {
  loading.value = true
  try {
    const res = await getUsers({
      page: pagination.page,
      pageSize: pagination.pageSize
    })
    users.value = res.items
    pagination.total = res.total
  } catch (error) {
    message.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

const handlePageSizeChange = (pageSize: number) => {
  pagination.pageSize = pageSize
  pagination.page = 1
  fetchUsers()
}

const formatDate = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

const handleCreate = () => {
  isEdit.value = false
  form.username = ''
  form.email = ''
  form.password = ''
  form.name = ''
  dialogVisible.value = true
}

const handleEdit = (user: User) => {
  isEdit.value = true
  currentUserId.value = user.id
  form.username = user.username
  form.email = user.email || ''
  form.name = user.name || ''
  form.password = ''
  dialogVisible.value = true
}

const handleDelete = (user: User) => {
  dialog.warning({
    title: '提示',
    content: '确定要删除该用户吗?',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await deleteUser(user.id)
        message.success('删除成功')
        fetchUsers()
      } catch (error) {
        message.error('删除失败')
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
        if (isEdit.value) {
          // 编辑
          message.info('编辑功能待实现')
        } else {
          // 新增
          await createUser(form)
          message.success('创建成功')
        }
        dialogVisible.value = false
        fetchUsers()
      } catch (error) {
        message.error('操作失败')
      } finally {
        submitLoading.value = false
      }
    }
  })
}

onMounted(() => {
  fetchUsers()
})
</script>
