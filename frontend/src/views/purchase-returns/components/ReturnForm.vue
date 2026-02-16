<template>
  <div>
    <n-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-placement="left"
      label-width="100"
      require-mark-placement="right-hanging"
    >
      <!-- 入库单选择 -->
      <n-form-item label="入库单" path="receiptId">
        <n-select
          v-model:value="formData.receiptId"
          :options="receiptOptions"
          placeholder="选择入库单"
          clearable
          filterable
          :disabled="isEdit"
          @update:value="handleReceiptChange"
        />
      </n-form-item>

      <!-- 供应商 -->
      <n-form-item label="供应商" path="supplierId">
        <n-select
          v-model:value="formData.supplierId"
          :options="supplierOptions"
          placeholder="选择供应商"
          clearable
          filterable
          :disabled="true"
        />
      </n-form-item>

      <!-- 退货明细 -->
      <n-form-item label="退货明细" path="items">
        <n-card size="small">
          <n-table :bordered="true" :single-line="false">
            <thead>
              <tr>
                <th>商品</th>
                <th>规格</th>
                <th style="width: 120px">入库数量</th>
                <th style="width: 120px">已退数量</th>
                <th style="width: 120px">可退数量</th>
                <th style="width: 150px">退货数量</th>
                <th style="width: 150px">退货单价</th>
                <th style="width: 120px">金额</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in formData.items" :key="index">
                <td>{{ item.skuName }}</td>
                <td>
                  <n-tag v-for="(value, key) in item.specs" :key="key" size="small" class="mr-1">
                    {{ key }}: {{ value }}
                  </n-tag>
                </td>
                <td>{{ item.receiptQuantity }}</td>
                <td>{{ item.returnedQty }}</td>
                <td>
                  <n-text type="success">{{ item.availableQty }}</n-text>
                </td>
                <td>
                  <n-input-number
                    v-model:value="item.quantity"
                    :min="0"
                    :max="item.availableQty"
                    placeholder="退货数量"
                    @update:value="handleQuantityChange(index)"
                  />
                </td>
                <td>
                  <n-input-number
                    v-model:value="item.price"
                    :min="0"
                    :precision="2"
                    placeholder="单价"
                    @update:value="handleQuantityChange(index)"
                  />
                </td>
                <td>¥{{ item.amount.toFixed(2) }}</td>
              </tr>
            </tbody>
          </n-table>
          <n-empty v-if="formData.items.length === 0" description="请选择入库单" />
        </n-card>
      </n-form-item>

      <!-- 总金额 -->
      <n-form-item label="退货金额">
        <n-statistic tabular-nums>
          <span class="text-2xl font-bold text-primary">¥{{ totalAmount.toFixed(2) }}</span>
        </n-statistic>
      </n-form-item>

      <!-- 备注 -->
      <n-form-item label="备注" path="remark">
        <n-input
          v-model:value="formData.remark"
          type="textarea"
          placeholder="请输入备注"
          :rows="3"
        />
      </n-form-item>
    </n-form>

    <!-- 按钮 -->
    <div class="flex justify-end gap-2 mt-4">
      <n-button @click="handleCancel">取消</n-button>
      <n-button type="primary" :loading="submitting" @click="handleSubmit">保存</n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useMessage } from 'naive-ui';
import type { FormInst, FormRules } from 'naive-ui';
import {
  createPurchaseReturn,
  updatePurchaseReturn,
  getReturnableReceipts,
} from '@/api/purchase';
import { getSuppliers } from '@/api/supplier';
import type { PurchaseReturn, ReturnableReceipt } from '@/types/purchase';
import type { Supplier } from '@/types/basic-data';

const props = defineProps<{
  initialData?: PurchaseReturn;
}>();

const emit = defineEmits<{
  success: [];
  cancel: [];
}>();

const message = useMessage();
const formRef = ref<FormInst | null>(null);
const submitting = ref(false);

const isEdit = computed(() => !!props.initialData);

// 表单数据
interface ReturnItemForm {
  skuId: number;
  skuName: string;
  specs: Record<string, string>;
  receiptQuantity: number;
  returnedQty: number;
  availableQty: number;
  quantity: number | null;
  price: number | null;
  amount: number;
}

const formData = reactive({
  receiptId: null as number | null,
  supplierId: null as number | null,
  items: [] as ReturnItemForm[],
  remark: '',
});

// 选项数据
const receiptOptions = ref<{ label: string; value: number }[]>([]);
const supplierOptions = ref<{ label: string; value: number }[]>([]);
const returnableReceipts = ref<ReturnableReceipt[]>([]);

// 总金额
const totalAmount = computed(() => {
  return formData.items.reduce((sum, item) => sum + item.amount, 0);
});

// 表单验证规则
const rules: FormRules = {
  receiptId: {
    required: true,
    message: '请选择入库单',
    type: 'number',
  },
  supplierId: {
    required: true,
    message: '请选择供应商',
    type: 'number',
  },
  items: {
    validator: () => {
      const validItems = formData.items.filter(
        (item) => item.quantity && item.quantity > 0
      );
      if (validItems.length === 0) {
        return new Error('请至少添加一个退货商品');
      }
      return true;
    },
  },
};

// 加载可退货的入库单
const loadReturnableReceipts = async (supplierId?: number) => {
  try {
    const res = await getReturnableReceipts(supplierId);
    if (res.data.code === 200) {
      returnableReceipts.value = res.data.data;
      receiptOptions.value = res.data.data.map((r) => ({
        label: `${r.receiptNo} - ${r.purchase.supplier.name} - ${r.warehouse.name}`,
        value: r.id,
      }));
    }
  } catch (error) {
    console.error('加载入库单失败:', error);
    message.error('加载入库单失败');
  }
};

// 加载供应商
const loadSuppliers = async () => {
  try {
    const res = await getSuppliers();
    if (res.data.code === 200) {
      const list = (res.data.data as any).data || [];
      supplierOptions.value = list
        .filter((s: Supplier) => s.isEnabled)
        .map((s: Supplier) => ({
          label: s.name,
          value: s.id,
        }));
    }
  } catch (error) {
    console.error('加载供应商失败:', error);
  }
};

// 入库单变更
const handleReceiptChange = (receiptId: number) => {
  formData.items = [];
  const receipt = returnableReceipts.value.find((r) => r.id === receiptId);
  if (receipt) {
    formData.supplierId = receipt.purchase.supplier.id;
    formData.items = receipt.items.map((item) => ({
      skuId: item.skuId,
      skuName: item.sku.product.name,
      specs: item.sku.specs,
      receiptQuantity: item.quantity,
      returnedQty: item.returnedQty,
      availableQty: item.availableQty,
      quantity: null,
      price: Number(item.price),
      amount: 0,
    }));
  } else {
    formData.supplierId = null;
  }
};

// 数量/价格变更
const handleQuantityChange = (index: number) => {
  const item = formData.items[index];
  const quantity = item.quantity || 0;
  const price = item.price || 0;
  item.amount = quantity * price;
};

// 提交
const handleSubmit = async () => {
  await formRef.value?.validate();

  const validItems = formData.items.filter(
    (item) => item.quantity && item.quantity > 0
  );

  if (validItems.length === 0) {
    message.error('请至少添加一个退货商品');
    return;
  }

  submitting.value = true;
  try {
    const data = {
      receiptId: formData.receiptId!,
      supplierId: formData.supplierId!,
      items: validItems.map((item) => ({
        skuId: item.skuId,
        quantity: item.quantity!,
        price: item.price!,
      })),
      remark: formData.remark,
    };

    if (isEdit.value && props.initialData) {
      const res = await updatePurchaseReturn(props.initialData.id, data);
      if (res.data.code === 200) {
        message.success('更新成功');
        emit('success');
      }
    } else {
      const res = await createPurchaseReturn(data);
      if (res.data.code === 200) {
        message.success('创建成功');
        emit('success');
      }
    }
  } catch (error) {
    console.error('提交失败:', error);
    message.error('提交失败');
  } finally {
    submitting.value = false;
  }
};

// 取消
const handleCancel = () => {
  emit('cancel');
};

// 初始化编辑数据
const initEditData = () => {
  if (props.initialData) {
    formData.receiptId = props.initialData.receiptId;
    formData.supplierId = props.initialData.supplierId;
    formData.remark = props.initialData.remark || '';
    // 编辑时不加载 items，因为需要重新选择入库单
  }
};

onMounted(() => {
  loadSuppliers();
  loadReturnableReceipts();
  if (isEdit.value) {
    initEditData();
  }
});
</script>
