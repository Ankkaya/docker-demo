<template>
  <div class="menu-list">
    <el-card class="box-card">
      <template #header>
        <div class="card-header flex justify-between items-center">
          <span>菜单列表</span>
          <el-button type="primary" @click="handleCreate(null)">新增菜单</el-button>
        </div>
      </template>

      <el-table
        :data="menus"
        v-loading="loading"
        row-key="id"
        :tree-props="{ children: 'children' }"
        default-expand-all
        stripe
      >
        <el-table-column prop="name" label="菜单名称" min-width="150" />
        <el-table-column prop="path" label="路由路径" min-width="120">
          <template #default="{ row }">
            {{ row.path || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="icon" label="图标" width="100">
          <template #default="{ row }">
            <el-icon v-if="row.icon"><component :is="row.icon" /></el-icon>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="order" label="排序" width="80" align="center" />
        <el-table-column prop="type" label="类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.type)">{{ getTypeLabel(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="hidden" label="隐藏" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.hidden ? 'danger' : 'success'" size="small">
              {{ row.hidden ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleCreate(row)">
              新增子菜单
            </el-button>
            <el-button link type="primary" size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑菜单' : '新增菜单'"
      width="600px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        size="default"
      >
        <el-form-item label="菜单类型" prop="type">
          <el-radio-group v-model="form.type">
            <el-radio label="menu">菜单</el-radio>
            <el-radio label="button">按钮</el-radio>
            <el-radio label="iframe">iframe</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="菜单名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入菜单名称" />
        </el-form-item>
        <el-form-item label="路由路径" prop="path" v-if="form.type !== 'button'">
          <el-input v-model="form.path" placeholder="如: /system" />
        </el-form-item>
        <el-form-item label="组件路径" prop="component" v-if="form.type === 'menu'">
          <el-input v-model="form.component" placeholder="如: layout/System/index" />
        </el-form-item>
        <el-form-item label="图标" prop="icon" v-if="form.type !== 'button'">
          <el-input v-model="form.icon" placeholder="图标名称" />
        </el-form-item>
        <el-form-item label="重定向" prop="redirect" v-if="form.type === 'menu'">
          <el-input v-model="form.redirect" placeholder="重定向路径" />
        </el-form-item>
        <el-form-item label="父级菜单" prop="parentId">
          <el-tree-select
            v-model="form.parentId"
            :data="menuOptions"
            :props="{ label: 'name', value: 'id' }"
            check-strictly
            clearable
            placeholder="请选择父级菜单"
            class="w-full"
          />
        </el-form-item>
        <el-form-item label="排序" prop="order">
          <el-input-number v-model="form.order" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="是否隐藏" prop="hidden">
          <el-switch v-model="form.hidden" />
        </el-form-item>
        <el-form-item label="总是显示" prop="alwaysShow" v-if="form.type === 'menu'">
          <el-switch v-model="form.alwaysShow" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getMenus, createMenu, updateMenu, deleteMenu } from '@/api/menu'
import type { Menu, CreateMenuDto } from '@/types'

const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const menus = ref<Menu[]>([])
const formRef = ref<FormInstance>()
const currentMenuId = ref<number>()

const form = reactive<CreateMenuDto>({
  name: '',
  path: '',
  icon: '',
  component: '',
  redirect: '',
  parentId: undefined,
  order: 0,
  hidden: false,
  alwaysShow: false,
  type: 'menu'
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择菜单类型', trigger: 'change' }]
}

// 菜单选项（用于父级菜单选择）
const menuOptions = computed(() => {
  const options: { id: number; name: string; children?: Menu[] }[] = []
  const buildOptions = (list: Menu[], level = 0) => {
    list.forEach((menu) => {
      options.push({
        id: menu.id,
        name: `${'　'.repeat(level)}${menu.name}`
      })
      if (menu.children && menu.children.length > 0) {
        buildOptions(menu.children, level + 1)
      }
    })
  }
  buildOptions(menus.value)
  return options
})

const fetchMenus = async () => {
  loading.value = true
  try {
    const res = await getMenus()
    menus.value = res
  } catch (error) {
    ElMessage.error('获取菜单列表失败')
  } finally {
    loading.value = false
  }
}

const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    menu: '菜单',
    button: '按钮',
    iframe: 'iframe'
  }
  return labels[type] || type
}

const getTypeTagType = (type: string) => {
  const types: Record<string, string> = {
    menu: 'success',
    button: 'warning',
    iframe: 'info'
  }
  return types[type] || 'info'
}

const handleCreate = (row: Menu | null) => {
  isEdit.value = false
  form.name = ''
  form.path = ''
  form.icon = ''
  form.component = ''
  form.redirect = ''
  form.parentId = row?.id
  form.order = 0
  form.hidden = false
  form.alwaysShow = false
  form.type = 'menu'
  dialogVisible.value = true
}

const handleEdit = (menu: Menu) => {
  isEdit.value = true
  currentMenuId.value = menu.id
  form.name = menu.name
  form.path = menu.path || ''
  form.icon = menu.icon || ''
  form.component = menu.component || ''
  form.redirect = menu.redirect || ''
  form.parentId = menu.parentId
  form.order = menu.order
  form.hidden = menu.hidden
  form.alwaysShow = menu.alwaysShow
  form.type = menu.type as 'menu' | 'button' | 'iframe'
  dialogVisible.value = true
}

const handleDelete = (menu: Menu) => {
  if (menu.children && menu.children.length > 0) {
    ElMessage.warning('该菜单存在子菜单，无法删除')
    return
  }

  ElMessageBox.confirm('确定要删除该菜单吗?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteMenu(menu.id)
      ElMessage.success('删除成功')
      fetchMenus()
    } catch (error: any) {
      ElMessage.error(error.response?.data?.message || '删除失败')
    }
  })
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        if (isEdit.value && currentMenuId.value) {
          await updateMenu(currentMenuId.value, form)
          ElMessage.success('更新成功')
        } else {
          await createMenu(form)
          ElMessage.success('创建成功')
        }
        dialogVisible.value = false
        fetchMenus()
      } catch (error: any) {
        ElMessage.error(error.response?.data?.message || '操作失败')
      } finally {
        submitLoading.value = false
      }
    }
  })
}

onMounted(() => {
  fetchMenus()
})
</script>
