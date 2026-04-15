<template>
  <div class="p-4">
    <n-card class="bg-container transition-theme">
      <div class="page-toolbar mb-4">
        <n-button type="primary" @click="handleCreate">新增配置</n-button>
      </div>
      <n-data-table :columns="columns" :data="list" :loading="loading" striped />
    </n-card>

    <SmartFormContainer
      v-model:show="dialogVisible"
      :title="isEdit ? '编辑打印配置' : '新增打印配置'"
      :form-item-count="12"
      modal-width="800px"
      :drawer-width="960"
    >
      <n-form ref="formRef" :model="form" :rules="rules" label-width="100">
        <n-grid :cols="2" :x-gap="12">
          <n-form-item-gi span="2" label="配置名称" path="name"><n-input v-model:value="form.name" /></n-form-item-gi>
          <n-form-item-gi label="打印模板" path="templateId">
            <n-select v-model:value="form.templateId" :options="templateOptions" clearable />
          </n-form-item-gi>
          <n-form-item-gi label="打印机" path="printerId">
            <n-select v-model:value="form.printerId" :options="printerOptions" clearable />
          </n-form-item-gi>
          <n-form-item-gi label="打印份数" path="copies"><n-input-number v-model:value="form.copies" :min="1" style="width: 100%" /></n-form-item-gi>
          <n-form-item-gi label="打印方向" path="orientation">
            <n-select v-model:value="form.orientation" :options="orientationOptions" style="width: 100%" />
          </n-form-item-gi>
          <n-form-item-gi label="纸张类型" path="paperType">
            <n-select v-model:value="form.paperType" :options="paperTypeOptions" style="width: 100%" />
          </n-form-item-gi>
          <n-form-item-gi label="间隙类型" path="gapType">
            <n-select v-model:value="form.gapType" :options="gapTypeOptions" style="width: 100%" />
          </n-form-item-gi>
          <n-form-item-gi label="打印速度" path="printSpeed">
            <n-select v-model:value="form.printSpeed" :options="printSpeedOptions" style="width: 100%" />
          </n-form-item-gi>
          <n-form-item-gi label="打印浓度" path="printDarkness">
            <n-select v-model:value="form.printDarkness" :options="printDarknessOptions" style="width: 100%" />
          </n-form-item-gi>
          <n-form-item-gi label="打印模式" path="printMode">
            <n-select v-model:value="form.printMode" :options="printModeOptions" style="width: 100%" />
          </n-form-item-gi>
          <n-form-item-gi label="默认配置"><n-switch v-model:value="form.isDefault" /></n-form-item-gi>
          <n-form-item-gi label="启用"><n-switch v-model:value="form.isEnabled" /></n-form-item-gi>
        </n-grid>
        <n-form-item label="备注"><n-input v-model:value="form.remark" /></n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="dialogVisible = false">取消</n-button>
          <n-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</n-button>
        </n-space>
      </template>
    </SmartFormContainer>

    <n-modal v-model:show="previewVisible" title="模板预览" preset="card" style="width: 980px">
      <div class="grid grid-cols-2 gap-4">
        <n-space vertical :size="12">
          <n-descriptions bordered :column="2" size="small">
            <n-descriptions-item label="模板名称">{{ previewTemplate?.name || '-' }}</n-descriptions-item>
            
            <n-descriptions-item label="业务类型">{{ previewTemplate?.bizType || '-' }}</n-descriptions-item>
            <n-descriptions-item label="纸张">{{ previewTemplate ? `${previewTemplate.paperWidth} x ${previewTemplate.paperHeight} mm` : '-' }}</n-descriptions-item>
          </n-descriptions>
          <n-input :value="previewJson" type="textarea" :autosize="{ minRows: 12, maxRows: 18 }" readonly />
        </n-space>
        <div>
          <div class="border rounded bg-gray-100 p-3 overflow-auto">
            <div class="mx-auto relative bg-white shadow" :style="previewPaperStyle">
              <template v-for="block in previewBlocks" :key="block.id">
                <div v-if="block.type === 'text'" :style="previewTextStyle(block)">{{ block.text || '文本' }}</div>
                <div v-else-if="block.type === 'qrcode'" :style="previewQrcodeStyle(block)">QR</div>
                <div v-else-if="block.type === 'barcode'" :style="previewBarcodeStyle(block)">BAR</div>
                <div v-else :style="previewLineStyle(block)"></div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, reactive, ref } from 'vue';
import type { CSSProperties } from 'vue';
import type { DataTableColumns, FormInst, FormRules } from 'naive-ui';
import { NButton, NSpace, NSwitch, useDialog, useMessage } from 'naive-ui';
import SmartFormContainer from '@/components/common/SmartFormContainer.vue';
import { createPrinterConfig, deletePrinterConfig, getPrinterConfigs, updatePrinterConfig } from '@/api/printer-config';
import { getPrinters } from '@/api/printer';
import { getPrintTemplate, getPrintTemplates } from '@/api/print-template';
import type { CreatePrinterConfigDto, PrintTemplate, PrinterConfig, TemplateBlock } from '@/types/print';
import {
  orientationOptions,
  paperTypeOptions,
  gapTypeOptions,
  printSpeedOptions,
  printDarknessOptions,
  printModeOptions,
  PaperType,
  PrintMode,
} from '@/types/print';
import { closePrinter, commitJob, drawBarcode, drawLine, drawQrCode, drawText, getDtpApi, getPrintErrorMessage, openPrinter, startJob } from '@/services/print/dtpweb';
import { getPrinter as getPrinterDetail } from '@/api/printer';

const message = useMessage();
const dialog = useDialog();

const loading = ref(false);
const submitLoading = ref(false);
const dialogVisible = ref(false);
const isEdit = ref(false);
const currentId = ref<number>();
const formRef = ref<FormInst>();
const list = ref<PrinterConfig[]>([]);
const templateOptions = ref<{ label: string; value: number }[]>([]);
const printerOptions = ref<{ label: string; value: number }[]>([]);
const previewVisible = ref(false);
const previewTemplate = ref<PrintTemplate | null>(null);
const previewJson = ref('');
const testingIds = ref<number[]>([]);

const previewBlocks = computed<TemplateBlock[]>(() => {
  const raw = previewTemplate.value?.content as any;
  const blocks = Array.isArray(raw?.blocks) ? raw.blocks : [];
  return blocks.map((item: any, idx: number) => ({ id: item.id || `pv_${idx}`, ...item }));
});

const previewScale = computed(() => {
  const width = previewTemplate.value?.paperWidth || 100;
  const height = previewTemplate.value?.paperHeight || 150;
  const maxW = 380;
  const maxH = 520;
  const sx = maxW / Math.max(width, 1);
  const sy = maxH / Math.max(height, 1);
  return Math.min(sx, sy);
});

const previewPaperStyle = computed<CSSProperties>(() => {
  const width = previewTemplate.value?.paperWidth || 100;
  const height = previewTemplate.value?.paperHeight || 150;
  return {
    width: `${width * previewScale.value}px`,
    height: `${height * previewScale.value}px`,
  };
});

const ppx = (mm?: number) => `${(mm || 0) * previewScale.value}px`;

const previewTextStyle = (block: TemplateBlock): CSSProperties => ({
  position: 'absolute',
  left: ppx(block.x),
  top: ppx(block.y),
  width: ppx(block.width || 30),
  minHeight: ppx(block.height || 6),
  fontSize: ppx(block.fontSize || 3),
  lineHeight: ppx(block.fontSize || 3),
  fontWeight: block.bold ? '700' : '400',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
});

const previewQrcodeStyle = (block: TemplateBlock): CSSProperties => ({
  position: 'absolute',
  left: ppx(block.x),
  top: ppx(block.y),
  width: ppx(block.width || 20),
  height: ppx(block.height || 20),
  border: '1px dashed #111827',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '12px',
});

const previewBarcodeStyle = (block: TemplateBlock): CSSProperties => ({
  position: 'absolute',
  left: ppx(block.x),
  top: ppx(block.y),
  width: ppx(block.width || 36),
  height: ppx(block.height || 12),
  border: '1px dashed #111827',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '12px',
});

const previewLineStyle = (block: TemplateBlock): CSSProperties => {
  const x1 = block.x1 || 0;
  const y1 = block.y1 || 0;
  const x2 = block.x2 || x1;
  const y2 = block.y2 || y1;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  return {
    position: 'absolute',
    left: ppx(x1),
    top: ppx(y1),
    width: ppx(len),
    borderTop: '1px solid #111827',
    transformOrigin: '0 0',
    transform: `rotate(${angle}deg)`,
  };
};

const form = reactive({
  name: '',
  templateId: null as number | null,
  printerId: null as number | null,
  copies: 1,
  orientation: 0,
  gapType: 255,
  paperType: PaperType.LABEL,
  printSpeed: 255,
  printDarkness: 255,
  printMode: PrintMode.PRINT,
  isDefault: false,
  isEnabled: true,
  remark: '',
});

const rules: FormRules = {
  name: [{ required: true, message: '请输入配置名称', trigger: 'blur' }],
};

const columns: DataTableColumns<PrinterConfig> = [
  { title: 'ID', key: 'id', width: 70 },
  { title: '配置名称', key: 'name', minWidth: 180 },
  { title: '模板', key: 'template', minWidth: 120, render: (row) => row.template?.name || '-' },
  { title: '打印机', key: 'printer', minWidth: 120, render: (row) => row.printer?.name || '-' },
  { title: '份数', key: 'copies', width: 70 },
  { title: '默认', key: 'isDefault', width: 90, render: (row) => h(NSwitch, { value: row.isDefault, disabled: true }) },
  {
    title: '操作',
    key: 'actions',
    width: 280,
    render: (row) => h(NSpace, null, {
      default: () => [
        h(NButton, { text: true, type: 'info', onClick: () => handlePreview(row) }, { default: () => '预览模板' }),
        h(
          NButton,
          {
            text: true,
            type: 'success',
            loading: isTesting(row.id),
            disabled: isTesting(row.id),
            onClick: () => handleTestPrint(row),
          },
          { default: () => '测试打印' },
        ),
        h(NButton, { text: true, type: 'primary', onClick: () => handleEdit(row) }, { default: () => '编辑' }),
        h(NButton, { text: true, type: 'error', onClick: () => handleDelete(row) }, { default: () => '删除' }),
      ],
    }),
  },
];

const fetchList = async () => {
  loading.value = true;
  try {
    list.value = await getPrinterConfigs();
  } catch (error: any) {
    message.error(error.message || '获取列表失败');
  } finally {
    loading.value = false;
  }
};

const fetchOptions = async () => {
  try {
    const [templates, printers] = await Promise.all([getPrintTemplates(), getPrinters()]);
    templateOptions.value = templates.map((item) => ({ label: item.name, value: item.id }));
    printerOptions.value = printers.map((item) => ({ label: `${item.name} (${item.device})`, value: item.id }));
  } catch (error) {
    // 忽略，下方会在页面操作时提示
  }
};

const resetForm = () => {
  form.name = '';
  form.templateId = null;
  form.printerId = null;
  form.copies = 1;
  form.orientation = 0;
  form.gapType = 255;
  form.paperType = PaperType.LABEL;
  form.printSpeed = 255;
  form.printDarkness = 255;
  form.printMode = PrintMode.PRINT;
  form.isDefault = false;
  form.isEnabled = true;
  form.remark = '';
};

const handleCreate = () => {
  isEdit.value = false;
  currentId.value = undefined;
  resetForm();
  dialogVisible.value = true;
};

const handleEdit = (row: PrinterConfig) => {
  isEdit.value = true;
  currentId.value = row.id;
  form.name = row.name;
  form.templateId = row.templateId || null;
  form.printerId = row.printerId || null;
  form.copies = row.copies;
  form.orientation = row.orientation;
  form.gapType = row.gapType;
  form.paperType = row.paperType || PaperType.LABEL;
  form.printSpeed = row.printSpeed;
  form.printDarkness = row.printDarkness;
  form.printMode = row.printMode || PrintMode.PRINT;
  form.isDefault = row.isDefault;
  form.isEnabled = row.isEnabled;
  form.remark = row.remark || '';
  dialogVisible.value = true;
};

const handleDelete = (row: PrinterConfig) => {
  dialog.warning({
    title: '提示',
    content: `确定删除配置 "${row.name}" 吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await deletePrinterConfig(row.id);
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
      const payload: CreatePrinterConfigDto = {
        name: form.name,
        templateId: form.templateId || undefined,
        printerId: form.printerId || undefined,
        copies: form.copies,
        orientation: form.orientation,
        gapType: form.gapType,
        paperType: form.paperType,
        printSpeed: form.printSpeed,
        printDarkness: form.printDarkness,
        printMode: form.printMode,
        isDefault: form.isDefault,
        isEnabled: form.isEnabled,
        remark: form.remark || undefined,
      };

      if (isEdit.value && currentId.value) {
        await updatePrinterConfig(currentId.value, payload);
        message.success('更新成功');
      } else {
        await createPrinterConfig(payload);
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

const isTesting = (id: number) => testingIds.value.includes(id);

const handlePreview = async (row: PrinterConfig) => {
  if (!row.templateId) {
    message.warning('该配置未关联模板');
    return;
  }
  try {
    const template = await getPrintTemplate(row.templateId);
    previewTemplate.value = template;
    previewJson.value = JSON.stringify(template.content || {}, null, 2);
    previewVisible.value = true;
  } catch (error: any) {
    message.error(error.message || '加载模板失败');
  }
};

const renderTemplateBlocks = async (template: PrintTemplate, config: PrinterConfig) => {
  const api = await getDtpApi();
  const printer = config.printerId ? await getPrinterDetail(config.printerId) : undefined;

  // 使用 printer.device（打印机终端设备标识）来打开打印机
  await openPrinter(api, printer?.device);
  try {
    await startJob(api, {
      width: template.paperWidth || 100,
      height: template.paperHeight || 150,
      jobName: `测试打印-${config.name}`,
      orientation: (config.orientation as 0 | 90 | 180 | 270) || 0,
      gapType: config.gapType as any,
      printSpeed: config.printSpeed as any,
      printDarkness: config.printDarkness as any,
    });

    const blocks = Array.isArray((template.content as any)?.blocks) ? (template.content as any).blocks : [];
    if (!blocks.length) {
      await drawText(api, { text: '打印配置测试', x: 8, y: 8, fontSize: 4, bold: true, width: 80 });
      await drawText(api, { text: `配置: ${config.name}`, x: 8, y: 16, width: 80 });
      await drawText(api, { text: `模板: ${template.name}`, x: 8, y: 22, width: 80 });
      await drawText(api, { text: `时间: ${new Date().toLocaleString()}`, x: 8, y: 28, width: 88 });
      await drawQrCode(api, { value: `TEST:${config.id}`, x: 62, y: 8, width: 26, height: 26 });
      await drawLine(api, { x1: 8, y1: 38, x2: 90, y2: 38 });
      await drawText(api, { text: '提示: 模板 content.blocks 为空，已使用默认测试布局', x: 8, y: 42, width: 84, fontSize: 3 });
    } else {
      for (const item of blocks) {
        if (item.type === 'text') {
          await drawText(api, {
            text: String(item.text || ''),
            x: Number(item.x || 0),
            y: Number(item.y || 0),
            width: Number(item.width || 80),
            height: Number(item.height || 6),
            fontSize: Number(item.fontSize || 3),
            bold: Boolean(item.bold),
          });
          continue;
        }
        if (item.type === 'qrcode') {
          await drawQrCode(api, {
            value: String(item.value || item.text || ''),
            x: Number(item.x || 0),
            y: Number(item.y || 0),
            width: Number(item.width || 20),
            height: Number(item.height || 20),
          });
          continue;
        }
        if (item.type === 'barcode') {
          await drawBarcode(api, {
            value: String(item.value || item.text || ''),
            x: Number(item.x || 0),
            y: Number(item.y || 0),
            width: Number(item.width || 40),
            height: Number(item.height || 12),
            barcodeType: Number(item.barcodeType || 58),
            showReadText: item.showReadText !== false,
          });
          continue;
        }
        if (item.type === 'line') {
          await drawLine(api, {
            x1: Number(item.x1 || 0),
            y1: Number(item.y1 || 0),
            x2: Number(item.x2 || 0),
            y2: Number(item.y2 || 0),
          });
        }
      }
    }

    await commitJob(api, {
      copies: config.copies || 1,
      orientation: (config.orientation as 0 | 90 | 180 | 270) || 0,
      gapType: config.gapType as any,
      printSpeed: config.printSpeed as any,
      printDarkness: config.printDarkness as any,
    });
  } finally {
    await closePrinter(api);
  }
};

const handleTestPrint = async (row: PrinterConfig) => {
  if (isTesting(row.id)) return;
  if (!row.templateId) {
    message.warning('该配置未关联打印模板');
    return;
  }
  if (!row.printerId) {
    message.warning('该配置未关联打印机');
    return;
  }

  testingIds.value.push(row.id);
  try {
    const template = await getPrintTemplate(row.templateId);
    await renderTemplateBlocks(template, row);
    message.success('测试打印任务已发送');
  } catch (error) {
    message.error(getPrintErrorMessage(error));
  } finally {
    testingIds.value = testingIds.value.filter((id) => id !== row.id);
  }
};

onMounted(() => {
  fetchList();
  fetchOptions();
});
</script>
