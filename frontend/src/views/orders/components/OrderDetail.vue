<template>
  <div v-if="loading" class="flex justify-center py-8">
    <n-spin size="large" />
  </div>
  <div v-else-if="orderData" class="space-y-4">
    <n-card title="基本信息" size="small">
      <n-descriptions :column="2" bordered>
        <n-descriptions-item label="订单号">{{ orderData.orderNo }}</n-descriptions-item>
        <n-descriptions-item label="客户">{{ orderData.customerName }}</n-descriptions-item>
        <n-descriptions-item label="订单金额">
          <span class="text-lg font-bold text-primary">¥{{ orderData.totalAmount.toFixed(2) }}</span>
        </n-descriptions-item>
        <n-descriptions-item label="应付金额">¥{{ orderData.payable.toFixed(2) }}</n-descriptions-item>
        <n-descriptions-item label="状态">
          <n-tag :type="statusType(orderData.status)" size="small">{{ statusText(orderData.status) }}</n-tag>
        </n-descriptions-item>
        <n-descriptions-item label="下单日期">{{ new Date(orderData.orderDate).toLocaleString() }}</n-descriptions-item>
      </n-descriptions>
    </n-card>

    <n-card title="订单明细" size="small">
      <n-table :bordered="true">
        <thead>
          <tr>
            <th>商品</th>
            <th>规格</th>
            <th>数量</th>
            <th>单价</th>
            <th>金额</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in orderData.items" :key="item.id">
            <td>{{ item.productName }}</td>
            <td>
              <n-tag v-for="(v, k) in item.specs" :key="k" size="small" class="mr-1">{{ k }}:{{ v }}</n-tag>
            </td>
            <td>{{ item.quantity }}</td>
            <td>¥{{ item.price.toFixed(2) }}</td>
            <td>¥{{ item.amount.toFixed(2) }}</td>
          </tr>
        </tbody>
      </n-table>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getOrder } from '@/api/order';
import type { Order, OrderStatus } from '@/types/purchase';

const props = defineProps<{ orderId: number }>();

const loading = ref(false);
const orderData = ref<Order | null>(null);

const statusMap: Record<OrderStatus, { type: any; label: string }> = {
  PENDING: { type: 'warning', label: '待处理' },
  CONFIRMED: { type: 'success', label: '已确认' },
  PROCESSING: { type: 'warning', label: '处理中' },
  SHIPPED: { type: 'success', label: '已发货' },
  COMPLETED: { type: 'success', label: '已完成' },
  CANCELLED: { type: 'default', label: '已取消' },
  REFUNDING: { type: 'warning', label: '退款中' },
  REFUNDED: { type: 'default', label: '已退款' },
};

const statusType = (s: OrderStatus) => statusMap[s].type;
const statusText = (s: OrderStatus) => statusMap[s].label;

onMounted(async () => {
  loading.value = true;
  try {
    const res: any = await getOrder(props.orderId);
    orderData.value = res.data;
  } finally {
    loading.value = false;
  }
});
</script>
