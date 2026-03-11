<template>
  <div class="p-4">
    <!-- 搜索栏 -->
    <n-card class="mb-4">
      <n-form inline :model="searchForm" label-placement="left">
        <n-form-item label="关键词">
          <n-input v-model:value="searchForm.keyword" placeholder="商品名称/编码" clearable />
        </n-form-item>
        <n-form-item label="分类">
          <n-select
            v-model:value="searchForm.categoryId"
            :options="categoryOptions"
            placeholder="选择分类"
            clearable
            style="width: 180px"
          />
        </n-form-item>
        <n-form-item label="品牌">
          <n-select
            v-model:value="searchForm.brandId"
            :options="brandOptions"
            placeholder="选择品牌"
            clearable
            style="width: 180px"
          />
        </n-form-item>
        <n-form-item label="商品状态">
          <n-select
            v-model:value="searchForm.isEnabled"
            :options="enabledOptions"
            placeholder="选择状态"
            clearable
            style="width: 140px"
          />
        </n-form-item>
        <n-form-item label="商城">
          <n-select
            v-model:value="searchForm.mallEnabled"
            :options="mallOptions"
            placeholder="商城状态"
            clearable
            style="width: 140px"
          />
        </n-form-item>
        <n-form-item>
          <n-space>
            <n-button type="primary" @click="handleSearch">搜索</n-button>
            <n-button @click="handleReset">重置</n-button>
          </n-space>
        </n-form-item>
      </n-form>
    </n-card>

    <!-- 操作栏 -->
    <n-card class="mb-4">
      <n-space>
        <n-button type="primary" @click="handleCreate">新增商品</n-button>
        <n-button @click="handleInventoryQuery">库存查询</n-button>
      </n-space>
    </n-card>

    <!-- 商品列表 -->
    <n-card>
      <n-data-table
        :columns="columns"
        :data="productList"
        :loading="loading"
        :pagination="pagination"
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
        remote
      />
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, h, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { NButton, NSpace, NTag, NPopconfirm, NImage, useMessage } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { getProducts, deleteProduct, updateProduct } from '@/api/product';
import { getCategories } from '@/api/category';
import { getBrands } from '@/api/brand';
import type { Product } from '@/types/product';
import type { Category } from '@/types/basic-data';
import type { Brand } from '@/types/basic-data';

const router = useRouter();
const message = useMessage();

// 搜索表单
const searchForm = reactive({
  keyword: '',
  categoryId: null as number | null,
  brandId: null as number | null,
  isEnabled: null as boolean | null,
  mallEnabled: null as boolean | null,
});

// 选项数据
const categoryOptions = ref<{ label: string; value: number }[]>([]);
const brandOptions = ref<{ label: string; value: number }[]>([]);
const enabledOptions = [
  { label: '启用', value: true },
  { label: '禁用', value: false },
];
const mallOptions = [
  { label: '已上架', value: true },
  { label: '未上架', value: false },
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
const columns: DataTableColumns<Product> = [
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
    width: 140,
  },
  {
    title: '分类',
    key: 'category',
    width: 120,
    render(row) {
      return row.category?.name || '-';
    },
  },
  {
    title: '品牌',
    key: 'brand',
    width: 100,
    render(row) {
      return row.brand?.name || '-';
    },
  },
  {
    title: 'SKU数量',
    key: 'skus',
    width: 90,
    render(row) {
      return h(NTag, { size: 'small' }, { default: () => row.skus?.length || 0 });
    },
  },
  {
    title: '是否启用',
    key: 'isEnabled',
    width: 100,
    render(row) {
      return h(NTag, { type: row.isEnabled ? 'success' : 'default', size: 'small' }, {
        default: () => row.isEnabled ? '启用' : '禁用',
      });
    },
  },
  {
    title: '商城',
    key: 'mallEnabled',
    width: 100,
    render(row) {
      return h(NTag, { type: row.mallEnabled ? 'success' : 'default', size: 'small' }, {
        default: () => row.mallEnabled ? '已上架' : '未上架',
      });
    },
  },
  {
    title: '操作',
    key: 'actions',
    width: 200,
    fixed: 'right',
    render(row) {
      return h(NSpace, null, {
        default: () => [
          h(NButton, { size: 'small', onClick: () => handleEdit(row) }, { default: () => '编辑' }),
          h(
            NPopconfirm,
            { onPositiveClick: () => handleToggleMall(row) },
            {
              trigger: () => h(
                NButton,
                { size: 'small', type: row.mallEnabled ? 'warning' : 'primary', disabled: !row.isEnabled && !row.mallEnabled },
                { default: () => row.mallEnabled ? '商城下架' : '商城上架' },
              ),
              default: () => `确定要${row.mallEnabled ? '从商城下架' : '上架到商城'}该商品吗？`,
            }
          ),
          h(
            NPopconfirm,
            { onPositiveClick: () => handleToggleStatus(row) },
            {
              trigger: () => h(NButton, { size: 'small' }, { default: () => row.isEnabled ? '禁用' : '启用' }),
              default: () => `确定要${row.isEnabled ? '禁用' : '启用'}该商品吗？`,
            }
          ),
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
  },
];

// 加载数据
const loadData = async () => {
  loading.value = true;
  try {
    const res = await getProducts({
      keyword: searchForm.keyword || undefined,
      categoryId: searchForm.categoryId || undefined,
      brandId: searchForm.brandId || undefined,
      isEnabled: searchForm.isEnabled === null ? undefined : searchForm.isEnabled,
      mallEnabled: searchForm.mallEnabled === null ? undefined : searchForm.mallEnabled,
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
  searchForm.mallEnabled = null;
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
      mallEnabled: row.isEnabled ? false : row.mallEnabled,
    });
    message.success('操作成功');
    loadData();
  } catch (error) {
    message.error('操作失败');
  }
};

const handleToggleMall = async (row: Product) => {
  if (!row.mallEnabled && !row.isEnabled) {
    message.warning('请先启用商品，再上架到商城');
    return;
  }

  try {
    await updateProduct(row.id, {
      mallEnabled: !row.mallEnabled,
    });
    message.success(row.mallEnabled ? '已从商城下架' : '已上架到商城');
    loadData();
  } catch (error) {
    message.error(row.mallEnabled ? '商城下架失败' : '商城上架失败');
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
