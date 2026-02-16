<template>
  <div v-if="receipt" class="space-y-4">
    <!-- 基本信息 -->
    <n-card title="基本信息">
      <n-descriptions :column="2" bordered>
        <n-descriptions-item label="入库单号">
          {{ receipt.receiptNo }}
        </n-descriptions-item>
        <n-descriptions-item label="状态">
          <n-tag :type="statusType">{{ statusText }}</n-tag>
        </n-descriptions-item>
        <n-descriptions-item label="采购订单">
          {{ receipt.purchaseNo }}
        </n-descriptions-item>
        <n-descriptions-item label="供应商">
          {{ receipt.supplierName }}
        </n-descriptions-item>
        <n-descriptions-item label="入库仓库">
          {{ receipt.warehouseName }}
        </n-descriptions-item>
        <n-descriptions-item label="创建时间">
          {{ new Date(receipt.createdAt).toLocaleString() }}
        </n-descriptions-item>
        <n-descriptions-item label="备注" :span="2">
          {{ receipt.remark || '-' }}
        </n-descriptions-item>
      </n-descriptions>
    </n-card>

    <!-- 金额信息 -->
    <n-card title="金额信息">
      <div class="text-right">
        <span class="text-gray-500">入库总金额：</span>
        <span class="text-xl font-bold text-primary">¥{{ receipt.totalAmount.toFixed(2) }}</span>
      </div>
    </n-card>

    <!-- 商品明细 -->
    <n-card title="入库明细">
      <n-table :bordered="true" :single-line="false">
        <thead>
          <tr>
            <th style="width: 60px">序号</th>
            <th>商品信息</th>
            <th style="width: 120px">入库单价</th>
            <th style="width: 100px">入库数量</th>
            <th style="width: 120px">金额</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in receipt.items" :key="item.id">
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
            <td>¥{{ (item.price * item.quantity).toFixed(2) }}</td>
          </tr>
        </tbody>
      </n-table>
    </n-card>
  </div>

  <div v-else class="flex justify-center items-center py-12">
    <n-spin size="large" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { getPurchaseReceipt } from '@/api/purchase';
import type { PurchaseReceipt, ReceiptStatus } from '@/types/purchase';

interface Props {
  receiptId: number;
}

const props = defineProps<Props>();

const receipt = ref<PurchaseReceipt | null>(null);
const loading = ref(false);

// 状态映射
const statusMap: Record<ReceiptStatus, { type: 'default' | 'warning' | 'success' | 'error'; text: string }> = {
  PENDING: { type: 'warning', text: '待入库' },
  RECEIVED: { type: 'success', text: '已入库' },
  CANCELLED: { type: 'default', text: '已取消' },
};

const statusType = computed(() => {
  return receipt.value ? statusMap[receipt.value.status].type : 'default';
});

const statusText = computed(() => {
  return receipt.value ? statusMap[receipt.value.status].text : '-';
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
    const res = await getPurchaseReceipt(props.receiptId);
    if (res.data.code === 200) {
      receipt.value = res.data.data;
    }
  } catch (error) {
    console.error('加载详情失败:', error);
  } finally {
    loading.value = false;
  }
};

// 监听receiptId变化
watch(
  () => props.receiptId,
  () => {
    loadDetail();
  },
  { immediate: true }
);
</script>
