<template>
  <div>
    <!-- 搜索栏 -->
    <QueryForm :model="searchForm" @search="handleSearch" class="mb-4">
      <n-form-item label="关键词">
        <n-input v-model:value="searchForm.keyword" placeholder="商品名称/SKU编码" clearable />
      </n-form-item>
      <n-form-item>
        <n-space>
          <n-button type="primary" @click="handleSearch">搜索</n-button>
          <n-button @click="handleReset">重置</n-button>
        </n-space>
      </n-form-item>
    </QueryForm>

    <!-- SKU列表 -->
    <n-data-table
      :columns="columns"
      :data="skuList"
      :loading="loading"
      :pagination="pagination"
      :row-key="(row: any) => row.id"
      @update:checked-row-keys="handleCheck"
      @update:page="handlePageChange"
      @update:page-size="handlePageSizeChange"
      remote
    />

    <!-- 底部操作 -->
    <div class="flex justify-between items-center mt-4">
      <div class="text-gray-500">已选择 {{ selectedIds.length }} 项</div>
      <n-space>
        <n-button @click="$emit('cancel')">取消</n-button>
        <n-button type="primary" :disabled="selectedIds.length === 0" @click="handleConfirm">
          确认选择
        </n-button>
      </n-space>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, h, onMounted } from 'vue';
import { NButton, NImage, useMessage } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import QueryForm from '@/components/common/QueryForm.vue';
import { getProducts, getProductSkus } from '@/api/product';
import type { ProductSku } from '@/types/product';

const emit = defineEmits<{
  select: [skus: any[]];
  cancel: [];
}>();

const message = useMessage();

// 搜索表单
const searchForm = reactive({
  keyword: '',
});

// 列表数据
const loading = ref(false);
const skuList = ref<any[]>([]);
const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
});

// 选中项
const selectedIds = ref<number[]>([]);
const selectedRows = ref<any[]>([]);

// 表格列定义
const columns: DataTableColumns<any> = [
  {
    type: 'selection',
    disabled(row: any) {
      return row.status !== 'ACTIVE';
    },
  },
  {
    title: 'SKU图片',
    key: 'image',
    width: 80,
    render(row: any) {
      return h(NImage, {
        src: row.image || row.product?.mainImage || '/placeholder.png',
        width: 50,
        height: 50,
        objectFit: 'cover',
        fallbackSrc: '/placeholder.png',
      });
    },
  },
  {
    title: 'SKU编码',
    key: 'skuCode',
    width: 150,
  },
  {
    title: '商品名称',
    key: 'productName',
    render(row: any) {
      return row.product?.name || '-';
    },
  },
  {
    title: '规格',
    key: 'specs',
    render(row: any) {
      if (!row.specs || Object.keys(row.specs).length === 0) {
        return '-';
      }
      return Object.entries(row.specs)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
    },
  },
  {
    title: '成本价',
    key: 'costPrice',
    width: 100,
    render(row: any) {
      return `¥${Number(row.costPrice).toFixed(2)}`;
    },
  },
  {
    title: '销售价',
    key: 'salePrice',
    width: 100,
    render(row: any) {
      return `¥${Number(row.salePrice).toFixed(2)}`;
    },
  },
];

// 加载SKU列表
const loadData = async () => {
  loading.value = true;
  try {
    // 先获取商品列表
    const productRes = await getProducts({
      keyword: searchForm.keyword || undefined,
      page: pagination.page,
      pageSize: pagination.pageSize,
    });

    const products = productRes.data;
    pagination.itemCount = productRes.meta.total;

      // 获取每个商品的SKU
      const skuPromises = products.map((p: any) =>
        getProductSkus(p.id).then((res) => {
          return res.map((sku: ProductSku) => ({
            ...sku,
            product: p,
          }));
        })
      );

      const skuArrays = await Promise.all(skuPromises);
      skuList.value = skuArrays.flat();
  } catch (error) {
    console.error('加载SKU失败:', error);
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

// 选择
const handleCheck = (keys: (string | number)[], rows: any[]) => {
  selectedIds.value = keys as number[];
  selectedRows.value = rows;
};

// 确认选择
const handleConfirm = () => {
  if (selectedRows.value.length === 0) {
    message.warning('请至少选择一个商品');
    return;
  }
  emit('select', selectedRows.value);
};

onMounted(() => {
  loadData();
});
</script>
