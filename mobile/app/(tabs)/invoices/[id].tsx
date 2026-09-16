import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useInvoice, useApproveInvoice, useRejectInvoice } from '@/hooks/useInvoices';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { Colors } from '@/constants/colors';
import dayjs from 'dayjs';

function fmt(n: number | null, cur: string) {
  if (n == null) return '—';
  return new Intl.NumberFormat('ar-SA', { style: 'currency', currency: cur, maximumFractionDigits: 2 }).format(n);
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowValue}>{value}</Text>
      <Text style={styles.rowLabel}>{label}</Text>
    </View>
  );
}

export default function InvoiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: invoice, isLoading } = useInvoice(id);
  const { mutateAsync: approve, isPending: approving } = useApproveInvoice();
  const { mutateAsync: reject,  isPending: rejecting  } = useRejectInvoice();

  const [rejectReason, setRejectReason] = useState('');

  if (isLoading) return <Loading />;
  if (!invoice) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: Colors.danger }}>لم يتم العثور على الفاتورة</Text>
    </View>
  );

  const currency = invoice.currency ?? 'SAR';
  const isPending = invoice.status === 'PENDING_REVIEW';

  async function handleApprove() {
    try {
      await approve(invoice!.id);
      Alert.alert('تم', 'تم ترحيل الفاتورة والقيد المحاسبي بنجاح');
      router.back();
    } catch (e: any) {
      Alert.alert('خطأ', e.message);
    }
  }

  async function handleReject() {
    Alert.alert('رفض الفاتورة', 'هل أنت متأكد من رفض هذه الفاتورة؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'رفض', style: 'destructive',
        onPress: async () => {
          try {
            await reject({ invoiceId: invoice!.id });
            router.back();
          } catch (e: any) {
            Alert.alert('خطأ', e.message);
          }
        },
      },
    ]);
  }

  const extracted = invoice.extractedData as Record<string, any> | null;
  const suggested = invoice.suggestedEntry;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.light.bg }} contentContainerStyle={{ gap: 16, padding: 16, paddingBottom: 40 }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 48 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: Colors.brand, fontSize: 16 }}>← رجوع</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'flex-end', gap: 4 }}>
          <Text style={{ fontSize: 18, fontWeight: '900', color: Colors.light.ink }}>
            {invoice.vendorName ?? 'فاتورة'}
          </Text>
          <Badge status={invoice.status} />
        </View>
      </View>

      {/* Key figures */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>بيانات الفاتورة</Text>
        <Row label="المورّد / العميل" value={extracted?.vendorName ?? invoice.vendorName ?? '—'} />
        <Row label="رقم الفاتورة"    value={extracted?.invoiceNumber ?? invoice.invoiceNumber ?? '—'} />
        <Row label="التاريخ"          value={dayjs(extracted?.invoiceDate ?? invoice.invoiceDate ?? invoice.createdAt).format('DD/MM/YYYY')} />
        <Row label="النوع"            value={invoice.invoiceType === 'PURCHASE' ? 'شراء' : 'مبيعات'} />
        <View style={styles.divider} />
        <Row label="المبلغ قبل الضريبة" value={fmt(extracted?.subtotal ?? null, currency)} />
        <Row label="الضريبة"             value={fmt(extracted?.taxAmount ?? null, currency)} />
        <View style={[styles.row, { borderTopWidth: 1.5, borderTopColor: Colors.light.border, paddingTop: 10, marginTop: 4 }]}>
          <Text style={[styles.rowValue, { fontWeight: '900', fontSize: 18, color: Colors.brand }]}>
            {fmt(extracted?.total ?? invoice.total, currency)}
          </Text>
          <Text style={[styles.rowLabel, { fontWeight: '700' }]}>الإجمالي</Text>
        </View>
      </View>

      {/* Line items */}
      {extracted?.lineItems && extracted.lineItems.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>بنود الفاتورة</Text>
          {extracted.lineItems.map((item: any, i: number) => (
            <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.light.ink }}>{fmt(item.total, currency)}</Text>
              <Text style={{ fontSize: 13, color: Colors.light.ink2, flex: 1, textAlign: 'right', marginRight: 8 }} numberOfLines={2}>{item.description}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Suggested journal entry */}
      {suggested && (
        <View style={[styles.card, { borderColor: Colors.brand500, borderWidth: 1.5 }]}>
          <Text style={[styles.sectionTitle, { color: Colors.brand }]}>القيد المقترح بالذكاء الاصطناعي 🤖</Text>
          <Text style={{ fontSize: 12, color: Colors.light.ink3, textAlign: 'right', marginBottom: 8, lineHeight: 18 }}>
            راجع القيد أدناه قبل الموافقة — الذكاء الاصطناعي يقترح ولا يرحّل تلقائياً
          </Text>
          {/* Header */}
          <View style={{ flexDirection: 'row', paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: Colors.light.border }}>
            <Text style={[styles.th, { width: 70 }]}>دائن</Text>
            <Text style={[styles.th, { width: 70 }]}>مدين</Text>
            <Text style={[styles.th, { flex: 1 }]}>الحساب</Text>
          </View>
          {suggested.lines?.map((line: any, i: number) => (
            <View key={i} style={{ flexDirection: 'row', paddingVertical: 5 }}>
              <Text style={[styles.td, { width: 70, color: Colors.danger }]}>{line.credit ? fmt(line.credit, currency) : '—'}</Text>
              <Text style={[styles.td, { width: 70, color: Colors.tip }]}>{line.debit  ? fmt(line.debit,  currency) : '—'}</Text>
              <Text style={[styles.td, { flex: 1 }]}>{line.accountName}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Actions */}
      {isPending && (
        <View style={{ gap: 10 }}>
          <Button
            label={approving ? 'جاري الترحيل...' : 'موافقة وترحيل القيد ✓'}
            onPress={handleApprove}
            loading={approving}
            disabled={rejecting}
          />
          <Button
            label="رفض الفاتورة"
            onPress={handleReject}
            loading={rejecting}
            disabled={approving}
            variant="danger"
          />
        </View>
      )}

      {!isPending && (
        <View style={{ backgroundColor: Colors.light.card, borderRadius: 12, padding: 14, borderWidth: 1.5, borderColor: Colors.light.border }}>
          <Text style={{ textAlign: 'center', color: Colors.light.ink3, fontSize: 13 }}>
            {invoice.status === 'POSTED' ? '✅ تم ترحيل هذا الفاتورة' : '❌ تم رفض هذه الفاتورة'}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card:         { backgroundColor: Colors.light.card, borderRadius: 14, padding: 16, gap: 8, borderWidth: 1, borderColor: Colors.light.border },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: Colors.light.ink2, textAlign: 'right', marginBottom: 4 },
  row:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  rowLabel:     { fontSize: 13, color: Colors.light.ink3 },
  rowValue:     { fontSize: 14, fontWeight: '600', color: Colors.light.ink, textAlign: 'right' },
  divider:      { height: 1, backgroundColor: Colors.light.border, marginVertical: 4 },
  th:           { fontSize: 11, fontWeight: '700', color: Colors.light.ink2, textAlign: 'right' },
  td:           { fontSize: 12, color: Colors.light.ink, textAlign: 'right' },
});
