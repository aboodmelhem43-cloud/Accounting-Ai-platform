import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useJournalEntry, useApproveEntry, useRejectEntry } from '@/hooks/useJournal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { Colors } from '@/constants/colors';
import dayjs from 'dayjs';

function fmt(n: number, cur: string) {
  return new Intl.NumberFormat('ar-SA', { style: 'currency', currency: cur, maximumFractionDigits: 2 }).format(n);
}

export default function JournalEntryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: entry, isLoading } = useJournalEntry(id);
  const { mutateAsync: approve, isPending: approving } = useApproveEntry();
  const { mutateAsync: reject,  isPending: rejecting  } = useRejectEntry();

  if (isLoading) return <Loading />;
  if (!entry) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: Colors.danger }}>لم يتم العثور على القيد</Text>
    </View>
  );

  const currency = entry.currency ?? 'SAR';
  const isPending = entry.status === 'PENDING_REVIEW';

  async function handleApprove() {
    try {
      await approve(entry!.id);
      Alert.alert('تم', 'تم ترحيل القيد المحاسبي بنجاح');
      router.back();
    } catch (e: any) {
      Alert.alert('خطأ', e.message);
    }
  }

  function handleReject() {
    Alert.alert('رفض القيد', 'هل أنت متأكد من رفض هذا القيد؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'رفض', style: 'destructive',
        onPress: async () => {
          try {
            await reject({ id: entry!.id });
            router.back();
          } catch (e: any) {
            Alert.alert('خطأ', e.message);
          }
        },
      },
    ]);
  }

  const totalDebits  = entry.lines?.reduce((s: number, l: any) => s + (l.debit  ?? 0), 0) ?? 0;
  const totalCredits = entry.lines?.reduce((s: number, l: any) => s + (l.credit ?? 0), 0) ?? 0;
  const balanced     = Math.abs(totalDebits - totalCredits) < 0.01;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.light.bg }} contentContainerStyle={{ gap: 16, padding: 16, paddingBottom: 40 }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 48 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: Colors.brand, fontSize: 16 }}>← رجوع</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'flex-end', gap: 4 }}>
          <Text style={{ fontSize: 18, fontWeight: '900', color: Colors.light.ink }}>
            {entry.reference ?? 'قيد محاسبي'}
          </Text>
          <Badge status={entry.status} />
        </View>
      </View>

      {/* Meta */}
      <View style={styles.card}>
        <View style={styles.metaRow}>
          <Text style={styles.metaVal}>{dayjs(entry.entryDate ?? entry.createdAt).format('DD/MM/YYYY')}</Text>
          <Text style={styles.metaLabel}>التاريخ</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaVal}>{entry.sourceType === 'AI_INVOICE' ? '🤖 فاتورة AI' : 'يدوي'}</Text>
          <Text style={styles.metaLabel}>المصدر</Text>
        </View>
        {entry.description && (
          <View style={styles.metaRow}>
            <Text style={[styles.metaVal, { flex: 1, textAlign: 'right' }]}>{entry.description}</Text>
            <Text style={styles.metaLabel}>وصف</Text>
          </View>
        )}
      </View>

      {/* Lines */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>سطور القيد</Text>
        <View style={[styles.lineRow, { paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: Colors.light.border }]}>
          <Text style={[styles.th, { width: 80 }]}>دائن</Text>
          <Text style={[styles.th, { width: 80 }]}>مدين</Text>
          <Text style={[styles.th, { flex: 1 }]}>الحساب</Text>
        </View>
        {entry.lines?.map((line: any, i: number) => (
          <View key={i} style={styles.lineRow}>
            <Text style={[styles.td, { width: 80, color: Colors.danger }]}>
              {line.credit ? fmt(line.credit, currency) : '—'}
            </Text>
            <Text style={[styles.td, { width: 80, color: Colors.tip }]}>
              {line.debit ? fmt(line.debit, currency) : '—'}
            </Text>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Text style={styles.td}>{line.accountName}</Text>
              <Text style={{ fontSize: 10, color: Colors.light.ink3 }}>{line.accountCode}</Text>
            </View>
          </View>
        ))}
        {/* Totals */}
        <View style={[styles.lineRow, { borderTopWidth: 1.5, borderTopColor: Colors.light.border, paddingTop: 10, marginTop: 4 }]}>
          <Text style={[styles.td, { width: 80, fontWeight: '800', color: Colors.danger }]}>{fmt(totalCredits, currency)}</Text>
          <Text style={[styles.td, { width: 80, fontWeight: '800', color: Colors.tip   }]}>{fmt(totalDebits,  currency)}</Text>
          <Text style={{ flex: 1, textAlign: 'right', fontSize: 12, fontWeight: '700', color: balanced ? Colors.success : Colors.danger }}>
            {balanced ? '✓ متوازن' : '⚠️ غير متوازن'}
          </Text>
        </View>
      </View>

      {/* Actions */}
      {isPending && (
        <View style={{ gap: 10 }}>
          <Button label={approving ? 'جاري الترحيل...' : 'ترحيل القيد ✓'} onPress={handleApprove} loading={approving} disabled={rejecting} />
          <Button label="رفض القيد" onPress={handleReject} loading={rejecting} disabled={approving} variant="danger" />
        </View>
      )}

      {!isPending && (
        <View style={{ backgroundColor: Colors.light.card, borderRadius: 12, padding: 14, borderWidth: 1.5, borderColor: Colors.light.border }}>
          <Text style={{ textAlign: 'center', color: Colors.light.ink3, fontSize: 13 }}>
            {entry.status === 'POSTED' ? '✅ تم ترحيل هذا القيد' : '❌ تم رفض هذا القيد'}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card:        { backgroundColor: Colors.light.card, borderRadius: 14, padding: 16, gap: 8, borderWidth: 1, borderColor: Colors.light.border },
  sectionTitle:{ fontSize: 13, fontWeight: '700', color: Colors.light.ink2, textAlign: 'right', marginBottom: 4 },
  metaRow:     { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  metaLabel:   { fontSize: 13, color: Colors.light.ink3 },
  metaVal:     { fontSize: 14, fontWeight: '600', color: Colors.light.ink },
  lineRow:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 6 },
  th:          { fontSize: 11, fontWeight: '700', color: Colors.light.ink2, textAlign: 'right' },
  td:          { fontSize: 12, color: Colors.light.ink, textAlign: 'right' },
});
