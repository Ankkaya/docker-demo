<template>
  <div class="p-4">
    <!-- 搜索栏 -->
    <n-card class="mb-4" content-style="padding-bottom: 0;">
      <QueryForm :model="searchForm">
        <n-form-item label="关键词">
          <n-input v-model:value="searchForm.keyword" placeholder="订单号" clearable />
        </n-form-item>
        <n-form-item label="客户">
          <n-select v-model:value="searchForm.customerId" :options="customerOptions" placeholder="选择客户" clearable />
        </n-form-item>
        <n-form-item label="状态">
          <n-select v-model:value="searchForm.status" :options="statusOptions" placeholder="选择状态" clearable />
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
        <n-button type="primary" @click="handleCreate">新增销售订单</n-button>
      </n-space>
    </n-card>

    <!-- 订单列表 -->
    <n-card>
      <n-data-table :columns="columns" :data="orderList" :loading="loading" :pagination="pagination" :scroll-x="tableScrollX"
        @update:page="handlePageChange" @update:page-size="handlePageSizeChange" remote />
    </n-card>

    <!-- 创建/编辑弹窗 -->
    <n-modal v-model:show="modalVisible" :title="modalTitle" preset="card" style="width: 900px; max-width: 95vw"
      :mask-closable="false">
      <OrderForm v-if="modalVisible" :initial-data="currentOrder" @success="handleFormSuccess"
        @cancel="modalVisible = false" />
    </n-modal>

    <!-- 详情抽屉 -->
    <n-drawer v-model:show="detailVisible" width="800" :mask-closable="false">
      <n-drawer-content title="销售订单详情" closable>
        <OrderDetail v-if="detailVisible" :order-id="currentOrderId" />
      </n-drawer-content>
    </n-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, h, onMounted } from 'vue';
import { NButton, NSpace, NTag, NPopconfirm, useMessage } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import QueryForm from '@/components/common/QueryForm.vue';
import { getOrders, deleteOrder, confirmOrder, cancelOrder } from '@/api/order';
import { getCustomers } from '@/api/customer';
import { getPrintErrorMessage, printOrder } from '@/services/print/print-service';
import OrderForm from './components/OrderForm.vue';
import OrderDetail from './components/OrderDetail.vue';
import type { Order, OrderStatus } from '@/types/purchase';
import type { Customer } from '@/types/basic-data';
import { autoFitTableColumns, createActionColumn, getTableScrollX } from '@/utils/table';

const message = useMessage();

// 搜索表单
const searchForm = reactive({
  keyword: '',
  customerId: null as number | null,
  status: null as OrderStatus | null,
});

// 选项数据
const customerOptions = ref<{ label: string; value: number }[]>([]);

const statusOptions = [
  { label: '待处理', value: 'PENDING' },
  { label: '已确认', value: 'CONFIRMED' },
  { label: '处理中', value: 'PROCESSING' },
  { label: '已发货', value: 'SHIPPED' },
  { label: '已完成', value: 'COMPLETED' },
  { label: '已取消', value: 'CANCELLED' },
];

// 列表数据
const loading = ref(false);
const orderList = ref<Order[]>([]);
const printingIds = ref<number[]>([]);
const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
});

// 弹窗控制
const modalVisible = ref(false);
const modalTitle = ref('新增销售订单');
const currentOrder = ref<Order | undefined>(undefined);
const detailVisible = ref(false);
const currentOrderId = ref<number>(0);

// 表格列定义
const columns: DataTableColumns<Order> = autoFitTableColumns([
  {
    title: '订单号',
    key: 'orderNo',
  },
  {
    title: '客户',
    key: 'customerName',
  },
  {
    title: '订单金额',
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
      const statusMap: Record<OrderStatus, { type: 'default' | 'warning' | 'success' | 'error'; label: string }> = {
        PENDING: { type: 'warning', label: '待处理' },
        CONFIRMED: { type: 'success', label: '已确认' },
        PROCESSING: { type: 'warning', label: '处理中' },
        SHIPPED: { type: 'success', label: '已发货' },
        COMPLETED: { type: 'success', label: '已完成' },
        CANCELLED: { type: 'default', label: '已取消' },
        REFUNDING: { type: 'warning', label: '退款中' },
        REFUNDED: { type: 'default', label: '已退款' },
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
  createActionColumn<Order>({
    title: '操作',
    key: 'actions',
    fixed: 'right',
    render(row) {
      const buttons: any[] = [];

      // 详情按钮
      buttons.push(
        h(NButton, { size: 'small', onClick: () => handleDetail(row) }, { default: () => '详情' })
      );
      buttons.push(
        h(
          NButton,
          {
            size: 'small',
            type: 'info',
            loading: isPrinting(row.id),
            disabled: isPrinting(row.id),
            onClick: () => handlePrint(row),
          },
          { default: () => '打印' },
        ),
      );

      // 待处理状态的操作
      if (row.status === 'PENDING') {
        buttons.push(
          h(NButton, { size: 'small', type: 'primary', onClick: () => handleEdit(row) }, { default: () => '编辑' }),
          h(NButton, { size: 'small', type: 'success', onClick: () => handleConfirm(row) }, { default: () => '确认' }),
          h(
            NPopconfirm,
            { onPositiveClick: () => handleDelete(row) },
            {
              trigger: () => h(NButton, { size: 'small', type: 'error' }, { default: () => '删除' }),
              default: () => '确定删除该订单吗？',
            }
          )
        );
      }

      // 已确认/处理中状态的操作
      if (row.status === 'CONFIRMED' || row.status === 'PROCESSING') {
        buttons.push(
          h(NButton, { size: 'small', type: 'warning', onClick: () => handleCancel(row) }, { default: () => '取消' })
        );
      }

      return h(NSpace, { size: 'small' }, { default: () => buttons });
    },
  }, 5),
]);
const tableScrollX = getTableScrollX(columns);

// 加载列表
const loadData = async () => {
  loading.value = true;
  try {
    const res: any = await getOrders({
      keyword: searchForm.keyword || undefined,
      customerId: searchForm.customerId || undefined,
      status: searchForm.status || undefined,
      page: pagination.page,
      pageSize: pagination.pageSize,
    });
    orderList.value = res.data;
    pagination.itemCount = res.meta.total;
  } finally {
    loading.value = false;
  }
};

// 加载客户选项
const loadCustomers = async () => {
  try {
    const res = await getCustomers();
    const list = (res as any).data || [];
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
  modalTitle.value = '新增销售订单';
  currentOrder.value = undefined;
  modalVisible.value = true;
};

// 编辑
const handleEdit = (row: Order) => {
  modalTitle.value = '编辑销售订单';
  currentOrder.value = row;
  modalVisible.value = true;
};

// 详情
const handleDetail = (row: Order) => {
  currentOrderId.value = row.id;
  detailVisible.value = true;
};

// 确认
const handleConfirm = async (row: Order) => {
  try {
    await confirmOrder(row.id);
    message.success('确认成功');
    loadData();
  } catch (error) {
    message.error('确认失败');
  }
};

// 取消
const handleCancel = async (row: Order) => {
  try {
    await cancelOrder(row.id);
    message.success('已取消');
    loadData();
  } catch (error) {
    message.error('取消失败');
  }
};

// 删除
const handleDelete = async (row: Order) => {
  try {
    await deleteOrder(row.id);
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

const isPrinting = (id: number) => printingIds.value.includes(id);

const handlePrint = async (row: Order) => {
  if (isPrinting(row.id)) return;
  printingIds.value.push(row.id);
  try {
    await printOrder(row.id);
    message.success('打印任务已发送');
  } catch (error) {
    message.error(getPrintErrorMessage(error));
  } finally {
    printingIds.value = printingIds.value.filter((itemId) => itemId !== row.id);
  }
};

onMounted(() => {
  loadData();
  loadCustomers();
});
</script>
