<template>
  <div>
    <n-form ref="formRef" :model="formData" :rules="rules" label-width="100">
      <n-form-item label="销售订单" path="orderId">
        <n-select v-model:value="formData.orderId" :options="orderOptions" placeholder="选择订单" filterable />
      </n-form-item>
      <n-form-item label="发货仓库" path="warehouseId">
        <n-select v-model:value="formData.warehouseId" :options="warehouseOptions" placeholder="选择仓库" />
      </n-form-item>
      <n-form-item label="物流公司">
        <n-input v-model:value="formData.logisticsCompany" placeholder="物流公司" />
      </n-form-item>
      <n-form-item label="物流单号">
        <n-input v-model:value="formData.trackingNo" placeholder="物流单号" />
      </n-form-item>
      <n-form-item label="备注">
        <n-input v-model:value="formData.remark" type="textarea" :rows="3" />
      </n-form-item>
    </n-form>
    <div class="flex justify-end gap-2">
      <n-button @click="handleCancel">取消</n-button>
      <n-button type="primary" :loading="submitting" @click="handleSubmit">保存</n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useMessage } from 'naive-ui';
import type { FormInst, FormRules } from 'naive-ui';
import { createShipment } from '@/api/order';
import { getOrders } from '@/api/order';
import { getWarehouses } from '@/api/warehouse';

const emit = defineEmits<{ success: []; cancel: [] }>();
const message = useMessage();
const formRef = ref<FormInst | null>(null);
const submitting = ref(false);
const orderOptions = ref([]);
const warehouseOptions = ref([]);

const formData = reactive({
  orderId: null as number | null,
  warehouseId: null as number | null,
  items: [] as any[],
  logisticsCompany: '',
  trackingNo: '',
  remark: '',
});

const rules: FormRules = {
  orderId: { required: true, message: '请选择订单', type: 'number' },
  warehouseId: { required: true, message: '请选择仓库', type: 'number' },
};

const handleSubmit = async () => {
  await formRef.value?.validate();
  submitting.value = true;
  try {
    await createShipment({
      orderId: formData.orderId!,
      warehouseId: formData.warehouseId!,
      items: [],
      logisticsCompany: formData.logisticsCompany,
      trackingNo: formData.trackingNo,
      remark: formData.remark,
    });
    message.success('创建成功');
    emit('success');
  } catch (error) {
    message.error('创建失败');
  } finally {
    submitting.value = false;
  }
};

const handleCancel = () => emit('cancel');

onMounted(async () => {
  const [ordersRes, warehousesRes] = await Promise.all([getOrders(), getWarehouses()]);
  const ordersData = (ordersRes as any)?.data;
  const warehousesData = (warehousesRes as any)?.data;
  if (ordersData) {
    orderOptions.value = ordersData.map((o: any) => ({
      label: `${o.orderNo} - ${o.customerName}`,
      value: o.id,
    })) || [];
  }
  if (warehousesData) {
    warehouseOptions.value = warehousesData.map((w: any) => ({
      label: w.name,
      value: w.id,
    })) || [];
  }
});
</script>
