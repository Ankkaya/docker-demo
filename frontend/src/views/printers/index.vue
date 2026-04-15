<template>
  <div class="p-4">
    <n-card class="bg-container transition-theme">
      <div class="page-toolbar mb-4">
        <n-space>
          <n-tooltip>
            <template #trigger>
              <n-switch v-model:value="autoRefreshEnabled" @update:value="handleAutoRefreshChange">
                <template #checked>自动刷新:开</template>
                <template #unchecked>自动刷新:关</template>
              </n-switch>
            </template>
            开启后每10秒自动检测打印机状态
          </n-tooltip>
          <n-button :loading="isChecking" @click="refreshAllStatus">刷新状态</n-button>
          <n-button type="primary" @click="handleCreate">新增打印机</n-button>
        </n-space>
      </div>
      <n-data-table :columns="columns" :data="listWithStatus" :loading="loading" striped />
    </n-card>

    <n-modal v-model:show="dialogVisible" :title="isEdit ? '编辑打印机' : '新增打印机'" preset="card" style="width: 520px">
      <n-form ref="formRef" :model="form" :rules="rules" label-width="100">
        <n-form-item label="打印机名称" path="name">
          <n-input v-model:value="form.name" placeholder="请输入打印机名称" />
        </n-form-item>
        <n-form-item label="打印机终端" path="device">
          <n-select
            v-model:value="form.device"
            :options="deviceOptions"
            placeholder="请选择打印机终端"
            :loading="loadingDevices"
            @focus="loadPrinterDevices"
          />
          <n-text depth="3" class="text-xs mt-1">
            提示：需要先安装并启动德佟打印助手，才能获取到打印机列表
          </n-text>
        </n-form-item>
        <n-form-item label="备注">
          <n-input v-model:value="form.remark" type="textarea" placeholder="请输入备注" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="dialogVisible = false">取消</n-button>
          <n-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- 打印机状态详情弹窗 -->
    <n-modal v-model:show="statusDialogVisible" title="打印机状态详情" preset="card" style="width: 400px">
      <n-descriptions bordered :column="1" v-if="selectedPrinterStatus">
        <n-descriptions-item label="打印机">{{ selectedPrinter?.name }}</n-descriptions-item>
        <n-descriptions-item label="设备标识">{{ selectedPrinterStatus.device }}</n-descriptions-item>
        <n-descriptions-item label="在线状态">
          <n-tag :type="selectedPrinterStatus.online ? 'success' : 'error'">
            {{ selectedPrinterStatus.online ? '在线' : '离线' }}
          </n-tag>
        </n-descriptions-item>
        <n-descriptions-item label="可打印">
          <n-tag :type="selectedPrinterStatus.printable ? 'success' : 'warning'">
            {{ selectedPrinterStatus.printable ? '正常' : '异常' }}
          </n-tag>
        </n-descriptions-item>
        <n-descriptions-item label="检测时间">
          {{ selectedPrinterStatus.lastCheckTime?.toLocaleString() || '-' }}
        </n-descriptions-item>
        <n-descriptions-item label="错误信息" v-if="selectedPrinterStatus.error">
          <n-text type="error">{{ selectedPrinterStatus.error }}</n-text>
        </n-descriptions-item>
      </n-descriptions>
      <template #footer>
        <n-space justify="end">
          <n-button @click="statusDialogVisible = false">关闭</n-button>
          <n-button type="primary" :loading="isChecking" @click="checkSelectedPrinter">重新检测</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { h, onMounted, reactive, ref, computed, watch } from 'vue';
import type { DataTableColumns, FormInst, FormRules } from 'naive-ui';
import { NButton, NSpace, NTag, NTooltip, useDialog, useMessage } from 'naive-ui';
import { DTPWeb } from 'dtpweb';
import type { LPA_DeviceInfo } from 'dtpweb';
import { createPrinter, deletePrinter, getPrinters, updatePrinter } from '@/api/printer';
import type { CreatePrinterDto, Printer } from '@/types/print';
import { usePrinterStatus, type PrinterStatus } from '@/composables/usePrinterStatus';

const message = useMessage();
const dialog = useDialog();

const loading = ref(false);
const submitLoading = ref(false);
const dialogVisible = ref(false);
const isEdit = ref(false);
const currentId = ref<number>();
const formRef = ref<FormInst>();
const list = ref<Printer[]>([]);

// 打印机状态管理
const {
  isChecking,
  autoRefreshEnabled,
  checkPrinterStatus,
  checkMultiplePrinters,
  getStatus,
  startAutoRefresh,
  stopAutoRefresh,
} = usePrinterStatus();

// 打印机设备下拉选项
const deviceOptions = ref<{ label: string; value: string }[]>([]);
const loadingDevices = ref(false);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dtpApi = ref<any>(null);

// 状态详情弹窗
const statusDialogVisible = ref(false);
const selectedPrinter = ref<Printer | null>(null);
const selectedPrinterStatus = ref<PrinterStatus | null>(null);

const form = reactive({
  name: '',
  device: '',
  remark: '',
});

const rules: FormRules = {
  name: [{ required: true, message: '请输入打印机名称', trigger: 'blur' }],
  device: [{ required: true, message: '请选择打印机终端', trigger: 'change' }],
};

// 带状态的打印机列表
const listWithStatus = computed(() => {
  return list.value.map(printer => ({
    ...printer,
    statusInfo: getStatus(printer.device),
  }));
});

// 渲染状态列
const renderStatus = (row: Printer & { statusInfo?: PrinterStatus }) => {
  const status = row.statusInfo;
  
  if (!status) {
    return h(NTag, { size: 'small' }, { default: () => '未检测' });
  }
  
  if (status.loading) {
    return h(NTag, { size: 'small', type: 'warning' }, { default: () => '检测中...' });
  }
  
  if (status.error) {
    return h(
      NTag, 
      { size: 'small', type: 'error' }, 
      { default: () => '异常' }
    );
  }
  
  if (status.online && status.printable) {
    return h(NTag, { size: 'small', type: 'success' }, { default: () => '正常' });
  }
  
  if (!status.online) {
    return h(NTag, { size: 'small', type: 'error' }, { default: () => '离线' });
  }
  
  return h(NTag, { size: 'small', type: 'warning' }, { default: () => '异常' });
};

const columns: DataTableColumns<Printer & { statusInfo?: PrinterStatus }> = [
  { title: 'ID', key: 'id', width: 70 },
  { title: '打印机名称', key: 'name', minWidth: 150 },
  { title: '打印机终端', key: 'device', minWidth: 200 },
  { 
    title: '状态', 
    key: 'status', 
    width: 100,
    render: renderStatus,
  },
  { title: '备注', key: 'remark', minWidth: 150, render: (row) => row.remark || '-' },
  {
    title: '操作',
    key: 'actions',
    width: 200,
    render: (row) => h(NSpace, null, {
      default: () => [
        h(NButton, { text: true, type: 'info', onClick: () => handleViewStatus(row) }, { default: () => '状态' }),
        h(NButton, { text: true, type: 'primary', onClick: () => handleEdit(row) }, { default: () => '编辑' }),
        h(NButton, { text: true, type: 'error', onClick: () => handleDelete(row) }, { default: () => '删除' }),
      ],
    }),
  },
];

/**
 * 从 DTPWeb 获取本地打印机设备列表
 * 参考：c:\Users\Ankkaya\Downloads\Web SDK (Windows & Linux)\test\vue\src\App.vue
 */
const loadPrinterDevices = async () => {
  if (loadingDevices.value) return;
  
  loadingDevices.value = true;
  deviceOptions.value = [];

  try {
    // 检查 DTPWeb 服务是否可用
    DTPWeb.checkServer({
      callback: (resp, api) => {
        if (resp?.statusCode === 0 && api) {
          dtpApi.value = api;
          
          // 获取本地打印机列表（onlyLocal: true 只获取本地打印机）
          api.getPrinters({ onlyLocal: true }, (devices: LPA_DeviceInfo[] | null) => {
            if (devices && devices.length > 0) {
              deviceOptions.value = devices.map((item: LPA_DeviceInfo) => {
                // 判断是否为本地打印机，格式化显示文本
                const isLocal = api.isLocalPrinter ? api.isLocalPrinter(item) : !item.ip;
                const displayName = item.deviceName || item.name || item.printerName || '未知打印机';
                const label = isLocal 
                  ? displayName 
                  : `${displayName} [${item.ip}]`;
                
                return {
                  label,
                  value: item.printerName || item.deviceName || item.name || '',
                };
              }).filter(opt => opt.value); // 过滤掉没有值的选项
            } else {
              deviceOptions.value = [{ label: '未检测到打印机', value: '' }];
              message.warning('未检测到打印机，请确认已安装并启动德佟打印助手');
            }
            loadingDevices.value = false;
          });
        } else {
          deviceOptions.value = [{ label: '未检测到打印助手', value: '' }];
          message.warning('未检测到德佟打印助手，请确认已安装并启动');
          loadingDevices.value = false;
        }
      },
    });
  } catch (error) {
    deviceOptions.value = [{ label: '获取打印机列表失败', value: '' }];
    message.error('获取打印机列表失败');
    loadingDevices.value = false;
  }
};

const fetchList = async () => {
  loading.value = true;
  try {
    list.value = await getPrinters();
    // 获取列表后自动检测一次状态
    if (list.value.length > 0) {
      checkMultiplePrinters(list.value.map(p => p.device));
    }
  } catch (error: any) {
    message.error(error.message || '获取列表失败');
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  form.name = '';
  form.device = '';
  form.remark = '';
};

const handleCreate = () => {
  isEdit.value = false;
  currentId.value = undefined;
  resetForm();
  dialogVisible.value = true;
  // 打开弹窗时自动加载打印机设备列表
  loadPrinterDevices();
};

const handleEdit = (row: Printer) => {
  isEdit.value = true;
  currentId.value = row.id;
  form.name = row.name;
  form.device = row.device;
  form.remark = row.remark || '';
  dialogVisible.value = true;
  // 打开弹窗时加载打印机设备列表
  loadPrinterDevices();
};

const handleDelete = (row: Printer) => {
  dialog.warning({
    title: '提示',
    content: `确定删除打印机 "${row.name}" 吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await deletePrinter(row.id);
        message.success('删除成功');
        fetchList();
      } catch (error: any) {
        message.error(error.message || '删除失败');
      }
    },
  });
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (errors) => {
    if (errors) return;
    submitLoading.value = true;
    try {
      const payload: CreatePrinterDto = {
        name: form.name,
        device: form.device,
        remark: form.remark || undefined,
      };

      if (isEdit.value && currentId.value) {
        await updatePrinter(currentId.value, payload);
        message.success('更新成功');
      } else {
        await createPrinter(payload);
        message.success('创建成功');
      }

      dialogVisible.value = false;
      fetchList();
    } catch (error: any) {
      message.error(error.message || '操作失败');
    } finally {
      submitLoading.value = false;
    }
  });
};

// 查看状态详情
const handleViewStatus = (row: Printer) => {
  selectedPrinter.value = row;
  selectedPrinterStatus.value = getStatus(row.device) || null;
  statusDialogVisible.value = true;
  
  // 如果没有检测过，自动检测一次
  if (!selectedPrinterStatus.value) {
    checkSelectedPrinter();
  }
};

// 检测选中的打印机
const checkSelectedPrinter = async () => {
  if (!selectedPrinter.value) return;
  const status = await checkPrinterStatus(selectedPrinter.value.device);
  selectedPrinterStatus.value = status;
};

// 刷新所有状态
const refreshAllStatus = () => {
  if (list.value.length === 0) {
    message.info('暂无打印机');
    return;
  }
  checkMultiplePrinters(list.value.map(p => p.device));
  message.success('正在检测打印机状态...');
};

// 处理自动刷新开关
const handleAutoRefreshChange = (enabled: boolean) => {
  if (enabled) {
    if (list.value.length === 0) {
      message.info('暂无打印机需要检测');
      autoRefreshEnabled.value = false;
      return;
    }
    startAutoRefresh(list.value.map(p => p.device));
    message.success('已开启自动刷新，每10秒检测一次');
  } else {
    stopAutoRefresh();
    message.info('已关闭自动刷新');
  }
};

// 监听列表变化，如果开启了自动刷新，更新检测列表
watch(list, (newList) => {
  if (autoRefreshEnabled.value && newList.length > 0) {
    startAutoRefresh(newList.map(p => p.device));
  }
});

onMounted(() => {
  fetchList();
});
</script>
