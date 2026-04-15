<template>
  <div class="p-4">
    <!-- 搜索栏 -->
    <n-card class="mb-4" content-style="padding-bottom: 0;">
      <QueryForm :model="searchForm">
        <n-form-item label="关键词">
          <n-input v-model:value="searchForm.keyword" placeholder="商品名称/编码" clearable />
        </n-form-item>
        <n-form-item label="分类">
          <n-select v-model:value="searchForm.categoryId" :options="categoryOptions" placeholder="选择分类" clearable />
        </n-form-item>
        <n-form-item label="品牌">
          <n-select v-model:value="searchForm.brandId" :options="brandOptions" placeholder="选择品牌" clearable />
        </n-form-item>
        <n-form-item label="商品状态">
          <n-select v-model:value="searchForm.isEnabled" :options="enabledOptions" placeholder="选择状态" clearable />
        </n-form-item>
        <n-form-item>
          <n-space>
            <n-button type="primary" @click="handleSearch">搜索</n-button>
            <n-button @click="handleReset">重置</n-button>
          </n-space>
        </n-form-item>
      </QueryForm>
    </n-card>

    <!-- 商品列表 -->
    <n-card>
      <n-space class="page-toolbar mb-4">
        <n-button type="primary" @click="handleCreate">新增商品</n-button>
        <n-button @click="handleInventoryQuery">库存查询</n-button>
      </n-space>
      <n-data-table :columns="columns" :data="productList" :loading="loading" :pagination="pagination" :scroll-x="tableScrollX"
        @update:page="handlePageChange" @update:page-size="handlePageSizeChange" remote />
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, h, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { NButton, NSpace, NTag, NPopconfirm, NImage, NSwitch, useMessage } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import QueryForm from '@/components/common/QueryForm.vue';
import { getProducts, deleteProduct, updateProduct } from '@/api/product';
import { getCategories } from '@/api/category';
import { getBrands } from '@/api/brand';
import type { Product } from '@/types/product';
import type { Category } from '@/types/basic-data';
import type { Brand } from '@/types/basic-data';
import { autoFitTableColumns, createActionColumn, getTableScrollX } from '@/utils/table';

const router = useRouter();
const message = useMessage();

// 搜索表单
const searchForm = reactive({
  keyword: '',
  categoryId: null as number | null,
  brandId: null as number | null,
  isEnabled: null as boolean | null,
});

// 选项数据
const categoryOptions = ref<{ label: string; value: number }[]>([]);
const brandOptions = ref<{ label: string; value: number }[]>([]);
const enabledOptions = [
  { label: '启用', value: true },
  { label: '禁用', value: false },
];

// 列表数据
const loading = ref(false);
const productList = ref<Product[]>([]);
const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
});

// 表格列定义
const columns: DataTableColumns<Product> = autoFitTableColumns([
  {
    title: '商品名称',
    key: 'name',
    ellipsis: {
      tooltip: true,
    },
  },
  {
    title: '商品图片',
    key: 'mainImage',
    render(row) {
      return h(NImage, {
        src: row.mainImage || '/placeholder.png',
        width: 60,
        height: 60,
        objectFit: 'cover',
        fallbackSrc: '/placeholder.png',
      });
    },
  },
  {
    title: 'SPU编码',
    key: 'spuCode',
  },
  {
    title: '分类',
    key: 'category',
    render(row) {
      return row.category?.name || '-';
    },
  },
  {
    title: '品牌',
    key: 'brand',
    render(row) {
      return row.brand?.name || '-';
    },
  },
  {
    title: '单位',
    key: 'unit',
    render(row) {
      return row.unit?.name || '-';
    },
  },
  {
    title: 'SKU数量',
    key: 'skus',
    render(row) {
      return h(NTag, { size: 'small' }, { default: () => row.skus?.length || 0 });
    },
  },
  {
    title: '状态',
    key: 'isEnabled',
    render(row) {
      return h(NSpace, { align: 'center', size: 8 }, {
        default: () => [
          h(NSwitch, {
            value: row.isEnabled,
            onUpdateValue: () => handleToggleStatus(row),
          }),
          h(NTag, { type: row.isEnabled ? 'success' : 'default', size: 'small' }, {
            default: () => row.isEnabled ? '启用' : '禁用',
          }),
        ],
      });
    },
  },
  createActionColumn<Product>({
    title: '操作',
    key: 'actions',
    fixed: 'right',
    render(row) {
      return h(NSpace, null, {
        default: () => [
          h(NButton, { size: 'small', onClick: () => handleEdit(row) }, { default: () => '编辑' }),
          h(
            NPopconfirm,
            { onPositiveClick: () => handleDelete(row) },
            {
              trigger: () => h(NButton, { size: 'small', type: 'error' }, { default: () => '删除' }),
              default: () => '确定要删除该商品吗？',
            }
          ),
        ],
      });
    },
  }, 2),
]);
const tableScrollX = getTableScrollX(columns);

// 加载数据
const loadData = async () => {
  loading.value = true;
  try {
    const res = await getProducts({
      keyword: searchForm.keyword || undefined,
      categoryId: searchForm.categoryId || undefined,
      brandId: searchForm.brandId || undefined,
      isEnabled: searchForm.isEnabled === null ? undefined : searchForm.isEnabled,
      page: pagination.page,
      pageSize: pagination.pageSize,
    });
    productList.value = res.data;
    pagination.itemCount = res.meta.total;
  } finally {
    loading.value = false;
  }
};

// 加载分类和品牌选项
const loadOptions = async () => {
  try {
    const [categories, brands] = await Promise.all([getCategories(), getBrands()]);
    categoryOptions.value = categories.map((c: Category) => ({ label: c.name, value: c.id }));
    brandOptions.value = brands.map((b: Brand) => ({ label: b.name, value: b.id }));
  } catch (error) {
    console.error('加载选项失败:', error);
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
  searchForm.categoryId = null;
  searchForm.brandId = null;
  searchForm.isEnabled = null;
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

// 创建商品
const handleCreate = () => {
  router.push('/products/create');
};

// 编辑商品
const handleEdit = (row: Product) => {
  router.push(`/products/edit/${row.id}`);
};

// 切换上下架状态
const handleToggleStatus = async (row: Product) => {
  try {
    await updateProduct(row.id, {
      isEnabled: !row.isEnabled,
    });
    message.success('操作成功');
    loadData();
  } catch (error) {
    message.error('操作失败');
  }
};

// 删除商品
const handleDelete = async (row: Product) => {
  try {
    await deleteProduct(row.id);
    message.success('删除成功');
    loadData();
  } catch (error) {
    message.error('删除失败');
  }
};

// 库存查询
const handleInventoryQuery = () => {
  router.push('/inventories');
};

onMounted(() => {
  loadData();
  loadOptions();
});
</script>
