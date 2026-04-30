<template>
  <div class="p-4 unit-list">
    <n-card class="mb-4 bg-container transition-theme" content-style="padding-bottom: 0;">
      <QueryForm :model="searchForm" class="mb-4">
        <n-form-item label="单位名称">
          <n-input v-model:value="searchForm.name" placeholder="请输入单位名称" clearable />
        </n-form-item>
        <n-form-item label="单位编码">
          <n-input v-model:value="searchForm.code" placeholder="请输入单位编码" clearable />
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
        <n-button type="primary" @click="handleCreate">新增单位</n-button>
      </div>
    </n-card>

    <n-card class="bg-container transition-theme">
      <n-data-table
        :columns="columns"
        :data="units"
        :loading="loading"
        :scroll-x="tableScrollX"
        striped
      />
    </n-card>

    <!-- 新增/编辑弹窗 -->
    <n-modal
      v-model:show="dialogVisible"
      :title="isEdit ? '编辑单位' : '新增单位'"
      preset="card"
      style="width: 500px"
    >
      <n-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
      >
        <n-form-item label="单位名称" path="name">
          <n-input v-model:value="form.name" placeholder="如：个、件、箱" />
        </n-form-item>
        <n-form-item label="单位编码" path="code">
          <n-input v-model:value="form.code" placeholder="如：GE、JIAN" :disabled="isEdit" />
        </n-form-item>
        <n-form-item label="排序号" path="sort">
          <n-input-number v-model:value="form.sort" :min="0" style="width: 100%" />
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
import QueryForm from '@/components/common/QueryForm.vue'
import { getUnits, createUnit, updateUnit, deleteUnit } from '@/api/unit'
import type { Unit, CreateUnitDto } from '@/types/basic-data'
import { autoFitTableColumns, createActionColumn, getTableScrollX } from '@/utils/table'

const message = useMessage()
const dialog = useDialog()
const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const units = ref<Unit[]>([])
const allUnits = ref<Unit[]>([])
const formRef = ref<FormInst>()
const currentId = ref<number>()
const searchForm = reactive({
  name: '',
  code: ''
})

const form = reactive<CreateUnitDto>({
  name: '',
  code: '',
  sort: 0
})

const rules: FormRules = {
  name: [
    { required: true, message: '请输入单位名称', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入单位编码', trigger: 'blur' }
  ]
}

const createColumns = (): DataTableColumns<Unit> => {
  return autoFitTableColumns([
    { title: 'ID', key: 'id' },
    { title: '单位名称', key: 'name' },
    { title: '单位编码', key: 'code' },
    { title: '排序号', key: 'sort' },
    createActionColumn<Unit>({
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
              type: 'error',
              onClick: () => handleDelete(row)
            }, { default: () => '删除' })
          ]
        })
      }
    }, 2)
  ])
}

const columns = createColumns()
const tableScrollX = getTableScrollX(columns)

const applyFilters = () => {
  const name = searchForm.name.trim().toLowerCase()
  const code = searchForm.code.trim().toLowerCase()

  units.value = allUnits.value.filter(unit => {
    const matchName = !name || unit.name.toLowerCase().includes(name)
    const matchCode = !code || unit.code.toLowerCase().includes(code)
    return matchName && matchCode
  })
}

const fetchUnits = async () => {
  loading.value = true
  try {
    allUnits.value = await getUnits()
    applyFilters()
  } catch (error) {
    message.error('获取单位列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  applyFilters()
}

const handleReset = async () => {
  searchForm.name = ''
  searchForm.code = ''
  await fetchUnits()
}

const handleCreate = () => {
  isEdit.value = false
  form.name = ''
  form.code = ''
  form.sort = 0
  dialogVisible.value = true
}

const handleEdit = (unit: Unit) => {
  isEdit.value = true
  currentId.value = unit.id
  form.name = unit.name
  form.code = unit.code
  form.sort = unit.sort
  dialogVisible.value = true
}

const handleDelete = (unit: Unit) => {
  dialog.warning({
    title: '提示',
    content: `确定要删除 "${unit.name}" 吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await deleteUnit(unit.id)
        message.success('删除成功')
        fetchUnits()
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
        if (isEdit.value && currentId.value) {
          await updateUnit(currentId.value, form)
          message.success('更新成功')
        } else {
          await createUnit(form)
          message.success('创建成功')
        }
        dialogVisible.value = false
        fetchUnits()
      } catch (error: any) {
        message.error(error.message || '操作失败')
      } finally {
        submitLoading.value = false
      }
    }
  })
}

onMounted(() => {
  fetchUnits()
})
</script>
