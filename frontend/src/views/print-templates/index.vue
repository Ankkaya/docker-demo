<template>
  <div class="p-4">
    <n-card>
      <template #header>
        <div class="flex justify-between items-center">
          <span>打印模板</span>
          <n-button type="primary" @click="handleCreate">新增模板</n-button>
        </div>
      </template>

      <n-data-table :columns="columns" :data="list" :loading="loading" striped />
    </n-card>

    <n-modal v-model:show="dialogVisible" :title="isEdit ? '编辑打印模板' : '新增打印模板'" preset="card"
      style="width: 1200px; max-width: 96vw">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <n-form ref="formRef" :model="form" :rules="rules" label-width="100">
            <n-grid :cols="2" :x-gap="12">
              <n-form-item-gi span="2" label="模板名称" path="name"><n-input v-model:value="form.name" /></n-form-item-gi>
              <n-form-item-gi label="业务类型" path="bizType">
                <n-select v-model:value="form.bizType" :options="bizTypeOptions" />
              </n-form-item-gi>
              <n-form-item-gi label="排序" path="sort"><n-input-number v-model:value="form.sort" :min="0"
                  style="width: 100%" /></n-form-item-gi>
              <n-form-item-gi label="纸张宽度" path="paperWidth">
                <n-input-number v-model:value="form.paperWidth" :min="1" :max="50" style="width: 100%">
                  <template #suffix>mm</template>
                </n-input-number>
              </n-form-item-gi>
              <n-form-item-gi label="纸张高度" path="paperHeight">
                <n-input-number v-model:value="form.paperHeight" :min="1" :max="300" style="width: 100%">
                  <template #suffix>mm</template>
                </n-input-number>
              </n-form-item-gi>
            </n-grid>
            <n-form-item label="描述" path="description"><n-input v-model:value="form.description" /></n-form-item>
            <n-form-item label="启用"><n-switch v-model:value="form.isEnabled" /></n-form-item>
          </n-form>

          <n-alert v-if="form.bizType === BizType.PRODUCT_LABEL" type="info" class="mb-3" :show-icon="false">
            <span v-pre>
              商品标签模板支持占位符：{{ productName }}、{{ price }}、{{ salePrice }}、{{ size }}、{{ barcode }}、{{ skuCode }}、{{ specs }}。
              文本块填写到“文本”，条码/二维码填写到“值”。
            </span>
          </n-alert>

          <n-divider>可视化模板块</n-divider>
          <n-space class="mb-3" align="center" justify="space-between">
            <n-space>
              <n-button size="small" @click="addBlock('text')">添加文本</n-button>
              <n-button size="small" @click="addBlock('qrcode')">添加二维码</n-button>
              <n-button size="small" @click="addBlock('barcode')">添加条码</n-button>
              <n-button size="small" @click="addBlock('line')">添加直线</n-button>
              <n-button size="small" :disabled="!selectedBlockId" @click="duplicateSelectedBlock">复制选中</n-button>
              <n-button size="small" type="error" ghost :disabled="!selectedBlockId"
                @click="removeSelectedBlock">删除选中</n-button>
            </n-space>
            <n-space size="small" align="center">
              <n-text depth="3">共 {{ blocks.length }} 个块</n-text>
              <n-text depth="3">已选中：{{ selectedBlockIndex >= 0 ? `#${selectedBlockIndex + 1}` : '无' }}</n-text>
            </n-space>
          </n-space>

          <div class="max-h-[420px] overflow-auto pr-2">
            <n-empty v-if="!blocks.length" description="暂无块，点击上方按钮添加" />
            <n-card v-for="(block, idx) in blocks" :key="block.id" size="small" class="mb-2 cursor-pointer"
              :class="selectedBlockId === block.id ? 'ring-2 ring-blue-500' : ''" @click="selectBlock(block.id)">
              <template #header>
                <div class="flex justify-between items-center">
                  <n-space size="small" align="center">
                    <n-tag size="small">{{ idx + 1 }}</n-tag>
                    <n-tag size="small" type="info">{{ block.type }}</n-tag>
                  </n-space>
                  <n-space size="small">
                    <n-button text size="tiny" @click="moveBlockUp(idx)" :disabled="idx === 0">上移</n-button>
                    <n-button text size="tiny" @click="moveBlockDown(idx)"
                      :disabled="idx === blocks.length - 1">下移</n-button>
                    <n-button text size="tiny" type="error" @click="removeBlock(idx)">删除</n-button>
                  </n-space>
                </div>
              </template>

              <n-grid :cols="2" :x-gap="10">
                <n-form-item-gi label="X (mm)">
                  <n-input-number v-model:value="block.x" :min="0" :max="form.paperWidth" :precision="2"
                    style="width: 100%">
                    <template #suffix>mm</template>
                  </n-input-number>
                </n-form-item-gi>
                <n-form-item-gi label="Y (mm)">
                  <n-input-number v-model:value="block.y" :min="0" :max="form.paperHeight" :precision="2"
                    style="width: 100%">
                    <template #suffix>mm</template>
                  </n-input-number>
                </n-form-item-gi>
              </n-grid>

              <template v-if="block.type === 'text'">
                <n-form-item label="文本"><n-input v-model:value="block.text" /></n-form-item>
                <n-grid :cols="3" :x-gap="10">
                  <n-form-item-gi label="宽 (mm)">
                    <n-input-number v-model:value="block.width" :min="1" :precision="2" style="width: 100%">
                      <template #suffix>mm</template>
                    </n-input-number>
                  </n-form-item-gi>
                  <n-form-item-gi label="高 (mm)">
                    <n-input-number v-model:value="block.height" :min="1" :precision="2" style="width: 100%">
                      <template #suffix>mm</template>
                    </n-input-number>
                  </n-form-item-gi>
                  <n-form-item-gi label="字号 (mm)">
                    <n-input-number v-model:value="block.fontSize" :min="0.5" :step="0.5" :precision="1"
                      style="width: 100%">
                      <template #suffix>mm</template>
                    </n-input-number>
                  </n-form-item-gi>
                </n-grid>
                <n-form-item label="粗体"><n-switch v-model:value="block.bold" /></n-form-item>
              </template>

              <template v-else-if="block.type === 'qrcode'">
                <n-form-item label="值"><n-input v-model:value="block.value" /></n-form-item>
                <n-grid :cols="2" :x-gap="10">
                  <n-form-item-gi label="宽 (mm)">
                    <n-input-number v-model:value="block.width" :min="1" :precision="2" style="width: 100%">
                      <template #suffix>mm</template>
                    </n-input-number>
                  </n-form-item-gi>
                  <n-form-item-gi label="高 (mm)">
                    <n-input-number v-model:value="block.height" :min="1" :precision="2" style="width: 100%">
                      <template #suffix>mm</template>
                    </n-input-number>
                  </n-form-item-gi>
                </n-grid>
              </template>
              <template v-else-if="block.type === 'barcode'">
                <n-form-item label="值"><n-input v-model:value="block.value" /></n-form-item>
                <n-grid :cols="2" :x-gap="10">
                  <n-form-item-gi label="宽 (mm)">
                    <n-input-number v-model:value="block.width" :min="1" :precision="2" style="width: 100%">
                      <template #suffix>mm</template>
                    </n-input-number>
                  </n-form-item-gi>
                  <n-form-item-gi label="高 (mm)">
                    <n-input-number v-model:value="block.height" :min="1" :precision="2" style="width: 100%">
                      <template #suffix>mm</template>
                    </n-input-number>
                  </n-form-item-gi>
                </n-grid>
                <n-grid :cols="2" :x-gap="10">
                  <n-form-item-gi label="条码类型">
                    <n-select v-model:value="block.barcodeType" :options="barcodeTypeOptions" style="width: 100%" />
                  </n-form-item-gi>
                  <n-form-item-gi label="显示文字"><n-switch v-model:value="block.showReadText" /></n-form-item-gi>
                </n-grid>
              </template>

              <template v-else>
                <n-grid :cols="2" :x-gap="10">
                  <n-form-item-gi label="X1 (mm)">
                    <n-input-number v-model:value="block.x1" :min="0" :max="form.paperWidth" :precision="2"
                      style="width: 100%">
                      <template #suffix>mm</template>
                    </n-input-number>
                  </n-form-item-gi>
                  <n-form-item-gi label="Y1 (mm)">
                    <n-input-number v-model:value="block.y1" :min="0" :max="form.paperHeight" :precision="2"
                      style="width: 100%">
                      <template #suffix>mm</template>
                    </n-input-number>
                  </n-form-item-gi>
                  <n-form-item-gi label="X2 (mm)">
                    <n-input-number v-model:value="block.x2" :min="0" :max="form.paperWidth" :precision="2"
                      style="width: 100%">
                      <template #suffix>mm</template>
                    </n-input-number>
                  </n-form-item-gi>
                  <n-form-item-gi label="Y2 (mm)">
                    <n-input-number v-model:value="block.y2" :min="0" :max="form.paperHeight" :precision="2"
                      style="width: 100%">
                      <template #suffix>mm</template>
                    </n-input-number>
                  </n-form-item-gi>
                </n-grid>
              </template>
            </n-card>
          </div>
        </div>

        <div>
          <n-divider>模拟画布预览</n-divider>
          <n-space class="mb-2" align="center" justify="space-between">
            <n-space size="small" align="center">
              <n-switch v-model:value="showGrid" />
              <n-text depth="3">网格</n-text>
              <n-switch v-model:value="snapToGrid" />
              <n-text depth="3">吸附</n-text>
              <n-text depth="3">间距</n-text>
              <n-input-number v-model:value="gridSizeMm" :min="1" :max="20" :step="1" :precision="0"
                style="width: 110px">
                <template #suffix>mm</template>
              </n-input-number>
            </n-space>
            <n-space size="small" align="center">
              <n-text depth="3">缩放</n-text>
              <n-slider v-model:value="zoomPercent" :min="60" :max="180" :step="10" style="width: 120px" />
              <n-text depth="3" style="min-width: 45px">{{ zoomPercent }}%</n-text>
            </n-space>
          </n-space>
          <div class="border rounded bg-gray-100 p-3 overflow-auto">
            <div class="canvas-wrapper">
              <!-- 左上角零点标记 -->
              <div class="ruler-zero">0</div>
              <!-- 水平刻度尺 -->
              <div class="ruler ruler-horizontal" :style="{ width: `${paperWidthPx}px` }">
                <div v-for="tick in horizontalTicks" :key="tick.key" class="ruler-tick" :class="tick.class"
                  :style="{ left: `${tick.pos}px` }">
                  <span v-if="tick.showLabel" class="ruler-label ruler-label-horizontal">{{ tick.label }}</span>
                </div>
              </div>
              <!-- 垂直刻度尺 -->
              <div class="ruler ruler-vertical" :style="{ height: `${paperHeightPx}px` }">
                <div v-for="tick in verticalTicks" :key="tick.key" class="ruler-tick" :class="tick.class"
                  :style="{ top: `${tick.pos}px` }">
                  <span v-if="tick.showLabel" class="ruler-label ruler-label-vertical">{{ tick.label }}</span>
                </div>
              </div>
              <!-- 画布 -->
              <div ref="canvasRef" class="canvas-area relative bg-white shadow" :style="paperStyle"
                @mousedown.self="clearSelection">
                <template v-for="block in blocks" :key="block.id">
                  <div v-if="block.type === 'text'" :style="textBlockStyle(block, selectedBlockId === block.id)"
                    class="cursor-move block-item" @mousedown="startDrag($event, block)"
                    @click.stop="selectBlock(block.id)">
                    {{ block.text || '文本' }}
                  </div>

                  <div v-else-if="block.type === 'qrcode'"
                    :style="qrcodeBlockStyle(block, selectedBlockId === block.id)" class="cursor-move block-item"
                    @mousedown="startDrag($event, block)" @click.stop="selectBlock(block.id)">
                    QR
                  </div>
                  <div v-else-if="block.type === 'barcode'"
                    :style="barcodeBlockStyle(block, selectedBlockId === block.id)" class="cursor-move block-item"
                    @mousedown="startDrag($event, block)" @click.stop="selectBlock(block.id)">
                    BAR
                  </div>

                  <div v-else :style="lineBlockStyle(block, selectedBlockId === block.id)"
                    class="cursor-move block-item" @mousedown="startDrag($event, block)"
                    @click.stop="selectBlock(block.id)"></div>
                </template>
              </div>
            </div>
          </div>
          <n-alert type="info" class="mt-3" :show-icon="false">
            说明：画布仅用于布局预览，实际打印效果以打印机和 dtpweb 渲染为准。方向键移动选中块，Shift=1mm，Alt=0.1mm，Delete 删除，Ctrl/Cmd + D 复制。
          </n-alert>
        </div>
      </div>

      <template #footer>
        <n-space justify="end">
          <n-button @click="dialogVisible = false">取消</n-button>
          <n-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import type { CSSProperties } from 'vue';
import type { DataTableColumns, FormInst, FormRules } from 'naive-ui';
import { NAlert, NButton, NSpace, NSwitch, useDialog, useMessage } from 'naive-ui';
import { createPrintTemplate, deletePrintTemplate, getPrintTemplates, updatePrintTemplate } from '@/api/print-template';
import type { CreatePrintTemplateDto, PrintTemplate, TemplateBlock, TemplateBlockType } from '@/types/print';
import { bizTypeOptions, BizType } from '@/types/print';

const message = useMessage();
const dialog = useDialog();

const loading = ref(false);
const submitLoading = ref(false);
const dialogVisible = ref(false);
const isEdit = ref(false);
const currentId = ref<number>();
const formRef = ref<FormInst>();
const list = ref<PrintTemplate[]>([]);
const blocks = ref<TemplateBlock[]>([]);
const canvasRef = ref<HTMLElement | null>(null);
const selectedBlockId = ref<string>('');
const showGrid = ref(true);
const snapToGrid = ref(true);
const gridSizeMm = ref(5);
const zoomPercent = ref(100);
const dragState = ref<{
  blockId: string;
  startX: number;
  startY: number;
  origin: TemplateBlock;
} | null>(null);

const form = reactive({
  name: '',
  bizType: BizType.ORDER,
  paperWidth: 50,
  paperHeight: 50,
  description: '',
  sort: 0,
  isEnabled: true,
});

const rules: FormRules = {
  name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
  bizType: [{ required: true, message: '请选择业务类型', trigger: 'change' }],
};

const barcodeTypeOptions = [
  { label: 'CODE128 (58)', value: 58 },
  { label: 'CODE39 (39)', value: 39 },
  { label: 'EAN13 (13)', value: 13 },
  { label: 'EAN8 (8)', value: 8 },
  { label: 'UPC-A (12)', value: 12 },
  { label: 'ITF (25)', value: 25 },
];

const columns: DataTableColumns<PrintTemplate> = [
  { title: 'ID', key: 'id', width: 80 },
  { title: '模板名称', key: 'name', minWidth: 180 },
  {
    title: '业务类型', key: 'bizType', width: 130, render: (row) => {
      const option = bizTypeOptions.find(o => o.value === row.bizType);
      return option?.label || row.bizType;
    }
  },
  { title: '纸张', key: 'paperSize', width: 130, render: (row) => `${row.paperWidth} x ${row.paperHeight} mm` },
  { title: '启用', key: 'isEnabled', width: 90, render: (row) => h(NSwitch, { value: row.isEnabled, disabled: true }) },
  {
    title: '操作',
    key: 'actions',
    width: 150,
    render: (row) => h(NSpace, null, {
      default: () => [
        h(NButton, { text: true, type: 'primary', onClick: () => handleEdit(row) }, { default: () => '编辑' }),
        h(NButton, { text: true, type: 'error', onClick: () => handleDelete(row) }, { default: () => '删除' }),
      ],
    }),
  },
];

// 计算缩放比例，适应预览区域
const scale = computed(() => {
  const maxW = 420;
  const maxH = 520;
  const sx = maxW / Math.max(form.paperWidth || 50, 1);
  const sy = maxH / Math.max(form.paperHeight || 50, 1);
  return Math.min(sx, sy) * (zoomPercent.value / 100);
});

// 纸张像素尺寸
const paperWidthPx = computed(() => (form.paperWidth || 50) * scale.value);
const paperHeightPx = computed(() => (form.paperHeight || 50) * scale.value);

// 生成刻度线数据
interface TickData {
  key: string;
  pos: number;
  class: string;
  showLabel: boolean;
  label: string;
}

const generateTicks = (size: number, isHorizontal: boolean): TickData[] => {
  const ticks: TickData[] = [];
  const gridSize = Math.max(1, gridSizeMm.value);
  const maxMm = Math.ceil(size);

  // 主刻度间隔（根据网格间距决定）
  const majorInterval = gridSize;

  for (let mm = 0; mm <= maxMm; mm++) {
    const pos = mm * scale.value;
    if (pos > size * scale.value) break;

    const isMajor = mm % majorInterval === 0;
    const isMedium = mm % (majorInterval / 2 === 0 ? 1 : majorInterval / 2) === 0 && !isMajor;

    let tickClass = 'ruler-tick-minor';
    if (isMajor) tickClass = 'ruler-tick-major';
    else if (isMedium) tickClass = 'ruler-tick-medium';

    // 只在主刻度显示标签
    const showLabel = isMajor && mm > 0;

    ticks.push({
      key: `${isHorizontal ? 'h' : 'v'}-${mm}`,
      pos,
      class: tickClass,
      showLabel,
      label: String(mm),
    });
  }

  return ticks;
};

const horizontalTicks = computed(() => generateTicks(form.paperWidth || 50, true));
const verticalTicks = computed(() => generateTicks(form.paperHeight || 50, false));

const paperStyle = computed<CSSProperties>(() => {
  const gridPx = Math.max(1, gridSizeMm.value * scale.value);
  return {
    width: `${paperWidthPx.value}px`,
    height: `${paperHeightPx.value}px`,
    backgroundImage: showGrid.value
      ? `linear-gradient(to right, rgba(148,163,184,0.25) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.25) 1px, transparent 1px)`
      : undefined,
    backgroundSize: showGrid.value ? `${gridPx}px ${gridPx}px` : undefined,
    backgroundPosition: showGrid.value ? `${gridPx}px ${gridPx}px` : undefined,
    position: 'relative' as const,
    overflow: 'hidden' as const,
  };
});

const px = (mm?: number) => `${(mm || 0) * scale.value}px`;
const selectedBlockIndex = computed(() => (selectedBlockId.value ? findBlockIndex(selectedBlockId.value) : -1));

const selectedOutline = (selected: boolean) =>
  selected
    ? {
      outline: '2px solid #2563eb',
      outlineOffset: '1px',
    }
    : {
      outline: '1px dashed #9ca3af',
      outlineOffset: '0px',
    };

const textBlockStyle = (block: TemplateBlock, selected = false): CSSProperties => {
  const width = block.width || 30;
  const height = block.height || 6;
  return {
    position: 'absolute',
    left: px(block.x),
    top: px(block.y),
    width: px(width),
    minHeight: px(height),
    fontSize: px(block.fontSize || 3),
    lineHeight: px(block.fontSize || 3),
    fontWeight: block.bold ? '700' : '400',
    color: '#000000',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    boxSizing: 'border-box',
    ...selectedOutline(selected),
  };
};

const qrcodeBlockStyle = (block: TemplateBlock, selected = false): CSSProperties => {
  const width = block.width || 20;
  const height = block.height || 20;
  return {
    position: 'absolute',
    left: px(block.x),
    top: px(block.y),
    width: px(width),
    height: px(height),
    border: '1px dashed #111827',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    color: '#111827',
    boxSizing: 'border-box',
    ...selectedOutline(selected),
  };
};

const barcodeBlockStyle = (block: TemplateBlock, selected = false): CSSProperties => {
  const width = block.width || 36;
  const height = block.height || 12;
  return {
    position: 'absolute',
    left: px(block.x),
    top: px(block.y),
    width: px(width),
    height: px(height),
    border: '1px dashed #111827',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    color: '#111827',
    boxSizing: 'border-box',
    ...selectedOutline(selected),
  };
};

const lineBlockStyle = (block: TemplateBlock, selected = false): CSSProperties => {
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
    left: px(x1),
    top: px(y1),
    width: px(len),
    borderTop: '1px solid #111827',
    transformOrigin: '0 0',
    transform: `rotate(${angle}deg)`,
    pointerEvents: 'auto' as const,
    ...selectedOutline(selected),
  };
};

const createDefaultBlock = (type: TemplateBlockType): TemplateBlock => {
  const id = `b_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  if (type === 'text') {
    return { id, type, x: 5, y: 5, width: 30, height: 6, text: '示例文本', fontSize: 3, bold: false };
  }
  if (type === 'qrcode') {
    return { id, type, x: 30, y: 5, width: 15, height: 15, value: 'https://example.com' };
  }
  if (type === 'barcode') {
    return { id, type, x: 5, y: 25, width: 35, height: 10, value: '1234567890', barcodeType: 58, showReadText: true };
  }
  return { id, type, x: 5, y: 40, x1: 5, y1: 40, x2: 45, y2: 40 };
};

const findBlockIndex = (id: string) => blocks.value.findIndex((item) => item.id === id);

const selectBlock = (id: string) => {
  selectedBlockId.value = id;
};

const clearSelection = () => {
  selectedBlockId.value = '';
};

const snapMm = (value: number) => {
  if (!snapToGrid.value) return Number(value.toFixed(2));
  const unit = Math.max(0.1, Number(gridSizeMm.value || 1));
  return Number((Math.round(value / unit) * unit).toFixed(2));
};

const cloneBlock = (source: TemplateBlock): TemplateBlock => {
  const id = `b_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  return {
    ...JSON.parse(JSON.stringify(source)),
    id,
  };
};

const duplicateSelectedBlock = () => {
  if (!selectedBlockId.value) return;
  const idx = findBlockIndex(selectedBlockId.value);
  if (idx < 0) return;
  const block = cloneBlock(blocks.value[idx]);
  const offset = 2;
  if (block.type === 'line') {
    block.x1 = snapMm(Math.min(form.paperWidth, Math.max(0, Number(block.x1 || 0) + offset)));
    block.y1 = snapMm(Math.min(form.paperHeight, Math.max(0, Number(block.y1 || 0) + offset)));
    block.x2 = snapMm(Math.min(form.paperWidth, Math.max(0, Number(block.x2 || 0) + offset)));
    block.y2 = snapMm(Math.min(form.paperHeight, Math.max(0, Number(block.y2 || 0) + offset)));
    block.x = block.x1;
    block.y = block.y1;
  } else {
    const w = block.width || 30;
    const h = block.height || 6;
    block.x = snapMm(Math.min(form.paperWidth - w, Math.max(0, Number(block.x || 0) + offset)));
    block.y = snapMm(Math.min(form.paperHeight - h, Math.max(0, Number(block.y || 0) + offset)));
  }
  blocks.value.splice(idx + 1, 0, block);
  selectedBlockId.value = block.id;
};

const removeSelectedBlock = () => {
  if (!selectedBlockId.value) return;
  const idx = findBlockIndex(selectedBlockId.value);
  if (idx < 0) return;
  removeBlock(idx);
};

const moveSelectedBlock = (stepX: number, stepY: number) => {
  if (!selectedBlockId.value) return;
  const idx = findBlockIndex(selectedBlockId.value);
  if (idx < 0) return;
  const target = blocks.value[idx];

  if (target.type === 'line') {
    const newX1 = Number(target.x1 || 0) + stepX;
    const newY1 = Number(target.y1 || 0) + stepY;
    const newX2 = Number(target.x2 || 0) + stepX;
    const newY2 = Number(target.y2 || 0) + stepY;

    target.x1 = snapMm(Math.max(0, Math.min(form.paperWidth, newX1)));
    target.y1 = snapMm(Math.max(0, Math.min(form.paperHeight, newY1)));
    target.x2 = snapMm(Math.max(0, Math.min(form.paperWidth, newX2)));
    target.y2 = snapMm(Math.max(0, Math.min(form.paperHeight, newY2)));
    target.x = target.x1;
    target.y = target.y1;
  } else {
    const w = target.width || 30;
    const h = target.height || 6;
    const newX = Number(target.x || 0) + stepX;
    const newY = Number(target.y || 0) + stepY;

    target.x = snapMm(Math.max(0, Math.min(form.paperWidth - w, newX)));
    target.y = snapMm(Math.max(0, Math.min(form.paperHeight - h, newY)));
  }
};

const onGlobalKeydown = (event: KeyboardEvent) => {
  if (!dialogVisible.value) return;
  const target = event.target as HTMLElement | null;
  if (target) {
    const tag = target.tagName.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || target.isContentEditable) return;
  }

  // 处理删除
  if (selectedBlockId.value && (event.key === 'Delete' || event.key === 'Backspace')) {
    event.preventDefault();
    removeSelectedBlock();
    return;
  }

  // 处理复制
  if (selectedBlockId.value && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'd') {
    event.preventDefault();
    duplicateSelectedBlock();
    return;
  }

  if (!selectedBlockId.value) return;

  // 处理方向键 - 使用 key 而不是 code
  const unit = event.shiftKey ? 1 : event.altKey ? 0.1 : 0.5;

  switch (event.key) {
    case 'ArrowUp':
      event.preventDefault();
      moveSelectedBlock(0, -unit);
      return;
    case 'ArrowDown':
      event.preventDefault();
      moveSelectedBlock(0, unit);
      return;
    case 'ArrowLeft':
      event.preventDefault();
      moveSelectedBlock(-unit, 0);
      return;
    case 'ArrowRight':
      event.preventDefault();
      moveSelectedBlock(unit, 0);
      return;
  }
};

const startDrag = (event: MouseEvent, block: TemplateBlock) => {
  event.preventDefault();
  event.stopPropagation();
  selectedBlockId.value = block.id;
  dragState.value = {
    blockId: block.id,
    startX: event.clientX,
    startY: event.clientY,
    origin: { ...block },
  };
  window.addEventListener('mousemove', onDragging);
  window.addEventListener('mouseup', stopDrag);
};

const onDragging = (event: MouseEvent) => {
  if (!dragState.value) return;
  const container = canvasRef.value;
  if (!container) return;

  const idx = findBlockIndex(dragState.value.blockId);
  if (idx < 0) return;
  const target = blocks.value[idx];
  const dxMm = (event.clientX - dragState.value.startX) / scale.value;
  const dyMm = (event.clientY - dragState.value.startY) / scale.value;

  if (target.type === 'line') {
    const newX1 = Number(dragState.value.origin.x1 || 0) + dxMm;
    const newY1 = Number(dragState.value.origin.y1 || 0) + dyMm;
    const newX2 = Number(dragState.value.origin.x2 || 0) + dxMm;
    const newY2 = Number(dragState.value.origin.y2 || 0) + dyMm;

    target.x1 = snapMm(Math.max(0, Math.min(form.paperWidth, newX1)));
    target.y1 = snapMm(Math.max(0, Math.min(form.paperHeight, newY1)));
    target.x2 = snapMm(Math.max(0, Math.min(form.paperWidth, newX2)));
    target.y2 = snapMm(Math.max(0, Math.min(form.paperHeight, newY2)));
    target.x = target.x1;
    target.y = target.y1;
    return;
  }

  const w = target.width || 30;
  const h = target.height || 6;
  const nextX = Number(dragState.value.origin.x || 0) + dxMm;
  const nextY = Number(dragState.value.origin.y || 0) + dyMm;

  target.x = snapMm(Math.max(0, Math.min(form.paperWidth - w, nextX)));
  target.y = snapMm(Math.max(0, Math.min(form.paperHeight - h, nextY)));
};

const stopDrag = () => {
  dragState.value = null;
  window.removeEventListener('mousemove', onDragging);
  window.removeEventListener('mouseup', stopDrag);
};

const addBlock = (type: TemplateBlockType) => {
  const block = createDefaultBlock(type);
  blocks.value.push(block);
  selectedBlockId.value = block.id;
};

const removeBlock = (idx: number) => {
  const removed = blocks.value[idx];
  blocks.value.splice(idx, 1);
  if (removed && removed.id === selectedBlockId.value) {
    selectedBlockId.value = blocks.value[Math.max(0, idx - 1)]?.id || '';
  }
};

const moveBlockUp = (idx: number) => {
  if (idx <= 0) return;
  const arr = blocks.value;
  [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
};

const moveBlockDown = (idx: number) => {
  if (idx >= blocks.value.length - 1) return;
  const arr = blocks.value;
  [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
};

const fetchList = async () => {
  loading.value = true;
  try {
    list.value = await getPrintTemplates();
  } catch (error: any) {
    message.error(error.message || '获取列表失败');
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  form.name = '';
  form.bizType = BizType.ORDER;
  form.paperWidth = 50;
  form.paperHeight = 50;
  form.description = '';
  form.sort = 0;
  form.isEnabled = true;
  blocks.value = [];
  selectedBlockId.value = '';
  showGrid.value = true;
  snapToGrid.value = true;
  gridSizeMm.value = 5;
  zoomPercent.value = 100;
};

const handleCreate = () => {
  isEdit.value = false;
  currentId.value = undefined;
  resetForm();
  dialogVisible.value = true;
};

const handleEdit = (row: PrintTemplate) => {
  isEdit.value = true;
  currentId.value = row.id;
  form.name = row.name;
  form.bizType = row.bizType as BizType;
  form.paperWidth = row.paperWidth;
  form.paperHeight = row.paperHeight;
  form.description = row.description || '';
  form.sort = row.sort;
  form.isEnabled = row.isEnabled;

  const rawBlocks = Array.isArray((row.content as any)?.blocks) ? (row.content as any).blocks : [];
  blocks.value = rawBlocks.map((item: any, idx: number) => ({
    id: item.id || `b_${row.id}_${idx}`,
    ...item,
  }));
  selectedBlockId.value = blocks.value[0]?.id || '';
  dialogVisible.value = true;
};

const handleDelete = (row: PrintTemplate) => {
  dialog.warning({
    title: '提示',
    content: `确定删除模板 "${row.name}" 吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await deletePrintTemplate(row.id);
        message.success('删除成功');
        fetchList();
      } catch (error: any) {
        message.error(error.message || '删除失败');
      }
    },
  });
};

const normalizeBlocks = (source: TemplateBlock[]) => {
  return source.map((item) => {
    if (item.type === 'line') {
      return {
        type: 'line',
        x1: Number(item.x1 || item.x || 0),
        y1: Number(item.y1 || item.y || 0),
        x2: Number(item.x2 || 0),
        y2: Number(item.y2 || 0),
      };
    }
    if (item.type === 'qrcode') {
      return {
        type: 'qrcode',
        x: Number(item.x || 0),
        y: Number(item.y || 0),
        width: Number(item.width || 20),
        height: Number(item.height || 20),
        value: String(item.value || ''),
      };
    }
    if (item.type === 'barcode') {
      return {
        type: 'barcode',
        x: Number(item.x || 0),
        y: Number(item.y || 0),
        width: Number(item.width || 40),
        height: Number(item.height || 12),
        value: String(item.value || ''),
        barcodeType: Number(item.barcodeType || 58),
        showReadText: item.showReadText !== false,
      };
    }
    return {
      type: 'text',
      x: Number(item.x || 0),
      y: Number(item.y || 0),
      width: Number(item.width || 40),
      height: Number(item.height || 6),
      text: String(item.text || ''),
      fontSize: Number(item.fontSize || 3),
      bold: Boolean(item.bold),
    };
  });
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (errors) => {
    if (errors) return;

    submitLoading.value = true;
    try {
      const content = {
        version: 1,
        blocks: normalizeBlocks(blocks.value),
      };

      const payload: CreatePrintTemplateDto = {
        name: form.name,
        bizType: form.bizType,
        paperWidth: form.paperWidth,
        paperHeight: form.paperHeight,
        content,
        description: form.description || undefined,
        sort: form.sort,
        isEnabled: form.isEnabled,
      };

      if (isEdit.value && currentId.value) {
        await updatePrintTemplate(currentId.value, payload);
        message.success('更新成功');
      } else {
        await createPrintTemplate(payload);
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

// 监听间距变化，同步调整网格大小（但不改变已有模板块尺寸）
watch(gridSizeMm, (newVal, oldVal) => {
  if (!newVal || !oldVal || newVal === oldVal) return;
  // 只调整网格显示，不自动调整模板块尺寸
  // 模板块尺寸由用户手动调整
});

onMounted(() => {
  fetchList();
  window.addEventListener('keydown', onGlobalKeydown);
});

onBeforeUnmount(() => {
  stopDrag();
  window.removeEventListener('keydown', onGlobalKeydown);
});
</script>

<style scoped>
.canvas-wrapper {
  --ruler-size: 28px;
  display: grid;
  grid-template-columns: var(--ruler-size) max-content;
  grid-template-rows: var(--ruler-size) max-content;
  width: max-content;
}

/* 零点标记 */
.ruler-zero {
  grid-column: 1;
  grid-row: 1;
  width: var(--ruler-size);
  height: var(--ruler-size);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  color: #666;
  background: #f8f9fa;
  z-index: 20;
}

/* 标尺基础样式 */
.ruler {
  position: relative;
  background: #f8f9fa;
}

/* 水平标尺 */
.ruler-horizontal {
  grid-column: 2;
  grid-row: 1;
  height: var(--ruler-size);
  border-bottom: 1px solid #d0d0d0;
}

/* 垂直标尺 */
.ruler-vertical {
  grid-column: 1;
  grid-row: 2;
  width: var(--ruler-size);
  border-right: 1px solid #d0d0d0;
}

/* 刻度线基础 */
.ruler-tick {
  position: absolute;
  pointer-events: none;
}

/* 水平刻度线贴着 X 轴显示 */
.ruler-horizontal .ruler-tick {
  bottom: 0;
  border-left: 1px solid;
}

.ruler-horizontal .ruler-tick-major {
  height: 10px;
  border-color: #555;
}

.ruler-horizontal .ruler-tick-medium {
  height: 6px;
  border-color: #888;
}

.ruler-horizontal .ruler-tick-minor {
  height: 4px;
  border-color: #bbb;
}

/* 垂直刻度线 */
.ruler-vertical .ruler-tick {
  right: 0;
  border-top: 1px solid;
}

.ruler-vertical .ruler-tick-major {
  width: 10px;
  border-color: #555;
}

.ruler-vertical .ruler-tick-medium {
  width: 6px;
  border-color: #888;
}

.ruler-vertical .ruler-tick-minor {
  width: 4px;
  border-color: #bbb;
}

/* 刻度标签基础 */
.ruler-label {
  position: absolute;
  font-size: 9px;
  font-weight: 500;
  color: #555;
  line-height: 1;
  user-select: none;
  white-space: nowrap;
}

/* 水平标签：显示在刻度线上方（数字在上，刻度在下） */
.ruler-label-horizontal {
  left: 50%;
  bottom: 12px;
  transform: translateX(-50%);
}

/* 垂直标签：显示在刻度线左侧，垂直居中 */
.ruler-label-vertical {
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
}

/* 画布 */
.canvas-area {
  grid-column: 2;
  grid-row: 2;
  position: relative;
  box-shadow: inset -1px -1px 0 0 #d0d0d0;
}

.block-item {
  user-select: none;
}
</style>
