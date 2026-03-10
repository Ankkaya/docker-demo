import api from './request';
import type { CreatePrintTemplateDto, PrintTemplate } from '@/types/print';

export const getPrintTemplates = () => {
  return api.get<PrintTemplate[]>('/print-templates');
};

export const getPrintTemplate = (id: number) => {
  return api.get<PrintTemplate>(`/print-templates/${id}`);
};

export const createPrintTemplate = (data: CreatePrintTemplateDto) => {
  return api.post<PrintTemplate>('/print-templates', data);
};

export const updatePrintTemplate = (id: number, data: Partial<CreatePrintTemplateDto>) => {
  return api.patch<PrintTemplate>(`/print-templates/${id}`, data);
};

export const deletePrintTemplate = (id: number) => {
  return api.delete<void>(`/print-templates/${id}`);
};
