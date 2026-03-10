import { getOrder, getShipment } from '@/api/order';
import type { Order, Shipment } from '@/types/purchase';
import {
  closePrinter,
  getDtpApi,
  getPrintErrorMessage,
  openPrinter,
  PrintSdkError,
} from '@/services/print/dtpweb';
import { printOrderJob } from '@/services/print/jobs/order-job';
import { printShipmentJob } from '@/services/print/jobs/shipment-job';

type LegacyApiResponse<T> = {
  code?: number;
  data?: T;
};

const unwrapApiData = <T>(payload: any): T => {
  if (payload && typeof payload === 'object') {
    const nested = payload.data as LegacyApiResponse<T> | undefined;
    if (nested && typeof nested === 'object' && typeof nested.code === 'number') {
      return nested.data as T;
    }

    if (typeof payload.code === 'number') {
      return (payload as LegacyApiResponse<T>).data as T;
    }

    if (payload.data && typeof payload.data === 'object') {
      return payload.data as T;
    }
  }

  return payload as T;
};

const ensureHasOrderData = (order: Order) => {
  if (!order.orderNo) {
    throw new PrintSdkError('ORDER_DATA_INVALID', '订单数据不完整，缺少订单号');
  }
};

const ensureHasShipmentData = (shipment: Shipment) => {
  if (!shipment.shipmentNo) {
    throw new PrintSdkError('SHIPMENT_DATA_INVALID', '发货单数据不完整，缺少发货单号');
  }
};

export const checkPrintEnvironment = async () => {
  await getDtpApi();
};

export const printOrder = async (orderId: number, printerName?: string) => {
  const response = await getOrder(orderId);
  const order = unwrapApiData<Order>(response);
  ensureHasOrderData(order);

  const api = await getDtpApi();
  await openPrinter(api, printerName);
  try {
    await printOrderJob(api, order);
  } finally {
    await closePrinter(api);
  }
};

export const printShipment = async (shipmentId: number, printerName?: string) => {
  const response = await getShipment(shipmentId);
  const shipment = unwrapApiData<Shipment>(response);
  ensureHasShipmentData(shipment);

  const api = await getDtpApi();
  await openPrinter(api, printerName);
  try {
    await printShipmentJob(api, shipment);
  } finally {
    await closePrinter(api);
  }
};

export { getPrintErrorMessage };
