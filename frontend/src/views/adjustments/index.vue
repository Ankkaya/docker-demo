<template>
  <div class="p-4">
    <!-- 搜索栏 -->
    <n-card class="mb-4" content-style="padding-bottom: 0;">
      <QueryForm :model="searchForm" @search="handleSearch">
        <n-form-item label="调整单号">
          <n-input v-model:value="searchForm.adjustNo" placeholder="调整单号" clearable />
        </n-form-item>
        <n-form-item label="仓库">
          <n-select
            v-model:value="searchForm.warehouseId"
            :options="warehouseOptions"
            placeholder="选择仓库"
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

    <n-card class="mb-4">
      <n-space class="page-toolbar">
        <n-button type="primary" @click="handleCreate">新建调整单</n-button>
      </n-space>
    </n-card>

    <!-- 调整单列表 -->
    <n-card title="库存调整单列表">
      <n-data-table
        :columns="columns"
        :data="adjustmentList"
        :loading="loading"
        :pagination="pagination"
        :scroll-x="tableScrollX"
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
        remote
      />
    </n-card>

    <!-- 创建调整单弹窗 -->
    <SmartFormContainer
      v-model:show="createModalVisible"
      title="新建库存调整单"
      :form-item-count="6"
      modal-width="950px"
      :drawer-width="960"
    >
      <n-card>
        <n-alert type="info" class="mb-4">
          库存调整用于盘点时修正系统库存与实际库存的差异。系统将自动计算差异数量。
        </n-alert>
        
        <n-form :model="createForm" label-placement="left" label-width="100" ref="formRef">
          <n-form-item label="调整仓库" required path="warehouseId">
            <n-select
              v-model:value="createForm.warehouseId"
              :options="warehouseOptions"
              placeholder="选择要盘点的仓库"
              style="width: 250px"
              @update:value="handleWarehouseChange"
            />
          </n-form-item>
          <n-form-item label="备注" path="remark">
            <n-input v-model:value="createForm.remark" placeholder="备注" type="textarea" style="width: 400px" />
          </n-form-item>
          <n-form-item label="盘点商品" required>
            <n-space vertical style="width: 100%">
              <n-alert v-if="!createForm.warehouseId" type="warning" :show-icon="false">
                请先选择调整仓库
              </n-alert>
              <n-space v-else>
                <n-button type="primary" size="small" @click="showSkuSelector">添加盘点商品</n-button>
                <n-text type="info" depth="3">已选择 {{ createForm.items.length }} 个商品</n-text>
              </n-space>
              
              <n-table v-if="createForm.items.length > 0" :bordered="true" :single-line="false" size="small">
                <thead>
                  <tr>
                    <th style="width: 180px">商品名称</th>
                    <th style="width: 120px">SKU编码</th>
                    <th style="width: 120px">规格</th>
                    <th style="width: 100px">账面数量</th>
                    <th style="width: 120px">实盘数量</th>
                    <th style="width: 100px">差异</th>
                    <th style="width: 80px">操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in createForm.items" :key="index">
                    <td>{{ item.productName }}</td>
                    <td>{{ item.skuCode }}</td>
                    <td>{{ item.specs }}</td>
                    <td>
                      <n-tag type="info" size="small">{{ item.bookQty }}</n-tag>
                    </td>
                    <td>
                      <n-input-number 
                        v-model:value="item.actualQty" 
                        :min="0"
                        style="width: 100px"
                        size="small"
                        @update:value="(val: number | null) => handleActualQtyChange(index, val)"
                      />
                    </td>
                    <td>
                      <n-tag :type="getDiffTagType(item.diffQty)" size="small">
                        {{ item.diffQty > 0 ? '+' : '' }}{{ item.diffQty }}
                      </n-tag>
                    </td>
                    <td>
                      <n-button type="error" size="small" @click="removeItem(index)">删除</n-button>
                    </td>
                  </tr>
                </tbody>
              </n-table>
              <n-empty v-else description="暂无商品，请点击添加盘点商品" />
              
              <!-- 差异汇总 -->
              <n-card v-if="createForm.items.length > 0" title="盘点汇总" size="small" class="mt-4">
                <n-row :gutter="16">
                  <n-col :span="6">
                    <n-statistic label="盘点商品数" :value="createForm.items.length" />
                  </n-col>
                  <n-col :span="6">
                    <n-statistic label="盘盈商品">
                      <n-text type="success">{{ profitCount }} 个</n-text>
                    </n-statistic>
                  </n-col>
                  <n-col :span="6">
                    <n-statistic label="盘亏商品">
                      <n-text type="error">{{ lossCount }} 个</n-text>
                    </n-statistic>
                  </n-col>
                  <n-col :span="6">
                    <n-statistic label="无差异">
                      <n-text type="info">{{ noDiffCount }} 个</n-text>
                    </n-statistic>
                  </n-col>
                </n-row>
              </n-card>
            </n-space>
          </n-form-item>
        </n-form>
      </n-card>
      <template #footer>
        <n-space justify="end">
          <n-button @click="createModalVisible = false">取消</n-button>
          <n-button type="primary" @click="handleSave" :disabled="createForm.items.length === 0">
            保存
          </n-button>
        </n-space>
      </template>
    </SmartFormContainer>

    <!-- SKU选择器弹窗 -->
    <n-modal v-model:show="skuSelectorVisible" title="选择盘点商品" style="width: 700px">
      <n-card>
        <QueryForm>
          <n-form-item label="商品名称">
            <n-input v-model:value="skuSearchForm.productName" placeholder="搜索商品" clearable />
          </n-form-item>
          <n-form-item label="SKU编码">
            <n-input v-model:value="skuSearchForm.skuCode" placeholder="搜索SKU" clearable />
          </n-form-item>
          <n-form-item>
            <n-button type="primary" @click="loadAvailableSkus">搜索</n-button>
          </n-form-item>
        </QueryForm>
        
        <n-data-table
          :columns="skuSelectorColumns"
          :data="availableSkuList"
          :loading="skuLoading"
          :pagination="skuPagination"
          :row-key="(row: any) => row.skuId"
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
    <n-modal v-model:show="detailModalVisible" title="调整单详情" style="width: 700px">
      <n-card v-if="currentAdjustment">
        <n-descriptions bordered :column="2">
          <n-descriptions-item label="调整单号">{{ currentAdjustment.adjustNo }}</n-descriptions-item>
          <n-descriptions-item label="状态">
            <n-tag :type="getStatusType(currentAdjustment.status)">{{ getStatusText(currentAdjustment.status) }}</n-tag>
          </n-descriptions-item>
          <n-descriptions-item label="仓库">{{ currentAdjustment.warehouseName }}</n-descriptions-item>
          <n-descriptions-item label="备注" :span="2">{{ currentAdjustment.remark || '-' }}</n-descriptions-item>
        </n-descriptions>
        <n-divider />
        <n-table :bordered="true" :single-line="false" size="small">
          <thead>
            <tr>
              <th>商品名称</th>
              <th>SKU编码</th>
              <th>规格</th>
              <th>账面数量</th>
              <th>实盘数量</th>
              <th>差异</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in currentAdjustment.items" :key="item.id">
              <td>{{ item.productName }}</td>
              <td>{{ item.skuCode }}</td>
              <td>{{ formatSpecs(item.specs) }}</td>
              <td>{{ item.bookQty }}</td>
              <td>{{ item.actualQty }}</td>
              <td>
                <n-tag :type="item.diffQty > 0 ? 'success' : item.diffQty < 0 ? 'error' : 'default'" size="small">
                  {{ item.diffQty > 0 ? '+' : '' }}{{ item.diffQty }}
                </n-tag>
              </td>
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
import type { DataTableColumns, DataTableRowKey, DataTableRowData } from 'naive-ui';
import QueryForm from '@/components/common/QueryForm.vue';
import SmartFormContainer from '@/components/common/SmartFormContainer.vue';
import { getAdjustments, createAdjustment, auditAdjustment, completeAdjustment, cancelAdjustment, type Adjustment } from '@/api/adjustment';
import { getWarehouses } from '@/api/warehouse';
import { getInventories } from '@/api/inventory';
import type { Warehouse } from '@/types/basic-data';
import { autoFitTableColumns, createActionColumn, getTableScrollX } from '@/utils/table';

const message = useMessage();

// 状态选项
const statusOptions = [
  { label: '待审核', value: 'PENDING' },
  { label: '已审核', value: 'APPROVED' },
  { label: '已完成', value: 'COMPLETED' },
  { label: '已取消', value: 'CANCELLED' },
];

// 搜索表单
const searchForm = reactive({
  adjustNo: '',
  warehouseId: undefined as number | undefined,
  status: undefined as string | undefined,
  page: 1,
  pageSize: 10,
});

// 选项数据
const warehouseOptions = ref<{ label: string; value: number }[]>([]);

// 列表数据
const loading = ref(false);
const adjustmentList = ref<Adjustment[]>([]);
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
  warehouseId: undefined as number | undefined,
  remark: '',
  items: [] as { 
    skuId: number; 
    bookQty: number;
    actualQty: number;
    diffQty: number;
    productName: string;
    skuCode: string;
    specs: string;
  }[],
});

// 差异统计
const profitCount = computed(() => createForm.items.filter(i => i.diffQty > 0).length);
const lossCount = computed(() => createForm.items.filter(i => i.diffQty < 0).length);
const noDiffCount = computed(() => createForm.items.filter(i => i.diffQty === 0).length);

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
    title: '当前库存', 
    key: 'quantity', 
    width: 100,
    render(row: DataTableRowData) {
      return h(NTag, { type: 'info', size: 'small' }, {
        default: () => String(row.quantity),
      });
    },
  },
];

// 详情弹窗
const detailModalVisible = ref(false);
const currentAdjustment = ref<Adjustment | null>(null);

// 表格列定义
const columns: DataTableColumns<Adjustment> = autoFitTableColumns([
  { title: '调整单号', key: 'adjustNo' },
  { title: '仓库', key: 'warehouseName' },
  {
    title: '状态',
    key: 'status',
    render(row) {
      return h(NTag, { type: getStatusType(row.status), size: 'small' }, {
        default: () => getStatusText(row.status),
      });
    },
  },
  { title: '商品种类', key: 'items', render(row) { return row.items?.length || 0; } },
  { title: '备注', key: 'remark', ellipsis: { tooltip: true } },
  { title: '创建时间', key: 'createdAt' },
  createActionColumn<Adjustment>({
    title: '操作',
    key: 'actions',
    fixed: 'right',
    render(row) {
      return h(NSpace, null, {
        default: () => [
          h(NButton, { size: 'small', onClick: () => handleDetail(row) }, { default: () => '详情' }),
          row.status === 'PENDING' && h(NButton, { type: 'primary', size: 'small', onClick: () => handleAudit(row) }, { default: () => '审核' }),
          row.status === 'APPROVED' && h(NButton, { type: 'success', size: 'small', onClick: () => handleComplete(row) }, { default: () => '执行调整' }),
          (row.status === 'PENDING' || row.status === 'APPROVED') && h(NButton, { type: 'error', size: 'small', onClick: () => handleCancel(row) }, { default: () => '取消' }),
        ],
      });
    },
  }, 4),
]);
const tableScrollX = getTableScrollX(columns);

// 获取差异标签类型
function getDiffTagType(diffQty: number) {
  if (diffQty > 0) return 'success';
  if (diffQty < 0) return 'error';
  return 'default';
}

// 获取状态类型
function getStatusType(status: string) {
  const map: Record<string, any> = {
    PENDING: 'warning',
    APPROVED: 'info',
    COMPLETED: 'success',
    CANCELLED: 'error',
  };
  return map[status] || 'default';
}

// 获取状态文本
function getStatusText(status: string) {
  const map: Record<string, string> = {
    PENDING: '待审核',
    APPROVED: '已审核',
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
    const res: any = await getAdjustments(searchForm);
    adjustmentList.value = res.data.data;
    pagination.itemCount = res.data.meta.total;
    pagination.page = res.data.meta.page;
    pagination.pageSize = res.data.meta.pageSize;
  } finally {
    loading.value = false;
  }
}

// 加载仓库选项
async function loadWarehouses() {
  const res: any = await getWarehouses();
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
  searchForm.adjustNo = '';
  searchForm.warehouseId = undefined;
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
  createForm.warehouseId = undefined;
  createForm.remark = '';
  createForm.items = [];
  skuSearchForm.productName = '';
  skuSearchForm.skuCode = '';
  selectedSkus.value = [];
  createModalVisible.value = true;
}

// 仓库变更
function handleWarehouseChange() {
  // 清空已选商品
  createForm.items = [];
  selectedSkus.value = [];
}

// 实盘数量变更
function handleActualQtyChange(index: number, val: number | null) {
  const item = createForm.items[index];
  if (item && val !== null) {
    item.actualQty = val;
    item.diffQty = val - item.bookQty;
  }
}

// 显示SKU选择器
function showSkuSelector() {
  if (!createForm.warehouseId) {
    message.warning('请先选择调整仓库');
    return;
  }
  skuSelectorVisible.value = true;
  loadAvailableSkus();
}

// 加载可用SKU列表（带库存）
async function loadAvailableSkus() {
  if (!createForm.warehouseId) return;
  
  skuLoading.value = true;
  try {
    const res: any = await getInventories({
      warehouseId: createForm.warehouseId,
      productName: skuSearchForm.productName || undefined,
      skuCode: skuSearchForm.skuCode || undefined,
      page: skuPagination.page,
      pageSize: skuPagination.pageSize,
    });
    
    // 过滤掉已经选择的SKU
    const existingSkuIds = createForm.items.map(i => i.skuId);
    availableSkuList.value = res.data
      .filter((item: DataTableRowData) => !existingSkuIds.includes(item.skuId as number))
      .map((item: DataTableRowData) => ({
        skuId: item.skuId as number,
        productName: item.productName as string,
        skuCode: item.skuCode as string,
        specs: formatSpecs(item.specs as Record<string, string>),
        quantity: item.quantity as number,
      }));
    
    skuPagination.itemCount = res.meta?.total || 0;
    skuPagination.page = res.meta?.page || 1;
    skuPagination.pageSize = res.meta?.pageSize || 10;
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
      bookQty: item.quantity,
      actualQty: item.quantity, // 默认实盘=账面，差异为0
      diffQty: 0,
      productName: item.productName,
      skuCode: item.skuCode,
      specs: item.specs,
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
  if (!createForm.warehouseId) {
    message.error('请选择调整仓库');
    return;
  }
  if (createForm.items.length === 0) {
    message.error('请至少添加一个盘点商品');
    return;
  }
  
  // 检查是否有实际差异
  const hasDiff = createForm.items.some(i => i.diffQty !== 0);
  if (!hasDiff) {
    message.warning('所有商品账面数量与实盘数量一致，无需调整');
    return;
  }
  
  try {
    await createAdjustment({
      warehouseId: createForm.warehouseId,
      remark: createForm.remark,
      items: createForm.items.map(i => ({ skuId: i.skuId, actualQty: i.actualQty })),
    });
    message.success('创建成功');
    createModalVisible.value = false;
    loadData();
  } catch (error: any) {
    message.error(error.response?.data?.message || '创建失败');
  }
}

// 详情
function handleDetail(row: Adjustment) {
  currentAdjustment.value = row;
  detailModalVisible.value = true;
}

// 审核
async function handleAudit(row: Adjustment) {
  try {
    await auditAdjustment(row.id);
    message.success('审核成功');
    loadData();
  } catch (error: any) {
    message.error(error.response?.data?.message || '审核失败');
  }
}

// 完成调整
async function handleComplete(row: Adjustment) {
  try {
    await completeAdjustment(row.id);
    message.success('调整完成');
    loadData();
  } catch (error: any) {
    message.error(error.response?.data?.message || '调整失败');
  }
}

// 取消
async function handleCancel(row: Adjustment) {
  try {
    await cancelAdjustment(row.id);
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
