import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { InvoiceListItem, InvoiceStatus } from '@/types';

export function useInvoices(status?: InvoiceStatus) {
  const path = status
    ? `/api/mobile/invoices?status=${status}`
    : '/api/mobile/invoices';
  return useQuery({
    queryKey: ['invoices', status],
    queryFn: () => api.get<{ invoices: InvoiceListItem[]; total: number }>(path),
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: ['invoice', id],
    queryFn: () => api.get<InvoiceDetail>(`/api/mobile/invoices/${id}`),
    enabled: !!id,
  });
}

export function useUploadInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (form: FormData) =>
      api.upload<{ invoiceId: string }>('/api/mobile/documents/upload', form),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  });
}

export function useApproveInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (invoiceId: string) =>
      api.post(`/api/mobile/invoices/${invoiceId}/confirm`, {}),
    onSuccess: (_data, invoiceId) => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['invoice', invoiceId] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useRejectInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ invoiceId, reason }: { invoiceId: string; reason?: string }) =>
      api.post(`/api/mobile/invoices/${invoiceId}/reject`, { reason }),
    onSuccess: (_data, { invoiceId }) => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['invoice', invoiceId] });
    },
  });
}

// Extended invoice detail type
interface InvoiceDetail extends InvoiceListItem {
  vendorTaxNumber: string | null;
  subtotal: number | null;
  taxAmount: number | null;
  dueDate: string | null;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
    taxRate: number | null;
  }>;
  suggestedEntry: {
    id: string;
    description: string;
    status: string;
    lines: Array<{
      accountName: string;
      accountCode: string;
      debit: number;
      credit: number;
    }>;
  } | null;
  fileUrl: string | null;
}
