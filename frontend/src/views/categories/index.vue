<template>
  <div class="p-4 category-list">
    <n-card class="mb-4 bg-container transition-theme" content-style="padding-bottom: 0;">
      <QueryForm :model="searchForm" @search="handleSearch">
        <n-form-item label="分类名称">
          <n-input v-model:value="searchForm.name" placeholder="请输入分类名称" clearable />
        </n-form-item>
        <n-form-item label="分类编码">
          <n-input v-model:value="searchForm.code" placeholder="请输入分类编码" clearable />
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
        <n-button type="primary" @click="handleCreate">新增分类</n-button>
      </div>
    </n-card>

    <n-card class="bg-container transition-theme">
      <n-data-table
        :columns="columns"
        :data="categories"
        :loading="loading"
        :scroll-x="tableScrollX"
        striped
        default-expand-all
      />
    </n-card>

    <!-- 新增/编辑弹窗 -->
    <SmartFormContainer
      v-model:show="dialogVisible"
      :title="isEdit ? '编辑分类' : '新增分类'"
      :form-item-count="11"
      modal-width="500px"
      :drawer-width="760"
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
        <n-form-item label="子标题" path="subtitle">
          <n-input v-model:value="form.subtitle" placeholder="请输入分类子标题" />
        </n-form-item>
        <n-form-item label="备注" path="remark">
          <n-input
            v-model:value="form.remark"
            type="textarea"
            placeholder="请输入分类备注"
            :autosize="{ minRows: 2, maxRows: 4 }"
          />
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
          <n-space vertical style="width: 100%">
            <IconPicker v-model="form.icon" />
            <div class="text-xs text-gray-500">
              统一录入 Ionicons 名称。输入关键字会忽略大小写匹配，并在下方展示相似图标。
            </div>
            <div v-if="form.icon" class="flex items-center gap-2 text-sm text-gray-500">
              <span
                v-if="iconPreviewUrl"
                class="inline-flex items-center justify-center rounded-md bg-slate-700 p-1"
              >
                <AppIcon :icon-url="iconPreviewUrl" :size="18" :alt="form.icon" />
              </span>
              <n-icon v-else-if="getIconComponent(form.icon)" size="18" :component="getIconComponent(form.icon)" />
              <span>{{ form.icon }}</span>
            </div>
          </n-space>
        </n-form-item>
        <n-form-item label="分类图片" path="image">
          <n-upload
            :key="imageUploadKey"
            list-type="image-card"
            :max="1"
            :custom-request="handleImageUpload"
            v-model:file-list="imageFileList"
            @remove="handleImageRemove"
            accept="image/*"
          >
            <n-button>上传图片</n-button>
          </n-upload>
        </n-form-item>
        <n-form-item label="排序号" path="sort">
          <n-input-number v-model:value="form.sort" :min="0" style="width: 100%" />
        </n-form-item>
        <n-form-item label="搜索推荐" path="mallRecommend">
          <n-switch v-model:value="form.mallRecommend" />
        </n-form-item>
        <n-form-item label="推荐排序" path="mallRecommendSort">
          <n-input-number
            v-model:value="form.mallRecommendSort"
            :min="0"
            :disabled="!form.mallRecommend"
            style="width: 100%"
          />
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
import { ref, reactive, onMounted, h, computed } from 'vue'
import type { DataTableColumns, FormInst, FormRules, TreeSelectOption } from 'naive-ui'
import { useMessage, useDialog } from 'naive-ui'
import { NButton, NIcon, NInput, NSelect, NSpace, NSwitch } from 'naive-ui'
import QueryForm from '@/components/common/QueryForm.vue'
import SmartFormContainer from '@/components/common/SmartFormContainer.vue'
import { getCategories, getCategoriesFlat, getCategory, createCategory, updateCategory, deleteCategory } from '@/api/category'
import { uploadFile } from '@/api/file'
import { extractFileObjectKey, resolveFileUrl } from '@/utils/file-url'
import AppIcon from '@/components/common/AppIcon.vue'
import IconPicker from '@/components/common/IconPicker.vue'
import type { Category, CreateCategoryDto } from '@/types/basic-data'
import * as Ionicons from '@vicons/ionicons5'
import { autoFitTableColumns, createActionColumn, getTableScrollX } from '@/utils/table'

const message = useMessage()
const dialog = useDialog()
const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const categories = ref<Category[]>([])
const allCategories = ref<Category[]>([])
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

const iconMap = Ionicons as Record<string, any>

const form = reactive<CreateCategoryDto & { isEnabled: boolean }>({
  name: '',
  code: '',
  subtitle: '',
  remark: '',
  parentId: undefined,
  mallRecommend: false,
  mallRecommendSort: 0,
  icon: '',
  image: '',
  sort: 0,
  isEnabled: true
})

// 分类图片上传文件列表
const imageFileList = ref<any[]>([])

const getIconComponent = (iconName?: string) => {
  if (!iconName) return undefined
  return iconMap[iconName]
}

const getIconPreviewUrl = (icon?: string) => {
  const component = getIconComponent(icon)
  if (!component) return ''

  const iconName = icon!.trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z0-9]+)/g, '$1-$2')
    .toLowerCase()

  return `https://api.iconify.design/ion/${iconName}.svg?color=%23ffffff`
}

const getFilenameFromKey = (value?: string | null) => {
  if (!value) return 'image.png'
  return value.split('/').pop() || 'image.png'
}

const inferImageMimeType = (value?: string | null) => {
  const filename = getFilenameFromKey(value).toLowerCase()
  if (filename.endsWith('.png')) return 'image/png'
  if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) return 'image/jpeg'
  if (filename.endsWith('.webp')) return 'image/webp'
  if (filename.endsWith('.gif')) return 'image/gif'
  if (filename.endsWith('.avif')) return 'image/avif'
  return 'image/png'
}

const buildImageUploadFile = (image?: string | null) => {
  if (!image) {
    return []
  }

  const objectKey = extractFileObjectKey(image) || image
  const previewUrl = resolveFileUrl(image)

  return [{
    id: objectKey,
    name: getFilenameFromKey(objectKey),
    status: 'finished',
    url: previewUrl,
    thumbnailUrl: previewUrl,
    type: inferImageMimeType(objectKey),
    objectKey,
  }]
}

// 自定义上传请求 - 分类图片
const handleImageUpload = async ({ file, onFinish, onError }: any) => {
  try {
    const result = await uploadFile(file.file, 'categories')
    const previewUrl = resolveFileUrl(result.url)
    console.log('[图片上传] 上传成功，URL:', previewUrl)
    
    file.id = result.objectKey
    file.name = getFilenameFromKey(result.objectKey)
    file.type = inferImageMimeType(result.objectKey)
    file.url = previewUrl
    file.thumbnailUrl = previewUrl
    file.objectKey = result.objectKey
    form.image = result.objectKey
    
    onFinish({ id: result.objectKey, url: previewUrl })
    message.success('上传成功')
  } catch (error) {
    console.error('[图片上传] 上传失败:', error)
    message.error('上传失败')
    onError()
  }
}

const handleImageRemove = () => {
  form.image = ''
}

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
  return convert(allCategories.value)
})

const imageUploadKey = computed(() => {
  return `${isEdit.value ? 'edit' : 'create'}-${currentId.value ?? 'new'}-${form.image || 'empty'}`
})

const iconPreviewUrl = computed(() => getIconPreviewUrl(form.icon))

const createColumns = (): DataTableColumns<Category> => {
  return autoFitTableColumns([
    { title: '分类名称', key: 'name' },
    { title: '分类编码', key: 'code' },
    {
      title: '子标题',
      key: 'subtitle',
      render: (row) => row.subtitle || '-',
    },
    {
      title: '图片',
      key: 'image',
      render: (row) => {
        if (row.image) {
          return h('img', {
            src: resolveFileUrl(row.image),
            style: 'width: 50px; height: 50px; object-fit: cover; border-radius: 4px;'
          })
        }
        return '-'
      }
    },
    {
      title: '图标',
      key: 'icon',
      render: (row) => {
        if (!row.icon) return '-'
        const legacyIcon = getIconComponent(row.icon)
        return h('div', { class: 'flex items-center' }, [
          row.iconUrl
            ? h('span', {
              class: 'inline-flex items-center justify-center rounded-md bg-slate-700 p-1',
            }, [
              h(AppIcon, { iconUrl: row.iconUrl, size: 16, alt: row.icon }),
            ])
            : legacyIcon
              ? h(NIcon, { size: 16, component: legacyIcon })
              : null,
        ])
      }
    },
    {
      title: '搜索推荐',
      key: 'mallRecommend',
      render: (row) => {
        return h(NSwitch, {
          value: row.mallRecommend,
          loading: statusUpdatingIds.value.includes(row.id),
          onUpdateValue: (value: boolean) => handleToggleMallRecommend(row, value),
          checkedValue: true,
          uncheckedValue: false,
        })
      },
    },
    {
      title: '推荐排序',
      key: 'mallRecommendSort',
      render: (row) => row.mallRecommend ? row.mallRecommendSort : '-',
    },
    { title: '排序号', key: 'sort' },
    {
      title: '状态',
      key: 'isEnabled',
      render: (row) => {
        return h(NSwitch, {
          value: row.isEnabled,
          loading: statusUpdatingIds.value.includes(row.id),
          onUpdateValue: (value: boolean) => handleToggleStatus(row, value),
          checkedValue: true,
          uncheckedValue: false
        })
      }
    },
    {
      title: '备注',
      key: 'remark',
      render: (row) => row.remark || '-',
    },
    createActionColumn<Category>({
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
    }, 3)
  ])
}

const columns = createColumns()
const tableScrollX = getTableScrollX(columns)

const filterCategoryTree = (list: Category[]): Category[] => {
  const name = searchForm.name.trim().toLowerCase()
  const code = searchForm.code.trim().toLowerCase()

  return list.reduce<Category[]>((result, category) => {
    const children = category.children ? filterCategoryTree(category.children) : []
    const matchName = !name || category.name.toLowerCase().includes(name)
    const matchCode = !code || category.code.toLowerCase().includes(code)
    const matchStatus = searchForm.isEnabled === null
      || (searchForm.isEnabled === 'enabled' ? category.isEnabled : !category.isEnabled)
    const matched = matchName && matchCode && matchStatus

    if (matched || children.length > 0) {
      result.push({
        ...category,
        children
      })
    }

    return result
  }, [])
}

const applyFilters = () => {
  categories.value = filterCategoryTree(allCategories.value)
}

const fetchCategories = async () => {
  loading.value = true
  try {
    allCategories.value = await getCategories()
    applyFilters()
    await getCategoriesFlat()
  } catch (error) {
    message.error('获取分类列表失败')
  } finally {
    loading.value = false
  }
}

const handleCreate = () => {
  isEdit.value = false
  currentId.value = undefined
  form.name = ''
  form.code = ''
  form.subtitle = ''
  form.remark = ''
  form.parentId = undefined
  form.mallRecommend = false
  form.mallRecommendSort = 0
  form.icon = ''
  form.image = ''
  form.sort = 0
  form.isEnabled = true
  imageFileList.value = []  // 清空图片列表
  dialogVisible.value = true
}

const handleAddChild = (category: Category) => {
  isEdit.value = false
  currentId.value = undefined
  form.name = ''
  form.code = ''
  form.subtitle = ''
  form.remark = ''
  form.parentId = category.id
  form.mallRecommend = false
  form.mallRecommendSort = 0
  form.icon = ''
  form.image = ''
  form.sort = 0
  form.isEnabled = true
  imageFileList.value = []  // 清空图片列表
  dialogVisible.value = true
}

const handleEdit = async (category: Category) => {
  try {
    submitLoading.value = true
    const detail = await getCategory(category.id)

    isEdit.value = true
    currentId.value = detail.id
    form.name = detail.name
    form.code = detail.code
    form.subtitle = detail.subtitle || ''
    form.remark = detail.remark || ''
    form.parentId = detail.parentId
    form.mallRecommend = detail.mallRecommend ?? false
    form.mallRecommendSort = detail.mallRecommendSort ?? 0
    form.icon = detail.icon || ''
    form.image = detail.image || ''
    form.sort = detail.sort
    form.isEnabled = detail.isEnabled
    imageFileList.value = buildImageUploadFile(detail.image)
    dialogVisible.value = true
  } catch (error) {
    message.error('获取分类详情失败')
  } finally {
    submitLoading.value = false
  }
}

const handleSearch = () => {
  applyFilters()
}

const handleReset = async () => {
  searchForm.name = ''
  searchForm.code = ''
  searchForm.isEnabled = null
  await fetchCategories()
}

const handleToggleStatus = async (category: Category, isEnabled: boolean) => {
  statusUpdatingIds.value = [...statusUpdatingIds.value, category.id]
  try {
    await updateCategory(category.id, { isEnabled })
    message.success(`${category.name}已${isEnabled ? '启用' : '禁用'}`)
    await fetchCategories()
  } catch (error: any) {
    message.error(error.message || '状态更新失败')
  } finally {
    statusUpdatingIds.value = statusUpdatingIds.value.filter(id => id !== category.id)
  }
}

const handleToggleMallRecommend = async (category: Category, mallRecommend: boolean) => {
  statusUpdatingIds.value = [...statusUpdatingIds.value, category.id]
  try {
    await updateCategory(category.id, {
      mallRecommend,
      mallRecommendSort: mallRecommend ? (category.mallRecommendSort ?? 0) : 0,
    })
    message.success(`${category.name}已${mallRecommend ? '设为搜索推荐' : '取消搜索推荐'}`)
    await fetchCategories()
  } catch (error: any) {
    message.error(error.message || '搜索推荐状态更新失败')
  } finally {
    statusUpdatingIds.value = statusUpdatingIds.value.filter(id => id !== category.id)
  }
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

  // 调试：打印图片数据
  console.log('[表单提交] 分类图片:', form.image)

  await formRef.value.validate(async (errors) => {
    if (!errors) {
      submitLoading.value = true
      try {
        const data = {
          ...form,
          mallRecommend: form.mallRecommend,
          mallRecommendSort: form.mallRecommend ? (form.mallRecommendSort ?? 0) : 0,
          icon: form.icon?.trim() || '',
        }
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

<style scoped>
.category-list :deep(.n-data-table-th__title) {
  white-space: nowrap;
}

.category-list :deep(.n-data-table-td:nth-child(1)) {
  white-space: nowrap;
}
</style>
