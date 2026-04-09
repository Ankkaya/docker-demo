<template>
  <div class="p-4">
    <!-- 搜索栏 -->
    <n-card class="mb-4">
      <QueryForm :model="searchForm">
        <n-form-item label="关键词">
          <n-input v-model:value="searchForm.keyword" placeholder="采购单号" clearable />
        </n-form-item>
        <n-form-item label="供应商">
          <n-select
            v-model:value="searchForm.supplierId"
            :options="supplierOptions"
            placeholder="选择供应商"
            clearable
          />
        </n-form-item>
        <n-form-item label="状态">
          <n-select
            v-model:value="searchForm.status"
            :options="statusOptions"
            placeholder="选择状态"
            clearable
          />
        </n-form-item>
        <n-form-item>
          <n-space>
            <n-button type="primary" @click="handleSearch">搜索</n-button>
            <n-button @click="handleReset">重置</n-button>
          </n-space>
        </n-form-item>
      </QueryForm>
    </n-card>

    <!-- 操作栏 -->
    <n-card class="mb-4">
      <n-space>
        <n-button type="primary" @click="handleCreate">新增采购订单</n-button>
      </n-space>
    </n-card>

    <!-- 采购订单列表 -->
    <n-card>
      <n-data-table
        :columns="columns"
        :data="purchaseList"
        :loading="loading"
        :pagination="pagination"
        :scroll-x="tableScrollX"
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
        remote
      />
    </n-card>

    <!-- 创建/编辑弹窗 -->
    <n-modal
      v-model:show="modalVisible"
      :title="modalTitle"
      preset="card"
      style="width: 900px; max-width: 95vw"
      :mask-closable="false"
    >
      <PurchaseForm
        v-if="modalVisible"
        :initial-data="currentPurchase"
        @success="handleFormSuccess"
        @cancel="modalVisible = false"
      />
    </n-modal>

    <!-- 详情抽屉 -->
    <n-drawer v-model:show="detailVisible" width="800" :mask-closable="false">
      <n-drawer-content title="采购订单详情" closable>
        <PurchaseDetail v-if="detailVisible" :purchase-id="currentPurchaseId" />
      </n-drawer-content>
    </n-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, h, onMounted } from 'vue';
import { NButton, NSpace, NTag, NPopconfirm, useMessage } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import QueryForm from '@/components/common/QueryForm.vue';
import { getPurchases, deletePurchase, auditPurchase, cancelPurchase } from '@/api/purchase';
import { getSuppliers } from '@/api/supplier';
import PurchaseForm from './components/PurchaseForm.vue';
import PurchaseDetail from './components/PurchaseDetail.vue';
import type { Purchase, PurchaseStatus } from '@/types/purchase';
import type { Supplier } from '@/types/basic-data';
import { autoFitTableColumns, createActionColumn, getTableScrollX } from '@/utils/table';

const message = useMessage();

// 搜索表单
const searchForm = reactive({
  keyword: '',
  supplierId: null as number | null,
  status: null as PurchaseStatus | null,
});

// 选项数据
const supplierOptions = ref<{ label: string; value: number }[]>([]);

const statusOptions = [
  { label: '待审核', value: 'PENDING' },
  { label: '已审核', value: 'APPROVED' },
  { label: '部分入库', value: 'PARTIAL' },
  { label: '已完成', value: 'COMPLETED' },
  { label: '已取消', value: 'CANCELLED' },
];

// 列表数据
const loading = ref(false);
const purchaseList = ref<Purchase[]>([]);
const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
});

// 弹窗控制
const modalVisible = ref(false);
const modalTitle = ref('新增采购订单');
const currentPurchase = ref<Purchase | undefined>(undefined);
const detailVisible = ref(false);
const currentPurchaseId = ref<number>(0);

const unwrapPaginatedList = <T>(payload: unknown): { data: T[]; meta: { total: number } } => {
  const raw = payload as any;
  if (Array.isArray(raw?.data)) {
    return {
      data: raw.data,
      meta: raw.meta || { total: raw.data.length },
    };
  }

  const nested = raw?.data as { data?: T[]; meta?: { total: number } } | undefined;
  if (Array.isArray(nested?.data)) {
    return {
      data: nested.data,
      meta: nested.meta || { total: nested.data.length },
    };
  }

  return {
    data: [],
    meta: { total: 0 },
  };
};

const unwrapList = <T>(payload: unknown): T[] => {
  const raw = payload as { data?: T[] } | T[];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  return [];
};

// 表格列定义
const columns: DataTableColumns<Purchase> = autoFitTableColumns([
  {
    title: '采购单号',
    key: 'orderNo',
  },
  {
    title: '供应商',
    key: 'supplierName',
  },
  {
    title: '入库仓库',
    key: 'warehouseName',
  },
  {
    title: '总金额',
    key: 'totalAmount',
    render(row) {
      return `¥${row.totalAmount.toFixed(2)}`;
    },
  },
  {
    title: '应付金额',
    key: 'payable',
    render(row) {
      return `¥${row.payable.toFixed(2)}`;
    },
  },
  {
    title: '已付金额',
    key: 'paid',
    render(row) {
      return `¥${row.paid.toFixed(2)}`;
    },
  },
  {
    title: '状态',
    key: 'status',
    render(row) {
      const statusMap: Record<PurchaseStatus, { type: 'default' | 'warning' | 'success' | 'error'; label: string }> = {
        PENDING: { type: 'warning', label: '待审核' },
        APPROVED: { type: 'success', label: '已审核' },
        PARTIAL: { type: 'warning', label: '部分入库' },
        COMPLETED: { type: 'success', label: '已完成' },
        CANCELLED: { type: 'default', label: '已取消' },
      };
      const status = statusMap[row.status];
      return h(NTag, { type: status.type, size: 'small' }, { default: () => status.label });
    },
  },
  {
    title: '下单日期',
    key: 'orderDate',
    render(row) {
      return new Date(row.orderDate).toLocaleString();
    },
  },
  createActionColumn<Purchase>({
    title: '操作',
    key: 'actions',
    fixed: 'right',
    render(row) {
      const buttons: any[] = [];
      
      // 详情按钮
      buttons.push(
        h(NButton, { size: 'small', onClick: () => handleDetail(row) }, { default: () => '详情' })
      );
      
      // 待审核状态的操作
      if (row.status === 'PENDING') {
        buttons.push(
          h(NButton, { size: 'small', type: 'primary', onClick: () => handleEdit(row) }, { default: () => '编辑' }),
          h(NButton, { size: 'small', type: 'success', onClick: () => handleAudit(row, 'APPROVE') }, { default: () => '审核' }),
          h(
            NPopconfirm,
            { onPositiveClick: () => handleDelete(row) },
            {
              trigger: () => h(NButton, { size: 'small', type: 'error' }, { default: () => '删除' }),
              default: () => '确定删除该采购订单吗？',
            }
          )
        );
      }
      
      // 已审核/部分入库状态的操作
      if (row.status === 'APPROVED' || row.status === 'PARTIAL') {
        buttons.push(
          h(NButton, { size: 'small', type: 'warning', onClick: () => handleCancel(row) }, { default: () => '取消' })
        );
      }
      
      return h(NSpace, { size: 'small' }, { default: () => buttons });
    },
  }, 4),
]);
const tableScrollX = getTableScrollX(columns);

// 加载列表
const loadData = async () => {
  loading.value = true;
  try {
    const res = await getPurchases({
      keyword: searchForm.keyword || undefined,
      supplierId: searchForm.supplierId || undefined,
      status: searchForm.status || undefined,
      page: pagination.page,
      pageSize: pagination.pageSize,
    });
    const result = unwrapPaginatedList<Purchase>(res);
    purchaseList.value = result.data;
    pagination.itemCount = result.meta.total;
  } finally {
    loading.value = false;
  }
};

// 加载供应商选项
const loadSuppliers = async () => {
  try {
    const res = await getSuppliers();
    supplierOptions.value = unwrapList<Supplier>(res)
      .filter((s: Supplier) => s.isEnabled)
      .map((s: Supplier) => ({
        label: s.name,
        value: s.id,
      }));
  } catch (error) {
    console.error('加载供应商失败:', error);
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
  searchForm.supplierId = null;
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

// 新增
const handleCreate = () => {
  modalTitle.value = '新增采购订单';
  currentPurchase.value = undefined;
  modalVisible.value = true;
};

// 编辑
const handleEdit = (row: Purchase) => {
  modalTitle.value = '编辑采购订单';
  currentPurchase.value = row;
  modalVisible.value = true;
};

// 详情
const handleDetail = (row: Purchase) => {
  currentPurchaseId.value = row.id;
  detailVisible.value = true;
};

// 审核
const handleAudit = async (row: Purchase, action: 'APPROVE' | 'REJECT') => {
  try {
    await auditPurchase(row.id, { action });
    message.success(action === 'APPROVE' ? '审核通过' : '已拒绝');
    loadData();
  } catch (error) {
    message.error('操作失败');
  }
};

// 取消
const handleCancel = async (row: Purchase) => {
  try {
    await cancelPurchase(row.id);
    message.success('已取消');
    loadData();
  } catch (error) {
    message.error('取消失败');
  }
};

// 删除
const handleDelete = async (row: Purchase) => {
  try {
    await deletePurchase(row.id);
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
  loadSuppliers();
});
</script>
