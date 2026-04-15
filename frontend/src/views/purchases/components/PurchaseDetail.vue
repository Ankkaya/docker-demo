<template>
  <div v-if="purchase" class="space-y-4">
    <!-- 基本信息 -->
    <n-card title="基本信息">
      <n-descriptions :column="2" bordered>
        <n-descriptions-item label="采购单号">
          {{ purchase.orderNo }}
        </n-descriptions-item>
        <n-descriptions-item label="状态">
          <n-tag :type="statusType">{{ statusText }}</n-tag>
        </n-descriptions-item>
        <n-descriptions-item label="供应商">
          {{ purchase.supplierName }}
        </n-descriptions-item>
        <n-descriptions-item label="入库仓库">
          {{ purchase.warehouseName }}
        </n-descriptions-item>
        <n-descriptions-item label="下单日期">
          {{ new Date(purchase.orderDate).toLocaleString() }}
        </n-descriptions-item>
        <n-descriptions-item label="预计到货">
          {{ purchase.deliveryDate ? new Date(purchase.deliveryDate).toLocaleDateString() : '-' }}
        </n-descriptions-item>
        <n-descriptions-item label="备注" :span="2">
          {{ purchase.remark || '-' }}
        </n-descriptions-item>
      </n-descriptions>
    </n-card>

    <!-- 金额信息 -->
    <n-card title="金额信息">
      <n-descriptions :column="4" bordered>
        <n-descriptions-item label="商品总金额">
          <span class="text-lg">¥{{ purchase.totalAmount.toFixed(2) }}</span>
        </n-descriptions-item>
        <n-descriptions-item label="折扣">
          <span class="text-lg">¥{{ purchase.discount.toFixed(2) }}</span>
        </n-descriptions-item>
        <n-descriptions-item label="应付金额">
          <span class="text-lg text-primary font-bold">¥{{ purchase.payable.toFixed(2) }}</span>
        </n-descriptions-item>
        <n-descriptions-item label="已付金额">
          <span class="text-lg" :class="purchase.paid >= purchase.payable ? 'text-success' : 'text-warning'">
            ¥{{ purchase.paid.toFixed(2) }}
          </span>
        </n-descriptions-item>
      </n-descriptions>
    </n-card>

    <!-- 商品明细 -->
    <n-card title="商品明细">
      <n-table :bordered="true" :single-line="false">
        <thead>
          <tr>
            <th style="width: 60px">序号</th>
            <th>商品信息</th>
            <th style="width: 120px">单价</th>
            <th style="width: 100px">采购数量</th>
            <th style="width: 100px">已入库</th>
            <th style="width: 100px">待入库</th>
            <th style="width: 120px">金额</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in purchase.items" :key="item.id">
            <td>{{ index + 1 }}</td>
            <td>
              <div class="flex items-center gap-2">
                <div>
                  <div class="font-medium">{{ item.productName }}</div>
                  <div class="text-gray-500 text-sm">{{ item.skuCode }}</div>
                  <div class="text-gray-400 text-xs">{{ formatSpecs(item.specs) }}</div>
                </div>
              </div>
            </td>
            <td>¥{{ item.price.toFixed(2) }}</td>
            <td>{{ item.quantity }}</td>
            <td>
              <n-tag :type="item.received >= item.quantity ? 'success' : 'default'" size="small">
                {{ item.received }}
              </n-tag>
            </td>
            <td>
              <n-tag :type="item.quantity - item.received > 0 ? 'warning' : 'success'" size="small">
                {{ item.quantity - item.received }}
              </n-tag>
            </td>
            <td>¥{{ item.amount.toFixed(2) }}</td>
          </tr>
        </tbody>
      </n-table>
    </n-card>

    <!-- 入库记录 -->
    <n-card v-if="purchase.receipts && purchase.receipts.length > 0" title="入库记录">
      <n-timeline>
        <n-timeline-item
          v-for="receipt in purchase.receipts"
          :key="receipt.id"
          :type="receipt.status === 'RECEIVED' ? 'success' : 'warning'"
        >
          <div class="flex justify-between items-center">
            <div>
              <div class="font-medium">{{ receipt.receiptNo }}</div>
              <div class="text-sm text-gray-500">
                {{ new Date(receipt.createdAt).toLocaleString() }}
              </div>
            </div>
            <div class="text-right">
              <n-tag :type="receipt.status === 'RECEIVED' ? 'success' : 'warning'" size="small">
                {{ receipt.status === 'RECEIVED' ? '已入库' : '待入库' }}
              </n-tag>
              <div class="text-sm mt-1">¥{{ Number(receipt.totalAmount).toFixed(2) }}</div>
            </div>
          </div>
        </n-timeline-item>
      </n-timeline>
    </n-card>
  </div>

  <div v-else class="flex justify-center items-center py-12">
    <n-spin size="large" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { getPurchase } from '@/api/purchase';
import type { Purchase, PurchaseStatus } from '@/types/purchase';

interface Props {
  purchaseId: number;
}

const props = defineProps<Props>();

const purchase = ref<Purchase | null>(null);
const loading = ref(false);

// 状态映射
const statusMap: Record<PurchaseStatus, { type: 'default' | 'warning' | 'success' | 'error'; text: string }> = {
  PENDING: { type: 'warning', text: '待审核' },
  APPROVED: { type: 'success', text: '已审核' },
  PARTIAL: { type: 'warning', text: '部分入库' },
  COMPLETED: { type: 'success', text: '已完成' },
  CANCELLED: { type: 'default', text: '已取消' },
};

const statusType = computed(() => {
  return purchase.value ? statusMap[purchase.value.status].type : 'default';
});

const statusText = computed(() => {
  return purchase.value ? statusMap[purchase.value.status].text : '-';
});

// 格式化规格
const formatSpecs = (specs: Record<string, string>) => {
  if (!specs || Object.keys(specs).length === 0) return '-';
  return Object.entries(specs)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');
};

// 加载详情
const loadDetail = async () => {
  loading.value = true;
  try {
    const res: any = await getPurchase(props.purchaseId);
    purchase.value = res;
  } catch (error) {
    console.error('加载详情失败:', error);
  } finally {
    loading.value = false;
  }
};

// 监听purchaseId变化
watch(
  () => props.purchaseId,
  () => {
    loadDetail();
  },
  { immediate: true }
);
</script>
