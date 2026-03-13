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
          <n-space vertical style="width: 100%">
            <n-input
              v-model:value="form.icon"
              placeholder="请输入 Iconify ID，例如 material-symbols:category-outline"
            />
            <div class="text-xs text-gray-500">
              推荐统一保存 Iconify ID。旧 Ionicons 名称和旧业务 key 仍兼容显示，但不建议继续新增。
            </div>
            <div v-if="form.icon" class="flex items-center gap-2 text-sm text-gray-500">
              <AppIcon v-if="iconPreviewUrl" :icon-url="iconPreviewUrl" :size="18" :alt="form.icon" />
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
import { NButton, NIcon, NInput, NSpace, NSwitch } from 'naive-ui'
import { getCategories, getCategoriesFlat, getCategory, createCategory, updateCategory, deleteCategory } from '@/api/category'
import { uploadFile } from '@/api/file'
import { extractFileObjectKey, resolveFileUrl } from '@/utils/file-url'
import AppIcon from '@/components/common/AppIcon.vue'
import type { Category, CreateCategoryDto } from '@/types/basic-data'
import * as Ionicons from '@vicons/ionicons5'

const message = useMessage()
const dialog = useDialog()
const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const categories = ref<Category[]>([])
const formRef = ref<FormInst>()
const currentId = ref<number>()

const iconMap = Ionicons as Record<string, any>

const form = reactive<CreateCategoryDto & { isEnabled: boolean }>({
  name: '',
  code: '',
  parentId: undefined,
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
  if (!icon) return ''
  const trimmed = icon.trim()
  if (!/^[a-z0-9-]+:[a-z0-9-]+$/i.test(trimmed)) {
    return ''
  }
  return `https://api.iconify.design/${trimmed}.svg`
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
  return convert(categories.value)
})

const imageUploadKey = computed(() => {
  return `${isEdit.value ? 'edit' : 'create'}-${currentId.value ?? 'new'}-${form.image || 'empty'}`
})

const iconPreviewUrl = computed(() => getIconPreviewUrl(form.icon))

const createColumns = (): DataTableColumns<Category> => {
  return [
    { title: '分类名称', key: 'name' },
    { title: '分类编码', key: 'code' },
    {
      title: '图片',
      key: 'image',
      width: 80,
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
      width: 110,
      render: (row) => {
        if (!row.icon) return '-'
        const legacyIcon = getIconComponent(row.icon)
        return h('div', { class: 'flex items-center gap-1' }, [
          row.iconUrl
            ? h(AppIcon, { iconUrl: row.iconUrl, size: 16, alt: row.icon })
            : legacyIcon
              ? h(NIcon, { size: 16, component: legacyIcon })
              : null,
          h('span', row.icon),
        ])
      }
    },
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
  form.parentId = undefined
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
  form.parentId = category.id
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
    form.parentId = detail.parentId
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
        const data = { ...form, icon: form.icon?.trim() || '' }
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
