<template>
  <div v-if="loading" class="flex justify-center py-8">
    <n-spin size="large" />
  </div>
  <div v-else-if="returnData" class="space-y-4">
    <!-- 基本信息 -->
    <n-card title="基本信息" size="small">
      <n-descriptions :column="2" bordered>
        <n-descriptions-item label="退货单号">
          {{ returnData.returnNo }}
        </n-descriptions-item>
        <n-descriptions-item label="关联入库单">
          {{ returnData.receiptNo }}
        </n-descriptions-item>
        <n-descriptions-item label="供应商">
          {{ returnData.supplierName }}
        </n-descriptions-item>
        <n-descriptions-item label="退货仓库">
          {{ returnData.warehouseName }}
        </n-descriptions-item>
        <n-descriptions-item label="退货金额">
          <span class="text-lg font-bold text-primary">
            ¥{{ returnData.totalAmount.toFixed(2) }}
          </span>
        </n-descriptions-item>
        <n-descriptions-item label="状态">
          <n-tag :type="statusType(returnData.status)" size="small">
            {{ statusText(returnData.status) }}
          </n-tag>
        </n-descriptions-item>
        <n-descriptions-item label="创建时间">
          {{ new Date(returnData.createdAt).toLocaleString() }}
        </n-descriptions-item>
        <n-descriptions-item label="更新时间">
          {{ new Date(returnData.updatedAt).toLocaleString() }}
        </n-descriptions-item>
        <n-descriptions-item label="备注" :span="2">
          {{ returnData.remark || '-' }}
        </n-descriptions-item>
      </n-descriptions>
    </n-card>

    <!-- 退货明细 -->
    <n-card title="退货明细" size="small">
      <n-table :bordered="true" :single-line="false">
        <thead>
          <tr>
            <th>#</th>
            <th>SKU编码</th>
            <th>商品名称</th>
            <th>规格</th>
            <th class="text-right">数量</th>
            <th class="text-right">单价</th>
            <th class="text-right">金额</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in returnData.items" :key="item.id">
            <td>{{ index + 1 }}</td>
            <td>{{ item.skuCode }}</td>
            <td>{{ item.productName }}</td>
            <td>
              <n-space v-if="Object.keys(item.specs).length > 0" size="small">
                <n-tag v-for="(value, key) in item.specs" :key="key" size="small">
                  {{ key }}: {{ value }}
                </n-tag>
              </n-space>
              <span v-else>-</span>
            </td>
            <td class="text-right">{{ item.quantity }}</td>
            <td class="text-right">¥{{ item.price.toFixed(2) }}</td>
            <td class="text-right">¥{{ item.amount.toFixed(2) }}</td>
          </tr>
          <tr v-if="!returnData.items || returnData.items.length === 0">
            <td colspan="7" class="text-center py-4">
              <n-empty description="暂无明细" />
            </td>
          </tr>
        </tbody>
        <tfoot v-if="returnData.items && returnData.items.length > 0">
          <tr>
            <td colspan="6" class="text-right font-bold">合计：</td>
            <td class="text-right font-bold text-primary">
              ¥{{ returnData.totalAmount.toFixed(2) }}
            </td>
          </tr>
        </tfoot>
      </n-table>
    </n-card>
  </div>
  <div v-else class="text-center py-8">
    <n-empty description="退货单不存在或已被删除" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useMessage } from 'naive-ui';
import { getPurchaseReturn } from '@/api/purchase';
import type { PurchaseReturn, ReturnStatus } from '@/types/purchase';

const props = defineProps<{
  returnId: number;
}>();

const message = useMessage();
const loading = ref(false);
const returnData = ref<PurchaseReturn | null>(null);

// 状态映射
const statusTypeMap: Record<ReturnStatus, 'default' | 'warning' | 'success' | 'error'> = {
  PENDING: 'warning',
  APPROVED: 'success',
  COMPLETED: 'success',
  CANCELLED: 'default',
};

const statusTextMap: Record<ReturnStatus, string> = {
  PENDING: '待审核',
  APPROVED: '已审核',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
};

const statusType = (status: ReturnStatus) => statusTypeMap[status];
const statusText = (status: ReturnStatus) => statusTextMap[status];

// 加载数据
const loadData = async () => {
  loading.value = true;
  try {
    returnData.value = await getPurchaseReturn(props.returnId) as any;
  } catch (error) {
    console.error('加载退货单详情失败:', error);
    message.error('加载失败');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadData();
});
</script>
