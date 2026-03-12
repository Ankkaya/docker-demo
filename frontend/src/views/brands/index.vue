<template>
  <div class="brand-list">
    <n-card class="bg-container transition-theme">
      <template #header>
        <div class="flex justify-between items-center">
          <span class="text-base-text">品牌管理</span>
          <n-button type="primary" @click="handleCreate">新增品牌</n-button>
        </div>
      </template>

      <n-data-table
        :columns="columns"
        :data="brands"
        :loading="loading"
        striped
      />
    </n-card>

    <!-- 新增/编辑弹窗 -->
    <n-modal
      v-model:show="dialogVisible"
      :title="isEdit ? '编辑品牌' : '新增品牌'"
      preset="card"
      style="width: 500px"
    >
      <n-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
      >
        <n-form-item label="品牌名称" path="name">
          <n-input v-model:value="form.name" placeholder="请输入品牌名称" />
        </n-form-item>
        <n-form-item label="品牌Logo" path="logo">
          <n-upload
            list-type="image-card"
            :max="1"
            :custom-request="handleLogoUpload"
            v-model:file-list="logoFileList"
            @remove="handleLogoRemove"
            accept="image/*"
          >
            <n-button>上传Logo</n-button>
          </n-upload>
        </n-form-item>
        <n-form-item label="品牌描述" path="description">
          <n-input v-model:value="form.description" type="textarea" placeholder="请输入品牌描述" />
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
import { ref, reactive, onMounted, h } from 'vue'
import type { DataTableColumns, FormInst, FormRules } from 'naive-ui'
import { useMessage, useDialog } from 'naive-ui'
import { NButton, NSpace, NSwitch } from 'naive-ui'
import { getBrands, createBrand, updateBrand, deleteBrand } from '@/api/brand'
import { uploadFile } from '@/api/file'
import { resolveFileUrl } from '@/utils/file-url'
import type { Brand, CreateBrandDto } from '@/types/basic-data'

const message = useMessage()
const dialog = useDialog()
const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const brands = ref<Brand[]>([])
const formRef = ref<FormInst>()
const currentId = ref<number>()

const form = reactive<CreateBrandDto & { isEnabled: boolean }>({
  name: '',
  logo: '',
  description: '',
  sort: 0,
  isEnabled: true
})

// Logo 上传文件列表
const logoFileList = ref<any[]>([])

// 自定义上传请求 - 品牌Logo
const handleLogoUpload = async ({ file, onFinish, onError }: any) => {
  try {
    const result = await uploadFile(file.file, 'brands')
    const previewUrl = resolveFileUrl(result.url)
    console.log('[图片上传] 上传成功，URL:', previewUrl)
    
    file.id = result.objectKey
    file.url = previewUrl
    file.thumbnailUrl = previewUrl
    form.logo = result.objectKey
    
    onFinish({ id: result.objectKey, url: previewUrl })
    message.success('上传成功')
  } catch (error) {
    console.error('[图片上传] 上传失败:', error)
    message.error('上传失败')
    onError()
  }
}

const handleLogoRemove = () => {
  form.logo = ''
}

const rules: FormRules = {
  name: [
    { required: true, message: '请输入品牌名称', trigger: 'blur' }
  ]
}

const createColumns = (): DataTableColumns<Brand> => {
  return [
    { title: 'ID', key: 'id', width: 80 },
    { title: '品牌名称', key: 'name' },
    {
      title: 'Logo',
      key: 'logo',
      render: (row) => {
        if (row.logo) {
          return h('img', {
            src: resolveFileUrl(row.logo),
            style: 'width: 40px; height: 40px; object-fit: contain;'
          })
        }
        return '-'
      }
    },
    {
      title: '描述',
      key: 'description',
      ellipsis: { tooltip: true },
      render: (row) => row.description || '-'
    },
    { title: '排序号', key: 'sort', width: 100 },
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

const fetchBrands = async () => {
  loading.value = true
  try {
    brands.value = await getBrands()
  } catch (error) {
    message.error('获取品牌列表失败')
  } finally {
    loading.value = false
  }
}

const handleCreate = () => {
  isEdit.value = false
  form.name = ''
  form.logo = ''
  form.description = ''
  form.sort = 0
  form.isEnabled = true
  logoFileList.value = []  // 清空图片列表
  dialogVisible.value = true
}

const handleEdit = (brand: Brand) => {
  isEdit.value = true
  currentId.value = brand.id
  form.name = brand.name
  form.logo = brand.logo || ''
  form.description = brand.description || ''
  form.sort = brand.sort
  form.isEnabled = brand.isEnabled
  // 加载Logo到文件列表（用于回显）
  if (brand.logo) {
    logoFileList.value = [{
      id: brand.logo,
      name: 'Logo',
      status: 'finished',
      url: resolveFileUrl(brand.logo),
    }]
  } else {
    logoFileList.value = []
  }
  dialogVisible.value = true
}

const handleDelete = (brand: Brand) => {
  dialog.warning({
    title: '提示',
    content: `确定要删除 "${brand.name}" 吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await deleteBrand(brand.id)
        message.success('删除成功')
        fetchBrands()
      } catch (error: any) {
        message.error(error.message || '删除失败')
      }
    }
  })
}

const handleSubmit = async () => {
  if (!formRef.value) return

  // 调试：打印图片数据
  console.log('[表单提交] Logo:', form.logo)

  await formRef.value.validate(async (errors) => {
    if (!errors) {
      submitLoading.value = true
      try {
        if (isEdit.value && currentId.value) {
          await updateBrand(currentId.value, form)
          message.success('更新成功')
        } else {
          await createBrand(form)
          message.success('创建成功')
        }
        dialogVisible.value = false
        fetchBrands()
      } catch (error: any) {
        message.error(error.message || '操作失败')
      } finally {
        submitLoading.value = false
      }
    }
  })
}

onMounted(() => {
  fetchBrands()
})
</script>
