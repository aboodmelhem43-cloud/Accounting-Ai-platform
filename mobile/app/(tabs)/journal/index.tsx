import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useJournalEntries } from '@/hooks/useJournal';
import { Badge } from '@/components/ui/Badge';
import { Loading } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';
import { Colors } from '@/constants/colors';
import type { JournalEntryListItem, JournalEntryStatus } from '@/types';
import dayjs from 'dayjs';

const FILTERS: { label: string; value: JournalEntryStatus | undefined }[] = [
  { label: 'الكل',         value: undefined },
  { label: 'في الانتظار', value: 'PENDING_REVIEW' },
  { label: 'مُرحَّلة',    value: 'POSTED' },
  { label: 'مرفوضة',      value: 'REJECTED' },
];

function fmt(n: number, cur: string) {
  return new Intl.NumberFormat('ar-SA', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(n);
}

function EntryRow({ item }: { item: JournalEntryListItem }) {
  return (
    <TouchableOpacity
      onPress={() => router.push(`/(tabs)/journal/${item.id}`)}
      style={styles.row}
    >
      <Badge status={item.status} />
      <View style={{ flex: 1, alignItems: 'flex-end', gap: 3 }}>
        <Text style={styles.ref} numberOfLines={1}>{item.reference ?? 'قيد يدوي'}</Text>
        <Text style={styles.date}>{dayjs(item.entryDate ?? item.createdAt).format('DD/MM/YYYY')}</Text>
      </View>
      <View style={{ alignItems: 'flex-end', minWidth: 80 }}>
        <Text style={styles.amount}>{fmt(item.totalDebits, item.currency)}</Text>
        <Text style={styles.source}>{item.sourceType === 'AI_INVOICE' ? '🤖 فاتورة' : 'يدوي'}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function JournalScreen() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<JournalEntryStatus | undefined>(undefined);
  const { data, isLoading, refetch, isRefetching } = useJournalEntries(filter);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.light.bg }}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('tabs.journal')}</Text>
      </View>

      <View style={styles.filterBar}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={String(f.value)}
            onPress={() => setFilter(f.value)}
            style={[styles.chip, filter === f.value && styles.chipActive]}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: filter === f.value ? '#fff' : Colors.light.ink2 }}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <Loading />
      ) : (
        <FlatList
          data={data?.entries ?? []}
          keyExtractor={i => i.id}
          renderItem={({ item }) => <EntryRow item={item} />}
          contentContainerStyle={{ padding: 16, gap: 10, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.brand} />}
          ListEmptyComponent={<EmptyState icon="📒" title="لا توجد قيود" subtitle="القيود المحاسبية ستظهر هنا" />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header:    { backgroundColor: Colors.brand, paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 },
  title:     { fontSize: 20, fontWeight: '900', color: '#fff', textAlign: 'right' },
  filterBar: { flexDirection: 'row', gap: 8, padding: 12, flexWrap: 'wrap' },
  chip:      { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 100, backgroundColor: Colors.light.card, borderWidth: 1.5, borderColor: Colors.light.border },
  chipActive:{ backgroundColor: Colors.brand, borderColor: Colors.brand },
  row:       { backgroundColor: Colors.light.card, borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderColor: Colors.light.border },
  ref:       { fontSize: 15, fontWeight: '700', color: Colors.light.ink },
  date:      { fontSize: 12, color: Colors.light.ink3 },
  amount:    { fontSize: 15, fontWeight: '800', color: Colors.light.ink },
  source:    { fontSize: 11, color: Colors.light.ink3 },
});
