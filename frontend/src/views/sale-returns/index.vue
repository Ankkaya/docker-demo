<template>
  <div class="p-4">
    <!-- 搜索栏 -->
    <n-card class="mb-4">
      <QueryForm :model="searchForm">
        <n-form-item label="关键词">
          <n-input v-model:value="searchForm.keyword" placeholder="退货单号" clearable />
        </n-form-item>
        <n-form-item label="客户">
          <n-select
            v-model:value="searchForm.customerId"
            :options="customerOptions"
            placeholder="选择客户"
            clearable
            style="width: 180px"
          />
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
      </QueryForm>
    </n-card>

    <!-- 操作栏 -->
    <n-card class="mb-4">
      <n-space>
        <n-button type="primary" @click="handleCreate">新增销售退货单</n-button>
      </n-space>
    </n-card>

    <!-- 退货单列表 -->
    <n-card>
      <n-data-table
        :columns="columns"
        :data="returnList"
        :loading="loading"
        :pagination="pagination"
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
      <SaleReturnForm
        v-if="modalVisible"
        :initial-data="currentReturn"
        @success="handleFormSuccess"
        @cancel="modalVisible = false"
      />
    </n-modal>

    <!-- 详情抽屉 -->
    <n-drawer v-model:show="detailVisible" width="800" :mask-closable="false">
      <n-drawer-content title="销售退货单详情" closable>
        <SaleReturnDetail v-if="detailVisible" :return-id="currentReturnId" />
      </n-drawer-content>
    </n-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, h, onMounted } from 'vue';
import { NButton, NSpace, NTag, NPopconfirm, useMessage } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import QueryForm from '@/components/common/QueryForm.vue';
import {
  getSaleReturns,
  deleteSaleReturn,
  auditSaleReturn,
  completeSaleReturn,
  cancelSaleReturn,
} from '@/api/order';
import { getCustomers } from '@/api/customer';
import SaleReturnForm from './components/SaleReturnForm.vue';
import SaleReturnDetail from './components/SaleReturnDetail.vue';
import type { SaleReturn, ReturnStatus } from '@/types/purchase';
import type { Customer } from '@/types/basic-data';

const message = useMessage();

// 搜索表单
const searchForm = reactive({
  keyword: '',
  customerId: null as number | null,
  status: null as ReturnStatus | null,
});

// 选项数据
const customerOptions = ref<{ label: string; value: number }[]>();

const statusOptions = [
  { label: '待审核', value: 'PENDING' },
  { label: '已审核', value: 'APPROVED' },
  { label: '已完成', value: 'COMPLETED' },
  { label: '已取消', value: 'CANCELLED' },
];

// 列表数据
const loading = ref(false);
const returnList = ref<SaleReturn[]>([]);
const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
});

// 弹窗控制
const modalVisible = ref(false);
const modalTitle = ref('新增销售退货单');
const currentReturn = ref<SaleReturn | undefined>(undefined);
const detailVisible = ref(false);
const currentReturnId = ref<number>(0);

// 表格列定义
const columns: DataTableColumns<SaleReturn> = [
  {
    title: '退货单号',
    key: 'returnNo',
    width: 170,
  },
  {
    title: '关联发货单',
    key: 'shipmentNo',
    width: 160,
  },
  {
    title: '客户',
    key: 'customerName',
    width: 150,
  },
  {
    title: '退货仓库',
    key: 'warehouseName',
    width: 120,
  },
  {
    title: '退货金额',
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
      const statusMap: Record<ReturnStatus, { type: 'default' | 'warning' | 'success' | 'error'; label: string }> = {
        PENDING: { type: 'warning', label: '待审核' },
        APPROVED: { type: 'success', label: '已审核' },
        COMPLETED: { type: 'success', label: '已完成' },
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
    width: 320,
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
              default: () => '确定删除该退货单吗？',
            }
          )
        );
      }
      
      // 已审核状态的操作
      if (row.status === 'APPROVED') {
        buttons.push(
          h(NButton, { size: 'small', type: 'info', onClick: () => handleComplete(row) }, { default: () => '完成' }),
          h(NButton, { size: 'small', type: 'warning', onClick: () => handleCancel(row) }, { default: () => '取消' })
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
    const res: any = await getSaleReturns({
      keyword: searchForm.keyword || undefined,
      customerId: searchForm.customerId || undefined,
      status: searchForm.status || undefined,
      page: pagination.page,
      pageSize: pagination.pageSize,
    });
    returnList.value = res.data.data;
    pagination.itemCount = res.data.meta.total;
  } finally {
    loading.value = false;
  }
};

// 加载客户选项
const loadCustomers = async () => {
  try {
    const res: any = await getCustomers();
    const list = res.data.data || [];
    customerOptions.value = list
      .filter((c: Customer) => c.isEnabled)
      .map((c: Customer) => ({
        label: c.name,
        value: c.id,
      }));
  } catch (error) {
    console.error('加载客户失败:', error);
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
  searchForm.customerId = null;
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
  modalTitle.value = '新增销售退货单';
  currentReturn.value = undefined;
  modalVisible.value = true;
};

// 编辑
const handleEdit = (row: SaleReturn) => {
  modalTitle.value = '编辑销售退货单';
  currentReturn.value = row;
  modalVisible.value = true;
};

// 详情
const handleDetail = (row: SaleReturn) => {
  currentReturnId.value = row.id;
  detailVisible.value = true;
};

// 审核
const handleAudit = async (row: SaleReturn, action: 'APPROVE' | 'REJECT') => {
  try {
    await auditSaleReturn(row.id, { action });
    message.success(action === 'APPROVE' ? '审核通过' : '已拒绝');
    loadData();
  } catch (error) {
    message.error('操作失败');
  }
};

// 完成
const handleComplete = async (row: SaleReturn) => {
  try {
    await completeSaleReturn(row.id);
    message.success('已完成');
    loadData();
  } catch (error) {
    message.error('操作失败');
  }
};

// 取消
const handleCancel = async (row: SaleReturn) => {
  try {
    await cancelSaleReturn(row.id);
    message.success('已取消');
    loadData();
  } catch (error) {
    message.error('取消失败');
  }
};

// 删除
const handleDelete = async (row: SaleReturn) => {
  try {
    await deleteSaleReturn(row.id);
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
  loadCustomers();
});
</script>
