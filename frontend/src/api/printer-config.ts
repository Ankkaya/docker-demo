import api from './request';
import type { CreatePrinterConfigDto, PrinterConfig } from '@/types/print';

export interface PrinterConfigEnumOptions {
  paperTypes: { label: string; value: string }[];
  printModes: { label: string; value: string }[];
  orientations: { label: string; value: number }[];
  printSpeeds: { label: string; value: number }[];
  printDarknessLevels: { label: string; value: number }[];
  gapTypes: { label: string; value: number }[];
}

export const getPrinterConfigs = () => {
  return api.get<PrinterConfig[]>('/printer-configs');
};

export const getPrinterConfig = (id: number) => {
  return api.get<PrinterConfig>(`/printer-configs/${id}`);
};

export const createPrinterConfig = (data: CreatePrinterConfigDto) => {
  return api.post<PrinterConfig>('/printer-configs', data);
};

export const updatePrinterConfig = (id: number, data: Partial<CreatePrinterConfigDto>) => {
  return api.patch<PrinterConfig>(`/printer-configs/${id}`, data);
};

export const deletePrinterConfig = (id: number) => {
  return api.delete<void>(`/printer-configs/${id}`);
};

export const getPrinterConfigEnumOptions = () => {
  return api.get<PrinterConfigEnumOptions>('/printer-configs/options/enums');
};
