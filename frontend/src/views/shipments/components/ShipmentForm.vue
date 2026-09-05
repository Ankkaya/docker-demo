<template>
  <div>
    <n-form ref="formRef" :model="formData" :rules="rules" label-width="100">
      <n-form-item label="销售订单" path="orderId">
        <n-select
          v-model:value="formData.orderId"
          :options="orderOptions"
          placeholder="选择待发货订单"
          filterable
          :loading="ordersLoading"
        />
      </n-form-item>
      <n-form-item label="物流公司">
        <n-select
          v-model:value="formData.logisticsCompany"
          :options="kuaidiCompanyOptions"
          placeholder="请选择物流公司（可搜索名称/拼音/编码）"
          filterable
          clearable
          :filter="filterKuaidiCompany"
        />
      </n-form-item>
      <n-form-item label="物流单号">
        <n-input v-model:value="formData.trackingNo" placeholder="物流单号" />
      </n-form-item>
      <n-form-item label="备注">
        <n-input v-model:value="formData.remark" type="textarea" :rows="3" />
      </n-form-item>
    </n-form>

    <div class="mb-4 rounded border border-[#f0e6cf] bg-[#fffdf8] p-4">
      <div class="mb-3 flex items-center justify-between">
        <span class="text-sm font-600 text-slate-800">商品明细</span>
        <span v-if="selectedOrder" class="text-xs text-slate-500">
          订单号：{{ selectedOrder.orderNo }} / 客户：{{ selectedOrder.customerName }}
        </span>
      </div>

      <n-spin :show="detailLoading">
        <n-empty v-if="!selectedItems.length" description="请选择待发货订单后配置每个 SKU 的发货仓库" />
        <div v-else class="space-y-3">
          <div
            v-for="item in selectedItems"
            :key="item.skuId"
            class="rounded border border-[#f3ead8] bg-white p-4"
          >
            <div class="mb-3 flex items-start justify-between gap-4">
              <div>
                <div class="text-sm font-600 text-slate-900">{{ item.productName }}</div>
                <div class="mt-1 text-xs text-slate-500">SKU：{{ item.skuCode }}</div>
                <div class="mt-1 text-xs text-slate-500">规格：{{ formatSpecs(item.specs) }}</div>
              </div>
              <div class="text-right text-xs text-slate-500">
                <div>待发数量</div>
                <div class="mt-1 text-sm font-600 text-slate-900">{{ item.quantity }}</div>
              </div>
            </div>
            <n-select
              v-model:value="item.warehouseId"
              :options="item.warehouseOptions"
              placeholder="选择该 SKU 的发货仓库"
              :loading="item.loading"
            />
          </div>
        </div>
      </n-spin>
    </div>

    <div class="flex justify-end gap-2">
      <n-button @click="handleCancel">取消</n-button>
      <n-button type="primary" :loading="submitting" @click="handleSubmit">保存</n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue';
import { useMessage } from 'naive-ui';
import type { FormInst, FormRules, SelectOption } from 'naive-ui';
import { createShipment, getOrder, getOrders } from '@/api/order';
import { getSkuInventories } from '@/api/inventory';
import type { Order, OrderItem } from '@/types/purchase';
import { getKuaidiCompanyOptions } from '@/constants/kuaidi-companies';

const kuaidiCompanyOptions = getKuaidiCompanyOptions();

function filterKuaidiCompany(pattern: string, option: SelectOption): boolean {
  if (!pattern) return true;
  const p = pattern.trim().toLowerCase();
  if (!p) return true;
  const name = String((option as any).name || option.label || '').toLowerCase();
  const code = String((option as any).code || option.value || '').toLowerCase();
  const pinyin = String((option as any).pinyin || '').toLowerCase();
  return name.includes(p) || code.includes(p) || pinyin.includes(p);
}

interface ShipmentFormItem extends OrderItem {
  warehouseId: number | null;
  warehouseOptions: SelectOption[];
  loading: boolean;
}

const emit = defineEmits<{ success: []; cancel: [] }>();
const message = useMessage();
const formRef = ref<FormInst | null>(null);
const submitting = ref(false);
const ordersLoading = ref(false);
const detailLoading = ref(false);
const orderOptions = ref<SelectOption[]>([]);
const selectedOrder = ref<Order | null>(null);
const selectedItems = ref<ShipmentFormItem[]>([]);

const formData = reactive({
  orderId: null as number | null,
  logisticsCompany: null as string | null,
  trackingNo: '',
  remark: '',
});

const rules: FormRules = {
  orderId: { required: true, message: '请选择订单', type: 'number' },
};

function formatSpecs(specs: Record<string, string>) {
  const entries = Object.entries(specs || {});
  return entries.length ? entries.map(([key, value]) => `${key}: ${value}`).join(' / ') : '-';
}

async function loadOrderOptions() {
  ordersLoading.value = true;
  try {
    const orders = await getOrders({
      status: 'CONFIRMED',
      shipStatus: 'UNSHIPPED',
      page: 1,
      pageSize: 200,
    }) as any;
    const orderList = ((orders as any)?.data || []) as Order[];
    orderOptions.value = orderList.map((order: Order) => ({
      label: `${order.orderNo} - ${order.customerName}`,
      value: order.id,
    }));
  } finally {
    ordersLoading.value = false;
  }
}

async function loadOrderDetail(orderId: number) {
  detailLoading.value = true;
  selectedOrder.value = null;
  selectedItems.value = [];

  try {
    const order = await getOrder(orderId) as any as Order;
    selectedOrder.value = order;

    const pendingItems = (order.items || [])
      .filter((item: OrderItem) => item.quantity > item.shipped)
      .map<ShipmentFormItem>(item => ({
        ...item,
        quantity: item.quantity - item.shipped,
        warehouseId: null,
        warehouseOptions: [],
        loading: true,
      }));

    selectedItems.value = pendingItems;

    await Promise.all(
      pendingItems.map(async (item) => {
        try {
          const skuInventory = await getSkuInventories(item.skuId);
          item.warehouseOptions = (skuInventory.inventories || []).map(inventory => ({
            label: `${(inventory as any).warehouse?.name || inventory.warehouseName || `仓库${inventory.warehouseId}`}（可用库存：${inventory.available}）`,
            value: inventory.warehouseId,
            disabled: inventory.available < item.quantity,
          }));

          const preferredOption = item.warehouseOptions.find((option: SelectOption) => !option.disabled);
          item.warehouseId = typeof preferredOption?.value === 'number' ? preferredOption.value : null;
        } finally {
          item.loading = false;
        }
      }),
    );
  } finally {
    detailLoading.value = false;
  }
}

async function handleSubmit() {
  await formRef.value?.validate();

  if (!selectedItems.value.length) {
    message.error('该订单没有待发货商品');
    return;
  }

  const invalidItem = selectedItems.value.find(item => !item.warehouseId);
  if (invalidItem) {
    message.error(`请为 SKU ${invalidItem.skuCode} 选择发货仓库`);
    return;
  }

  submitting.value = true;
  try {
    await createShipment({
      orderId: formData.orderId!,
      items: selectedItems.value.map(item => ({
        skuId: item.skuId,
        quantity: item.quantity,
        warehouseId: item.warehouseId!,
      })),
      logisticsCompany: formData.logisticsCompany || undefined,
      trackingNo: formData.trackingNo,
      remark: formData.remark,
    });
    message.success('创建成功');
    emit('success');
  } catch (error: any) {
    message.error(error?.message || '创建失败');
  } finally {
    submitting.value = false;
  }
}

function handleCancel() {
  emit('cancel');
}

watch(() => formData.orderId, (orderId) => {
  if (!orderId) {
    selectedOrder.value = null;
    selectedItems.value = [];
    return;
  }
  loadOrderDetail(orderId);
});

onMounted(() => {
  loadOrderOptions();
});
</script>
