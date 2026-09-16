import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, Switch } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/colors';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { session, logout } = useAuth();

  const [businessName, setBusinessName] = useState(session?.businessName ?? '');
  const [saving, setSaving]             = useState(false);
  const [notifInvoice, setNotifInvoice] = useState(true);
  const [notifJournal, setNotifJournal] = useState(true);

  async function handleSave() {
    setSaving(true);
    try {
      await api.patch('/api/settings/profile', { businessName });
      Alert.alert('تم الحفظ', 'تم تحديث البيانات بنجاح');
    } catch (e: any) {
      Alert.alert('خطأ', e.message);
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    Alert.alert('تسجيل الخروج', 'هل أنت متأكد؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'خروج', style: 'destructive', onPress: logout },
    ]);
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.light.bg }} contentContainerStyle={{ gap: 20, padding: 16, paddingBottom: 40 }}>
      {/* Header */}
      <View style={{ paddingTop: 60 }}>
        <Text style={styles.pageTitle}>الإعدادات</Text>
      </View>

      {/* Profile */}
      <Card>
        <Text style={styles.sectionTitle}>الملف الشخصي</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoVal}>{session?.name ?? '—'}</Text>
          <Text style={styles.infoLabel}>الاسم</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.infoVal, { direction: 'ltr', textAlign: 'left' }]}>{session?.email ?? '—'}</Text>
          <Text style={styles.infoLabel}>البريد</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoVal}>{session?.country ?? '—'} · {session?.currency ?? '—'}</Text>
          <Text style={styles.infoLabel}>الدولة / العملة</Text>
        </View>
      </Card>

      {/* Business */}
      <Card>
        <Text style={styles.sectionTitle}>بيانات المنشأة</Text>
        <Input
          label="اسم المنشأة"
          value={businessName}
          onChangeText={setBusinessName}
          placeholder="اسم شركتك أو نشاطك"
        />
        <Button label={saving ? 'جاري الحفظ...' : 'حفظ التغييرات'} onPress={handleSave} loading={saving} />
      </Card>

      {/* Notifications */}
      <Card>
        <Text style={styles.sectionTitle}>الإشعارات</Text>
        <View style={styles.switchRow}>
          <Switch
            value={notifInvoice}
            onValueChange={setNotifInvoice}
            trackColor={{ true: Colors.brand }}
          />
          <Text style={styles.switchLabel}>فواتير تحتاج مراجعة</Text>
        </View>
        <View style={styles.switchRow}>
          <Switch
            value={notifJournal}
            onValueChange={setNotifJournal}
            trackColor={{ true: Colors.brand }}
          />
          <Text style={styles.switchLabel}>قيود تحتاج موافقة</Text>
        </View>
      </Card>

      {/* About */}
      <Card>
        <Text style={styles.sectionTitle}>عن التطبيق</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoVal}>1.0.0</Text>
          <Text style={styles.infoLabel}>الإصدار</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoVal}>محاسب AI</Text>
          <Text style={styles.infoLabel}>التطبيق</Text>
        </View>
      </Card>

      {/* Logout */}
      <Button label="تسجيل الخروج" onPress={handleLogout} variant="danger" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pageTitle:   { fontSize: 24, fontWeight: '900', color: Colors.light.ink, textAlign: 'right' },
  sectionTitle:{ fontSize: 13, fontWeight: '700', color: Colors.light.ink2, textAlign: 'right', marginBottom: 12 },
  infoRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  infoLabel:   { fontSize: 13, color: Colors.light.ink3 },
  infoVal:     { fontSize: 14, fontWeight: '600', color: Colors.light.ink },
  switchRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  switchLabel: { fontSize: 14, color: Colors.light.ink, fontWeight: '600' },
});
