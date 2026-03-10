<template>
  <div class="p-4">
    <!-- 搜索栏 -->
    <n-card class="mb-4">
      <n-form inline :model="searchForm" label-placement="left">
        <n-form-item label="关键词">
          <n-input v-model:value="searchForm.keyword" placeholder="入库单号" clearable />
        </n-form-item>
        <n-form-item label="状态">
          <n-select
            v-model:value="searchForm.status"
            :options="statusOptions"
            placeholder="选择状态"
            clearable
            style="width: 150px"
          />
        </n-form-item>
        <n-form-item>
          <n-space>
            <n-button type="primary" @click="handleSearch">搜索</n-button>
            <n-button @click="handleReset">重置</n-button>
          </n-space>
        </n-form-item>
      </n-form>
    </n-card>

    <!-- 入库单列表 -->
    <n-card>
      <n-data-table
        :columns="columns"
        :data="receiptList"
        :loading="loading"
        :pagination="pagination"
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
        remote
      />
    </n-card>

    <!-- 创建入库单弹窗 -->
    <n-modal
      v-model:show="modalVisible"
      title="创建入库单"
      preset="card"
      style="width: 900px; max-width: 95vw"
      :mask-closable="false"
    >
      <ReceiptForm v-if="modalVisible" @success="handleFormSuccess" @cancel="modalVisible = false" />
    </n-modal>

    <!-- 详情抽屉 -->
    <n-drawer v-model:show="detailVisible" width="800" :mask-closable="false">
      <n-drawer-content title="入库单详情" closable>
        <ReceiptDetail v-if="detailVisible" :receipt-id="currentReceiptId" />
      </n-drawer-content>
    </n-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, h, onMounted } from 'vue';
import { NButton, NSpace, NTag, NPopconfirm, useMessage } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { getPurchaseReceipts, confirmReceipt, cancelReceipt, deleteReceipt } from '@/api/purchase';
import ReceiptForm from './components/ReceiptForm.vue';
import ReceiptDetail from './components/ReceiptDetail.vue';
import type { PurchaseReceipt, ReceiptStatus } from '@/types/purchase';

const message = useMessage();

// 搜索表单
const searchForm = reactive({
  keyword: '',
  status: null as ReceiptStatus | null,
});

const statusOptions = [
  { label: '待入库', value: 'PENDING' },
  { label: '已入库', value: 'RECEIVED' },
  { label: '已取消', value: 'CANCELLED' },
];

// 列表数据
const loading = ref(false);
const receiptList = ref<PurchaseReceipt[]>([]);
const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
});

// 弹窗控制
const modalVisible = ref(false);
const detailVisible = ref(false);
const currentReceiptId = ref<number>(0);

// 表格列定义
const columns: DataTableColumns<PurchaseReceipt> = [
  {
    title: '入库单号',
    key: 'receiptNo',
    width: 160,
  },
  {
    title: '采购单号',
    key: 'purchaseNo',
    width: 160,
  },
  {
    title: '供应商',
    key: 'supplierName',
    width: 150,
  },
  {
    title: '入库仓库',
    key: 'warehouseName',
    width: 120,
  },
  {
    title: '总金额',
    key: 'totalAmount',
    width: 120,
    render(row) {
      return `¥${row.totalAmount.toFixed(2)}`;
    },
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render(row) {
      const statusMap: Record<ReceiptStatus, { type: 'default' | 'warning' | 'success' | 'error'; label: string }> = {
        PENDING: { type: 'warning', label: '待入库' },
        RECEIVED: { type: 'success', label: '已入库' },
        CANCELLED: { type: 'default', label: '已取消' },
      };
      const status = statusMap[row.status];
      return h(NTag, { type: status.type, size: 'small' }, { default: () => status.label });
    },
  },
  {
    title: '创建时间',
    key: 'createdAt',
    width: 160,
    render(row) {
      return new Date(row.createdAt).toLocaleString();
    },
  },
  {
    title: '操作',
    key: 'actions',
    width: 250,
    fixed: 'right',
    render(row) {
      const buttons: any[] = [];
      
      // 详情按钮
      buttons.push(
        h(NButton, { size: 'small', onClick: () => handleDetail(row) }, { default: () => '详情' })
      );
      
      // 待入库状态的操作
      if (row.status === 'PENDING') {
        buttons.push(
          h(NButton, { size: 'small', type: 'success', onClick: () => handleConfirm(row) }, { default: () => '确认入库' }),
          h(NButton, { size: 'small', type: 'warning', onClick: () => handleCancel(row) }, { default: () => '取消' }),
          h(
            NPopconfirm,
            { onPositiveClick: () => handleDelete(row) },
            {
              trigger: () => h(NButton, { size: 'small', type: 'error' }, { default: () => '删除' }),
              default: () => '确定删除该入库单吗？',
            }
          )
        );
      }
      
      return h(NSpace, { size: 'small' }, { default: () => buttons });
    },
  },
];

// 加载列表
const loadData = async () => {
  loading.value = true;
  try {
    const res: any = await getPurchaseReceipts({
      keyword: searchForm.keyword || undefined,
      status: searchForm.status || undefined,
      page: pagination.page,
      pageSize: pagination.pageSize,
    });
    receiptList.value = res.data.data;
    pagination.itemCount = res.meta.total;
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  pagination.page = 1;
  loadData();
};

// 重置
const handleReset = () => {
  searchForm.keyword = '';
  searchForm.status = null;
  pagination.page = 1;
  loadData();
};

// 分页
const handlePageChange = (page: number) => {
  pagination.page = page;
  loadData();
};

const handlePageSizeChange = (pageSize: number) => {
  pagination.pageSize = pageSize;
  pagination.page = 1;
  loadData();
};

// 详情
const handleDetail = (row: PurchaseReceipt) => {
  currentReceiptId.value = row.id;
  detailVisible.value = true;
};

// 确认入库
const handleConfirm = async (row: PurchaseReceipt) => {
  try {
    await confirmReceipt(row.id);
    message.success('入库成功');
    loadData();
  } catch (error) {
    message.error('入库失败');
  }
};

// 取消
const handleCancel = async (row: PurchaseReceipt) => {
  try {
    await cancelReceipt(row.id);
    message.success('已取消');
    loadData();
  } catch (error) {
    message.error('取消失败');
  }
};

// 删除
const handleDelete = async (row: PurchaseReceipt) => {
  try {
    await deleteReceipt(row.id);
    message.success('删除成功');
    loadData();
  } catch (error) {
    message.error('删除失败');
  }
};

// 表单成功
const handleFormSuccess = () => {
  modalVisible.value = false;
  loadData();
};

onMounted(() => {
  loadData();
});
</script>
