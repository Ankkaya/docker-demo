<template>
  <n-form
    ref="formRef"
    :model="formData"
    :rules="rules"
    label-placement="left"
    label-width="100"
  >
    <n-form-item label="采购订单" path="purchaseId">
      <n-select
        v-model:value="formData.purchaseId"
        :options="purchaseOptions"
        placeholder="选择采购订单"
        clearable
        filterable
        @update:value="handlePurchaseChange"
      />
    </n-form-item>

    <!-- 采购订单信息展示 -->
    <n-card v-if="selectedPurchase" title="采购订单信息" size="small" class="mb-4">
      <n-descriptions :column="3" size="small">
        <n-descriptions-item label="供应商">
          {{ selectedPurchase.supplierName }}
        </n-descriptions-item>
        <n-descriptions-item label="入库仓库">
          {{ selectedPurchase.warehouseName }}
        </n-descriptions-item>
        <n-descriptions-item label="应付金额">
          ¥{{ selectedPurchase.payable.toFixed(2) }}
        </n-descriptions-item>
      </n-descriptions>
    </n-card>

    <!-- 入库明细 -->
    <n-divider title-placement="left">入库商品</n-divider>

    <n-table v-if="selectedPurchase" :bordered="true" :single-line="false">
      <thead>
        <tr>
          <th style="width: 60px">选择</th>
          <th>商品信息</th>
          <th style="width: 100px">采购数量</th>
          <th style="width: 100px">已入库</th>
          <th style="width: 100px">待入库</th>
          <th style="width: 150px">入库单价</th>
          <th style="width: 120px">入库数量</th>
          <th style="width: 120px">金额</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in formData.items" :key="item.skuId">
          <td>
            <n-checkbox v-model:checked="item.selected" />
          </td>
          <td>
            <div>
              <div class="font-medium">{{ item.productName }}</div>
              <div class="text-gray-500 text-sm">{{ item.skuCode }}</div>
              <div class="text-gray-400 text-xs">{{ formatSpecs(item.specs) }}</div>
            </div>
          </td>
          <td>{{ item.quantity }}</td>
          <td>{{ item.received }}</td>
          <td>
            <n-tag :type="item.pending > 0 ? 'warning' : 'success'" size="small">
              {{ item.pending }}
            </n-tag>
          </td>
          <td>
            <n-input-number v-model:value="item.price" :min="0" :precision="2" style="width: 120px" @update:value="calcAmount(item)" />
          </td>
          <td>
            <n-input-number v-model:value="item.inputQty" :min="0" :max="item.pending" style="width: 100px" @update:value="calcAmount(item)" />
          </td>
          <td>¥{{ item.amount.toFixed(2) }}</td>
        </tr>
        <tr v-if="formData.items.length === 0">
          <td colspan="8" class="text-center py-4 text-gray-400">请选择采购订单</td>
        </tr>
      </tbody>
    </n-table>

    <!-- 金额汇总 -->
    <div v-if="selectedPurchase" class="flex justify-end gap-4 py-2">
      <div class="text-right">
        <div class="text-gray-500">入库总金额</div>
        <div class="text-xl font-bold text-primary">¥{{ totalAmount.toFixed(2) }}</div>
      </div>
    </div>

    <n-form-item label="备注">
      <n-input v-model:value="formData.remark" type="textarea" placeholder="请输入备注" />
    </n-form-item>

    <n-divider />

    <n-form-item class="justify-end">
      <n-space>
        <n-button @click="$emit('cancel')">取消</n-button>
        <n-button type="primary" :loading="submitting" :disabled="!canSubmit" @click="handleSubmit">
          创建入库单
        </n-button>
      </n-space>
    </n-form-item>
  </n-form>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useMessage } from 'naive-ui';
import { getAvailableReceiptPurchases, getPurchase } from '@/api/purchase';
import { createPurchaseReceipt } from '@/api/purchase';
import type { FormInst, FormRules } from 'naive-ui';
import type { Purchase, CreateReceiptDto } from '@/types/purchase';

const emit = defineEmits<{
  success: [];
  cancel: [];
}>();

const message = useMessage();
const formRef = ref<FormInst | null>(null);
const submitting = ref(false);

// 采购订单选项
const purchaseOptions = ref<{ label: string; value: number }[]>([]);
const purchaseMap = ref<Map<number, Purchase>>(new Map());

// 选中的采购订单
const selectedPurchase = ref<Purchase | null>(null);

// 表单数据
interface FormItem {
  skuId: number;
  skuCode: string;
  productName: string;
  specs: Record<string, string>;
  quantity: number;
  received: number;
  pending: number;
  price: number;
  inputQty: number;
  amount: number;
  selected: boolean;
}

const formData = reactive({
  purchaseId: null as number | null,
  remark: '',
  items: [] as FormItem[],
});

// 计算总金额
const totalAmount = computed(() => {
  return formData.items
    .filter((item) => item.selected)
    .reduce((sum, item) => sum + item.amount, 0);
});

// 是否可以提交
const canSubmit = computed(() => {
  return (
    formData.purchaseId &&
    formData.items.some((item) => item.selected && item.inputQty > 0)
  );
});

// 表单校验规则
const rules: FormRules = {
  purchaseId: [{ required: true, message: '请选择采购订单', type: 'number' }],
};

const unwrapPurchaseList = (payload: unknown): Purchase[] => {
  if (Array.isArray(payload)) {
    return payload as Purchase[];
  }

  if (!payload || typeof payload !== 'object') {
    return [];
  }

  const raw = payload as {
    data?: Purchase[] | { data?: Purchase[]; items?: Purchase[] };
    items?: Purchase[];
  };

  if (Array.isArray(raw.data)) {
    return raw.data;
  }

  if (Array.isArray(raw.items)) {
    return raw.items;
  }

  if (raw.data && typeof raw.data === 'object') {
    const nested = raw.data as { data?: Purchase[]; items?: Purchase[] };
    if (Array.isArray(nested.data)) {
      return nested.data;
    }
    if (Array.isArray(nested.items)) {
      return nested.items;
    }
  }

  return [];
};

const unwrapPurchaseDetail = (payload: unknown): Purchase | null => {
  if (!payload || typeof payload !== 'object') return null;

  const direct = payload as Purchase;
  if (typeof direct.id === 'number' && typeof direct.orderNo === 'string') {
    return direct;
  }

  const wrapped = payload as { data?: unknown };
  if (!wrapped.data || typeof wrapped.data !== 'object') return null;

  const nested = wrapped.data as Purchase;
  if (typeof nested.id === 'number' && typeof nested.orderNo === 'string') {
    return nested;
  }

  return null;
};

// 加载采购订单选项
const loadPurchases = async () => {
  try {
    const res = await getAvailableReceiptPurchases();
    const purchases = unwrapPurchaseList(res);

    purchaseOptions.value = purchases.map((p: Purchase) => ({
      label: `${p.orderNo} - ${p.supplierName} (应付:¥${p.payable})`,
      value: p.id,
    }));
    purchaseMap.value = new Map(purchases.map((p: Purchase) => [p.id, p]));
  } catch (error) {
    console.error('加载采购订单失败:', error);
    message.error('加载采购订单失败');
  }
};

// 选择采购订单变化
const handlePurchaseChange = async (purchaseId: number | null) => {
  if (!purchaseId) {
    selectedPurchase.value = null;
    formData.items = [];
    return;
  }

  try {
    const detail = await getPurchase(purchaseId);
    const purchase = unwrapPurchaseDetail(detail);

    if (!purchase) {
      throw new Error('采购订单详情为空');
    }

    selectedPurchase.value = purchase;
    formData.items = (purchase.items || []).map((item) => ({
      skuId: item.skuId,
      skuCode: item.skuCode,
      productName: item.productName,
      specs: item.specs,
      quantity: item.quantity,
      received: item.received,
      pending: item.quantity - item.received,
      price: item.price,
      inputQty: 0,
      amount: 0,
      selected: false,
    }));
  } catch (error) {
    selectedPurchase.value = purchaseMap.value.get(purchaseId) || null;
    formData.items = [];
    message.error('加载采购订单明细失败');
  }
};

// 计算单项金额
const calcAmount = (item: FormItem) => {
  item.amount = item.price * item.inputQty;
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
  if (!canSubmit.value) {
    message.error('请至少选择一项商品并填写入库数量');
    return;
  }

  await formRef.value?.validate();

  submitting.value = true;
  try {
    const items = formData.items
      .filter((item) => item.selected && item.inputQty > 0)
      .map((item) => ({
        skuId: item.skuId,
        quantity: item.inputQty,
        price: item.price,
      }));

    const data: CreateReceiptDto = {
      purchaseId: formData.purchaseId!,
      items,
      remark: formData.remark,
    };

    await createPurchaseReceipt(data);
    message.success('创建入库单成功');
    emit('success');
  } catch (error) {
    console.error('提交失败:', error);
  } finally {
    submitting.value = false;
  }
};

onMounted(() => {
  loadPurchases();
});
</script>
