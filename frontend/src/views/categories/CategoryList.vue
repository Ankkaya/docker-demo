<template>
  <div class="category-list">
    <n-card class="bg-container transition-theme">
      <template #header>
        <div class="flex justify-between items-center">
          <span class="text-base-text">商品分类</span>
          <n-button type="primary" @click="handleCreate">新增分类</n-button>
        </div>
      </template>

      <n-data-table
        :columns="columns"
        :data="categories"
        :loading="loading"
        striped
        default-expand-all
      />
    </n-card>

    <!-- 新增/编辑弹窗 -->
    <n-modal
      v-model:show="dialogVisible"
      :title="isEdit ? '编辑分类' : '新增分类'"
      preset="card"
      style="width: 500px"
    >
      <n-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
      >
        <n-form-item label="分类名称" path="name">
          <n-input v-model:value="form.name" placeholder="请输入分类名称" />
        </n-form-item>
        <n-form-item label="分类编码" path="code">
          <n-input v-model:value="form.code" placeholder="请输入分类编码" :disabled="isEdit" />
        </n-form-item>
        <n-form-item label="父级分类" path="parentId">
          <n-tree-select
            v-model:value="form.parentId"
            :options="categoryOptions"
            :default-expand-all="true"
            clearable
            placeholder="不选则为顶级分类"
            check-strategy="all"
          />
        </n-form-item>
        <n-form-item label="分类图标" path="icon">
          <n-input v-model:value="form.icon" placeholder="请输入图标名称" />
        </n-form-item>
        <n-form-item label="分类图片" path="image">
          <n-input v-model:value="form.image" placeholder="请输入图片URL" />
        </n-form-item>
        <n-form-item label="排序号" path="sort">
          <n-input-number v-model:value="form.sort" :min="0" style="width: 100%" />
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
import { ref, reactive, onMounted, h, computed } from 'vue'
import type { DataTableColumns, FormInst, FormRules, TreeSelectOption } from 'naive-ui'
import { useMessage, useDialog } from 'naive-ui'
import { NButton, NSpace, NSwitch } from 'naive-ui'
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/api/category'
import type { Category, CreateCategoryDto } from '@/types/basic-data'

const message = useMessage()
const dialog = useDialog()
const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const categories = ref<Category[]>([])
const flatCategories = ref<Category[]>([])
const formRef = ref<FormInst>()
const currentId = ref<number>()

const form = reactive<CreateCategoryDto & { isEnabled: boolean }>({
  name: '',
  code: '',
  parentId: undefined,
  icon: '',
  image: '',
  sort: 0,
  isEnabled: true
})

const rules: FormRules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入分类编码', trigger: 'blur' }
  ]
}

// 转换为树形选择器选项
const categoryOptions = computed<TreeSelectOption[]>(() => {
  const convert = (cats: Category[]): TreeSelectOption[] => {
    return cats.map(cat => ({
      key: cat.id,
      label: cat.name,
      value: cat.id,
      children: cat.children ? convert(cat.children) : undefined
    }))
  }
  return convert(categories.value)
})

const createColumns = (): DataTableColumns<Category> => {
  return [
    { title: '分类名称', key: 'name' },
    { title: '分类编码', key: 'code' },
    { title: '层级', key: 'level', width: 80 },
    { title: '排序号', key: 'sort', width: 100 },
    {
      title: '状态',
      key: 'isEnabled',
      width: 100,
      render: (row) => {
        return h(NSwitch, {
          value: row.isEnabled,
          disabled: true,
          checkedValue: true,
          uncheckedValue: false
        })
      }
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
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
              type: 'info',
              onClick: () => handleAddChild(row)
            }, { default: () => '添加子类' }),
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

const fetchCategories = async () => {
  loading.value = true
  try {
    categories.value = await getCategories()
    // 同时获取扁平化列表用于选择父级
    const flatRes = await fetch('/api/categories?format=flat', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    }).then(r => r.json())
    flatCategories.value = flatRes.data || flatRes
  } catch (error) {
    message.error('获取分类列表失败')
  } finally {
    loading.value = false
  }
}

const handleCreate = () => {
  isEdit.value = false
  form.name = ''
  form.code = ''
  form.parentId = undefined
  form.icon = ''
  form.image = ''
  form.sort = 0
  form.isEnabled = true
  dialogVisible.value = true
}

const handleAddChild = (category: Category) => {
  isEdit.value = false
  form.name = ''
  form.code = ''
  form.parentId = category.id
  form.icon = ''
  form.image = ''
  form.sort = 0
  form.isEnabled = true
  dialogVisible.value = true
}

const handleEdit = (category: Category) => {
  isEdit.value = true
  currentId.value = category.id
  form.name = category.name
  form.code = category.code
  form.parentId = category.parentId
  form.icon = category.icon || ''
  form.image = category.image || ''
  form.sort = category.sort
  form.isEnabled = category.isEnabled
  dialogVisible.value = true
}

const handleDelete = (category: Category) => {
  dialog.warning({
    title: '提示',
    content: `确定要删除 "${category.name}" 吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await deleteCategory(category.id)
        message.success('删除成功')
        fetchCategories()
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
        if (!data.parentId) {
          delete data.parentId
        }
        if (isEdit.value && currentId.value) {
          await updateCategory(currentId.value, data)
          message.success('更新成功')
        } else {
          await createCategory(data)
          message.success('创建成功')
        }
        dialogVisible.value = false
        fetchCategories()
      } catch (error: any) {
        message.error(error.message || '操作失败')
      } finally {
        submitLoading.value = false
      }
    }
  })
}

onMounted(() => {
  fetchCategories()
})
</script>
