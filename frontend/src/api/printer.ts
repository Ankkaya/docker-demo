import api from './request';
import type { CreatePrinterDto, Printer } from '@/types/print';

export const getPrinters = () => {
  return api.get<Printer[]>('/printers');
};

export const getPrinter = (id: number) => {
  return api.get<Printer>(`/printers/${id}`);
};

export const createPrinter = (data: CreatePrinterDto) => {
  return api.post<Printer>('/printers', data);
};

export const updatePrinter = (id: number, data: Partial<CreatePrinterDto>) => {
  return api.patch<Printer>(`/printers/${id}`, data);
};

export const deletePrinter = (id: number) => {
  return api.delete<void>(`/printers/${id}`);
};
