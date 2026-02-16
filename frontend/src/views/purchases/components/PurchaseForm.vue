<template>
  <n-form
    ref="formRef"
    :model="formData"
    :rules="rules"
    label-placement="left"
    label-width="100"
  >
    <n-grid :cols="2" :x-gap="20">
      <n-grid-item>
        <n-form-item label="供应商" path="supplierId">
          <n-select
            v-model:value="formData.supplierId"
            :options="supplierOptions"
            placeholder="选择供应商"
            clearable
          />
        </n-form-item>
      </n-grid-item>
      <n-grid-item>
        <n-form-item label="入库仓库" path="warehouseId">
          <n-select
            v-model:value="formData.warehouseId"
            :options="warehouseOptions"
            placeholder="选择仓库"
            clearable
          />
        </n-form-item>
      </n-grid-item>
    </n-grid>

    <n-form-item label="预计到货">
      <n-date-picker v-model:value="formData.deliveryDate" type="date" clearable />
    </n-form-item>

    <n-form-item label="备注">
      <n-input v-model:value="formData.remark" type="textarea" placeholder="请输入备注" />
    </n-form-item>

    <!-- 商品明细 -->
    <n-divider title-placement="left">采购商品</n-divider>

    <n-space vertical>
      <n-button type="primary" @click="showSkuSelector = true">添加商品</n-button>
      
      <n-table :bordered="true" :single-line="false">
        <thead>
          <tr>
            <th style="width: 80px">序号</th>
            <th>商品信息</th>
            <th style="width: 150px">单价</th>
            <th style="width: 120px">数量</th>
            <th style="width: 120px">金额</th>
            <th style="width: 80px">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in formData.items" :key="index">
            <td>{{ index + 1 }}</td>
            <td>
              <div class="flex items-center gap-2">
                <n-image
                  :src="item.image || '/placeholder.png'"
                  width="50"
                  height="50"
                  object-fit="cover"
                  fallback-src="/placeholder.png"
                />
                <div>
                  <div class="font-medium">{{ item.productName }}</div>
                  <div class="text-gray-500 text-sm">{{ item.skuCode }}</div>
                  <div class="text-gray-400 text-xs">{{ formatSpecs(item.specs) }}</div>
                </div>
              </div>
            </td>
            <td>
              <n-input-number v-model:value="item.price" :min="0" :precision="2" @update:value="calcAmount(index)" />
            </td>
            <td>
              <n-input-number v-model:value="item.quantity" :min="1" @update:value="calcAmount(index)" />
            </td>
            <td>¥{{ item.amount.toFixed(2) }}</td>
            <td>
              <n-button text type="error" @click="removeItem(index)">删除</n-button>
            </td>
          </tr>
          <tr v-if="formData.items.length === 0">
            <td colspan="6" class="text-center py-4 text-gray-400">请添加采购商品</td>
          </tr>
        </tbody>
      </n-table>

      <!-- 金额汇总 -->
      <div class="flex justify-end gap-4 py-2">
        <div class="text-right">
          <div class="text-gray-500">商品总金额</div>
          <div class="text-lg font-medium">¥{{ totalAmount.toFixed(2) }}</div>
        </div>
        <div class="text-right">
          <div class="text-gray-500">折扣</div>
          <n-input-number v-model:value="formData.discount" :min="0" :max="totalAmount" :precision="2" style="width: 120px" />
        </div>
        <div class="text-right">
          <div class="text-gray-500">应付金额</div>
          <div class="text-xl font-bold text-primary">¥{{ payable.toFixed(2) }}</div>
        </div>
      </div>
    </n-space>

    <n-divider />

    <n-form-item class="justify-end">
      <n-space>
        <n-button @click="$emit('cancel')">取消</n-button>
        <n-button type="primary" :loading="submitting" @click="handleSubmit">保存</n-button>
      </n-space>
    </n-form-item>
  </n-form>

  <!-- SKU选择器弹窗 -->
  <n-modal v-model:show="showSkuSelector" title="选择商品" preset="card" style="width: 800px; max-width: 95vw">
    <SkuSelector @select="handleSkuSelect" @cancel="showSkuSelector = false" />
  </n-modal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useMessage } from 'naive-ui';
import { createPurchase, updatePurchase } from '@/api/purchase';
import { getSuppliers } from '@/api/supplier';
import { getWarehouses } from '@/api/warehouse';
import SkuSelector from './SkuSelector.vue';
import type { FormInst, FormRules } from 'naive-ui';
import type { Purchase, CreatePurchaseDto } from '@/types/purchase';
import type { Supplier, Warehouse } from '@/types/basic-data';

interface Props {
  initialData?: Purchase;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  success: [];
  cancel: [];
}>();

const message = useMessage();
const formRef = ref<FormInst | null>(null);
const submitting = ref(false);
const showSkuSelector = ref(false);

// 选项数据
const supplierOptions = ref<{ label: string; value: number }[]>([]);
const warehouseOptions = ref<{ label: string; value: number }[]>([]);

// 表单数据
interface FormItem {
  skuId: number;
  skuCode: string;
  productName: string;
  image?: string;
  specs: Record<string, string>;
  price: number;
  quantity: number;
  amount: number;
}

const formData = reactive({
  supplierId: null as number | null,
  warehouseId: null as number | null,
  deliveryDate: null as number | null,
  discount: 0,
  remark: '',
  items: [] as FormItem[],
});

// 计算总金额
const totalAmount = computed(() => {
  return formData.items.reduce((sum, item) => sum + item.amount, 0);
});

// 计算应付金额
const payable = computed(() => {
  return Math.max(0, totalAmount.value - formData.discount);
});

// 表单校验规则
const rules: FormRules = {
  supplierId: [{ required: true, message: '请选择供应商', type: 'number' }],
  warehouseId: [{ required: true, message: '请选择仓库', type: 'number' }],
};

// 加载选项
const loadOptions = async () => {
  try {
    const [suppliersRes, warehousesRes] = await Promise.all([
      getSuppliers({ pageSize: 1000 }),
      getWarehouses({ pageSize: 1000 }),
    ]);

    if (suppliersRes.data.code === 200) {
      supplierOptions.value = suppliersRes.data.data.data
        .filter((s: Supplier) => s.isEnabled)
        .map((s: Supplier) => ({ label: s.name, value: s.id }));
    }

    if (warehousesRes.data.code === 200) {
      warehouseOptions.value = warehousesRes.data.data.data
        .filter((w: Warehouse) => w.isEnabled)
        .map((w: Warehouse) => ({ label: w.name, value: w.id }));
    }
  } catch (error) {
    console.error('加载选项失败:', error);
  }
};

// 计算单项金额
const calcAmount = (index: number) => {
  const item = formData.items[index];
  if (item) {
    item.amount = item.price * item.quantity;
  }
};

// 删除明细项
const removeItem = (index: number) => {
  formData.items.splice(index, 1);
};

// 选择SKU
const handleSkuSelect = (skus: any[]) => {
  for (const sku of skus) {
    // 检查是否已存在
    const existing = formData.items.find((item) => item.skuId === sku.id);
    if (existing) {
      existing.quantity += 1;
      calcAmount(formData.items.indexOf(existing));
    } else {
      formData.items.push({
        skuId: sku.id,
        skuCode: sku.skuCode,
        productName: sku.product?.name || '',
        image: sku.image || sku.product?.mainImage,
        specs: sku.specs || {},
        price: Number(sku.costPrice) || 0,
        quantity: 1,
        amount: Number(sku.costPrice) || 0,
      });
    }
  }
  showSkuSelector.value = false;
};

// 格式化规格
const formatSpecs = (specs: Record<string, string>) => {
  if (!specs || Object.keys(specs).length === 0) return '-';
  return Object.entries(specs)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');
};

// 提交表单
const handleSubmit = async () => {
  if (formData.items.length === 0) {
    message.error('请至少添加一个商品');
    return;
  }

  await formRef.value?.validate();

  submitting.value = true;
  try {
    const data: CreatePurchaseDto = {
      supplierId: formData.supplierId!,
      warehouseId: formData.warehouseId!,
      items: formData.items.map((item) => ({
        skuId: item.skuId,
        quantity: item.quantity,
        price: item.price,
      })),
      discount: formData.discount,
      remark: formData.remark,
      deliveryDate: formData.deliveryDate
        ? new Date(formData.deliveryDate).toISOString().split('T')[0]
        : undefined,
    };

    let res;
    if (props.initialData) {
      res = await updatePurchase(props.initialData.id, data);
    } else {
      res = await createPurchase(data);
    }

    if (res.data.code === 200) {
      message.success(props.initialData ? '更新成功' : '创建成功');
      emit('success');
    }
  } catch (error) {
    console.error('提交失败:', error);
  } finally {
    submitting.value = false;
  }
};

// 编辑时回填数据
watch(
  () => props.initialData,
  (data) => {
    if (data) {
      formData.supplierId = data.supplierId;
      formData.warehouseId = data.warehouseId;
      formData.discount = data.discount || 0;
      formData.remark = data.remark || '';
      formData.deliveryDate = data.deliveryDate
        ? new Date(data.deliveryDate).getTime()
        : null;
      formData.items =
        data.items?.map((item) => ({
          skuId: item.skuId,
          skuCode: item.skuCode,
          productName: item.productName,
          image: undefined,
          specs: item.specs,
          price: item.price,
          quantity: item.quantity,
          amount: item.amount,
        })) || [];
    }
  },
  { immediate: true }
);

onMounted(() => {
  loadOptions();
});
</script>
