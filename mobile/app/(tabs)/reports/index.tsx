import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Loading } from '@/components/ui/Loading';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/colors';

type ReportType = 'income' | 'balance' | 'trial';

const REPORT_TABS: { key: ReportType; label: string; icon: string }[] = [
  { key: 'income',  label: 'الدخل',       icon: '📊' },
  { key: 'balance', label: 'الميزانية',    icon: '⚖️' },
  { key: 'trial',   label: 'ميزان المراجعة', icon: '📋' },
];

function fmt(n: number, cur: string) {
  return new Intl.NumberFormat('ar-SA', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(n);
}

function SectionItem({ label, amount, currency, indent = false }: { label: string; amount: number; currency: string; indent?: boolean }) {
  return (
    <View style={[styles.lineItem, indent && { paddingRight: 20 }]}>
      <Text style={{ fontSize: 14, fontWeight: '600', color: amount >= 0 ? Colors.light.ink : Colors.danger }}>
        {fmt(amount, currency)}
      </Text>
      <Text style={{ fontSize: 13, color: Colors.light.ink2, flex: 1, textAlign: 'right' }} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function TotalItem({ label, amount, currency, color }: { label: string; amount: number; currency: string; color?: string }) {
  return (
    <View style={[styles.lineItem, { borderTopWidth: 1.5, borderTopColor: Colors.light.border, paddingTop: 10, marginTop: 4 }]}>
      <Text style={{ fontSize: 17, fontWeight: '900', color: color ?? Colors.light.ink }}>
        {fmt(amount, currency)}
      </Text>
      <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.light.ink2 }}>{label}</Text>
    </View>
  );
}

function IncomeReport({ currency }: { currency: string }) {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['report-income'],
    queryFn: () => api.get<any>('/api/reports/income'),
  });

  if (isLoading) return <Loading />;

  const d = data ?? {};
  const netIncome = (d.totalRevenue ?? 0) - (d.totalExpenses ?? 0);

  return (
    <ScrollView
      contentContainerStyle={{ gap: 12, padding: 16 }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.brand} />}
    >
      <Card>
        <Text style={styles.sectionTitle}>الإيرادات</Text>
        {d.revenueLines?.map((l: any, i: number) => (
          <SectionItem key={i} label={l.accountName} amount={l.amount} currency={currency} indent />
        ))}
        <TotalItem label="إجمالي الإيرادات" amount={d.totalRevenue ?? 0} currency={currency} color={Colors.tip} />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>المصروفات</Text>
        {d.expenseLines?.map((l: any, i: number) => (
          <SectionItem key={i} label={l.accountName} amount={l.amount} currency={currency} indent />
        ))}
        <TotalItem label="إجمالي المصروفات" amount={d.totalExpenses ?? 0} currency={currency} color={Colors.danger} />
      </Card>

      <Card>
        <TotalItem label="صافي الدخل" amount={netIncome} currency={currency} color={netIncome >= 0 ? Colors.success : Colors.danger} />
      </Card>
    </ScrollView>
  );
}

function BalanceReport({ currency }: { currency: string }) {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['report-balance'],
    queryFn: () => api.get<any>('/api/reports/balance-sheet'),
  });

  if (isLoading) return <Loading />;
  const d = data ?? {};

  return (
    <ScrollView
      contentContainerStyle={{ gap: 12, padding: 16 }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.brand} />}
    >
      <Card>
        <Text style={styles.sectionTitle}>الأصول</Text>
        {d.assets?.map((l: any, i: number) => (
          <SectionItem key={i} label={l.accountName} amount={l.balance} currency={currency} indent />
        ))}
        <TotalItem label="إجمالي الأصول" amount={d.totalAssets ?? 0} currency={currency} color={Colors.tip} />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>الالتزامات وحقوق الملكية</Text>
        {d.liabilities?.map((l: any, i: number) => (
          <SectionItem key={i} label={l.accountName} amount={l.balance} currency={currency} indent />
        ))}
        {d.equity?.map((l: any, i: number) => (
          <SectionItem key={i} label={l.accountName} amount={l.balance} currency={currency} indent />
        ))}
        <TotalItem label="الإجمالي" amount={(d.totalLiabilities ?? 0) + (d.totalEquity ?? 0)} currency={currency} />
      </Card>
    </ScrollView>
  );
}

function TrialBalance({ currency }: { currency: string }) {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['report-trial'],
    queryFn: () => api.get<any>('/api/reports/trial-balance'),
  });

  if (isLoading) return <Loading />;
  const rows: any[] = data?.rows ?? [];

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.brand} />}
      horizontal={false}
    >
      <Card>
        <Text style={styles.sectionTitle}>ميزان المراجعة</Text>
        {/* header */}
        <View style={styles.trRow}>
          <Text style={[styles.trCell, { width: 80, fontWeight: '700' }]}>دائن</Text>
          <Text style={[styles.trCell, { width: 80, fontWeight: '700' }]}>مدين</Text>
          <Text style={[styles.trCell, { flex: 1, fontWeight: '700' }]}>الحساب</Text>
        </View>
        {rows.map((r: any, i: number) => (
          <View key={i} style={styles.trRow}>
            <Text style={[styles.trCell, { width: 80, color: Colors.danger }]}>{r.credit ? fmt(r.credit, currency) : '—'}</Text>
            <Text style={[styles.trCell, { width: 80, color: Colors.tip }]}>{r.debit ? fmt(r.debit, currency) : '—'}</Text>
            <Text style={[styles.trCell, { flex: 1 }]} numberOfLines={1}>{r.accountName}</Text>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}

export default function ReportsScreen() {
  const { t } = useTranslation();
  const [active, setActive] = useState<ReportType>('income');
  const currency = 'SAR';

  return (
    <View style={{ flex: 1, backgroundColor: Colors.light.bg }}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('tabs.reports')}</Text>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {REPORT_TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActive(tab.key)}
            style={[styles.tab, active === tab.key && styles.tabActive]}
          >
            <Text style={{ fontSize: 11 }}>{tab.icon}</Text>
            <Text style={{ fontSize: 11, fontWeight: '700', color: active === tab.key ? '#fff' : Colors.light.ink2 }}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {active === 'income'  && <IncomeReport  currency={currency} />}
      {active === 'balance' && <BalanceReport currency={currency} />}
      {active === 'trial'   && <TrialBalance  currency={currency} />}
    </View>
  );
}

const styles = StyleSheet.create({
  header:    { backgroundColor: Colors.brand, paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 },
  title:     { fontSize: 20, fontWeight: '900', color: '#fff', textAlign: 'right' },
  tabBar:    { flexDirection: 'row', padding: 12, gap: 8 },
  tab:       { flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 10, backgroundColor: Colors.light.card, borderWidth: 1.5, borderColor: Colors.light.border },
  tabActive: { backgroundColor: Colors.brand, borderColor: Colors.brand },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: Colors.light.ink2, textAlign: 'right', marginBottom: 8 },
  lineItem:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5, gap: 12 },
  trRow:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 5, borderBottomWidth: 0.5, borderBottomColor: Colors.light.border, gap: 6 },
  trCell:    { fontSize: 12, color: Colors.light.ink, textAlign: 'right' },
});
