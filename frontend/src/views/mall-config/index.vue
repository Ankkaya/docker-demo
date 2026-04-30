<template>
  <div class="p-4 mall-config-page">
    <n-card class="mb-4 bg-container transition-theme" title="商城配置">
      <n-alert type="info" :show-icon="false">
        当前页面用于维护移动端搜索页的热门搜索词。搜索页初始化时会通过聚合接口同时返回热门搜索词和推荐分类。
      </n-alert>
    </n-card>

    <n-card class="bg-container transition-theme" title="热门搜索词">
      <template #header-extra>
        <n-button type="primary" @click="handleCreate">新增热门词</n-button>
      </template>

      <n-data-table
        :columns="columns"
        :data="keywords"
        :loading="loading"
        :scroll-x="760"
        striped
      />
    </n-card>

    <SmartFormContainer
      v-model:show="dialogVisible"
      :title="isEdit ? '编辑热门搜索词' : '新增热门搜索词'"
      :form-item-count="3"
      modal-width="460px"
      :drawer-width="620"
    >
      <n-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="90px"
      >
        <n-form-item label="热门搜索词" path="keyword">
          <n-input v-model:value="form.keyword" placeholder="请输入热门搜索词" />
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
    </SmartFormContainer>
  </div>
</template>

<script setup lang="ts">
import { h, onMounted, reactive, ref } from 'vue'
import type { DataTableColumns, FormInst, FormRules } from 'naive-ui'
import { NButton, NSpace, NSwitch, useDialog, useMessage } from 'naive-ui'
import SmartFormContainer from '@/components/common/SmartFormContainer.vue'
import {
  createMallHotSearchKeyword,
  deleteMallHotSearchKeyword,
  getMallHotSearchKeyword,
  getMallHotSearchKeywords,
  updateMallHotSearchKeyword,
} from '@/api/mall-hot-search'
import type { CreateMallHotSearchDto, MallHotSearchKeyword } from '@/types/mall-hot-search'
import { createActionColumn } from '@/utils/table'

const message = useMessage()
const dialog = useDialog()

const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const currentId = ref<number>()
const keywords = ref<MallHotSearchKeyword[]>([])
const formRef = ref<FormInst>()

const form = reactive<CreateMallHotSearchDto & { isEnabled: boolean }>({
  keyword: '',
  sort: 0,
  isEnabled: true,
})

const rules: FormRules = {
  keyword: [
    { required: true, message: '请输入热门搜索词', trigger: 'blur' },
  ],
}

const columns: DataTableColumns<MallHotSearchKeyword> = [
  { title: '热门搜索词', key: 'keyword', minWidth: 180 },
  { title: '排序号', key: 'sort', width: 100 },
  { title: '搜索次数', key: 'searchCount', width: 100 },
  {
    title: '状态',
    key: 'isEnabled',
    width: 100,
    render: (row) => h(NSwitch, {
      value: row.isEnabled,
      onUpdateValue: (value: boolean) => handleToggleStatus(row, value),
    }),
  },
  {
    title: '更新时间',
    key: 'updatedAt',
    minWidth: 180,
  },
  createActionColumn<MallHotSearchKeyword>({
    title: '操作',
    key: 'actions',
    render: (row) => h(NSpace, null, {
      default: () => [
        h(NButton, {
          text: true,
          type: 'primary',
          onClick: () => handleEdit(row),
        }, { default: () => '编辑' }),
        h(NButton, {
          text: true,
          type: 'error',
          onClick: () => handleDelete(row),
        }, { default: () => '删除' }),
      ],
    }),
  }, 2),
]

const resetForm = () => {
  currentId.value = undefined
  form.keyword = ''
  form.sort = 0
  form.isEnabled = true
}

const fetchKeywords = async () => {
  loading.value = true
  try {
    keywords.value = await getMallHotSearchKeywords()
  }
  catch (error: any) {
    message.error(error.message || '获取热门搜索词失败')
  }
  finally {
    loading.value = false
  }
}

const handleCreate = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

const handleEdit = async (row: MallHotSearchKeyword) => {
  submitLoading.value = true
  try {
    const detail = await getMallHotSearchKeyword(row.id)
    isEdit.value = true
    currentId.value = detail.id
    form.keyword = detail.keyword
    form.sort = detail.sort
    form.isEnabled = detail.isEnabled
    dialogVisible.value = true
  }
  catch (error: any) {
    message.error(error.message || '获取热门搜索词详情失败')
  }
  finally {
    submitLoading.value = false
  }
}

const handleToggleStatus = async (row: MallHotSearchKeyword, isEnabled: boolean) => {
  try {
    await updateMallHotSearchKeyword(row.id, { isEnabled })
    message.success(`${row.keyword}已${isEnabled ? '启用' : '禁用'}`)
    await fetchKeywords()
  }
  catch (error: any) {
    message.error(error.message || '状态更新失败')
  }
}

const handleDelete = (row: MallHotSearchKeyword) => {
  dialog.warning({
    title: '提示',
    content: `确定删除热门搜索词“${row.keyword}”吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await deleteMallHotSearchKeyword(row.id)
        message.success('删除成功')
        await fetchKeywords()
      }
      catch (error: any) {
        message.error(error.message || '删除失败')
      }
    },
  })
}

const handleSubmit = async () => {
  if (!formRef.value) {
    return
  }

  await formRef.value.validate(async (errors) => {
    if (errors) {
      return
    }

    submitLoading.value = true
    try {
      const payload = {
        keyword: form.keyword.trim(),
        sort: form.sort ?? 0,
        isEnabled: form.isEnabled,
      }

      if (isEdit.value && currentId.value) {
        await updateMallHotSearchKeyword(currentId.value, payload)
        message.success('更新成功')
      }
      else {
        await createMallHotSearchKeyword(payload)
        message.success('创建成功')
      }

      dialogVisible.value = false
      await fetchKeywords()
    }
    catch (error: any) {
      message.error(error.message || '保存失败')
    }
    finally {
      submitLoading.value = false
    }
  })
}

onMounted(() => {
  fetchKeywords()
})
</script>
