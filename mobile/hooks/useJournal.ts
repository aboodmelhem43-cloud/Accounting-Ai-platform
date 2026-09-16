import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { JournalEntryListItem, JournalEntryStatus } from '@/types';

export function useJournalEntries(status?: JournalEntryStatus) {
  const path = status
    ? `/api/journal?status=${status}&limit=50`
    : '/api/journal?limit=50';
  return useQuery({
    queryKey: ['journal', status],
    queryFn: () =>
      api.get<{ entries: JournalEntryListItem[]; total: number }>(path),
  });
}

export function useJournalEntry(id: string) {
  return useQuery({
    queryKey: ['journal-entry', id],
    queryFn: () => api.get<JournalEntryDetail>(`/api/journal/${id}`),
    enabled: !!id,
  });
}

export function useApproveEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/api/journal/${id}/post`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['journal'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useRejectEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      api.post(`/api/journal/${id}/reject`, { reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['journal'] }),
  });
}

interface JournalEntryDetail extends JournalEntryListItem {
  lines: Array<{
    id: string;
    accountName: string;
    accountCode: string;
    debit: number;
    credit: number;
    description: string | null;
    currency: string;
  }>;
  totalCredits: number;
}
