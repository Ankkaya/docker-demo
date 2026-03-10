<template>
  <div class="p-4">
    <n-card class="mb-4">
      <n-form inline :model="searchForm" label-placement="left">
        <n-form-item label="关键词">
          <n-input v-model:value="searchForm.keyword" placeholder="发货单号" clearable />
        </n-form-item>
        <n-form-item label="状态">
          <n-select v-model:value="searchForm.status" :options="statusOptions" placeholder="选择状态" clearable style="width: 150px" />
        </n-form-item>
        <n-form-item>
          <n-space>
            <n-button type="primary" @click="handleSearch">搜索</n-button>
            <n-button @click="handleReset">重置</n-button>
          </n-space>
        </n-form-item>
      </n-form>
    </n-card>

    <n-card class="mb-4">
      <n-space>
        <n-button type="primary" @click="handleCreate">创建发货单</n-button>
      </n-space>
    </n-card>

    <n-card>
      <n-data-table :columns="columns" :data="shipmentList" :loading="loading" :pagination="pagination" remote />
    </n-card>

    <n-modal v-model:show="modalVisible" title="创建发货单" preset="card" style="width: 800px">
      <ShipmentForm v-if="modalVisible" @success="handleFormSuccess" @cancel="modalVisible = false" />
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, h } from 'vue';
import { NButton, NSpace, NTag, useMessage } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { getShipments, shipShipment, receiveShipment } from '@/api/order';
import { getPrintErrorMessage, printShipment } from '@/services/print/print-service';
import ShipmentForm from './components/ShipmentForm.vue';
import type { Shipment, ShipmentStatus } from '@/types/purchase';

const message = useMessage();

const searchForm = reactive({ keyword: '', status: null as ShipmentStatus | null });
const statusOptions = [
  { label: '待发货', value: 'PENDING' },
  { label: '已发货', value: 'SHIPPED' },
  { label: '已收货', value: 'RECEIVED' },
];

const loading = ref(false);
const shipmentList = ref<Shipment[]>([]);
const printingIds = ref<number[]>([]);
const pagination = reactive({ page: 1, pageSize: 10, itemCount: 0 });
const modalVisible = ref(false);

const columns: DataTableColumns<Shipment> = [
  { title: '发货单号', key: 'shipmentNo', width: 160 },
  { title: '订单号', key: 'orderNo', width: 160 },
  { title: '仓库', key: 'warehouseName', width: 120 },
  { title: '物流公司', key: 'logisticsCompany', width: 120 },
  { title: '物流单号', key: 'trackingNo', width: 150 },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render(row) {
      const map: Record<ShipmentStatus, { type: any; label: string }> = {
        PENDING: { type: 'warning', label: '待发货' },
        SHIPPED: { type: 'success', label: '已发货' },
        RECEIVED: { type: 'success', label: '已收货' },
        CANCELLED: { type: 'default', label: '已取消' },
      };
      const s = map[row.status];
      return h(NTag, { type: s.type, size: 'small' }, { default: () => s.label });
    },
  },
  {
    title: '操作',
    key: 'actions',
    width: 320,
    render(row) {
      const buttons: any[] = [];
      buttons.push(
        h(
          NButton,
          {
            size: 'small',
            type: 'info',
            loading: isPrinting(row.id),
            disabled: isPrinting(row.id),
            onClick: () => handlePrint(row),
          },
          { default: () => '打印' },
        ),
      );
      if (row.status === 'PENDING') {
        buttons.push(
          h(NButton, { size: 'small', type: 'primary', onClick: () => handleShip(row) }, { default: () => '发货' })
        );
      }
      if (row.status === 'SHIPPED') {
        buttons.push(
          h(NButton, { size: 'small', type: 'success', onClick: () => handleReceive(row) }, { default: () => '收货' })
        );
      }
      return h(NSpace, { size: 'small' }, { default: () => buttons });
    },
  },
];

const loadData = async () => {
  loading.value = true;
  try {
    const res: any = await getShipments({
      keyword: searchForm.keyword || undefined,
      status: searchForm.status || undefined,
      page: pagination.page,
      pageSize: pagination.pageSize,
    });
    if (res) {
      shipmentList.value = res.data;
      pagination.itemCount = res.meta?.total || 0;
    }
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => { pagination.page = 1; loadData(); };
const handleReset = () => { searchForm.keyword = ''; searchForm.status = null; loadData(); };
const handleCreate = () => { modalVisible.value = true; };
const handleFormSuccess = () => { modalVisible.value = false; loadData(); };
const isPrinting = (id: number) => printingIds.value.includes(id);

const handleShip = async (row: Shipment) => {
  try {
    await shipShipment(row.id);
    message.success('发货成功');
    loadData();
  } catch (error) {
    message.error('发货失败');
  }
};

const handleReceive = async (row: Shipment) => {
  try {
    await receiveShipment(row.id);
    message.success('收货成功');
    loadData();
  } catch (error) {
    message.error('收货失败');
  }
};

const handlePrint = async (row: Shipment) => {
  if (isPrinting(row.id)) return;
  printingIds.value.push(row.id);
  try {
    await printShipment(row.id);
    message.success('打印任务已发送');
  } catch (error) {
    message.error(getPrintErrorMessage(error));
  } finally {
    printingIds.value = printingIds.value.filter((itemId) => itemId !== row.id);
  }
};

loadData();
</script>
