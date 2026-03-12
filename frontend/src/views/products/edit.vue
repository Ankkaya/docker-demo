<template>
  <div class="p-4">
    <n-card :title="isEdit ? '编辑商品' : '新增商品'">
      <n-steps :current="currentStep" class="mb-8">
        <n-step title="基础信息" />
        <n-step title="规格与SKU" />
      </n-steps>

      <!-- 步骤1: 基础信息 -->
      <n-form
        v-show="currentStep === 1"
        ref="formRef1"
        :model="formData"
        :rules="rules1"
        label-placement="left"
        label-width="100"
        style="max-width: 100%;"
      >
        <n-grid :cols="3" :x-gap="24">
          <n-grid-item>
            <n-form-item label="商品名称" path="name">
              <n-input v-model:value="formData.name" placeholder="请输入商品名称" style="width: 100%" />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="SPU编码" path="spuCode">
              <n-input v-model:value="formData.spuCode" placeholder="留空则自动生成" style="width: 100%" />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="商品分类" path="categoryId">
              <n-cascader
                v-model:value="formData.categoryId"
                :options="categoryOptions"
                placeholder="选择分类"
                check-strategy="child"
                style="width: 100%"
              />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="品牌" path="brandId">
              <n-select
                v-model:value="formData.brandId"
                :options="brandOptions"
                placeholder="选择品牌"
                clearable
                style="width: 100%"
              />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="计量单位" path="unitId">
              <n-select
                v-model:value="formData.unitId"
                :options="unitOptions"
                placeholder="选择单位"
                style="width: 100%"
              />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="商品描述" path="description">
              <n-input
                v-model:value="formData.description"
                type="textarea"
                placeholder="请输入商品描述"
                :rows="2"
                style="width: 100%"
              />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="商品启用" path="isEnabled">
              <n-switch v-model:value="formData.isEnabled" />
            </n-form-item>
          </n-grid-item>
        </n-grid>
        <n-grid :cols="3" :x-gap="24">
          <n-grid-item>
            <n-form-item label="商品主图" path="mainImage">
              <n-upload
                list-type="image-card"
                :max="1"
                v-model:file-list="mainImageList"
                :custom-request="handleMainImageUpload"
                @remove="handleMainImageRemove"
                accept="image/*"
              >
                <n-button>上传主图</n-button>
              </n-upload>
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="商品相册" path="images">
              <n-upload
                list-type="image-card"
                :max="9"
                multiple
                v-model:file-list="imagesList"
                :custom-request="handleImagesUpload"
                @change="handleImagesChange"
                @remove="handleImagesRemove"
                accept="image/*"
              >
                <n-button>上传图片</n-button>
              </n-upload>
            </n-form-item>
          </n-grid-item>
        </n-grid>
        <n-grid :cols="1">
          <n-grid-item>
            <n-form-item label="商品详情">
              <TinymceEditor v-model="formData.detail" />
            </n-form-item>
          </n-grid-item>
        </n-grid>
      </n-form>

      <!-- 步骤2: 规格与SKU -->
      <div v-show="currentStep === 2">
        <n-alert type="info" class="mb-4">
          添加商品规格（如颜色、尺码），系统将自动生成SKU组合。无规格商品请直接添加一个SKU。
        </n-alert>
        <n-alert type="warning" class="mb-4" :show-icon="false">
          商品档案页只维护 SKU 基础属性。库存数量、安全库存、入库仓库等库存数据请在采购入库或库存管理中维护。
        </n-alert>

        <!-- 规格模板设置 -->
        <n-card title="规格设置" class="mb-4">
          <n-space vertical>
            <n-space v-for="(spec, index) in specTemplates" :key="index" align="center">
              <n-input v-model:value="spec.name" placeholder="规格名称（如：颜色）" style="width: 150px" />
              <n-dynamic-tags v-model:value="spec.values" placeholder="输入规格值后回车（如：红、蓝、黑）" style="min-width: 300px" />
              <n-button type="error" text @click="removeSpec(index)">删除</n-button>
            </n-space>
            <n-button type="primary" dashed @click="addSpec" :disabled="specTemplates.length >= 3">
              + 添加规格
            </n-button>
          </n-space>
        </n-card>

        <!-- SKU列表 -->
        <n-card title="SKU列表" class="mb-4">
          <n-data-table  :columns="skuColumns" :data="skuList" :pagination="false" />
        </n-card>

        <n-space class="mb-4">
          <n-button @click="generateSkus" type="info" :disabled="specTemplates.length === 0">
            生成SKU组合
          </n-button>
        </n-space>
      </div>



      <!-- 操作按钮 -->
      <n-space justify="center" class="mt-8">
        <n-button v-if="currentStep > 1" @click="prevStep">上一步</n-button>
        <n-button v-if="currentStep < 2" type="primary" @click="nextStep">下一步</n-button>
        <n-button v-if="currentStep === 2" type="primary" :loading="submitLoading" @click="handleSubmit">
          {{ isEdit ? '保存' : '创建' }}
        </n-button>
        <n-button @click="handleCancel">取消</n-button>
      </n-space>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, h, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { NInput, NInputNumber, NSpace, NButton, NSelect, NSwitch, useMessage, FormInst } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { getProduct, createProduct, updateProduct } from '@/api/product';
import { getCategoriesFlat } from '@/api/category';
import { getBrands } from '@/api/brand';
import { getUnits } from '@/api/unit';
import { uploadFile } from '@/api/file';
import { extractFileObjectKey, resolveFileUrl } from '@/utils/file-url';
import TinymceEditor from '@/components/common/TinymceEditor.vue';
import type { ProductSku, SkuSpec, SpecTemplateItem } from '@/types/product';
import type { Category, Brand, Unit } from '@/types/basic-data';

const route = useRoute();
const router = useRouter();
const message = useMessage();

const isEdit = computed(() => !!route.params.id);
const productId = computed(() => Number(route.params.id));

// 步骤控制
const currentStep = ref(1);
const formRef1 = ref<FormInst | null>(null);
const submitLoading = ref(false);

// 表单数据
const formData = reactive({
  name: '',
  spuCode: '',
  categoryId: null as number | null,
  brandId: null as number | null,
  unitId: null as number | null,
  description: '',
  detail: '',
  mainImage: '',
  images: [] as string[],
  isEnabled: true,
});

// 选项数据
const categoryOptions = ref<{ label: string; value: number; children?: any[] }[]>([]);
const brandOptions = ref<{ label: string; value: number }[]>([]);
const unitOptions = ref<{ label: string; value: number }[]>([]);
// 规格模板
const specTemplates = reactive<SpecTemplateItem[]>([]);

// SKU列表（临时ID用于前端管理）
interface EditableSku extends Omit<ProductSku, 'inventories'> {
  tempId: string;
}

const skuList = reactive<EditableSku[]>([]);

// 图片上传
const mainImageList = ref<any[]>([]);
const imagesList = ref<any[]>([]);

const getFilenameFromKey = (value?: string | null) => {
  if (!value) return 'image.png';
  return value.split('/').pop() || 'image.png';
};

const inferImageMimeType = (value?: string | null) => {
  const filename = getFilenameFromKey(value).toLowerCase();
  if (filename.endsWith('.png')) return 'image/png';
  if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) return 'image/jpeg';
  if (filename.endsWith('.webp')) return 'image/webp';
  if (filename.endsWith('.gif')) return 'image/gif';
  return 'image/png';
};

const normalizeNumberInputValue = (value: unknown, fallback: number | null = 0) => {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : fallback;
};

const normalizeEditableSku = (sku: ProductSku): EditableSku => ({
  ...sku,
  costPrice: normalizeNumberInputValue(sku.costPrice, 0) ?? 0,
  salePrice: normalizeNumberInputValue(sku.salePrice, 0) ?? 0,
  marketPrice: normalizeNumberInputValue(sku.marketPrice, null) ?? undefined,
  weight: normalizeNumberInputValue(sku.weight, null) ?? undefined,
  volume: normalizeNumberInputValue(sku.volume, null) ?? undefined,
  barcode: sku.barcode ?? undefined,
  image: sku.image ?? undefined,
  tempId: `sku_${sku.id}`,
});

const syncImagesFromFileList = () => {
  formData.images = imagesList.value
    .map((file: any) => file.id || file.objectKey)
    .filter((image: string | undefined): image is string => Boolean(image));
};

// 自定义上传请求 - 商品主图
const handleMainImageUpload = async ({ file, onFinish, onError }: any) => {
  try {
    const result = await uploadFile(file.file, 'products/main');
    const previewUrl = resolveFileUrl(result.url);
    
    file.id = result.objectKey;
    file.name = getFilenameFromKey(result.objectKey);
    file.type = inferImageMimeType(result.objectKey);
    file.url = previewUrl;
    file.thumbnailUrl = previewUrl;
    formData.mainImage = result.objectKey;
    
    onFinish({ id: result.objectKey, url: previewUrl });
    message.success('上传成功');
  } catch (error) {
    message.error('上传失败');
    onError();
  }
};

// 自定义上传请求 - 商品相册
const handleImagesUpload = async ({ file, onFinish, onError }: any) => {
  try {
    const result = await uploadFile(file.file, 'products/gallery');
    const previewUrl = resolveFileUrl(result.url);
    
    file.id = result.objectKey;
    file.name = getFilenameFromKey(result.objectKey);
    file.type = inferImageMimeType(result.objectKey);
    file.url = previewUrl;
    file.thumbnailUrl = previewUrl;
    formData.images = Array.from(new Set([...formData.images, result.objectKey]));
    syncImagesFromFileList();

    onFinish({ id: result.objectKey, url: previewUrl });
    message.success('上传成功');
  } catch (error) {
    message.error('上传失败');
    onError();
  }
};

// 表单验证规则
const rules1 = {
  name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择分类', trigger: 'change', type: 'number' }],
  unitId: [{ required: true, message: '请选择单位', trigger: 'change', type: 'number' }],
};

// SKU表格列
const skuColumns = computed<DataTableColumns<any>>(() => [
  { title: 'SKU编码', key: 'skuCode', render: (row) => h(NInput, { value: row.skuCode, onUpdateValue: (v: string) => row.skuCode = v, placeholder: '自动生成', size: 'small' }) },
  { title: '规格', key: 'specs', render: (row) => row.specs?.map((s: SkuSpec) => `${s.name}:${s.value}`).join(', ') || '-' },
  { title: '成本价', key: 'costPrice', width: 110, render: (row) => h(NInputNumber, { value: row.costPrice, onUpdateValue: (v: number | null) => row.costPrice = v || 0, min: 0, precision: 2, placeholder: '成本价', size: 'small' }) },
  { title: '销售价', key: 'salePrice', width: 110, render: (row) => h(NInputNumber, { value: row.salePrice, onUpdateValue: (v: number | null) => row.salePrice = v || 0, min: 0, precision: 2, placeholder: '销售价', size: 'small' }) },
  { title: '市场价', key: 'marketPrice', width: 110, render: (row) => h(NInputNumber, { value: row.marketPrice, onUpdateValue: (v: number | null) => row.marketPrice = v || undefined, min: 0, precision: 2, placeholder: '市场价', size: 'small' }) },
  { title: '条形码', key: 'barcode', width: 120, render: (row) => h(NInput, { value: row.barcode, onUpdateValue: (v: string) => row.barcode = v, placeholder: '条形码', size: 'small' }) },
  { title: '操作', key: 'actions', width: 60, render: (row) => h(NButton, { type: 'error', text: true, size: 'small', onClick: () => removeSku(row.tempId) }, { default: () => '删除' }) },
]);

// 生成临时ID
const generateTempId = () => `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// 添加规格
const addSpec = () => {
  if (specTemplates.length < 3) {
    specTemplates.push({ name: '', values: [] });
  }
};

// 删除规格
const removeSpec = (index: number) => {
  specTemplates.splice(index, 1);
};

// 生成SKU组合
const generateSkus = () => {
  // 过滤掉空的规格
  const validSpecs = specTemplates.filter(s => s.name && s.values.length > 0);
  if (validSpecs.length === 0) {
    message.warning('请至少添加一个有效的规格');
    return;
  }

  // 生成规格组合
  const combinations: SkuSpec[][] = [];
  const generate = (current: SkuSpec[], index: number) => {
    if (index === validSpecs.length) {
      combinations.push([...current]);
      return;
    }
    for (const value of validSpecs[index].values) {
      current.push({ name: validSpecs[index].name, value });
      generate(current, index + 1);
      current.pop();
    }
  };
  generate([], 0);

  // 清空现有SKU
  skuList.length = 0;

  // 创建SKU
  combinations.forEach((specs, index) => {
    skuList.push({
      tempId: generateTempId(),
      id: 0,
      skuCode: '',
      productId: 0,
      specs,
      costPrice: 0,
      salePrice: 0,
      marketPrice: 0,
      image: '',
      barcode: '',
      weight: 0,
      volume: 0,
      isDefault: index === 0,
      sort: index,
      status: 'ACTIVE',
      createdAt: '',
      updatedAt: '',
    });
  });

  message.success(`已生成 ${combinations.length} 个SKU`);
};


// 删除SKU
const removeSku = (tempId: string) => {
  const index = skuList.findIndex(s => s.tempId === tempId);
  if (index > -1) {
    skuList.splice(index, 1);
  }
};



// 图片上传状态变化处理 - 统一通过 fileList 同步数据
const handleMainImageRemove = () => {
  formData.mainImage = '';
};

const handleImagesChange = (options: any) => {
  imagesList.value = options.fileList;
  syncImagesFromFileList();
};

const handleImagesRemove = (options: { file: { id?: string } }) => {
  const removedId = options.file.id;
  if (removedId) {
    formData.images = formData.images.filter(image => image !== removedId);
  } else {
    syncImagesFromFileList();
  }
};

// 步骤控制
const nextStep = async () => {
  if (currentStep.value === 1) {
    try {
      await formRef1.value?.validate();
      currentStep.value++;
    } catch (e) {
      // 验证失败
    }
  } else if (currentStep.value === 2) {
    if (skuList.length === 0) {
      message.warning('请至少添加一个SKU');
      return;
    }
    currentStep.value++;
  } else {
    currentStep.value++;
  }
};

const prevStep = () => {
  currentStep.value--;
};

// 提交表单
const handleSubmit = async () => {
  if (skuList.length === 0) {
    message.warning('请至少添加一个SKU');
    return;
  }

  submitLoading.value = true;
  try {
    const submitData: any = {
      ...formData,
      categoryId: formData.categoryId!,
      unitId: formData.unitId!,
      brandId: formData.brandId || undefined,
      isEnabled: formData.isEnabled,
      specTemplate: specTemplates.length > 0 ? [...specTemplates] : undefined,
      skus: skuList.map(s => ({
        skuCode: s.skuCode,
        specs: s.specs,
        costPrice: s.costPrice,
        salePrice: s.salePrice,
        marketPrice: s.marketPrice,
        barcode: s.barcode,
        image: s.image,
        weight: s.weight,
        volume: s.volume,
        isDefault: s.isDefault,
        sort: s.sort,
      })),
    };

    if (isEdit.value) {
      await updateProduct(productId.value, submitData);
      message.success('更新成功');
    } else {
      await createProduct(submitData);
      message.success('创建成功');
    }
    router.push('/products');
  } catch (error) {
    message.error(isEdit.value ? '更新失败' : '创建失败');
  } finally {
    submitLoading.value = false;
  }
};

const handleCancel = () => {
  router.back();
};

// 加载选项数据
const loadOptions = async () => {
  try {
    const [categories, brands, units] = await Promise.all([
      getCategoriesFlat(),
      getBrands(),
      getUnits(),
    ]);

    // 处理分类树
    const buildTree = (list: Category[], parentId: number | null = null): any[] => {
      return list
        .filter(item => item.parentId === parentId)
        .map(item => {
          const children = buildTree(list, item.id);
          const node: any = {
            label: item.name,
            value: item.id,
          };
          if (children.length > 0) {
            node.children = children;
          }
          return node;
        });
    };
    categoryOptions.value = buildTree(categories);

    brandOptions.value = brands.map((b: Brand) => ({ label: b.name, value: b.id }));
    unitOptions.value = units.map((u: Unit) => ({ label: u.name, value: u.id }));
  } catch (error) {
    console.error('加载选项失败:', error);
  }
};

// 加载商品详情（编辑模式）
const loadProduct = async () => {
  if (!isEdit.value) return;
  try {
    const product = await getProduct(productId.value);
    const mainImageKey = extractFileObjectKey(product.mainImage);
    const imageKeys = (product.images || []).map(image => extractFileObjectKey(image));
    formData.name = product.name;
    formData.spuCode = product.spuCode;
    formData.categoryId = product.categoryId;
    formData.brandId = product.brandId || null;
    formData.unitId = product.unitId;
    formData.description = product.description || '';
    formData.detail = product.detail || '';
    formData.mainImage = mainImageKey || '';
    formData.images = imageKeys;
    formData.isEnabled = product.isEnabled;
    // 加载主图到文件列表（用于回显）
    if (product.mainImage) {
      const mainImageUrl = resolveFileUrl(product.mainImage);
      mainImageList.value = [{
        id: mainImageKey,
        name: getFilenameFromKey(mainImageKey),
        status: 'finished',
        url: mainImageUrl,
        thumbnailUrl: mainImageUrl,
        type: inferImageMimeType(mainImageKey),
      }];
    } else {
      mainImageList.value = [];
    }

    // 加载商品相册到文件列表（用于回显）
    if (product.images && product.images.length > 0) {
      imagesList.value = product.images.map((url, index) => ({
        id: imageKeys[index],
        name: getFilenameFromKey(imageKeys[index]),
        status: 'finished',
        url: resolveFileUrl(url),
        thumbnailUrl: resolveFileUrl(url),
        type: inferImageMimeType(imageKeys[index]),
      }));
      syncImagesFromFileList();
    } else {
      imagesList.value = [];
    }

    // 加载规格模板
    if (product.specTemplate) {
      specTemplates.length = 0;
      specTemplates.push(...(product.specTemplate as SpecTemplateItem[]));
    }

    // 加载SKU
    skuList.length = 0;
    (product.skus || []).forEach(s => {
      skuList.push(normalizeEditableSku(s));
    });
  } catch (error) {
    message.error('加载商品详情失败');
  }
};

onMounted(() => {
  loadOptions();
  loadProduct();
});
</script>
