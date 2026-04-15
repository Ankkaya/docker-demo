<template>
  <div class="p-4">
    <!-- 搜索栏 -->
    <n-card class="mb-4" content-style="padding-bottom: 0;">
      <QueryForm :model="searchForm">
        <n-form-item label="关键词">
          <n-input v-model:value="searchForm.keyword" placeholder="入库单号" clearable />
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

    <n-card class="mb-4">
      <n-space class="page-toolbar">
        <n-button type="primary" @click="handleCreate">创建入库单</n-button>
      </n-space>
    </n-card>

    <!-- 入库单列表 -->
    <n-card>
      <n-data-table
        :columns="columns"
        :data="receiptList"
        :loading="loading"
        :pagination="pagination"
        :scroll-x="tableScrollX"
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

    <n-modal
      v-model:show="printConfigVisible"
      title="选择标签打印配置"
      preset="card"
      style="width: 520px"
      :mask-closable="false"
    >
      <n-space vertical :size="16">
        <n-alert type="info" :show-icon="false">
          当前存在多个商品标签打印配置，请选择一个配置后继续打印。
        </n-alert>
        <n-select
          v-model:value="selectedPrintConfigId"
          :options="printConfigOptions"
          placeholder="请选择打印配置"
        />
      </n-space>
      <template #footer>
        <n-space justify="end">
          <n-button @click="handleCancelPrintConfig">跳过打印</n-button>
          <n-button
            type="primary"
            :disabled="!selectedPrintConfigId"
            :loading="printingLabel"
            @click="handleConfirmPrintConfig"
          >
            打印标签
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, h, onMounted } from 'vue';
import { NAlert, NButton, NSpace, NTag, NPopconfirm, useMessage } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import QueryForm from '@/components/common/QueryForm.vue';
import { getPurchaseReceipts, confirmReceipt, cancelReceipt, deleteReceipt } from '@/api/purchase';
import { getPrinterConfigs } from '@/api/printer-config';
import ReceiptForm from './components/ReceiptForm.vue';
import ReceiptDetail from './components/ReceiptDetail.vue';
import { getPrintErrorMessage, printProductLabels } from '@/services/print/product-label-service';
import { BizType, type PrinterConfig } from '@/types/print';
import type { PurchaseReceipt, ReceiptStatus } from '@/types/purchase';
import { autoFitTableColumns, createActionColumn, getTableScrollX } from '@/utils/table';

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
const printConfigVisible = ref(false);
const selectedPrintConfigId = ref<number | null>(null);
const pendingPrintReceipt = ref<PurchaseReceipt | null>(null);
const printingLabel = ref(false);
const labelConfigs = ref<PrinterConfig[]>([]);
const printConfigOptions = ref<{ label: string; value: number }[]>([]);

const unwrapPaginatedReceiptList = (payload: unknown): { data: PurchaseReceipt[]; meta: { total: number } } => {
  const raw = payload as any;
  if (Array.isArray(raw?.data)) {
    return {
      data: raw.data,
      meta: raw.meta || { total: raw.data.length },
    };
  }

  const nested = raw?.data as { data?: PurchaseReceipt[]; meta?: { total: number } } | undefined;
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

// 表格列定义
const columns: DataTableColumns<PurchaseReceipt> = autoFitTableColumns([
  {
    title: '入库单号',
    key: 'receiptNo',
  },
  {
    title: '采购单号',
    key: 'purchaseNo',
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
    title: '状态',
    key: 'status',
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
    render(row) {
      return new Date(row.createdAt).toLocaleString();
    },
  },
  createActionColumn<PurchaseReceipt>({
    title: '操作',
    key: 'actions',
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
  }, 4),
]);
const tableScrollX = getTableScrollX(columns);

// 加载列表
const loadData = async () => {
  loading.value = true;
  try {
    const res = await getPurchaseReceipts({
      keyword: searchForm.keyword || undefined,
      status: searchForm.status || undefined,
      page: pagination.page,
      pageSize: pagination.pageSize,
    });
    const result = unwrapPaginatedReceiptList(res);
    receiptList.value = result.data;
    pagination.itemCount = result.meta.total;
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

const handleCreate = () => {
  modalVisible.value = true;
};

// 详情
const handleDetail = (row: PurchaseReceipt) => {
  currentReceiptId.value = row.id;
  detailVisible.value = true;
};

const unwrapReceiptResponse = (payload: unknown): PurchaseReceipt => {
  const data = payload as { data?: PurchaseReceipt } & PurchaseReceipt;
  return data?.data && typeof data.data === 'object' ? data.data : (data as PurchaseReceipt);
};

const resolveLabelConfigs = async () => {
  const configs = await getPrinterConfigs();
  return configs.filter(
    (config) =>
      config.isEnabled &&
      config.templateId &&
      config.template?.bizType === BizType.PRODUCT_LABEL &&
      config.printerId &&
      config.printer?.device,
  );
};

const resetPrintConfigState = () => {
  printConfigVisible.value = false;
  selectedPrintConfigId.value = null;
  pendingPrintReceipt.value = null;
  labelConfigs.value = [];
  printConfigOptions.value = [];
};

const executeLabelPrint = async (receipt: PurchaseReceipt, config: PrinterConfig) => {
  printingLabel.value = true;
  try {
    await printProductLabels(receipt, config);
    message.success(`标签打印任务已发送：${config.name}`);
  } finally {
    printingLabel.value = false;
  }
};

const handleLabelPrintAfterConfirm = async (receipt: PurchaseReceipt) => {
  const configs = await resolveLabelConfigs();
  if (!configs.length) {
    message.info('未找到启用中的商品标签打印配置，已跳过标签打印');
    return;
  }

  const defaultConfig = configs.find((config) => config.isDefault);
  if (defaultConfig) {
    await executeLabelPrint(receipt, defaultConfig);
    return;
  }

  if (configs.length === 1) {
    await executeLabelPrint(receipt, configs[0]);
    return;
  }

  pendingPrintReceipt.value = receipt;
  labelConfigs.value = configs;
  printConfigOptions.value = configs.map((config) => ({
    label: `${config.name} / ${config.printer?.name || '-'} / ${config.template?.name || '-'}`,
    value: config.id,
  }));
  selectedPrintConfigId.value = configs[0].id;
  printConfigVisible.value = true;
};

// 确认入库
const handleConfirm = async (row: PurchaseReceipt) => {
  try {
    const receipt = unwrapReceiptResponse(await confirmReceipt(row.id));
    message.success('入库成功');
    await handleLabelPrintAfterConfirm(receipt);
    loadData();
  } catch (error) {
    message.error((error as { message?: string })?.message || '入库失败');
  }
};

const handleCancelPrintConfig = () => {
  resetPrintConfigState();
  message.info('已跳过标签打印');
};

const handleConfirmPrintConfig = async () => {
  if (!pendingPrintReceipt.value || !selectedPrintConfigId.value) return;
  const config = labelConfigs.value.find((item) => item.id === selectedPrintConfigId.value);
  if (!config) {
    message.error('所选打印配置不存在');
    return;
  }

  try {
    await executeLabelPrint(pendingPrintReceipt.value, config);
    resetPrintConfigState();
  } catch (error) {
    message.error(getPrintErrorMessage(error));
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
