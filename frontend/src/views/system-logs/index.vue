<template>
  <div class="p-4">
    <n-card class="bg-container transition-theme">
      <n-tabs type="line" animated v-model:value="activeTab">
        <n-tab-pane name="operation" tab="操作审计日志">
          <n-card class="mb-4" content-style="padding-bottom: 0;">
            <QueryForm :model="operationSearch">
              <n-form-item label="模块">
                <n-input v-model:value="operationSearch.module" placeholder="模块" clearable />
              </n-form-item>
              <n-form-item label="动作">
                <n-select v-model:value="operationSearch.action" :options="actionOptions" placeholder="动作" clearable />
              </n-form-item>
              <n-form-item label="用户ID">
                <n-input-number v-model:value="operationSearch.userId" placeholder="用户ID" clearable />
              </n-form-item>
              <n-form-item>
                <n-space>
                  <n-button type="primary" @click="handleOperationSearch">搜索</n-button>
                  <n-button @click="handleOperationReset">重置</n-button>
                </n-space>
              </n-form-item>
            </QueryForm>
          </n-card>

          <n-card>
            <n-data-table :columns="operationColumns" :data="operationList" :loading="operationLoading"
              :pagination="operationPagination" remote @update:page="handleOperationPageChange"
              @update:page-size="handleOperationPageSizeChange" />
          </n-card>
        </n-tab-pane>

        <n-tab-pane name="login" tab="登录安全日志">
          <n-card class="mb-4" content-style="padding-bottom: 0;">
            <QueryForm :model="loginSearch">
              <n-form-item label="类型">
                <n-select v-model:value="loginSearch.type" :options="loginTypeOptions" placeholder="类型" clearable />
              </n-form-item>
              <n-form-item label="用户ID">
                <n-input-number v-model:value="loginSearch.userId" placeholder="用户ID" clearable />
              </n-form-item>
              <n-form-item label="结果">
                <n-select v-model:value="loginSearch.success" :options="successOptions" placeholder="结果" clearable />
              </n-form-item>
              <n-form-item>
                <n-space>
                  <n-button type="primary" @click="handleLoginSearch">搜索</n-button>
                  <n-button @click="handleLoginReset">重置</n-button>
                </n-space>
              </n-form-item>
            </QueryForm>
          </n-card>

          <n-card>
            <n-data-table :columns="loginColumns" :data="loginList" :loading="loginLoading"
              :pagination="loginPagination" remote @update:page="handleLoginPageChange"
              @update:page-size="handleLoginPageSizeChange" />
          </n-card>
        </n-tab-pane>
      </n-tabs>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, h, onMounted } from 'vue';
import { useMessage, NTag, NButton, NSpace } from 'naive-ui';
import type { DataTableColumns, DataTableRowData } from 'naive-ui';
import QueryForm from '@/components/common/QueryForm.vue';
import { getOperationLogs, getLoginLogs, type OperationLog, type LoginLog } from '@/api/system-logs';

const message = useMessage();

const activeTab = ref('operation');

// ==================== 操作审计日志 ====================
const actionOptions = [
  { label: '创建', value: 'CREATE' },
  { label: '更新', value: 'UPDATE' },
  { label: '删除', value: 'DELETE' },
  { label: '登录', value: 'LOGIN' },
  { label: '登出', value: 'LOGOUT' },
  { label: '导出', value: 'EXPORT' },
  { label: '导入', value: 'IMPORT' },
  { label: '审批', value: 'APPROVE' },
  { label: '拒绝', value: 'REJECT' },
  { label: '取消', value: 'CANCEL' },
  { label: '其他', value: 'OTHER' },
];

const operationSearch = reactive({
  module: '',
  action: undefined as string | undefined,
  userId: undefined as number | undefined,
  page: 1,
  pageSize: 10,
});

const operationLoading = ref(false);
const operationList = ref<OperationLog[]>([]);
const operationPagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
});

const operationColumns: DataTableColumns<OperationLog> = [
  { title: 'ID', key: 'id', width: 60 },
  { title: '用户', key: 'username', width: 120 },
  { title: '模块', key: 'module', width: 120 },
  {
    title: '动作',
    key: 'action',
    width: 100,
    render(row: DataTableRowData) {
      const label = actionOptions.find(o => o.value === row.action)?.label || row.action;
      return h(NTag, { type: 'info', size: 'small' }, { default: () => label });
    },
  },
  { title: '目标ID', key: 'targetId', width: 120, ellipsis: { tooltip: true } },
  { title: '描述', key: 'description', ellipsis: { tooltip: true } },
  { title: 'IP', key: 'ip', width: 140 },
  { title: '耗时(ms)', key: 'duration', width: 100 },
  { title: '时间', key: 'createdAt', width: 180 },
  {
    title: '详情',
    key: 'actions',
    width: 80,
    render(row: DataTableRowData) {
      return h(
        NButton,
        { text: true, type: 'primary', size: 'small', onClick: () => showDetail(row as OperationLog) },
        { default: () => '详情' }
      );
    },
  },
];

async function loadOperationLogs() {
  operationLoading.value = true;
  try {
    const res: any = await getOperationLogs(operationSearch);
    operationList.value = res.list || [];
    operationPagination.itemCount = res.total || 0;
    operationPagination.page = res.page || 1;
    operationPagination.pageSize = res.pageSize || 10;
  } finally {
    operationLoading.value = false;
  }
}

function handleOperationSearch() {
  operationSearch.page = 1;
  loadOperationLogs();
}

function handleOperationReset() {
  operationSearch.module = '';
  operationSearch.action = undefined;
  operationSearch.userId = undefined;
  operationSearch.page = 1;
  loadOperationLogs();
}

function handleOperationPageChange(page: number) {
  operationSearch.page = page;
  loadOperationLogs();
}

function handleOperationPageSizeChange(pageSize: number) {
  operationSearch.pageSize = pageSize;
  operationSearch.page = 1;
  loadOperationLogs();
}

// ==================== 登录安全日志 ====================
const loginTypeOptions = [
  { label: '登录', value: 'LOGIN' },
  { label: '登出', value: 'LOGOUT' },
  { label: '改密', value: 'PASSWORD_CHANGE' },
  { label: 'Token过期', value: 'TOKEN_EXPIRED' },
  { label: 'Token刷新', value: 'TOKEN_REFRESH' },
];

const successOptions = [
  { label: '成功', value: 'true' },
  { label: '失败', value: 'false' },
];

const loginSearch = reactive({
  type: undefined as string | undefined,
  userId: undefined as number | undefined,
  success: undefined as string | undefined,
  page: 1,
  pageSize: 10,
});

const loginLoading = ref(false);
const loginList = ref<LoginLog[]>([]);
const loginPagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
});

const loginColumns: DataTableColumns<LoginLog> = [
  { title: 'ID', key: 'id', width: 60 },
  { title: '用户', key: 'username', width: 120 },
  {
    title: '类型',
    key: 'type',
    width: 120,
    render(row: DataTableRowData) {
      const label = loginTypeOptions.find(o => o.value === row.type)?.label || row.type;
      return h(NTag, { type: 'info', size: 'small' }, { default: () => label });
    },
  },
  {
    title: '结果',
    key: 'success',
    width: 100,
    render(row: DataTableRowData) {
      const success = row.success as boolean;
      return h(NTag, { type: success ? 'success' : 'error', size: 'small' }, { default: () => success ? '成功' : '失败' });
    },
  },
  { title: 'IP', key: 'ip', width: 140 },
  { title: '失败原因', key: 'failReason', ellipsis: { tooltip: true } },
  { title: 'User-Agent', key: 'userAgent', ellipsis: { tooltip: true } },
  { title: '时间', key: 'createdAt', width: 180 },
];

async function loadLoginLogs() {
  loginLoading.value = true;
  try {
    const params: any = { ...loginSearch };
    if (params.success !== undefined) {
      params.success = params.success === 'true';
    }
    const res: any = await getLoginLogs(params);
    loginList.value = res.list || [];
    loginPagination.itemCount = res.total || 0;
    loginPagination.page = res.page || 1;
    loginPagination.pageSize = res.pageSize || 10;
  } finally {
    loginLoading.value = false;
  }
}

function handleLoginSearch() {
  loginSearch.page = 1;
  loadLoginLogs();
}

function handleLoginReset() {
  loginSearch.type = undefined;
  loginSearch.userId = undefined;
  loginSearch.success = undefined;
  loginSearch.page = 1;
  loadLoginLogs();
}

function handleLoginPageChange(page: number) {
  loginSearch.page = page;
  loadLoginLogs();
}

function handleLoginPageSizeChange(pageSize: number) {
  loginSearch.pageSize = pageSize;
  loginSearch.page = 1;
  loadLoginLogs();
}

// ==================== 通用 ====================
function showDetail(row: OperationLog) {
  const detail = JSON.stringify({ oldValue: row.oldValue, newValue: row.newValue }, null, 2);
  message.info('变更详情：' + detail);
}

onMounted(() => {
  loadOperationLogs();
  loadLoginLogs();
});
</script>

<style scoped>
:deep(.n-tabs-nav) {
  justify-content: flex-start !important;
}
:deep(.n-tabs-tab) {
  flex: 0 0 auto !important;
  padding: 0 16px 12px 16px !important;
}
:deep(.n-tabs-pad) {
  padding-top: 16px !important;
}
</style>
