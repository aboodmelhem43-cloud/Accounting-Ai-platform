import { ScrollView, View, Text, RefreshControl, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useDashboard } from '@/hooks/useDashboard';
import { useAuth } from '@/hooks/useAuth';
import { KPITile } from '@/components/ui/KPITile';
import { Card } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { Colors } from '@/constants/colors';

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat('ar-SA', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
}

export default function DashboardScreen() {
  const { t } = useTranslation();
  const { session, logout } = useAuth();
  const { data, isLoading, refetch, isRefetching } = useDashboard();

  if (isLoading) return <Loading label={t('common.loading')} />;

  const currency = data?.currency ?? session?.currency ?? 'SAR';
  const netPositive = (data?.netIncome ?? 0) >= 0;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.light.bg }}
      contentContainerStyle={{ gap: 16, paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.brand} />}
    >
      {/* Header */}
      <View style={{ backgroundColor: Colors.brand, paddingTop: 60, paddingBottom: 28, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <TouchableOpacity onPress={logout}>
          <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>خروج</Text>
        </TouchableOpacity>
        <View style={{ alignItems: 'flex-end', gap: 2 }}>
          <Text style={{ fontSize: 18, fontWeight: '900', color: '#fff' }}>{t('dashboard.title')}</Text>
          <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{session?.businessName}</Text>
        </View>
      </View>

      <View style={{ paddingHorizontal: 16, gap: 12 }}>
        {/* Net income — full width hero */}
        <Card>
          <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.light.ink3, textAlign: 'right', textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('dashboard.netIncome')}</Text>
          <Text style={{ fontSize: 32, fontWeight: '900', color: netPositive ? Colors.tip : Colors.danger, textAlign: 'right', marginTop: 4 }}>
            {fmt(data?.netIncome ?? 0, currency)}
          </Text>
          <Text style={{ fontSize: 12, color: Colors.light.ink3, textAlign: 'right' }}>هذا الشهر</Text>
        </Card>

        {/* Revenue / Expenses row */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <KPITile label={t('dashboard.revenue')}  value={fmt(data?.totalRevenue  ?? 0, currency)} color={Colors.tip}    flex={1} />
          <KPITile label={t('dashboard.expenses')} value={fmt(data?.totalExpenses ?? 0, currency)} color={Colors.danger} flex={1} />
        </View>

        {/* Cash balance */}
        <KPITile label={t('dashboard.cashBalance')} value={fmt(data?.cashBalance ?? 0, currency)} color={Colors.brand} />

        {/* Pending actions */}
        {(data?.pendingInvoices ?? 0) > 0 && (
          <TouchableOpacity onPress={() => router.push('/(tabs)/invoices')}>
            <Card style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 13, color: Colors.brand, fontWeight: '700' }}>← عرض</Text>
              <View style={{ alignItems: 'flex-end', gap: 2 }}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: Colors.light.ink }}>{data!.pendingInvoices} {t('dashboard.pendingInvoices')}</Text>
                <Text style={{ fontSize: 12, color: Colors.light.ink3 }}>{t('dashboard.pending')}</Text>
              </View>
            </Card>
          </TouchableOpacity>
        )}

        {(data?.pendingJournalEntries ?? 0) > 0 && (
          <TouchableOpacity onPress={() => router.push('/(tabs)/journal')}>
            <Card style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 13, color: Colors.brand, fontWeight: '700' }}>← عرض</Text>
              <View style={{ alignItems: 'flex-end', gap: 2 }}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: Colors.light.ink }}>{data!.pendingJournalEntries} {t('dashboard.pendingJournal')}</Text>
                <Text style={{ fontSize: 12, color: Colors.light.ink3 }}>{t('dashboard.pending')}</Text>
              </View>
            </Card>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}
