import type { Shipment } from '@/types/purchase';
import { commitJob, drawLine, drawQrCode, drawText, startJob } from '@/services/print/dtpweb';
import type { DtpApi } from '@/services/print/dtpweb';

const formatDateTime = (value?: string) => (value ? new Date(value).toLocaleString() : '-');
const formatSpecs = (specs: Record<string, string> = {}) => {
  const entries = Object.entries(specs);
  if (!entries.length) return '-';
  return entries.map(([k, v]) => `${k}:${v}`).join(', ');
};

export const printShipmentJob = async (api: DtpApi, shipment: Shipment) => {
  await startJob(api, {
    jobName: `发货单-${shipment.shipmentNo}`,
    width: 100,
    height: 120,
  });

  let y = 6;
  await drawText(api, { text: '发货单', x: 6, y, width: 40, fontSize: 14, bold: true });
  await drawQrCode(api, { value: `SHIPMENT:${shipment.shipmentNo}`, x: 72, y: 4, width: 22, height: 22 });

  y += 10;
  await drawText(api, { text: `发货单号: ${shipment.shipmentNo}`, x: 6, y, width: 90, fontSize: 10 });
  y += 6;
  await drawText(api, { text: `订单号: ${shipment.orderNo}`, x: 6, y, width: 90, fontSize: 10 });
  y += 6;
  await drawText(api, { text: `仓库: ${shipment.warehouseName}`, x: 6, y, width: 90, fontSize: 10 });
  y += 6;
  await drawText(api, { text: `物流公司: ${shipment.logisticsCompany || '-'}`, x: 6, y, width: 90, fontSize: 9 });
  y += 6;
  await drawText(api, { text: `物流单号: ${shipment.trackingNo || '-'}`, x: 6, y, width: 90, fontSize: 9 });
  y += 6;
  await drawText(api, { text: `创建时间: ${formatDateTime(shipment.createdAt)}`, x: 6, y, width: 90, fontSize: 8 });

  y += 6;
  await drawLine(api, { x1: 6, y1: y, x2: 94, y2: y });
  y += 2;
  await drawText(api, { text: '发货明细', x: 6, y, width: 30, fontSize: 10, bold: true });
  y += 6;

  const items = shipment.items || [];
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    await drawText(api, { text: `${i + 1}. ${item.productName}`, x: 6, y, width: 88, fontSize: 9, bold: true });
    y += 5;
    await drawText(api, { text: `SKU: ${item.skuCode}`, x: 8, y, width: 86, fontSize: 8 });
    y += 5;
    await drawText(api, { text: `规格: ${formatSpecs(item.specs)}`, x: 8, y, width: 86, fontSize: 8 });
    y += 5;
    await drawText(api, { text: `数量: ${item.quantity}`, x: 8, y, width: 86, fontSize: 8 });
    y += 6;
  }

  await drawLine(api, { x1: 6, y1: y, x2: 94, y2: y });
  y += 3;
  await drawText(api, { text: `打印时间: ${new Date().toLocaleString()}`, x: 6, y, width: 90, fontSize: 8 });

  await commitJob(api);
};
