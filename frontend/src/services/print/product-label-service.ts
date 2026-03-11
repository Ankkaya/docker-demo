import { getPrintTemplate } from '@/api/print-template';
import { closePrinter, getDtpApi, getPrintErrorMessage, openPrinter, PrintSdkError } from '@/services/print/dtpweb';
import { printProductLabelJob } from '@/services/print/jobs/product-label-job';
import type { PrinterConfig } from '@/types/print';
import type { PurchaseReceipt, ReceiptItem } from '@/types/purchase';

const ensurePrintableReceipt = (receipt: PurchaseReceipt) => {
  if (!receipt.items?.length) {
    throw new PrintSdkError('RECEIPT_ITEMS_EMPTY', '入库单没有可打印的商品明细');
  }
};

export const printProductLabels = async (receipt: PurchaseReceipt, config: PrinterConfig) => {
  if (!config.templateId) {
    throw new PrintSdkError('PRINT_TEMPLATE_MISSING', '打印配置未关联打印模板');
  }
  if (!config.printer?.device) {
    throw new PrintSdkError('PRINTER_MISSING', '打印配置未关联打印机');
  }

  ensurePrintableReceipt(receipt);

  const template = await getPrintTemplate(config.templateId);
  const api = await getDtpApi();
  await openPrinter(api, config.printer.device);

  try {
    for (const item of receipt.items as ReceiptItem[]) {
      const quantity = Math.max(1, Number(item.quantity || 1));
      for (let index = 0; index < quantity; index += 1) {
        await printProductLabelJob(api, template, config, item);
      }
    }
  } finally {
    await closePrinter(api);
  }
};

export { getPrintErrorMessage };
