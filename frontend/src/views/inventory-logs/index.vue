<template>
  <div class="p-4">
    <!-- 搜索栏 -->
    <n-card class="mb-4" content-style="padding-bottom: 0;">
      <QueryForm :model="searchForm">
        <n-form-item label="仓库">
          <n-select v-model:value="searchForm.warehouseId" :options="warehouseOptions" placeholder="选择仓库" clearable />
        </n-form-item>
        <n-form-item label="类型">
          <n-select v-model:value="searchForm.type" :options="typeOptions" placeholder="选择类型" clearable />
        </n-form-item>
        <n-form-item label="业务单号">
          <n-input v-model:value="searchForm.bizNo" placeholder="业务单号" clearable />
        </n-form-item>
        <n-form-item>
          <n-space>
            <n-button type="primary" @click="handleSearch">搜索</n-button>
            <n-button @click="handleReset">重置</n-button>
          </n-space>
        </n-form-item>
      </QueryForm>
    </n-card>

    <!-- 流水列表 -->
    <n-card title="库存流水记录">
      <n-data-table :columns="columns" :data="logList" :loading="loading" :pagination="pagination"
        @update:page="handlePageChange" @update:page-size="handlePageSizeChange" remote />
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, h, onMounted } from 'vue';
import { NTag } from 'naive-ui';
import type { DataTableColumns, DataTableRowData } from 'naive-ui';
import QueryForm from '@/components/common/QueryForm.vue';
import { getInventoryLogs, type InventoryLog } from '@/api/inventory';
import { getWarehouses } from '@/api/warehouse';
import type { Warehouse } from '@/types/basic-data';



// 类型选项
const typeOptions = [
  { label: '采购入库', value: 'IN_PURCHASE' },
  { label: '退货入库', value: 'IN_SALE_RETURN' },
  { label: '调拨入库', value: 'IN_TRANSFER' },
  { label: '盘点入库', value: 'IN_ADJUST' },
  { label: '销售出库', value: 'OUT_SALE' },
  { label: '采购退货出库', value: 'OUT_PURCHASE_RETURN' },
  { label: '调拨出库', value: 'OUT_TRANSFER' },
  { label: '盘点出库', value: 'OUT_ADJUST' },
];

// 搜索表单
const searchForm = reactive({
  warehouseId: undefined as number | undefined,
  type: undefined as string | undefined,
  bizNo: '',
  page: 1,
  pageSize: 10,
});

// 选项数据
const warehouseOptions = ref<{ label: string; value: number }[]>([]);

// 列表数据
const loading = ref(false);
const logList = ref<InventoryLog[]>([]);
const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
});

function formatSpecs(specs: unknown): string {
  if (!specs || typeof specs !== 'object' || Array.isArray(specs)) {
    return '-';
  }

  const entries = Object.entries(specs as Record<string, unknown>)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${key}:${String(value)}`);

  return entries.length > 0 ? entries.join('，') : '-';
}

// 表格列定义
const columns: DataTableColumns<InventoryLog> = [
  {
    title: '流水类型',
    key: 'typeName',
    width: 120,
    render(row: DataTableRowData) {
      const isIn = (row.type as string).startsWith('IN_');
      return h(NTag, { type: isIn ? 'success' : 'error', size: 'small' }, {
        default: () => row.typeName as string,
      });
    },
  },
  { title: '商品名称', key: 'productName', width: 200 },
  { title: 'SKU编码', key: 'skuCode', width: 150 },
  {
    title: '规格',
    key: 'specs',
    width: 100,
    render(row: DataTableRowData) {
      return formatSpecs(row.specs);
    },
  },
  {
    title: '变动数量',
    key: 'quantity',
    width: 100,
    render(row: DataTableRowData) {
      return h('span', { style: { color: (row.quantity as number) > 0 ? '#18a058' : '#d03050' } },
        ((row.quantity as number) > 0 ? '+' : '') + row.quantity
      );
    },
  },
  { title: '变动前', key: 'before', width: 90 },
  { title: '变动后', key: 'after', width: 90 },
  { title: '业务单号', key: 'bizNo', width: 180 },
  { title: '备注', key: 'remark', ellipsis: { tooltip: true } },
  { title: '时间', key: 'createdAt', width: 180 },
];

// 加载数据
async function loadData() {
  loading.value = true;
  try {
    const res: any = await getInventoryLogs(searchForm);
    logList.value = res.data;
    pagination.itemCount = res.meta?.total || 0;
    pagination.page = res.meta?.page || 1;
    pagination.pageSize = res.meta?.pageSize || 10;
  } finally {
    loading.value = false;
  }
}

// 加载仓库选项
async function loadWarehouses() {
  const warehouses = await getWarehouses();
  warehouseOptions.value = warehouses.map((w: Warehouse) => ({
    label: w.name,
    value: w.id,
  }));
}

// 搜索
function handleSearch() {
  searchForm.page = 1;
  loadData();
}

// 重置
function handleReset() {
  searchForm.warehouseId = undefined;
  searchForm.type = undefined;
  searchForm.bizNo = '';
  searchForm.page = 1;
  loadData();
}

// 分页
function handlePageChange(page: number) {
  searchForm.page = page;
  loadData();
}

function handlePageSizeChange(pageSize: number) {
  searchForm.pageSize = pageSize;
  searchForm.page = 1;
  loadData();
}

onMounted(() => {
  loadData();
  loadWarehouses();
});
</script>
