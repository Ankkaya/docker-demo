<template>
  <div class="p-4">
    <n-card class="mb-4" content-style="padding-bottom: 0;">
      <QueryForm :model="searchForm" @search="handleSearch">
        <n-form-item label="关键词">
          <n-input
            v-model:value="searchForm.keyword"
            placeholder="客户名称/手机号"
            clearable
          />
        </n-form-item>
        <n-form-item label="状态">
          <n-select
            v-model:value="searchForm.status"
            :options="statusOptions"
            placeholder="全部状态"
            clearable
          />
        </n-form-item>
        <n-form-item>
          <n-space>
            <n-button type="primary" @click="handleSearch">查询</n-button>
            <n-button @click="handleReset">重置</n-button>
          </n-space>
        </n-form-item>
      </QueryForm>
    </n-card>

    <n-card class="mb-4">
      <n-space>
        <n-button type="primary" @click="openCreateModal">开通余额账户</n-button>
        <n-button @click="router.push('/balances/recharges')">充值单</n-button>
      </n-space>
    </n-card>

    <n-card>
      <n-data-table
        :columns="columns"
        :data="tableData"
        :loading="loading"
        :pagination="pagination"
        :row-key="(row: BalanceAccount) => row.id"
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
      />
    </n-card>

    <n-modal v-model:show="createModalVisible" preset="dialog" title="开通余额账户" positive-text="确定" negative-text="取消" @positive-click="handleCreateAccount">
      <n-form :model="createForm" label-width="90">
        <n-form-item label="客户">
          <n-select
            v-model:value="createForm.customerId"
            :options="customerOptions"
            filterable
            placeholder="请选择客户"
          />
        </n-form-item>
        <n-form-item label="备注">
          <n-input v-model:value="createForm.remark" type="textarea" placeholder="开户备注（可选）" />
        </n-form-item>
      </n-form>
    </n-modal>

    <n-modal
      v-model:show="adjustModalVisible"
      preset="dialog"
      title="余额调账"
      style="width: 620px"
      positive-text="确定"
      negative-text="取消"
      @positive-click="handleAdjustAccount"
    >
      <div class="adjust-modal-body">
        <n-form :model="adjustForm" label-width="92" label-placement="left">
        <n-form-item label="账户">
          <div class="account-summary">{{ currentAccountLabel }}</div>
        </n-form-item>
        <n-form-item label="方向">
          <n-radio-group v-model:value="adjustForm.direction">
            <n-radio-button value="INCREASE">加款</n-radio-button>
            <n-radio-button value="DECREASE">扣减</n-radio-button>
          </n-radio-group>
        </n-form-item>
        <n-form-item label="金额">
          <n-input-number v-model:value="adjustForm.amount" :min="0.01" :precision="2" style="width: 100%" />
        </n-form-item>
        <n-form-item label="业务单号">
          <n-input v-model:value="adjustForm.bizNo" placeholder="可选" />
        </n-form-item>
        <n-form-item label="备注">
          <n-input v-model:value="adjustForm.remark" type="textarea" placeholder="请输入调账说明" />
        </n-form-item>
        </n-form>
      </div>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import type { DataTableColumns, SelectOption } from 'naive-ui';
import { NButton, NSpace, NTag, useMessage } from 'naive-ui';
import QueryForm from '@/components/common/QueryForm.vue';
import { createBalanceAccount, adjustBalanceAccount, getBalanceAccounts } from '@/api/balance';
import { getCustomers } from '@/api/customer';
import type { Customer } from '@/types/basic-data';
import type { BalanceAccount, BalanceAccountStatus } from '@/types/balance';

const message = useMessage();
const router = useRouter();

const loading = ref(false);
const tableData = ref<BalanceAccount[]>([]);
const customers = ref<Customer[]>([]);
const createModalVisible = ref(false);
const adjustModalVisible = ref(false);
const currentAccount = ref<BalanceAccount | null>(null);

const searchForm = reactive<{
  keyword: string;
  status: BalanceAccountStatus | null;
}>({
  keyword: '',
  status: null,
});

const createForm = reactive({
  customerId: null as number | null,
  remark: '',
});

const adjustForm = reactive({
  direction: 'INCREASE' as 'INCREASE' | 'DECREASE',
  amount: null as number | null,
  bizType: 'MANUAL',
  bizNo: '',
  remark: '',
});

const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
});

const statusOptions = [
  { label: '启用', value: 'ACTIVE' },
  { label: '停用', value: 'DISABLED' },
];

const customerOptions = computed<SelectOption[]>(() => {
  return customers.value.map(customer => ({
    label: `${customer.name} (${customer.code}${customer.phone ? ` / ${customer.phone}` : ''})`,
    value: customer.id,
  }));
});

const currentAccountLabel = computed(() => {
  if (!currentAccount.value) {
    return '-';
  }
  return `${currentAccount.value.customer.name} / ${currentAccount.value.customer.code}`;
});

const columns: DataTableColumns<BalanceAccount> = [
  {
    title: '客户信息',
    key: 'customer',
    width: 180,
    render(row) {
      return h('div', [
        h('div', { style: 'font-weight: 600;' }, row.customer.name),
        h('div', { style: 'color: #999; font-size: 12px;' }, `编码: ${row.customer.code}`),
        h('div', { style: 'color: #999; font-size: 12px;' }, row.customer.phone || '-'),
      ]);
    },
  },
  {
    title: '可用余额',
    key: 'availableBalance',
    width: 120,
    render: row => `¥${Number(row.availableBalance).toFixed(2)}`,
  },
  {
    title: '累计充值',
    key: 'totalRecharged',
    width: 120,
    render: row => `¥${Number(row.totalRecharged).toFixed(2)}`,
  },
  {
    title: '累计赠送',
    key: 'totalPresented',
    width: 120,
    render: row => `¥${Number(row.totalPresented).toFixed(2)}`,
  },
  {
    title: '累计消费',
    key: 'totalConsumed',
    width: 120,
    render: row => `¥${Number(row.totalConsumed).toFixed(2)}`,
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render(row) {
      return h(
        NTag,
        { type: row.status === 'ACTIVE' ? 'success' : 'warning', size: 'small' },
        { default: () => (row.status === 'ACTIVE' ? '启用' : '停用') },
      );
    },
  },
  {
    title: '更新时间',
    key: 'updatedAt',
    width: 180,
    render: row => formatDateTime(row.updatedAt),
  },
  {
    title: '操作',
    key: 'actions',
    width: 180,
    render(row) {
      return h(NSpace, null, {
        default: () => [
          h(
            NButton,
            {
              size: 'small',
              type: 'primary',
              onClick: () => openAdjustModal(row),
            },
            { default: () => '调账' },
          ),
          h(
            NButton,
            {
              size: 'small',
              onClick: () => openLogPage(row),
            },
            { default: () => '流水' },
          ),
        ],
      });
    },
  },
];

async function loadCustomers() {
  customers.value = await getCustomers();
}

async function loadData() {
  loading.value = true;
  try {
    const res = await getBalanceAccounts({
      keyword: searchForm.keyword || undefined,
      status: searchForm.status || undefined,
      page: pagination.page,
      pageSize: pagination.pageSize,
    });
    tableData.value = res.data;
    pagination.itemCount = res.meta.total;
  } catch (error: any) {
    message.error(error.message || '加载余额账户失败');
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
  searchForm.status = null;
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

function openCreateModal() {
  createForm.customerId = null;
  createForm.remark = '';
  createModalVisible.value = true;
}

async function handleCreateAccount() {
  if (!createForm.customerId) {
    message.error('请选择客户');
    return false;
  }

  try {
    await createBalanceAccount({
      customerId: createForm.customerId,
      remark: createForm.remark || undefined,
    });
    message.success('余额账户已开通');
    createModalVisible.value = false;
    await loadData();
    return true;
  } catch (error: any) {
    message.error(error.message || '开通余额账户失败');
    return false;
  }
}

function openAdjustModal(row: BalanceAccount) {
  currentAccount.value = row;
  adjustForm.direction = 'INCREASE';
  adjustForm.amount = null;
  adjustForm.bizType = 'MANUAL';
  adjustForm.bizNo = '';
  adjustForm.remark = '';
  adjustModalVisible.value = true;
}

async function handleAdjustAccount() {
  if (!currentAccount.value) {
    return false;
  }

  if (!adjustForm.amount || adjustForm.amount <= 0) {
    message.error('请输入正确的金额');
    return false;
  }

  try {
    await adjustBalanceAccount(currentAccount.value.id, {
      direction: adjustForm.direction,
      amount: adjustForm.amount,
      bizType: adjustForm.bizType || undefined,
      bizNo: adjustForm.bizNo || undefined,
      remark: adjustForm.remark || undefined,
    });
    message.success('调账成功');
    adjustModalVisible.value = false;
    await loadData();
    return true;
  } catch (error: any) {
    message.error(error.message || '调账失败');
    return false;
  }
}

function openLogPage(row: BalanceAccount) {
  router.push({
    name: 'balance-logs',
    query: {
      accountId: String(row.id),
    },
  });
}

function formatDateTime(value: string) {
  return value ? new Date(value).toLocaleString('zh-CN') : '-';
}

onMounted(async () => {
  await loadCustomers();
  await loadData();
});
</script>

<style scoped>
.adjust-modal-body {
  padding-top: 8px;
}

.account-summary {
  min-height: 34px;
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0 12px;
  border-radius: 6px;
  background-color: #f8fafc;
  color: #334155;
}
</style>
