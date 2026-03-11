export interface PrintTemplate {
  id: number;
  name: string;
  code?: string;
  bizType: string;
  paperWidth: number;
  paperHeight: number;
  content?: Record<string, any>;
  description?: string;
  sort: number;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TemplateBlockType = 'text' | 'qrcode' | 'barcode' | 'line';

export interface TemplateBlock {
  id: string;
  type: TemplateBlockType;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  text?: string;
  value?: string;
  barcodeType?: number;
  showReadText?: boolean;
  fontSize?: number;
  bold?: boolean;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
}

// 业务类型枚举
export enum BizType {
  ORDER = 'ORDER',
  SHIPMENT = 'SHIPMENT',
  PURCHASE = 'PURCHASE',
  PRODUCT_LABEL = 'PRODUCT_LABEL',
}

// 业务类型选项
export const bizTypeOptions = [
  { label: '销售订单', value: BizType.ORDER },
  { label: '发货单', value: BizType.SHIPMENT },
  { label: '采购单', value: BizType.PURCHASE },
  { label: '商品标签', value: BizType.PRODUCT_LABEL },
];

export interface CreatePrintTemplateDto {
  name: string;
  bizType: BizType;
  paperWidth?: number;
  paperHeight?: number;
  content?: Record<string, any>;
  description?: string;
  sort?: number;
  isEnabled?: boolean;
}

// 打印机（简化版）
export interface Printer {
  id: number;
  name: string; // 打印机名称（自定义）
  device: string; // 打印机终端（设备标识，从电脑端获取）
  remark?: string; // 备注
  createdAt: string;
  updatedAt: string;
}

export interface CreatePrinterDto {
  name: string;
  device: string;
  remark?: string;
}

// DTPWeb 打印机设备信息
export interface DtpPrinterDevice {
  deviceName?: string;
  name?: string;
  printerName?: string;
  ip?: string;
  port?: number;
  deviceDPI?: number;
  deviceWidth?: number;
}

// 纸张类型枚举
export enum PaperType {
  CONTINUOUS = 'CONTINUOUS', // 连续纸 (gapType: 0)
  LABEL = 'LABEL', // 标签纸/间隙纸 (gapType: 2)
  MARK = 'MARK', // 黑标纸/定位孔 (gapType: 1)
  PERFORATED = 'PERFORATED', // 穿孔纸
}

// 打印模式枚举
export enum PrintMode {
  PRINT = 'PRINT', // 打印模式
  PREV_BASE64 = 'PREV_BASE64', // 白色底色图片
  TRANS_BASE64 = 'TRANS_BASE64', // 透明底色图片
  PRINT_DATA = 'PRINT_DATA', // 生成打印数据
}

// 打印方向选项
export const orientationOptions = [
  { label: '水平方向', value: 0 },
  { label: '右转90度', value: 90 },
  { label: '180度旋转', value: 180 },
  { label: '左转90度', value: 270 },
];

// 纸张类型选项
export const paperTypeOptions = [
  { label: '连续纸', value: PaperType.CONTINUOUS },
  { label: '标签纸', value: PaperType.LABEL },
  { label: '黑标纸', value: PaperType.MARK },
  { label: '穿孔纸', value: PaperType.PERFORATED },
];

// 纸张间隙类型选项 (gapType)
export const gapTypeOptions = [
  { label: '随打印机', value: 255 },
  { label: '连续纸', value: 0 },
  { label: '定位孔', value: 1 },
  { label: '间隙纸', value: 2 },
];

// 打印速度选项
export const printSpeedOptions = [
  { label: '随打印机', value: 255 },
  { label: '1(特慢)', value: 0 },
  { label: '2(慢)', value: 1 },
  { label: '3(正常)', value: 2 },
  { label: '4(快)', value: 3 },
  { label: '5(特快)', value: 4 },
];

// 打印浓度选项
export const printDarknessOptions = [
  { label: '随打印机', value: 255 },
  { label: '6(正常)', value: 5 },
  { label: '7', value: 6 },
  { label: '8', value: 7 },
  { label: '9', value: 8 },
  { label: '10(较浓)', value: 9 },
  { label: '11', value: 10 },
  { label: '12', value: 11 },
  { label: '13', value: 12 },
  { label: '14', value: 13 },
  { label: '15(特浓)', value: 14 },
];

// 打印模式选项
export const printModeOptions = [
  { label: '打印模式', value: PrintMode.PRINT },
  { label: '白色底色图片', value: PrintMode.PREV_BASE64 },
  { label: '透明底色图片', value: PrintMode.TRANS_BASE64 },
  { label: '生成打印数据', value: PrintMode.PRINT_DATA },
];

export interface PrinterConfig {
  id: number;
  name: string;
  templateId?: number;
  template?: { id: number; name: string; code: string };
  printerId?: number;
  printer?: { id: number; name: string; device: string };
  copies: number;
  orientation: number;
  gapType: number;
  paperType: PaperType;
  printSpeed: number;
  printDarkness: number;
  printMode: PrintMode;
  isDefault: boolean;
  isEnabled: boolean;
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePrinterConfigDto {
  name: string;
  templateId?: number;
  printerId?: number;
  copies?: number;
  orientation?: number;
  gapType?: number;
  paperType?: PaperType;
  printSpeed?: number;
  printDarkness?: number;
  printMode?: PrintMode;
  isDefault?: boolean;
  isEnabled?: boolean;
  remark?: string;
}
