<template>
  <div>
    <n-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-placement="left"
      label-width="100"
    >
      <n-form-item label="客户" path="customerId">
        <n-select
          v-model:value="formData.customerId"
          :options="customerOptions"
          placeholder="选择客户"
          clearable
          filterable
        />
      </n-form-item>

      <n-form-item label="商品明细" path="items">
        <n-card size="small">
          <n-table :bordered="true" :single-line="false">
            <thead>
              <tr>
                <th>商品SKU</th>
                <th style="width: 150px">数量</th>
                <th style="width: 150px">单价</th>
                <th style="width: 120px">金额</th>
                <th style="width: 80px">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in formData.items" :key="index">
                <td>
                  <n-select
                    v-model:value="item.skuId"
                    :options="skuOptions"
                    placeholder="选择SKU"
                    filterable
                    @update:value="(val: number) => handleSkuChange(index, val)"
                  />
                </td>
                <td>
                  <n-input-number v-model:value="item.quantity" :min="1" @update:value="calcAmount(index)" />
                </td>
                <td>
                  <n-input-number v-model:value="item.price" :min="0" :precision="2" @update:value="calcAmount(index)" />
                </td>
                <td>¥{{ item.amount.toFixed(2) }}</td>
                <td>
                  <n-button type="error" size="small" @click="removeItem(index)">删除</n-button>
                </td>
              </tr>
            </tbody>
          </n-table>
          <n-button class="mt-2" type="primary" dashed @click="addItem">添加商品</n-button>
        </n-card>
      </n-form-item>

      <n-form-item label="运费">
        <n-input-number v-model:value="formData.freight" :min="0" :precision="2" />
      </n-form-item>

      <n-form-item label="优惠金额">
        <n-input-number v-model:value="formData.discount" :min="0" :precision="2" />
      </n-form-item>

      <n-form-item label="订单金额">
        <n-statistic>
          <span class="text-2xl font-bold text-primary">¥{{ totalAmount.toFixed(2) }}</span>
        </n-statistic>
      </n-form-item>

      <n-form-item label="备注">
        <n-input v-model:value="formData.remark" type="textarea" :rows="3" />
      </n-form-item>
    </n-form>

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
import { createOrder, updateOrder } from '@/api/order';
import { getCustomers } from '@/api/customer';
import { getProducts } from '@/api/product';
import type { Order } from '@/types/purchase';

const props = defineProps<{ initialData?: Order }>();
const emit = defineEmits<{ success: []; cancel: [] }>();

const message = useMessage();
const formRef = ref<FormInst | null>(null);
const submitting = ref(false);
const customerOptions = ref([]);
const skuOptions = ref([]);

const formData = reactive({
  customerId: null as number | null,
  items: [] as any[],
  freight: 0,
  discount: 0,
  remark: '',
});

const totalAmount = computed(() => {
  const itemsTotal = formData.items.reduce((sum, item) => sum + item.amount, 0);
  return itemsTotal + (formData.freight || 0) - (formData.discount || 0);
});

const rules: FormRules = {
  customerId: { required: true, message: '请选择客户', type: 'number' },
};

const addItem = () => {
  formData.items.push({ skuId: null, quantity: 1, price: 0, amount: 0 });
};

const removeItem = (index: number) => {
  formData.items.splice(index, 1);
};

const handleSkuChange = (index: number, skuId: number) => {
  const sku = (skuOptions.value as any[]).find((s: any) => s.value === skuId);
  if (sku) {
    formData.items[index].price = sku.price;
    calcAmount(index);
  }
};

const calcAmount = (index: number) => {
  const item = formData.items[index];
  item.amount = (item.quantity || 0) * (item.price || 0);
};

const handleSubmit = async () => {
  await formRef.value?.validate();
  
  if (formData.items.length === 0) {
    message.error('请至少添加一个商品');
    return;
  }

  submitting.value = true;
  try {
    const data = {
      customerId: formData.customerId!,
      items: formData.items.map(item => ({
        skuId: item.skuId,
        quantity: item.quantity,
        price: item.price,
      })),
      freight: formData.freight,
      discount: formData.discount,
      remark: formData.remark,
    };

    if (props.initialData) {
      await updateOrder(props.initialData.id, data);
      message.success('更新成功');
    } else {
      await createOrder(data);
      message.success('创建成功');
    }
    emit('success');
  } catch (error) {
    message.error('提交失败');
  } finally {
    submitting.value = false;
  }
};

const handleCancel = () => emit('cancel');

onMounted(async () => {
  const [customersRes, productsRes] = await Promise.all([getCustomers(), getProducts()]);
  const customers = (customersRes as any).data || [];
  customerOptions.value = customers.map((c: any) => ({
    label: c.name,
    value: c.id,
  })) || [];
  const products = (productsRes as any).data || [];
  skuOptions.value = products.flatMap((p: any) => 
    (p.skus || []).map((s: any) => ({
      label: `${p.name} - ${Object.entries(s.specs || {}).map(([k, v]) => `${k}:${v}`).join(',')}`,
      value: s.id,
      price: Number(s.salePrice),
    }))
  );
  if (props.initialData) {
    formData.customerId = props.initialData.customerId;
    formData.freight = props.initialData.freight;
    formData.discount = props.initialData.discount;
    formData.remark = props.initialData.remark || '';
  }
});
</script>
