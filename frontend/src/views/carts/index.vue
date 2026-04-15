<template>
  <div class="page-container">
    <n-card title="购物车管理" class="page-card">
      <!-- 搜索栏 -->
      <QueryForm :model="searchForm" class="search-form">
        <n-form-item label="用户ID">
          <n-input-number
            v-model:value="searchForm.userId"
            placeholder="请输入用户ID"
            clearable
          />
        </n-form-item>
        <n-form-item label="关键词">
          <n-input
            v-model:value="searchForm.keyword"
            placeholder="商品名称/SKU编码"
            clearable
          />
        </n-form-item>
        <n-form-item>
          <n-space>
            <n-button type="primary" @click="handleSearch">
              <template #icon>
                <n-icon><SearchOutline /></n-icon>
              </template>
              搜索
            </n-button>
            <n-button @click="handleReset">重置</n-button>
          </n-space>
        </n-form-item>
      </QueryForm>

      <!-- 操作栏 -->
      <n-space class="page-toolbar toolbar" style="margin-bottom: 16px">
        <n-button type="error" @click="handleBatchDelete" :disabled="!checkedRowKeys.length">
          批量删除
        </n-button>
      </n-space>

      <!-- 数据表格 -->
      <n-data-table
        :columns="columns"
        :data="tableData"
        :loading="loading"
        :pagination="pagination"
        :row-key="(row: any) => row.id"
        v-model:checked-row-keys="checkedRowKeys"
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
      />
    </n-card>

    <!-- 详情抽屉 -->
    <n-drawer v-model:show="detailDrawerVisible" :width="500" title="购物车详情">
      <n-drawer-content v-if="currentItem">
        <n-descriptions :column="1" bordered>
          <n-descriptions-item label="购物车ID">{{ currentItem.id }}</n-descriptions-item>
          <n-descriptions-item label="用户">{{ currentItem.username }} (ID: {{ currentItem.userId }})</n-descriptions-item>
          <n-descriptions-item label="商品名称">{{ currentItem.productName }}</n-descriptions-item>
          <n-descriptions-item label="SKU编码">{{ currentItem.skuCode }}</n-descriptions-item>
          <n-descriptions-item label="规格">
            <n-tag v-for="(value, key) in currentItem.specs" :key="key" size="small" style="margin-right: 8px">
              {{ key }}: {{ value }}
            </n-tag>
          </n-descriptions-item>
          <n-descriptions-item label="单价">¥{{ formatPrice(currentItem.salePrice) }}</n-descriptions-item>
          <n-descriptions-item label="数量">{{ currentItem.quantity }}</n-descriptions-item>
          <n-descriptions-item label="小计">¥{{ formatPrice(currentItem.subtotal) }}</n-descriptions-item>
          <n-descriptions-item label="库存">{{ currentItem.stock }}</n-descriptions-item>
          <n-descriptions-item label="选中状态">
            <n-tag :type="currentItem.selected ? 'success' : 'default'">
              {{ currentItem.selected ? '已选中' : '未选中' }}
            </n-tag>
          </n-descriptions-item>
          <n-descriptions-item label="创建时间">{{ formatDateTime(currentItem.createdAt) }}</n-descriptions-item>
          <n-descriptions-item label="更新时间">{{ formatDateTime(currentItem.updatedAt) }}</n-descriptions-item>
        </n-descriptions>
        
        <n-space style="margin-top: 16px" justify="end">
          <n-button @click="detailDrawerVisible = false">关闭</n-button>
          <n-button type="error" @click="handleDelete(currentItem.id)">删除</n-button>
        </n-space>
      </n-drawer-content>
    </n-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, h } from 'vue';
import { useMessage, useDialog, NButton, NSpace, NTag, NImage, NPopconfirm } from 'naive-ui';
import { SearchOutline, EyeOutline, TrashOutline } from '@vicons/ionicons5';
import { getCartList, deleteCart, deleteCartBatch } from '@/api/cart';
import type { DataTableColumns, DataTableRowData } from 'naive-ui';
import QueryForm from '@/components/common/QueryForm.vue';

const message = useMessage();
const dialog = useDialog();

// 搜索表单
const searchForm = reactive({
  userId: undefined as number | undefined,
  keyword: '',
});

// 表格数据
const loading = ref(false);
const tableData = ref<any[]>([]);
const checkedRowKeys = ref<number[]>([]);
const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
});

// 详情抽屉
const detailDrawerVisible = ref(false);
const currentItem = ref<any>(null);

// 表格列定义
const columns: DataTableColumns<any> = [
  { type: 'selection', fixed: 'left' },
  {
    title: 'ID',
    key: 'id',
    width: 60,
  },
  {
    title: '用户信息',
    key: 'user',
    width: 120,
    render(row: DataTableRowData) {
      return h('div', [
        h('div', row.username as string),
        h('div', { style: 'color: #999; font-size: 12px' }, `ID: ${row.userId}`),
      ]);
    },
  },
  {
    title: '商品信息',
    key: 'product',
    minWidth: 250,
    render(row: DataTableRowData) {
      return h('div', { style: 'display: flex; align-items: center; gap: 8px' }, [
        h(NImage, {
          src: (row.mainImage || row.skuImage || '/placeholder.png') as string,
          width: 50,
          height: 50,
          style: 'border-radius: 4px; object-fit: cover;',
          fallbackSrc: '/placeholder.png',
        }),
        h('div', [
          h('div', { style: 'font-weight: 500' }, row.productName as string),
          h('div', { style: 'color: #999; font-size: 12px; margin-top: 4px' }, row.skuCode as string),
          h('div', { style: 'margin-top: 4px' },
            Object.entries((row.specs || {}) as Record<string, unknown>).map(([key, value]: [string, unknown]) =>
              h(NTag, { size: 'small', style: 'margin-right: 4px' }, { default: () => `${key}: ${value}` })
            )
          ),
        ]),
      ]);
    },
  },
  {
    title: '单价',
    key: 'salePrice',
    width: 100,
    render(row: DataTableRowData) {
      return h('span', `¥${formatPrice(row.salePrice as number)}`);
    },
  },
  {
    title: '数量',
    key: 'quantity',
    width: 80,
  },
  {
    title: '小计',
    key: 'subtotal',
    width: 100,
    render(row) {
      return h('span', { style: 'color: #f5222d; font-weight: 500' }, `¥${formatPrice(row.subtotal)}`);
    },
  },
  {
    title: '库存',
    key: 'stock',
    width: 80,
    render(row: DataTableRowData) {
      const isLow = (row.stock as number) < (row.quantity as number);
      return h(NTag, { type: isLow ? 'error' : 'success', size: 'small' }, { default: () => String(row.stock) });
    },
  },
  {
    title: '状态',
    key: 'selected',
    width: 80,
    render(row: DataTableRowData) {
      return h(NTag, { type: row.selected ? 'success' : 'default', size: 'small' }, {
        default: () => (row.selected ? '已选中' : '未选中') as string,
      });
    },
  },
  {
    title: '添加时间',
    key: 'createdAt',
    width: 160,
    render(row: DataTableRowData) {
      return h('span', formatDateTime(row.createdAt as string));
    },
  },
  {
    title: '操作',
    key: 'actions',
    width: 120,
    fixed: 'right',
    render(row: DataTableRowData) {
      return h(NSpace, {}, {
        default: () => [
          h(NButton, {
            size: 'small',
            onClick: () => handleViewDetail(row),
          }, { icon: () => h(EyeOutline), default: () => '详情' }),
          h(NPopconfirm, {
            onPositiveClick: () => handleDelete(row.id as number),
          }, {
            trigger: () => h(NButton, { size: 'small', type: 'error' }, { icon: () => h(TrashOutline) }),
            default: () => '确定删除该购物车项吗？',
          }),
        ],
      });
    },
  },
];

// 加载数据
async function loadData() {
  loading.value = true;
  try {
    const res: any = await getCartList({
      userId: searchForm.userId,
      keyword: searchForm.keyword || undefined,
      page: pagination.page,
      pageSize: pagination.pageSize,
    });
    tableData.value = res.data || [];
    pagination.itemCount = res.meta?.total || 0;
  } catch (error) {
    console.error('加载购物车列表失败:', error);
    message.error('加载数据失败');
  } finally {
    loading.value = false;
  }
}

// 搜索
function handleSearch() {
  pagination.page = 1;
  loadData();
}

// 重置
function handleReset() {
  searchForm.userId = undefined;
  searchForm.keyword = '';
  pagination.page = 1;
  loadData();
}

// 分页变化
function handlePageChange(page: number) {
  pagination.page = page;
  loadData();
}

// 每页条数变化
function handlePageSizeChange(pageSize: number) {
  pagination.pageSize = pageSize;
  pagination.page = 1;
  loadData();
}

// 查看详情
function handleViewDetail(row: any) {
  currentItem.value = row;
  detailDrawerVisible.value = true;
}

// 删除
async function handleDelete(id: number) {
  try {
    await deleteCart(id);
    message.success('删除成功');
    if (detailDrawerVisible.value) {
      detailDrawerVisible.value = false;
    }
    loadData();
  } catch (error) {
    console.error('删除失败:', error);
    message.error('删除失败');
  }
}

// 批量删除
function handleBatchDelete() {
  if (!checkedRowKeys.value.length) return;
  
  dialog.warning({
    title: '确认删除',
    content: `确定删除选中的 ${checkedRowKeys.value.length} 项吗？`,
    positiveText: '确认',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await deleteCartBatch(checkedRowKeys.value);
        message.success('批量删除成功');
        checkedRowKeys.value = [];
        loadData();
      } catch (error) {
        console.error('批量删除失败:', error);
        message.error('批量删除失败');
      }
    },
  });
}

// 格式化价格
function formatPrice(price: number) {
  return (price / 100).toFixed(2);
}

// 格式化日期时间
function formatDateTime(date: string) {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleString('zh-CN');
}

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.search-form {
  margin-bottom: 16px;
}

.toolbar {
  margin-bottom: 16px;
}
</style>
