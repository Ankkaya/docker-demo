import { commitJob, drawBarcode, drawLine, drawQrCode, drawText, startJob } from '@/services/print/dtpweb';
import type { DtpApi } from '@/services/print/dtpweb';
import type { PrintTemplate, PrinterConfig, TemplateBlock } from '@/types/print';
import type { ReceiptItem } from '@/types/purchase';

export interface ProductLabelPayload {
  productName: string;
  salePrice: number;
  size: string;
  barcode: string;
  skuCode: string;
  specs: Record<string, string>;
}

type RawSpecs =
  | Record<string, string>
  | Array<{ name?: string; value?: string | number | null }>
  | null
  | undefined;

const formatPrice = (value: number) => `¥${(value || 0).toFixed(2)}`;

const normalizeSpecs = (specs: RawSpecs): Record<string, string> => {
  if (Array.isArray(specs)) {
    return specs.reduce<Record<string, string>>((acc, item) => {
      if (item?.name) {
        acc[item.name] = item.value == null ? '' : String(item.value);
      }
      return acc;
    }, {});
  }

  if (specs && typeof specs === 'object') {
    return Object.entries(specs).reduce<Record<string, string>>((acc, [key, value]) => {
      acc[key] = value == null ? '' : String(value);
      return acc;
    }, {});
  }

  return {};
};

const formatSpecs = (specs: RawSpecs) => {
  const normalized = normalizeSpecs(specs);
  const entries = Object.entries(normalized);
  if (!entries.length) return '';
  return entries.map(([key, val]) => `${key}:${val}`).join(' ');
};

const resolveSize = (specs: RawSpecs) => {
  const normalized = normalizeSpecs(specs);
  const exactKeys = ['尺码', '尺寸', 'size', 'Size', 'SIZE'];
  for (const key of exactKeys) {
    if (normalized[key]) return String(normalized[key]);
  }
  const fuzzyEntry = Object.entries(normalized).find(([key]) => key.toLowerCase().includes('size'));
  if (fuzzyEntry?.[1]) return String(fuzzyEntry[1]);

  // 兼容历史错误数据：规格名录成“颜色”，值实际是 90/100/110 这类尺码
  const numericLike = Object.values(normalized).find((value) => /^\d{2,4}([./-]\d{1,2})?$/.test(String(value)));
  return numericLike ? String(numericLike) : '';
};

const buildPayload = (item: ReceiptItem): ProductLabelPayload => ({
  productName: item.productName || item.skuName || '',
  salePrice: Number(item.salePrice || 0),
  size: resolveSize(item.specs || {}),
  barcode: item.barcode || item.skuCode || '',
  skuCode: item.skuCode || '',
  specs: normalizeSpecs(item.specs as RawSpecs),
});

const resolveTemplateValue = (template: string | undefined, payload: ProductLabelPayload) => {
  const source = template || '';
  return source.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key: string) => {
    const valueMap: Record<string, string> = {
      productName: payload.productName,
      salePrice: formatPrice(payload.salePrice),
      price: formatPrice(payload.salePrice),
      size: payload.size,
      barcode: payload.barcode,
      skuCode: payload.skuCode,
      specs: formatSpecs(payload.specs),
    };
    return valueMap[key.trim()] ?? '';
  });
};

const renderBlock = async (api: DtpApi, block: TemplateBlock, payload: ProductLabelPayload) => {
  if (block.type === 'text') {
    await drawText(api, {
      text: resolveTemplateValue(block.text, payload),
      x: Number(block.x || 0),
      y: Number(block.y || 0),
      width: Number(block.width || 30),
      height: Number(block.height || 6),
      fontSize: Number(block.fontSize || 3),
      bold: Boolean(block.bold),
    });
    return;
  }

  if (block.type === 'barcode') {
    const value = resolveTemplateValue(block.value || '{{ barcode }}', payload) || payload.barcode;
    await drawBarcode(api, {
      value,
      x: Number(block.x || 0),
      y: Number(block.y || 0),
      width: Number(block.width || 36),
      height: Number(block.height || 12),
      barcodeType: Number(block.barcodeType || 58),
      showReadText: block.showReadText !== false,
    });
    return;
  }

  if (block.type === 'qrcode') {
    const value = resolveTemplateValue(block.value || '{{ barcode }}', payload) || payload.barcode;
    await drawQrCode(api, {
      value,
      x: Number(block.x || 0),
      y: Number(block.y || 0),
      width: Number(block.width || 20),
      height: Number(block.height || 20),
    });
    return;
  }

  if (block.type === 'line') {
    await drawLine(api, {
      x1: Number(block.x1 || 0),
      y1: Number(block.y1 || 0),
      x2: Number(block.x2 || 0),
      y2: Number(block.y2 || 0),
    });
  }
};

const renderFallback = async (api: DtpApi, payload: ProductLabelPayload) => {
  await drawText(api, { text: payload.productName, x: 4, y: 4, width: 42, fontSize: 4, bold: true });
  await drawText(api, { text: `价格 ${formatPrice(payload.salePrice)}`, x: 4, y: 11, width: 24, fontSize: 3.5, bold: true });
  await drawText(api, { text: `尺码 ${payload.size || '-'}`, x: 28, y: 11, width: 18, fontSize: 3 });
  await drawBarcode(api, { value: payload.barcode, x: 4, y: 17, width: 42, height: 12, barcodeType: 58, showReadText: true });
  await drawText(api, { text: payload.skuCode, x: 4, y: 31, width: 42, fontSize: 2.5 });
};

export const printProductLabelJob = async (
  api: DtpApi,
  template: PrintTemplate,
  config: PrinterConfig,
  item: ReceiptItem,
) => {
  const payload = buildPayload(item);
  const blocks = Array.isArray((template.content as { blocks?: TemplateBlock[] } | undefined)?.blocks)
    ? ((template.content as { blocks?: TemplateBlock[] }).blocks as TemplateBlock[])
    : [];

  await startJob(api, {
    jobName: `商品标签-${payload.skuCode || payload.productName}`,
    width: template.paperWidth || 50,
    height: template.paperHeight || 30,
    orientation: (config.orientation as 0 | 90 | 180 | 270) || 0,
    gapType: config.gapType as never,
    printSpeed: config.printSpeed as never,
    printDarkness: config.printDarkness as never,
  });

  if (blocks.length) {
    for (const block of blocks) {
      await renderBlock(api, block, payload);
    }
  } else {
    await renderFallback(api, payload);
  }

  await commitJob(api, {
    copies: config.copies || 1,
    orientation: (config.orientation as 0 | 90 | 180 | 270) || 0,
    gapType: config.gapType as never,
    printSpeed: config.printSpeed as never,
    printDarkness: config.printDarkness as never,
  });
};
