<template>
  <div class="p-4">
    <!-- 统计卡片 -->
    <n-row :gutter="16" class="mb-3" style="margin-left: -8px; margin-right: -8px; width: calc(100% + 16px);">
      <n-col :span="6">
        <n-card>
          <n-statistic label="SKU种类" :value="stats.totalSkuCount" />
        </n-card>
      </n-col>
      <n-col :span="6">
        <n-card>
          <n-statistic label="总库存数量" :value="stats.totalQuantity" />
        </n-card>
      </n-col>
      <n-col :span="6">
        <n-card>
          <n-statistic label="可用库存" :value="stats.totalAvailable" />
        </n-card>
      </n-col>
      <n-col :span="6">
        <n-card>
          <n-statistic label="低库存预警" :value="stats.lowStockCount">
            <template #suffix>
              <n-tag v-if="stats.lowStockCount > 0" type="error" size="small">需补货</n-tag>
            </template>
          </n-statistic>
        </n-card>
      </n-col>
    </n-row>

    <!-- 搜索栏 -->
    <n-card class="mb-3" content-style="padding-bottom: 0;">
      <QueryForm :model="searchForm" @search="handleSearch">
        <n-form-item label="商品名称">
          <n-input v-model:value="searchForm.productName" placeholder="商品名称" clearable />
        </n-form-item>
        <n-form-item label="SKU编码">
          <n-input v-model:value="searchForm.skuCode" placeholder="SKU编码" clearable />
        </n-form-item>
        <n-form-item label="仓库">
          <n-select
            v-model:value="searchForm.warehouseId"
            :options="warehouseOptions"
            placeholder="选择仓库"
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

    <n-card class="mb-3">
      <n-space class="page-toolbar">
        <n-button type="warning" @click="showWarningList">库存预警</n-button>
      </n-space>
    </n-card>

    <!-- 库存列表 -->
    <n-card title="库存列表">
      <n-data-table
        :columns="columns"
        :data="inventoryList"
        :loading="loading"
        :pagination="pagination"
        :scroll-x="tableScrollX"
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
        remote
      />
    </n-card>

    <!-- 库存预警弹窗 -->
    <n-modal v-model:show="warningModalVisible" title="库存预警" style="width: 900px">
      <n-card>
        <n-radio-group v-model:value="warningType" @update:value="loadWarnings" class="mb-4">
          <n-radio-button value="low">低库存</n-radio-button>
          <n-radio-button value="high">高库存</n-radio-button>
        </n-radio-group>
        <n-data-table
          :columns="warningColumns"
          :data="warningList"
          :loading="warningLoading"
          :pagination="warningPagination"
          @update:page="handleWarningPageChange"
          remote
        />
      </n-card>
    </n-modal>

    <!-- 编辑库存弹窗 -->
    <SmartFormContainer
      v-model:show="editModalVisible"
      title="编辑库存设置"
      :form-item-count="5"
      modal-width="500px"
      :drawer-width="680"
    >
      <n-form :model="editForm" label-placement="left" label-width="100">
        <n-form-item label="SKU">
          <span>{{ editForm.skuName }}</span>
        </n-form-item>
        <n-form-item label="仓库">
          <span>{{ editForm.warehouseName }}</span>
        </n-form-item>
        <n-form-item label="当前库存">
          <span>{{ editForm.currentQuantity }}</span>
        </n-form-item>
        <n-form-item label="安全库存">
          <n-input-number v-model:value="editForm.minStock" :min="0" style="width: 200px" />
        </n-form-item>
        <n-form-item label="库位">
          <n-input v-model:value="editForm.location" placeholder="库位编码" style="width: 200px" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="editModalVisible = false">取消</n-button>
          <n-button type="primary" @click="handleSaveInventory">确定</n-button>
        </n-space>
      </template>
    </SmartFormContainer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, h, onMounted } from 'vue';
import { NButton, NSpace, NTag, useMessage } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import QueryForm from '@/components/common/QueryForm.vue';
import SmartFormContainer from '@/components/common/SmartFormContainer.vue';
import { getInventories, getInventoryStats, getInventoryWarnings, updateInventory } from '@/api/product';
import { getWarehouses } from '@/api/warehouse';
import type { Inventory, QueryInventoryParams } from '@/types/product';
import type { Warehouse } from '@/types/basic-data';
import { autoFitTableColumns, createActionColumn, getTableScrollX } from '@/utils/table';

const message = useMessage();
type InventoryRow = Inventory & {
  productName?: string;
  skuCode?: string;
  specs?: Record<string, string>;
  warehouseName?: string;
  sku?: {
    skuCode?: string;
    specs?: Record<string, string> | Array<{ name: string; value: string }> | null;
    product?: {
      name?: string;
      spuCode?: string;
      unit?: {
        name?: string;
      } | null;
    } | null;
  } | null;
  warehouse?: {
    id: number;
    name: string;
    code: string;
  } | null;
};

// 统计数据
const stats = reactive({
  totalSkuCount: 0,
  totalQuantity: 0,
  totalAvailable: 0,
  totalLocked: 0,
  lowStockCount: 0,
});

// 搜索表单
const searchForm = reactive<QueryInventoryParams>({
  productName: '',
  skuCode: '',
  warehouseId: undefined,
  page: 1,
  pageSize: 10,
});

// 选项数据
const warehouseOptions = ref<{ label: string; value: number }[]>([]);

// 列表数据
const loading = ref(false);
const inventoryList = ref<InventoryRow[]>([]);
const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
});

// 预警弹窗
const warningModalVisible = ref(false);
const warningType = ref<'low' | 'high'>('low');
const warningLoading = ref(false);
const warningList = ref<(InventoryRow & { warningType: 'low' | 'high' })[]>([]);
const warningPagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
});

// 编辑弹窗
const editModalVisible = ref(false);
const editForm = reactive({
  id: 0,
  skuName: '',
  warehouseName: '',
  currentQuantity: 0,
  minStock: 0,
  location: '',
});

// 表格列定义
const columns: DataTableColumns<InventoryRow> = autoFitTableColumns([
  {
    title: 'SPU编码',
    key: 'spuCode',
    render(row) {
      return row.sku?.product?.spuCode || '-';
    },
  },
  {
    title: '商品名称',
    key: 'productName',
    render(row) {
      return row.sku?.product?.name || row.productName || '-';
    },
  },
  {
    title: 'SKU编码',
    key: 'skuCode',
    render(row) {
      return row.sku?.skuCode || row.skuCode || '-';
    },
  },
  {
    title: '规格',
    key: 'specs',
    render(row) {
      return formatSpecs(row.sku?.specs ?? row.specs);
    },
  },
  {
    title: '单位',
    key: 'unitName',
    render(row) {
      return row.sku?.product?.unit?.name || '-';
    },
  },
  {
    title: '仓库编码',
    key: 'warehouseCode',
    render(row) {
      return row.warehouse?.code || '-';
    },
  },
  {
    title: '仓库名称',
    key: 'warehouseName',
    render(row) {
      return row.warehouse?.name || row.warehouseName || '-';
    },
  },
  {
    title: '实际库存',
    key: 'quantity',
  },
  {
    title: '锁定库存',
    key: 'locked',
  },
  {
    title: '可用库存',
    key: 'available',
    render(row) {
      return h(NTag, { type: row.available <= row.minStock ? 'error' : 'success', size: 'small' }, {
        default: () => row.available,
      });
    },
  },
  {
    title: '安全库存',
    key: 'minStock',
  },
  {
    title: '库存上限',
    key: 'maxStock',
    render(row) {
      return row.maxStock ?? '-';
    },
  },
  {
    title: '库位',
    key: 'location',
    render(row) {
      return row.location || '-';
    },
  },
  {
    title: '更新时间',
    key: 'updatedAt',
    render(row) {
      return formatDateTime(row.updatedAt);
    },
  },
  createActionColumn<InventoryRow>({
    title: '操作',
    key: 'actions',
    fixed: 'right',
    render(row) {
      return h(NSpace, null, {
        default: () => [
          h(NButton, { size: 'small', onClick: () => handleEdit(row) }, { default: () => '调整' }),
        ],
      });
    },
  }, 1),
]);
const tableScrollX = getTableScrollX(columns);

const formatSpecs = (
  specs?: Record<string, string> | Array<{ name: string; value: string }> | null,
) => {
  if (!specs) {
    return '-';
  }

  if (Array.isArray(specs)) {
    const items = specs
      .map((item) => [item?.name, item?.value].filter(Boolean).join(':'))
      .filter(Boolean);
    return items.length > 0 ? items.join('，') : '-';
  }

  const entries = Object.entries(specs)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${key}:${value}`);
  return entries.length > 0 ? entries.join('，') : '-';
};

const formatDateTime = (value?: string) => {
  if (!value) {
    return '-';
  }

  return new Date(value).toLocaleString('zh-CN');
};

// 预警表格列
const warningColumns: DataTableColumns<any> = [
  {
    title: '商品名称',
    key: 'productName',
    render(row) {
      return row.sku?.product?.name || '-';
    },
  },
  {
    title: 'SKU编码',
    key: 'skuCode',
    render(row) {
      return row.sku?.skuCode || '-';
    },
  },
  {
    title: '仓库',
    key: 'warehouse',
    render(row) {
      return row.warehouse?.name || '-';
    },
  },
  {
    title: '可用库存',
    key: 'available',
  },
  {
    title: '安全库存',
    key: 'minStock',
  },
  {
    title: '预警类型',
    key: 'warningType',
    render(row) {
      return h(NTag, { type: row.warningType === 'low' ? 'error' : 'warning', size: 'small' }, {
        default: () => row.warningType === 'low' ? '低库存' : '高库存',
      });
    },
  },
];

// 加载统计数据
const loadStats = async () => {
  try {
    const res = await getInventoryStats(searchForm.warehouseId);
    Object.assign(stats, res);
  } catch (error) {
    console.error('加载统计数据失败:', error);
  }
};

// 加载库存列表
const loadData = async () => {
  loading.value = true;
  try {
    const res = await getInventories({
      productName: searchForm.productName,
      skuCode: searchForm.skuCode,
      warehouseId: searchForm.warehouseId,
      page: pagination.page,
      pageSize: pagination.pageSize,
    });
    inventoryList.value = res.data;
    pagination.itemCount = res.meta.total;
  } finally {
    loading.value = false;
  }
};

// 加载选项
const loadOptions = async () => {
  try {
    const warehouses = await getWarehouses();
    warehouseOptions.value = warehouses.map((w: Warehouse) => ({ label: w.name, value: w.id }));
  } catch (error) {
    console.error('加载选项失败:', error);
  }
};

// 搜索
const handleSearch = () => {
  pagination.page = 1;
  loadData();
  loadStats();
};

// 重置
const handleReset = () => {
  searchForm.productName = '';
  searchForm.skuCode = '';
  searchForm.warehouseId = undefined;
  handleSearch();
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

// 显示预警列表
const showWarningList = () => {
  warningModalVisible.value = true;
  loadWarnings();
};

// 加载预警数据
const loadWarnings = async () => {
  warningLoading.value = true;
  try {
    const res = await getInventoryWarnings({
      type: warningType.value,
      page: warningPagination.page,
      pageSize: warningPagination.pageSize,
    });
    warningList.value = res.data;
    warningPagination.itemCount = res.meta.total;
  } finally {
    warningLoading.value = false;
  }
};

// 预警分页
const handleWarningPageChange = (page: number) => {
  warningPagination.page = page;
  loadWarnings();
};

// 编辑库存
const handleEdit = (row: InventoryRow) => {
  editForm.id = row.id;
  editForm.skuName = row.sku?.product?.name || row.productName || '-';
  editForm.warehouseName = row.warehouse?.name || row.warehouseName || '-';
  editForm.currentQuantity = row.quantity;
  editForm.minStock = row.minStock;
  editForm.location = row.location || '';
  editModalVisible.value = true;
};

// 保存库存
const handleSaveInventory = async () => {
  try {
    await updateInventory(editForm.id, {
      minStock: editForm.minStock,
      location: editForm.location,
    });
    message.success('设置已更新');
    editModalVisible.value = false;
    loadData();
    loadStats();
  } catch (error) {
    message.error('更新失败');
  }
};

onMounted(() => {
  loadData();
  loadStats();
  loadOptions();
});
</script>
