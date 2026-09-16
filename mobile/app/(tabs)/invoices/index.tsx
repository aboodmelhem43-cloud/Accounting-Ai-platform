import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useInvoices } from '@/hooks/useInvoices';
import { Badge } from '@/components/ui/Badge';
import { Loading } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';
import { Colors } from '@/constants/colors';
import type { InvoiceStatus, InvoiceListItem } from '@/types';
import dayjs from 'dayjs';

const FILTERS: { label: string; value: InvoiceStatus | undefined }[] = [
  { label: 'الكل', value: undefined },
  { label: 'في الانتظار', value: 'PENDING_REVIEW' },
  { label: 'مُرحَّلة', value: 'POSTED' },
  { label: 'مرفوضة', value: 'REJECTED' },
];

function fmt(n: number | null, cur: string) {
  if (n == null) return '—';
  return new Intl.NumberFormat('ar-SA', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(n);
}

function InvoiceRow({ item }: { item: InvoiceListItem }) {
  return (
    <TouchableOpacity
      onPress={() => router.push(`/(tabs)/invoices/${item.id}`)}
      style={styles.row}
    >
      <Badge status={item.status} />
      <View style={{ flex: 1, alignItems: 'flex-end', gap: 3 }}>
        <Text style={styles.vendor} numberOfLines={1}>{item.vendorName ?? '—'}</Text>
        <Text style={styles.meta}>{item.invoiceNumber ?? '—'} · {dayjs(item.invoiceDate ?? item.createdAt).format('DD/MM/YYYY')}</Text>
      </View>
      <View style={{ alignItems: 'flex-end', minWidth: 80 }}>
        <Text style={styles.amount}>{fmt(item.total, item.currency)}</Text>
        <Text style={styles.type}>{item.invoiceType === 'PURCHASE' ? 'شراء' : 'مبيعات'}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function InvoicesScreen() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<InvoiceStatus | undefined>(undefined);
  const { data, isLoading, refetch, isRefetching } = useInvoices(filter);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.light.bg }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/invoices/upload')}
          style={styles.uploadBtn}
        >
          <Text style={{ color: '#fff', fontSize: 22, lineHeight: 26 }}>+</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('invoices.title')}</Text>
      </View>

      {/* Filter bar */}
      <View style={styles.filterBar}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={String(f.value)}
            onPress={() => setFilter(f.value)}
            style={[styles.filterChip, filter === f.value && styles.filterChipActive]}
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
          data={data?.invoices ?? []}
          keyExtractor={i => i.id}
          renderItem={({ item }) => <InvoiceRow item={item} />}
          contentContainerStyle={{ padding: 16, gap: 10, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.brand} />}
          ListEmptyComponent={<EmptyState icon="🧾" title="لا توجد فواتير" subtitle="ارفع فاتورتك الأولى" />}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.brand, paddingTop: 60, paddingBottom: 20,
    paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  title:     { fontSize: 20, fontWeight: '900', color: '#fff' },
  uploadBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  filterBar: { flexDirection: 'row', gap: 8, padding: 12, flexWrap: 'wrap' },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 100, backgroundColor: Colors.light.card, borderWidth: 1.5, borderColor: Colors.light.border },
  filterChipActive: { backgroundColor: Colors.brand, borderColor: Colors.brand },
  row:    { backgroundColor: Colors.light.card, borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderColor: Colors.light.border },
  vendor: { fontSize: 15, fontWeight: '700', color: Colors.light.ink },
  meta:   { fontSize: 12, color: Colors.light.ink3 },
  amount: { fontSize: 15, fontWeight: '800', color: Colors.light.ink },
  type:   { fontSize: 11, color: Colors.light.ink3 },
});
