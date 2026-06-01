<template>
  <div class="p-4 user-list">
    <n-card class="mb-4 bg-container transition-theme">
      <div class="page-toolbar">
        <n-button type="primary" @click="handleCreate">新增用户</n-button>
      </div>
    </n-card>

    <n-card class="bg-container transition-theme">
      <n-data-table
        :columns="columns"
        :data="users"
        :loading="loading"
        :scroll-x="tableScrollX"
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
          <n-input v-model:value="form.username" :disabled="isEdit" autocomplete="username" />
        </n-form-item>
        <n-form-item label="邮箱" path="email">
          <n-input v-model:value="form.email" autocomplete="email" />
        </n-form-item>
        <n-form-item label="密码" path="password" v-if="!isEdit">
          <n-input v-model:value="form.password" type="password" show-password-on="click" autocomplete="new-password" />
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

    <!-- 分配角色弹窗 -->
    <n-modal
      v-model:show="roleDialogVisible"
      :title="`分配角色${currentUserName ? ` - ${currentUserName}` : ''}`"
      preset="card"
      style="width: 520px"
    >
      <n-spin :show="roleLoading">
        <n-checkbox-group v-model:value="selectedRoleIds">
          <n-space v-if="allRoles.length > 0" vertical>
            <n-checkbox
              v-for="role in allRoles"
              :key="role.id"
              :value="role.id"
              :label="`${role.name}（${role.code}）`"
            />
          </n-space>
          <n-empty v-else description="暂无可分配角色" />
        </n-checkbox-group>
      </n-spin>
      <template #footer>
        <n-space justify="end">
          <n-button @click="roleDialogVisible = false">取消</n-button>
          <n-button type="primary" :loading="roleSubmitLoading" @click="handleSaveRoles">
            保存
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
import { getUsers, createUser, updateUser, deleteUser, getUserRoles, assignUserRoles } from '@/api/user'
import { getRoles } from '@/api/roles'
import type { User, Role, CreateUserDto } from '@/types'
import { autoFitTableColumns, createActionColumn, getTableScrollX } from '@/utils/table'

const message = useMessage()
const dialog = useDialog()
const loading = ref(false)
const submitLoading = ref(false)
const roleLoading = ref(false)
const roleSubmitLoading = ref(false)
const dialogVisible = ref(false)
const roleDialogVisible = ref(false)
const isEdit = ref(false)
const users = ref<User[]>([])
const allRoles = ref<Role[]>([])
const selectedRoleIds = ref<number[]>([])
const formRef = ref<FormInst>()
const currentUserId = ref<number>()
const currentUserName = ref('')

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
  return autoFitTableColumns([
    { title: 'ID', key: 'id' },
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
    createActionColumn<User>({
      title: '操作',
      key: 'actions',
      render: (row) => {
        return h(NSpace, null, {
          default: () => [
            h(NButton, {
              text: true,
              type: 'primary',
              onClick: () => handleAssignRoles(row)
            }, { default: () => '分配角色' }),
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
    }, 3)
  ])
}

const columns = createColumns()
const tableScrollX = getTableScrollX(columns)

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

const handleAssignRoles = async (user: User) => {
  currentUserId.value = user.id
  currentUserName.value = user.name || user.username
  selectedRoleIds.value = []
  roleDialogVisible.value = true
  roleLoading.value = true

  try {
    const [roles, assignedRoles] = await Promise.all([
      getRoles(),
      getUserRoles(user.id)
    ])
    allRoles.value = roles
    selectedRoleIds.value = assignedRoles.map((role) => role.id)
  } catch (error: any) {
    message.error(error.message || '获取角色信息失败')
  } finally {
    roleLoading.value = false
  }
}

const handleSaveRoles = async () => {
  if (!currentUserId.value) return

  roleSubmitLoading.value = true
  try {
    await assignUserRoles(currentUserId.value, selectedRoleIds.value)
    message.success('角色分配成功')
    roleDialogVisible.value = false
    fetchUsers()
  } catch (error: any) {
    message.error(error.message || '角色分配失败')
  } finally {
    roleSubmitLoading.value = false
  }
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
          await updateUser(currentUserId.value!, {
            email: form.email,
            name: form.name
          })
          message.success('更新成功')
        } else {
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
