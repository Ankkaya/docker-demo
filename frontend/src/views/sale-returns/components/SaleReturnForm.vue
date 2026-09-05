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
      <!-- 发货单选择 -->
      <n-form-item label="发货单" path="shipmentId">
        <n-select
          v-model:value="formData.shipmentId"
          :options="shipmentOptions"
          placeholder="选择发货单"
          clearable
          filterable
          :disabled="isEdit"
          @update:value="handleShipmentChange"
        />
      </n-form-item>

      <!-- 客户 -->
      <n-form-item label="客户" path="customerId">
        <n-select
          v-model:value="formData.customerId"
          :options="customerOptions"
          placeholder="选择客户"
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
                <th style="width: 120px">发货数量</th>
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
                <td>{{ item.shipmentQuantity }}</td>
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
          <n-empty v-if="formData.items.length === 0" description="请选择发货单" />
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
  createSaleReturn,
  updateSaleReturn,
  getReturnableShipments,
} from '@/api/order';
import { getCustomers } from '@/api/customer';
import type { SaleReturn, ReturnableShipment } from '@/types/purchase';
import type { Customer } from '@/types/basic-data';

const props = defineProps<{
  initialData?: SaleReturn;
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
  shipmentQuantity: number;
  returnedQty: number;
  availableQty: number;
  quantity: number | null;
  price: number | null;
  amount: number;
}

const formData = reactive({
  shipmentId: null as number | null,
  customerId: null as number | null,
  items: [] as ReturnItemForm[],
  remark: '',
});

// 选项数据
const shipmentOptions = ref<{ label: string; value: number }[]>([]);
const customerOptions = ref<{ label: string; value: number }[]>([]);
const returnableShipments = ref<ReturnableShipment[]>([]);

// 总金额
const totalAmount = computed(() => {
  return formData.items.reduce((sum, item) => sum + item.amount, 0);
});

// 表单验证规则
const rules: FormRules = {
  shipmentId: {
    required: true,
    message: '请选择发货单',
    type: 'number',
  },
  customerId: {
    required: true,
    message: '请选择客户',
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

// 加载可退货的发货单
const loadReturnableShipments = async (customerId?: number) => {
  try {
    const data = await getReturnableShipments(customerId);
    if (Array.isArray(data)) {
      returnableShipments.value = data;
      shipmentOptions.value = data.map((s) => ({
        label: `${s.shipmentNo} - ${s.order.customer.name} - ${s.warehouse.name}`,
        value: s.id,
      }));
    }
  } catch (error) {
    console.error('加载发货单失败:', error);
    message.error('加载发货单失败');
  }
};

// 加载客户
const loadCustomers = async () => {
  try {
    const res: any = await getCustomers();
    const list = res.data || [];
    customerOptions.value = list
      .filter((c: Customer) => c.isEnabled)
      .map((c: Customer) => ({
        label: c.name,
        value: c.id,
      }));
  } catch (error) {
    console.error('加载客户失败:', error);
  }
};

// 发货单变更
const handleShipmentChange = (shipmentId: number) => {
  formData.items = [];
  const shipment = returnableShipments.value.find((s) => s.id === shipmentId);
  if (shipment) {
    formData.customerId = shipment.order.customer.id;
    formData.items = shipment.items.map((item) => ({
      skuId: item.skuId,
      skuName: item.sku.product.name,
      specs: item.sku.specs,
      shipmentQuantity: item.quantity,
      returnedQty: item.returnedQty,
      availableQty: item.availableQty,
      quantity: null,
      price: 0,
      amount: 0,
    }));
  } else {
    formData.customerId = null;
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
      shipmentId: formData.shipmentId!,
      customerId: formData.customerId!,
      items: validItems.map((item) => ({
        skuId: item.skuId,
        quantity: item.quantity!,
        price: item.price!,
      })),
      remark: formData.remark,
    };

    if (isEdit.value && props.initialData) {
      await updateSaleReturn(props.initialData.id, data);
      message.success('更新成功');
      emit('success');
    } else {
      await createSaleReturn(data);
      message.success('创建成功');
      emit('success');
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
    formData.shipmentId = props.initialData.shipmentId;
    formData.customerId = props.initialData.customerId;
    formData.remark = props.initialData.remark || '';
    // 编辑时不加载 items，因为需要重新选择发货单
  }
};

onMounted(() => {
  loadCustomers();
  loadReturnableShipments();
  if (isEdit.value) {
    initEditData();
  }
});
</script>
