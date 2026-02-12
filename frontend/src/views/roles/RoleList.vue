<template>
  <div class="role-list">
    <n-card class="bg-container transition-theme">
      <template #header>
        <div class="flex justify-between items-center">
          <span class="text-base-text">角色列表</span>
          <n-button type="primary" @click="handleCreate">新增角色</n-button>
        </div>
      </template>

      <n-data-table
        :columns="columns"
        :data="roles"
        :loading="loading"
        striped
      />
    </n-card>

    <!-- 新增/编辑弹窗 -->
    <n-modal
      v-model:show="dialogVisible"
      :title="isEdit ? '编辑角色' : '新增角色'"
      preset="card"
      style="width: 500px"
    >
      <n-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
      >
        <n-form-item label="角色名称" path="name">
          <n-input v-model:value="form.name" placeholder="请输入角色名称" />
        </n-form-item>
        <n-form-item label="角色编码" path="code">
          <n-input v-model:value="form.code" placeholder="请输入角色编码" :disabled="isEdit" />
        </n-form-item>
        <n-form-item label="描述" path="description">
          <n-input v-model:value="form.description" type="textarea" placeholder="请输入描述" />
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
import { getRoles, createRole, updateRole, deleteRole } from '@/api/roles'
import type { Role } from '@/types'

const message = useMessage()
const dialog = useDialog()
const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const roles = ref<Role[]>([])
const formRef = ref<FormInst>()
const currentRoleId = ref<number>()

const form = reactive({
  name: '',
  code: '',
  description: ''
})

const rules: FormRules = {
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入角色编码', trigger: 'blur' },
    { pattern: /^[a-z0-9_]+$/, message: '只能包含小写字母、数字和下划线', trigger: 'blur' }
  ]
}

// 表格列定义
const createColumns = (): DataTableColumns<Role> => {
  return [
    { title: 'ID', key: 'id', width: 80 },
    { title: '角色名称', key: 'name' },
    { title: '角色编码', key: 'code' },
    {
      title: '描述',
      key: 'description',
      render: (row) => row.description || '-'
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

const fetchRoles = async () => {
  loading.value = true
  try {
    const res = await getRoles()
    roles.value = res
  } catch (error) {
    message.error('获取角色列表失败')
  } finally {
    loading.value = false
  }
}

const formatDate = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

const handleCreate = () => {
  isEdit.value = false
  form.name = ''
  form.code = ''
  form.description = ''
  dialogVisible.value = true
}

const handleEdit = (role: Role) => {
  isEdit.value = true
  currentRoleId.value = role.id
  form.name = role.name
  form.code = role.code
  form.description = role.description || ''
  dialogVisible.value = true
}

const handleDelete = (role: Role) => {
  dialog.warning({
    title: '提示',
    content: `确定要删除角色「${role.name}」吗?`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await deleteRole(role.id)
        message.success('删除成功')
        fetchRoles()
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
          await updateRole(currentRoleId.value!, {
            name: form.name,
            description: form.description
          })
          message.success('更新成功')
        } else {
          await createRole({
            name: form.name,
            code: form.code,
            description: form.description
          })
          message.success('创建成功')
        }
        dialogVisible.value = false
        fetchRoles()
      } catch (error) {
        message.error('操作失败')
      } finally {
        submitLoading.value = false
      }
    }
  })
}

onMounted(() => {
  fetchRoles()
})
</script>
