<template>
  <div class="p-4 banner-list">
    <n-card class="bg-container transition-theme">
      <div class="page-toolbar mb-4">
        <n-space>
          <n-button type="primary" @click="handleCreate">新增轮播图</n-button>
          <n-button @click="handleResetList">重置</n-button>
        </n-space>
      </div>
      <n-data-table :columns="columns" :data="banners" :loading="loading" striped />
    </n-card>

    <SmartFormContainer
      v-model:show="dialogVisible"
      :title="isEdit ? '编辑轮播图' : '新增轮播图'"
      :form-item-count="10"
      modal-width="640px"
      :drawer-width="760"
    >
      <n-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <n-form-item label="标题" path="title">
          <n-input v-model:value="form.title" placeholder="请输入轮播图标题" />
        </n-form-item>
        <n-form-item label="子标题" path="subtitle">
          <n-input v-model:value="form.subtitle" placeholder="可选，填写轮播图副文案" />
        </n-form-item>
        <n-form-item label="标签" path="tag">
          <n-input v-model:value="form.tag" placeholder="可选，例：新品上市" />
        </n-form-item>
        <n-form-item label="图片来源">
          <n-radio-group v-model:value="imageSourceType">
            <n-radio value="upload">上传图片</n-radio>
            <n-radio value="url">图片 URL</n-radio>
          </n-radio-group>
        </n-form-item>
        <n-form-item v-if="imageSourceType === 'upload'" label="轮播图片" path="image">
          <n-upload :key="uploadKey" list-type="image-card" :max="1" :custom-request="handleImageUpload"
            v-model:file-list="imageFileList" @remove="handleImageRemove" accept="image/*">
            <n-button>上传图片</n-button>
          </n-upload>
        </n-form-item>
        <n-form-item v-else label="图片 URL" path="image">
          <n-input v-model:value="form.image" placeholder="请输入 https:// 开头的图片地址" />
        </n-form-item>
        <n-form-item v-if="previewImageUrl" label="图片预览">
          <img :src="previewImageUrl" alt="轮播图预览" class="h-28 w-48 rounded object-cover border border-gray-200">
        </n-form-item>
        <n-form-item label="启用跳转" path="jumpEnabled">
          <n-switch v-model:value="form.jumpEnabled" />
        </n-form-item>
        <n-form-item v-if="form.jumpEnabled" label="跳转路径" path="jumpPath">
          <n-input v-model:value="form.jumpPath" placeholder="例如 /mall/products/1 或 https://example.com/activity" />
        </n-form-item>
        <n-form-item label="排序号" path="sort">
          <n-input-number v-model:value="form.sort" :min="0" class="w-full" />
        </n-form-item>
        <n-form-item label="启用状态" path="isEnabled">
          <n-switch v-model:value="form.isEnabled" />
        </n-form-item>
        <n-form-item label="备注" path="remark">
          <n-input v-model:value="form.remark" type="textarea" placeholder="可选，填写投放说明" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="dialogVisible = false">取消</n-button>
          <n-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</n-button>
        </n-space>
      </template>
    </SmartFormContainer>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, reactive, ref } from 'vue'
import type { DataTableColumns, FormInst, FormRules } from 'naive-ui'
import { useDialog, useMessage } from 'naive-ui'
import { NButton, NRadio, NRadioGroup, NSpace, NSwitch, NTag } from 'naive-ui'
import SmartFormContainer from '@/components/common/SmartFormContainer.vue'
import { createBanner, deleteBanner, getBanners, updateBanner } from '@/api/banner'
import { uploadFile } from '@/api/file'
import { extractFileObjectKey, resolveFileUrl } from '@/utils/file-url'
import type { Banner, CreateBannerDto } from '@/types/basic-data'

const message = useMessage()
const dialog = useDialog()

const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const currentId = ref<number>()
const banners = ref<Banner[]>([])
const statusUpdatingIds = ref<number[]>([])
const formRef = ref<FormInst>()
const imageFileList = ref<any[]>([])
const imageSourceType = ref<'upload' | 'url'>('upload')
const form = reactive<CreateBannerDto & { jumpEnabled: boolean; isEnabled: boolean }>({
  title: '',
  tag: '',
  subtitle: '',
  image: '',
  jumpEnabled: false,
  jumpPath: '',
  sort: 0,
  remark: '',
  isEnabled: true,
})

const rules: FormRules = {
  title: [{ required: true, message: '请输入轮播图标题', trigger: 'blur' }],
  image: [{ required: true, message: '请上传图片或填写图片 URL', trigger: ['blur', 'change'] }],
  jumpPath: [{
    validator: () => {
      if (!form.jumpEnabled) {
        return true
      }
      return !!form.jumpPath?.trim()
    },
    message: '开启跳转后请输入跳转路径',
    trigger: ['blur', 'change'],
  }],
}

const getFilenameFromKey = (value?: string | null) => {
  if (!value) return 'banner.png'
  return value.split('/').pop() || 'banner.png'
}

const inferImageMimeType = (value?: string | null) => {
  const filename = getFilenameFromKey(value).toLowerCase()
  if (filename.endsWith('.png')) return 'image/png'
  if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) return 'image/jpeg'
  if (filename.endsWith('.webp')) return 'image/webp'
  if (filename.endsWith('.gif')) return 'image/gif'
  if (filename.endsWith('.svg')) return 'image/svg+xml'
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

const uploadKey = computed(() => `${isEdit.value ? 'edit' : 'create'}-${currentId.value ?? 'new'}-${form.image || 'empty'}`)
const previewImageUrl = computed(() => form.image ? resolveFileUrl(form.image) : '')

const columns = computed<DataTableColumns<Banner>>(() => [
  { title: '标题', key: 'title', minWidth: 160 },
  {
    title: '标签',
    key: 'tag',
    width: 120,
    render: row => row.tag || '-',
  },
  {
    title: '子标题',
    key: 'subtitle',
    minWidth: 180,
    render: row => row.subtitle || '-',
  },
  {
    title: '图片',
    key: 'image',
    width: 110,
    render: (row) => h('img', {
      src: resolveFileUrl(row.image),
      style: 'width: 84px; height: 48px; object-fit: cover; border-radius: 6px; border: 1px solid #e5e7eb;',
    }),
  },
  { title: '排序', key: 'sort', width: 80 },
  {
    title: '跳转',
    key: 'jumpEnabled',
    width: 220,
    render: (row) => {
      if (!row.jumpEnabled) {
        return h(NTag, { size: 'small' }, { default: () => '不跳转' })
      }
      return h('div', { class: 'flex items-center gap-2' }, [
        h(NTag, { type: 'info', size: 'small' }, { default: () => '已开启' }),
        h('span', { class: 'text-xs text-gray-500 truncate max-w-[120px]' }, row.jumpPath || '-'),
      ])
    },
  },
  {
    title: '状态',
    key: 'isEnabled',
    width: 90,
    render: (row) => h(NSwitch, {
      value: row.isEnabled,
      loading: statusUpdatingIds.value.includes(row.id),
      onUpdateValue: (value: boolean) => handleToggleStatus(row, value),
    }),
  },
  {
    title: '备注',
    key: 'remark',
    ellipsis: { tooltip: true },
    render: row => row.remark || '-',
  },
  {
    title: '操作',
    key: 'actions',
    width: 150,
    render: (row) => h(NSpace, null, {
      default: () => [
        h(NButton, { text: true, type: 'primary', onClick: () => handleEdit(row) }, { default: () => '编辑' }),
        h(NButton, { text: true, type: 'error', onClick: () => handleDelete(row) }, { default: () => '删除' }),
      ],
    }),
  },
])

const resetForm = () => {
  currentId.value = undefined
  form.title = ''
  form.tag = ''
  form.subtitle = ''
  form.image = ''
  form.jumpEnabled = false
  form.jumpPath = ''
  form.sort = 0
  form.remark = ''
  form.isEnabled = true
  imageSourceType.value = 'upload'
  imageFileList.value = []
}

const fetchBanners = async () => {
  loading.value = true
  try {
    banners.value = await getBanners()
  } catch (error) {
    message.error('获取轮播图列表失败')
  } finally {
    loading.value = false
  }
}

const handleCreate = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (banner: Banner) => {
  isEdit.value = true
  currentId.value = banner.id
  form.title = banner.title
  form.tag = banner.tag || ''
  form.subtitle = banner.subtitle || ''
  form.image = banner.image
  form.jumpEnabled = banner.jumpEnabled
  form.jumpPath = banner.jumpPath || ''
  form.sort = banner.sort
  form.remark = banner.remark || ''
  form.isEnabled = banner.isEnabled
  imageSourceType.value = /^https?:\/\//i.test(banner.image) && !extractFileObjectKey(banner.image) ? 'url' : 'upload'
  imageFileList.value = imageSourceType.value === 'upload' ? buildImageUploadFile(banner.image) : []
  dialogVisible.value = true
}

const handleResetList = () => {
  fetchBanners()
}

const handleToggleStatus = async (banner: Banner, isEnabled: boolean) => {
  statusUpdatingIds.value = [...statusUpdatingIds.value, banner.id]
  try {
    await updateBanner(banner.id, { isEnabled })
    message.success(`${banner.title}已${isEnabled ? '启用' : '禁用'}`)
    await fetchBanners()
  } catch (error: any) {
    message.error(error.message || '状态更新失败')
  } finally {
    statusUpdatingIds.value = statusUpdatingIds.value.filter(id => id !== banner.id)
  }
}

const handleDelete = (banner: Banner) => {
  dialog.warning({
    title: '提示',
    content: `确定删除轮播图 "${banner.title}" 吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await deleteBanner(banner.id)
        message.success('删除成功')
        fetchBanners()
      } catch (error: any) {
        message.error(error.message || '删除失败')
      }
    },
  })
}

const handleImageUpload = async ({ file, onFinish, onError }: any) => {
  try {
    const result = await uploadFile(file.file, 'banners')
    const previewUrl = resolveFileUrl(result.url)

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
    message.error('上传失败')
    onError()
  }
}

const handleImageRemove = () => {
  form.image = ''
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (errors) => {
    if (!errors) {
      submitLoading.value = true
      try {
        const payload = {
          ...form,
          image: form.image?.trim(),
          jumpPath: form.jumpEnabled ? form.jumpPath?.trim() : '',
          remark: form.remark?.trim(),
        }

        if (isEdit.value && currentId.value) {
          await updateBanner(currentId.value, payload)
          message.success('更新成功')
        } else {
          await createBanner(payload)
          message.success('创建成功')
        }
        dialogVisible.value = false
        fetchBanners()
      } catch (error: any) {
        message.error(error.message || '操作失败')
      } finally {
        submitLoading.value = false
      }
    }
  })
}

onMounted(() => {
  fetchBanners()
})
</script>
