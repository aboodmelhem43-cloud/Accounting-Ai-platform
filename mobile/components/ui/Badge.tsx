import { View, Text } from 'react-native';
import { Colors } from '@/constants/colors';
import type { InvoiceStatus, JournalEntryStatus } from '@/types';

type Status = InvoiceStatus | JournalEntryStatus;

const map: Record<string, { bg: string; text: string; label: string }> = {
  PENDING_REVIEW: { bg: '#FEF3C7', text: '#92400E', label: 'في الانتظار' },
  APPROVED:       { bg: '#D1FAE5', text: '#065F46', label: 'مقبولة'      },
  CONFIRMED:      { bg: '#DBEAFE', text: '#1E3A8A', label: 'مُرحَّل'     },
  REJECTED:       { bg: '#FEE2E2', text: '#991B1B', label: 'مرفوضة'      },
  POSTED:         { bg: '#DBEAFE', text: '#1E3A8A', label: 'مُرحَّل'     },
  DRAFT:          { bg: '#F3F4F6', text: '#374151', label: 'مسودة'        },
};

interface Props {
  status: Status;
  labelOverride?: string;
}

export function Badge({ status, labelOverride }: Props) {
  const cfg = map[status] ?? { bg: '#F3F4F6', text: '#374151', label: status };
  return (
    <View style={{ backgroundColor: cfg.bg, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 100 }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: cfg.text }}>
        {labelOverride ?? cfg.label}
      </Text>
    </View>
  );
}
