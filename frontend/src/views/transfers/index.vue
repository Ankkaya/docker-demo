<template>
  <div class="p-4">
    <!-- 搜索栏 -->
    <n-card class="mb-4">
      <n-form inline :model="searchForm" label-placement="left">
        <n-form-item label="调拨单号">
          <n-input v-model:value="searchForm.transferNo" placeholder="调拨单号" clearable />
        </n-form-item>
        <n-form-item label="出库仓库">
          <n-select
            v-model:value="searchForm.fromId"
            :options="warehouseOptions"
            placeholder="选择出库仓库"
            clearable
            style="width: 180px"
          />
        </n-form-item>
        <n-form-item label="入库仓库">
          <n-select
            v-model:value="searchForm.toId"
            :options="warehouseOptions"
            placeholder="选择入库仓库"
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
            <n-button type="primary" @click="handleCreate">新建调拨单</n-button>
          </n-space>
        </n-form-item>
      </n-form>
    </n-card>

    <!-- 调拨单列表 -->
    <n-card title="调拨单列表">
      <n-data-table
        :columns="columns"
        :data="transferList"
        :loading="loading"
        :pagination="pagination"
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
        remote
      />
    </n-card>

    <!-- 创建调拨单弹窗 -->
    <n-modal v-model:show="createModalVisible" title="新建调拨单" style="width: 900px">
      <n-card>
        <n-form :model="createForm" label-placement="left" label-width="100" ref="formRef">
          <n-form-item label="出库仓库" required path="fromId">
            <n-select
              v-model:value="createForm.fromId"
              :options="warehouseOptions"
              placeholder="选择出库仓库"
              style="width: 250px"
              @update:value="handleFromWarehouseChange"
            />
          </n-form-item>
          <n-form-item label="入库仓库" required path="toId">
            <n-select
              v-model:value="createForm.toId"
              :options="warehouseOptions"
              placeholder="选择入库仓库"
              style="width: 250px"
            />
          </n-form-item>
          <n-form-item label="备注" path="remark">
            <n-input v-model:value="createForm.remark" placeholder="备注" type="textarea" style="width: 400px" />
          </n-form-item>
          <n-form-item label="调拨商品" required>
            <n-space vertical style="width: 100%">
              <n-alert v-if="!createForm.fromId" type="warning" :show-icon="false">
                请先选择出库仓库
              </n-alert>
              <n-space v-else>
                <n-button type="primary" size="small" @click="showSkuSelector">添加商品</n-button>
                <n-text type="info" depth="3">已选择 {{ createForm.items.length }} 个商品</n-text>
              </n-space>
              
              <n-table v-if="createForm.items.length > 0" :bordered="true" :single-line="false" size="small">
                <thead>
                  <tr>
                    <th style="width: 200px">商品名称</th>
                    <th style="width: 150px">SKU编码</th>
                    <th style="width: 150px">规格</th>
                    <th style="width: 100px">可用库存</th>
                    <th style="width: 120px">调拨数量</th>
                    <th style="width: 80px">操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in createForm.items" :key="index">
                    <td>{{ item.productName }}</td>
                    <td>{{ item.skuCode }}</td>
                    <td>{{ item.specs }}</td>
                    <td>
                      <n-tag :type="item.available > 0 ? 'success' : 'error'" size="small">
                        {{ item.available }}
                      </n-tag>
                    </td>
                    <td>
                      <n-input-number 
                        v-model:value="item.quantity" 
                        :min="1" 
                        :max="item.available"
                        style="width: 100px"
                        size="small"
                      />
                    </td>
                    <td>
                      <n-button type="error" size="small" @click="removeItem(index)">删除</n-button>
                    </td>
                  </tr>
                </tbody>
              </n-table>
              <n-empty v-else description="暂无商品，请点击添加商品" />
            </n-space>
          </n-form-item>
        </n-form>
        <template #footer>
          <n-space justify="end">
            <n-button @click="createModalVisible = false">取消</n-button>
            <n-button type="primary" @click="handleSave" :disabled="createForm.items.length === 0">保存</n-button>
          </n-space>
        </template>
      </n-card>
    </n-modal>

    <!-- SKU选择器弹窗 -->
    <n-modal v-model:show="skuSelectorVisible" title="选择商品" style="width: 700px">
      <n-card>
        <n-form inline>
          <n-form-item label="商品名称">
            <n-input v-model:value="skuSearchForm.productName" placeholder="搜索商品" clearable />
          </n-form-item>
          <n-form-item label="SKU编码">
            <n-input v-model:value="skuSearchForm.skuCode" placeholder="搜索SKU" clearable />
          </n-form-item>
          <n-form-item>
            <n-button type="primary" @click="loadAvailableSkus">搜索</n-button>
          </n-form-item>
        </n-form>
        
        <n-data-table
          :columns="skuSelectorColumns"
          :data="availableSkuList"
          :loading="skuLoading"
          :pagination="skuPagination"
          :row-key="row => row.skuId"
          @update:checked-row-keys="handleSkuSelect"
          remote
          @update:page="handleSkuPageChange"
        />
        
        <template #footer>
          <n-space justify="end">
            <n-button @click="skuSelectorVisible = false">取消</n-button>
            <n-button type="primary" @click="confirmSkuSelect" :disabled="selectedSkus.length === 0">
              确认选择 ({{ selectedSkus.length }})
            </n-button>
          </n-space>
        </template>
      </n-card>
    </n-modal>

    <!-- 详情弹窗 -->
    <n-modal v-model:show="detailModalVisible" title="调拨单详情" style="width: 700px">
      <n-card v-if="currentTransfer">
        <n-descriptions bordered :column="2">
          <n-descriptions-item label="调拨单号">{{ currentTransfer.transferNo }}</n-descriptions-item>
          <n-descriptions-item label="状态">
            <n-tag :type="getStatusType(currentTransfer.status)">{{ getStatusText(currentTransfer.status) }}</n-tag>
          </n-descriptions-item>
          <n-descriptions-item label="出库仓库">{{ currentTransfer.fromName }}</n-descriptions-item>
          <n-descriptions-item label="入库仓库">{{ currentTransfer.toName }}</n-descriptions-item>
          <n-descriptions-item label="备注" :span="2">{{ currentTransfer.remark || '-' }}</n-descriptions-item>
        </n-descriptions>
        <n-divider />
        <n-table :bordered="true" :single-line="false" size="small">
          <thead>
            <tr>
              <th>商品名称</th>
              <th>SKU编码</th>
              <th>规格</th>
              <th>数量</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in currentTransfer.items" :key="item.id">
              <td>{{ item.productName }}</td>
              <td>{{ item.skuCode }}</td>
              <td>{{ formatSpecs(item.specs) }}</td>
              <td>{{ item.quantity }}</td>
            </tr>
          </tbody>
        </n-table>
      </n-card>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, h, onMounted, computed } from 'vue';
import { NButton, NSpace, NTag, useMessage, NText } from 'naive-ui';
import type { DataTableColumns, DataTableRowKey } from 'naive-ui';
import { getTransfers, createTransfer, confirmOut, confirmIn, cancelTransfer, type Transfer } from '@/api/transfer';
import { getWarehouses } from '@/api/warehouse';
import { getInventories } from '@/api/inventory';
import type { Warehouse } from '@/types/basic-data';

const message = useMessage();

// 状态选项
const statusOptions = [
  { label: '待出库', value: 'PENDING' },
  { label: '已出库', value: 'OUT' },
  { label: '已入库', value: 'IN' },
  { label: '已完成', value: 'COMPLETED' },
  { label: '已取消', value: 'CANCELLED' },
];

// 搜索表单
const searchForm = reactive({
  transferNo: '',
  fromId: undefined as number | undefined,
  toId: undefined as number | undefined,
  status: undefined as string | undefined,
  page: 1,
  pageSize: 10,
});

// 选项数据
const warehouseOptions = ref<{ label: string; value: number }[]>([]);

// 列表数据
const loading = ref(false);
const transferList = ref<Transfer[]>([]);
const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
});

// 创建弹窗
const createModalVisible = ref(false);
const formRef = ref();
const createForm = reactive({
  fromId: undefined as number | undefined,
  toId: undefined as number | undefined,
  remark: '',
  items: [] as { 
    skuId: number; 
    quantity: number; 
    productName: string;
    skuCode: string;
    specs: string;
    available: number;
  }[],
});

// SKU选择器
const skuSelectorVisible = ref(false);
const skuLoading = ref(false);
const availableSkuList = ref<any[]>([]);
const selectedSkus = ref<DataTableRowKey[]>([]);
const skuSearchForm = reactive({
  productName: '',
  skuCode: '',
  page: 1,
  pageSize: 10,
});
const skuPagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
});

// SKU选择器表格列
const skuSelectorColumns: DataTableColumns<any> = [
  { type: 'selection', multiple: true },
  { title: '商品名称', key: 'productName', ellipsis: { tooltip: true } },
  { title: 'SKU编码', key: 'skuCode', width: 150 },
  { title: '规格', key: 'specs', width: 120 },
  { 
    title: '可用库存', 
    key: 'available', 
    width: 100,
    render(row) {
      return h(NTag, { type: row.available > 0 ? 'success' : 'error', size: 'small' }, {
        default: () => row.available,
      });
    },
  },
];

// 详情弹窗
const detailModalVisible = ref(false);
const currentTransfer = ref<Transfer | null>(null);

// 表格列定义
const columns: DataTableColumns<Transfer> = [
  { title: '调拨单号', key: 'transferNo', width: 180 },
  { title: '出库仓库', key: 'fromName', width: 120 },
  { title: '入库仓库', key: 'toName', width: 120 },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render(row) {
      return h(NTag, { type: getStatusType(row.status), size: 'small' }, {
        default: () => getStatusText(row.status),
      });
    },
  },
  { title: '备注', key: 'remark', ellipsis: { tooltip: true } },
  { title: '创建时间', key: 'createdAt', width: 180 },
  {
    title: '操作',
    key: 'actions',
    width: 200,
    fixed: 'right',
    render(row) {
      return h(NSpace, null, {
        default: () => [
          h(NButton, { size: 'small', onClick: () => handleDetail(row) }, { default: () => '详情' }),
          row.status === 'PENDING' && h(NButton, { type: 'primary', size: 'small', onClick: () => handleOut(row) }, { default: () => '出库' }),
          row.status === 'OUT' && h(NButton, { type: 'success', size: 'small', onClick: () => handleIn(row) }, { default: () => '入库' }),
          (row.status === 'PENDING' || row.status === 'OUT') && h(NButton, { type: 'error', size: 'small', onClick: () => handleCancel(row) }, { default: () => '取消' }),
        ],
      });
    },
  },
];

// 获取状态类型
function getStatusType(status: string) {
  const map: Record<string, any> = {
    PENDING: 'warning',
    OUT: 'info',
    IN: 'success',
    COMPLETED: 'success',
    CANCELLED: 'error',
  };
  return map[status] || 'default';
}

// 获取状态文本
function getStatusText(status: string) {
  const map: Record<string, string> = {
    PENDING: '待出库',
    OUT: '已出库',
    IN: '已入库',
    COMPLETED: '已完成',
    CANCELLED: '已取消',
  };
  return map[status] || status;
}

// 格式化规格
function formatSpecs(specs: Record<string, string>) {
  return Object.entries(specs || {}).map(([k, v]) => `${k}:${v}`).join(', ');
}

// 加载数据
async function loadData() {
  loading.value = true;
  try {
    const res: any = await getTransfers(searchForm);
    transferList.value = res.data.data;
    pagination.itemCount = res.data.meta.total;
    pagination.page = res.data.meta.page;
    pagination.pageSize = res.data.meta.pageSize;
  } finally {
    loading.value = false;
  }
}

// 加载仓库选项
async function loadWarehouses() {
  const res = await getWarehouses();
  warehouseOptions.value = res.data.data.map((w: Warehouse) => ({
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
  searchForm.transferNo = '';
  searchForm.fromId = undefined;
  searchForm.toId = undefined;
  searchForm.status = undefined;
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

// 创建
function handleCreate() {
  createForm.fromId = undefined;
  createForm.toId = undefined;
  createForm.remark = '';
  createForm.items = [];
  skuSearchForm.productName = '';
  skuSearchForm.skuCode = '';
  selectedSkus.value = [];
  createModalVisible.value = true;
}

// 出库仓库变更
function handleFromWarehouseChange() {
  // 清空已选商品
  createForm.items = [];
  selectedSkus.value = [];
}

// 显示SKU选择器
function showSkuSelector() {
  if (!createForm.fromId) {
    message.warning('请先选择出库仓库');
    return;
  }
  skuSelectorVisible.value = true;
  loadAvailableSkus();
}

// 加载可用SKU列表（带库存）
async function loadAvailableSkus() {
  if (!createForm.fromId) return;
  
  skuLoading.value = true;
  try {
    const res: any = await getInventories({
      warehouseId: createForm.fromId,
      productName: skuSearchForm.productName || undefined,
      skuCode: skuSearchForm.skuCode || undefined,
      page: skuPagination.page,
      pageSize: skuPagination.pageSize,
    });
    
    // 过滤掉已经选择的SKU
    const existingSkuIds = createForm.items.map(i => i.skuId);
    availableSkuList.value = res.data.data
      .filter((item: any) => !existingSkuIds.includes(item.skuId))
      .map((item: any) => ({
        skuId: item.skuId,
        productName: item.productName,
        skuCode: item.skuCode,
        specs: formatSpecs(item.specs),
        available: item.available,
      }));
    
    skuPagination.itemCount = res.data.meta.total;
    skuPagination.page = res.data.meta.page;
    skuPagination.pageSize = res.data.meta.pageSize;
  } finally {
    skuLoading.value = false;
  }
}

// SKU选择
function handleSkuSelect(keys: DataTableRowKey[]) {
  selectedSkus.value = keys;
}

// 确认SKU选择
function confirmSkuSelect() {
  const selectedItems = availableSkuList.value.filter(item => 
    selectedSkus.value.includes(item.skuId)
  );
  
  for (const item of selectedItems) {
    createForm.items.push({
      skuId: item.skuId,
      quantity: 1,
      productName: item.productName,
      skuCode: item.skuCode,
      specs: item.specs,
      available: item.available,
    });
  }
  
  skuSelectorVisible.value = false;
  selectedSkus.value = [];
  message.success(`已添加 ${selectedItems.length} 个商品`);
}

// SKU分页
function handleSkuPageChange(page: number) {
  skuPagination.page = page;
  loadAvailableSkus();
}

// 删除商品
function removeItem(index: number) {
  createForm.items.splice(index, 1);
}

// 保存
async function handleSave() {
  if (!createForm.fromId || !createForm.toId) {
    message.error('请选择出库仓库和入库仓库');
    return;
  }
  if (createForm.fromId === createForm.toId) {
    message.error('出库仓库和入库仓库不能相同');
    return;
  }
  if (createForm.items.length === 0) {
    message.error('请至少添加一个调拨商品');
    return;
  }
  
  // 验证数量
  for (const item of createForm.items) {
    if (!item.quantity || item.quantity <= 0) {
      message.error(`${item.productName} 的调拨数量必须大于0`);
      return;
    }
    if (item.quantity > item.available) {
      message.error(`${item.productName} 的调拨数量不能超过可用库存 ${item.available}`);
      return;
    }
  }
  
  try {
    await createTransfer({
      fromId: createForm.fromId,
      toId: createForm.toId,
      remark: createForm.remark,
      items: createForm.items.map(i => ({ skuId: i.skuId, quantity: i.quantity })),
    });
    message.success('创建成功');
    createModalVisible.value = false;
    loadData();
  } catch (error: any) {
    message.error(error.response?.data?.message || '创建失败');
  }
}

// 详情
function handleDetail(row: Transfer) {
  currentTransfer.value = row;
  detailModalVisible.value = true;
}

// 出库
async function handleOut(row: Transfer) {
  try {
    await confirmOut(row.id);
    message.success('出库成功');
    loadData();
  } catch (error: any) {
    message.error(error.response?.data?.message || '出库失败');
  }
}

// 入库
async function handleIn(row: Transfer) {
  try {
    await confirmIn(row.id);
    message.success('入库成功');
    loadData();
  } catch (error: any) {
    message.error(error.response?.data?.message || '入库失败');
  }
}

// 取消
async function handleCancel(row: Transfer) {
  try {
    await cancelTransfer(row.id);
    message.success('取消成功');
    loadData();
  } catch (error: any) {
    message.error(error.response?.data?.message || '取消失败');
  }
}

onMounted(() => {
  loadData();
  loadWarehouses();
});
</script>
