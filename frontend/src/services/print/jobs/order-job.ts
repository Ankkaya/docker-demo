import type { Order } from '@/types/purchase';
import { commitJob, drawLine, drawQrCode, drawText, startJob } from '@/services/print/dtpweb';
import type { DtpApi } from '@/services/print/dtpweb';

const formatMoney = (value: number) => `¥${(value || 0).toFixed(2)}`;
const formatDateTime = (value?: string) => (value ? new Date(value).toLocaleString() : '-');
const formatSpecs = (specs: Record<string, string> = {}) => {
  const entries = Object.entries(specs);
  if (!entries.length) return '-';
  return entries.map(([k, v]) => `${k}:${v}`).join(', ');
};

export const printOrderJob = async (api: DtpApi, order: Order) => {
  await startJob(api, {
    jobName: `销售订单-${order.orderNo}`,
    width: 100,
    height: 150,
  });

  let y = 6;
  await drawText(api, { text: '销售订单', x: 6, y, width: 50, fontSize: 14, bold: true });
  await drawQrCode(api, { value: `ORDER:${order.orderNo}`, x: 72, y: 4, width: 22, height: 22 });

  y += 10;
  await drawText(api, { text: `订单号: ${order.orderNo}`, x: 6, y, width: 90, fontSize: 10 });
  y += 6;
  await drawText(api, { text: `客户: ${order.customerName}`, x: 6, y, width: 90, fontSize: 10 });
  y += 6;
  await drawText(api, { text: `下单时间: ${formatDateTime(order.orderDate)}`, x: 6, y, width: 90, fontSize: 9 });
  y += 6;
  await drawText(api, { text: `收货人: ${order.receiverName || '-'}`, x: 6, y, width: 90, fontSize: 9 });
  y += 6;
  await drawText(api, { text: `电话: ${order.receiverPhone || '-'}`, x: 6, y, width: 90, fontSize: 9 });
  y += 6;
  await drawText(api, { text: `地址: ${order.receiverAddress || '-'}`, x: 6, y, width: 90, fontSize: 9 });

  y += 6;
  await drawLine(api, { x1: 6, y1: y, x2: 94, y2: y });
  y += 2;
  await drawText(api, { text: '明细', x: 6, y, width: 20, fontSize: 10, bold: true });
  y += 6;

  const items = order.items || [];
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    await drawText(api, { text: `${i + 1}. ${item.productName}`, x: 6, y, width: 88, fontSize: 9, bold: true });
    y += 5;
    await drawText(api, { text: `SKU: ${item.skuCode}`, x: 8, y, width: 86, fontSize: 8 });
    y += 5;
    await drawText(api, { text: `规格: ${formatSpecs(item.specs)}`, x: 8, y, width: 86, fontSize: 8 });
    y += 5;
    await drawText(
      api,
      { text: `数量:${item.quantity} 单价:${formatMoney(item.price)} 小计:${formatMoney(item.amount)}`, x: 8, y, width: 86, fontSize: 8 },
    );
    y += 6;
  }

  await drawLine(api, { x1: 6, y1: y, x2: 94, y2: y });
  y += 3;
  await drawText(api, { text: `商品金额: ${formatMoney(order.totalAmount)}`, x: 6, y, width: 50, fontSize: 9 });
  y += 5;
  await drawText(api, { text: `优惠: ${formatMoney(order.discount)}`, x: 6, y, width: 50, fontSize: 9 });
  y += 5;
  await drawText(api, { text: `运费: ${formatMoney(order.freight)}`, x: 6, y, width: 50, fontSize: 9 });
  y += 5;
  await drawText(api, { text: `应付: ${formatMoney(order.payable)}`, x: 6, y, width: 50, fontSize: 10, bold: true });
  y += 8;
  await drawText(api, { text: `打印时间: ${new Date().toLocaleString()}`, x: 6, y, width: 90, fontSize: 8 });

  await commitJob(api);
};
