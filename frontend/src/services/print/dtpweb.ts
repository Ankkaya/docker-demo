import { DTPWeb, LPA_FontStyle } from 'dtpweb';
import type { LPA_CheckResult, LPA_DeviceInfo, LPA_JobCommitOptions, LPA_JobStartOptions } from 'dtpweb';

export type DtpApi = DTPWeb;

export class PrintSdkError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'PrintSdkError';
    this.code = code;
  }
}

export const getDtpApi = async (): Promise<DtpApi> => {
  return await new Promise<DtpApi>((resolve, reject) => {
    DTPWeb.checkServer({
      callback: (resp: LPA_CheckResult, api: DTPWeb) => {
        if (resp?.statusCode === 0 && api) {
          resolve(api);
          return;
        }
        reject(
          new PrintSdkError(
            'SDK_CONNECT_FAIL',
            `未检测到打印助手，请确认安装并启动客户端。错误码: ${resp?.statusCode ?? 'unknown'}`,
          ),
        );
      },
    });
  });
};

export const getPrinters = async (api: DtpApi, onlyLocal = true): Promise<LPA_DeviceInfo[]> => {
  return await new Promise<LPA_DeviceInfo[]>((resolve) => {
    api.getPrinters({ onlyLocal }, (devices) => resolve(devices || []));
  });
};

export const openPrinter = async (api: DtpApi, printer?: string | LPA_DeviceInfo) => {
  const target = printer || api.getDefaultPrinter()?.printerName || undefined;
  const success = await new Promise<boolean>((resolve) => {
    api.openPrinter(target, (value) => resolve(Boolean(value)));
  });
  if (!success) {
    throw new PrintSdkError('OPEN_PRINTER_FAIL', '打开打印机失败，请检查打印机连接状态');
  }
};

export const closePrinter = async (api: DtpApi) => {
  api.closePrinter();
};

export const startJob = async (api: DtpApi, options: LPA_JobStartOptions) => {
  const success = api.startJob(options);
  if (!success) {
    throw new PrintSdkError('START_JOB_FAIL', '创建打印任务失败');
  }
};

export const drawText = async (api: DtpApi, options: {
  text: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  fontSize?: number;
  bold?: boolean;
}) => {
  const { text, x, y, width = 80, height = 6, fontSize = 3, bold = false } = options;
  const success = api.drawText({
    text,
    x,
    y,
    width,
    height,
    fontHeight: fontSize,
    fontStyle: bold ? LPA_FontStyle.Bold : LPA_FontStyle.Regular,
  });
  if (!success) {
    throw new PrintSdkError('DRAW_TEXT_FAIL', `绘制文本失败: ${text}`);
  }
};

export const drawLine = async (api: DtpApi, options: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}) => {
  const { x1, y1, x2, y2 } = options;
  api.drawLine({ x1, y1, x2, y2, lineWidth: 0.2 });
};

export const drawQrCode = async (api: DtpApi, options: {
  value: string;
  x: number;
  y: number;
  width: number;
  height: number;
}) => {
  const { value, x, y, width, height } = options;
  const success = api.draw2DQRCode({
    text: value,
    x,
    y,
    width,
    height,
  });
  if (!success) {
    throw new PrintSdkError('DRAW_QRCODE_FAIL', '绘制二维码失败');
  }
};

export const drawBarcode = async (api: DtpApi, options: {
  value: string;
  x: number;
  y: number;
  width: number;
  height: number;
  barcodeType?: number;
  showReadText?: boolean;
}) => {
  const { value, x, y, width, height, barcodeType = 58, showReadText = true } = options;
  const success = api.draw1DBarcode({
    text: value,
    x,
    y,
    width,
    height,
    barcodeType,
    showReadText,
  });
  if (!success) {
    throw new PrintSdkError('DRAW_BARCODE_FAIL', '绘制条码失败');
  }
};

export const commitJob = async (api: DtpApi, options?: LPA_JobCommitOptions) => {
  const result = await new Promise<unknown>((resolve) => {
    if (options) {
      api.commitJob(options, (value) => resolve(value));
      return;
    }
    api.commitJob((value) => resolve(value));
  });
  if (!result) {
    throw new PrintSdkError('COMMIT_JOB_FAIL', '提交打印任务失败');
  }
};

export const getPrintErrorMessage = (error: unknown) => {
  if (error instanceof PrintSdkError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return '打印失败';
};
