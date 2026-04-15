<template>
  <div class="page-container">
    <n-card title="余额流水" class="page-card">
      <n-form inline :model="searchForm" class="search-form">
        <n-form-item label="关键词">
          <n-input
            v-model:value="searchForm.keyword"
            placeholder="客户名称/编码/手机号/单号"
            clearable
            style="width: 240px"
          />
        </n-form-item>
        <n-form-item label="类型">
          <n-select
            v-model:value="searchForm.type"
            :options="typeOptions"
            placeholder="全部类型"
            clearable
            style="width: 180px"
          />
        </n-form-item>
        <n-form-item label="账户ID">
          <n-input-number
            v-model:value="searchForm.accountId"
            clearable
            style="width: 140px"
          />
        </n-form-item>
        <n-form-item>
          <n-space>
            <n-button type="primary" @click="handleSearch">查询</n-button>
            <n-button @click="handleReset">重置</n-button>
          </n-space>
        </n-form-item>
      </n-form>

      <n-data-table
        :columns="columns"
        :data="tableData"
        :loading="loading"
        :pagination="pagination"
        :row-key="(row: BalanceLog) => row.id"
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
      />
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { h, onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import type { DataTableColumns } from 'naive-ui';
import { NTag, useMessage } from 'naive-ui';
import { getBalanceLogs } from '@/api/balance';
import type { BalanceLog, BalanceLogType } from '@/types/balance';

const route = useRoute();
const message = useMessage();

const loading = ref(false);
const tableData = ref<BalanceLog[]>([]);
const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
});

const searchForm = reactive<{
  keyword: string;
  type: BalanceLogType | null;
  accountId: number | null;
}>({
  keyword: '',
  type: null,
  accountId: null,
});

const typeOptions = [
  { label: '充值', value: 'RECHARGE' },
  { label: '消费', value: 'CONSUME' },
  { label: '退款', value: 'REFUND' },
  { label: '后台加款', value: 'ADJUST_INCREASE' },
  { label: '后台扣减', value: 'ADJUST_DECREASE' },
];

const columns: DataTableColumns<BalanceLog> = [
  { title: '流水ID', key: 'id', width: 90 },
  { title: '账户ID', key: 'accountId', width: 90 },
  {
    title: '客户信息',
    key: 'customer',
    minWidth: 220,
    render(row) {
      return h('div', [
        h('div', { style: 'font-weight: 600;' }, row.customerName),
        h('div', { style: 'color: #999; font-size: 12px;' }, `编码: ${row.customerCode}`),
        h('div', { style: 'color: #999; font-size: 12px;' }, row.customerPhone || '-'),
      ]);
    },
  },
  {
    title: '类型',
    key: 'typeText',
    width: 120,
    render(row) {
      const type = row.type === 'ADJUST_DECREASE' ? 'warning' : row.type === 'ADJUST_INCREASE' ? 'success' : 'default';
      return h(NTag, { type, size: 'small' }, { default: () => row.typeText });
    },
  },
  {
    title: '变动金额',
    key: 'changeAmount',
    width: 120,
    render: row => `¥${Number(row.changeAmount).toFixed(2)}`,
  },
  {
    title: '变动前',
    key: 'balanceBefore',
    width: 120,
    render: row => `¥${Number(row.balanceBefore).toFixed(2)}`,
  },
  {
    title: '变动后',
    key: 'balanceAfter',
    width: 120,
    render: row => `¥${Number(row.balanceAfter).toFixed(2)}`,
  },
  {
    title: '业务单号',
    key: 'bizNo',
    width: 160,
    render: row => row.bizNo || '-',
  },
  {
    title: '备注',
    key: 'remark',
    minWidth: 180,
    render: row => row.remark || '-',
  },
  {
    title: '创建时间',
    key: 'createdAt',
    width: 180,
    render: row => formatDateTime(row.createdAt),
  },
];

async function loadData() {
  loading.value = true;
  try {
    const res = await getBalanceLogs({
      keyword: searchForm.keyword || undefined,
      type: searchForm.type || undefined,
      accountId: searchForm.accountId || undefined,
      page: pagination.page,
      pageSize: pagination.pageSize,
    });
    tableData.value = res.data;
    pagination.itemCount = res.meta.total;
  } catch (error: any) {
    message.error(error.message || '加载余额流水失败');
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  pagination.page = 1;
  loadData();
}

function handleReset() {
  searchForm.keyword = '';
  searchForm.type = null;
  searchForm.accountId = null;
  pagination.page = 1;
  loadData();
}

function handlePageChange(page: number) {
  pagination.page = page;
  loadData();
}

function handlePageSizeChange(pageSize: number) {
  pagination.pageSize = pageSize;
  pagination.page = 1;
  loadData();
}

function formatDateTime(value: string) {
  return value ? new Date(value).toLocaleString('zh-CN') : '-';
}

onMounted(async () => {
  const accountId = Number(route.query.accountId || 0);
  if (accountId > 0) {
    searchForm.accountId = accountId;
  }
  await loadData();
});
</script>

<style scoped>
.search-form {
  margin-bottom: 16px;
}
</style>
