import { View, Text, ScrollView, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    nameAr: 'المبتدئ',
    price: '$9',
    period: '/شهر',
    aiQueries: '50 سؤال ذكي',
    features: ['فواتير غير محدودة', 'اليومية المزدوجة', 'التقارير الأساسية'],
    highlight: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    nameAr: 'الاحترافي',
    price: '$29',
    period: '/شهر',
    aiQueries: '500 سؤال ذكي',
    features: ['كل مزايا المبتدئ', 'قراءة الفواتير بالذكاء الاصطناعي', 'تقارير متقدمة', 'دعم أولوية'],
    highlight: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    nameAr: 'المؤسسي',
    price: 'تواصل معنا',
    period: '',
    aiQueries: 'غير محدود',
    features: ['كل مزايا الاحترافي', 'فريق محاسبة متعدد', 'API مخصص', 'SLA مضمون'],
    highlight: false,
  },
];

function PlanCard({ plan }: { plan: typeof PLANS[0] }) {
  function handleUpgrade() {
    Linking.openURL(`https://mohasabai.com/pricing?plan=${plan.id}`);
  }

  return (
    <View style={[styles.card, plan.highlight && styles.cardHighlight]}>
      {plan.highlight && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>الأكثر شيوعاً</Text>
        </View>
      )}
      <Text style={[styles.planName, plan.highlight && styles.planNameHighlight]}>
        {plan.nameAr}
      </Text>
      <View style={styles.priceRow}>
        <Text style={[styles.price, plan.highlight && styles.priceHighlight]}>{plan.price}</Text>
        {plan.period ? <Text style={styles.period}>{plan.period}</Text> : null}
      </View>
      <Text style={styles.aiQueries}>🤖 {plan.aiQueries}</Text>
      <View style={styles.featureList}>
        {plan.features.map((f) => (
          <Text key={f} style={styles.feature}>✓ {f}</Text>
        ))}
      </View>
      <TouchableOpacity
        style={[styles.upgradeBtn, plan.highlight && styles.upgradeBtnHighlight]}
        onPress={handleUpgrade}
        activeOpacity={0.85}
      >
        <Text style={[styles.upgradeBtnText, plan.highlight && styles.upgradeBtnTextHighlight]}>
          {plan.id === 'enterprise' ? 'تواصل معنا' : 'ابدأ الآن'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default function UpgradeScreen() {
  return (
    <View style={styles.root}>
      {/* Handle bar for modal */}
      <View style={styles.handleBar} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.emoji}>🚀</Text>
          <Text style={styles.title}>ارقَ لخطة أفضل</Text>
          <Text style={styles.subtitle}>
            وصلت للحد الأقصى لاشتراكك الحالي. اختر خطة تناسب نمو أعمالك.
          </Text>
        </View>

        {/* Plans */}
        <View style={styles.plansContainer}>
          {PLANS.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </View>

        {/* Footer */}
        <TouchableOpacity onPress={() => router.back()} style={styles.laterBtn}>
          <Text style={styles.laterText}>ربما لاحقاً</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:               { flex: 1, backgroundColor: Colors.light.bg },
  handleBar:          { width: 40, height: 4, backgroundColor: Colors.light.border, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  content:            { padding: 20, paddingBottom: 48 },
  header:             { alignItems: 'center', marginBottom: 28, gap: 8 },
  emoji:              { fontSize: 48 },
  title:              { fontSize: 26, fontWeight: '900', color: Colors.light.ink, textAlign: 'center' },
  subtitle:           { fontSize: 14, color: Colors.light.ink2, textAlign: 'center', lineHeight: 22, maxWidth: 300 },
  plansContainer:     { gap: 16 },
  card:               { backgroundColor: Colors.light.card, borderRadius: 16, padding: 20, borderWidth: 1.5, borderColor: Colors.light.border, gap: 10 },
  cardHighlight:      { borderColor: Colors.brand, borderWidth: 2, backgroundColor: '#EFF6FF' },
  badge:              { backgroundColor: Colors.brand, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, alignSelf: 'flex-end' },
  badgeText:          { color: '#fff', fontSize: 11, fontWeight: '700' },
  planName:           { fontSize: 20, fontWeight: '900', color: Colors.light.ink, textAlign: 'right' },
  planNameHighlight:  { color: Colors.brand },
  priceRow:           { flexDirection: 'row', alignItems: 'baseline', gap: 4, justifyContent: 'flex-end' },
  price:              { fontSize: 28, fontWeight: '900', color: Colors.light.ink },
  priceHighlight:     { color: Colors.brand },
  period:             { fontSize: 13, color: Colors.light.ink2 },
  aiQueries:          { fontSize: 13, color: Colors.light.ink2, textAlign: 'right', fontWeight: '600' },
  featureList:        { gap: 6 },
  feature:            { fontSize: 13, color: Colors.light.ink2, textAlign: 'right' },
  upgradeBtn:         { backgroundColor: Colors.light.border, borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginTop: 4 },
  upgradeBtnHighlight:{ backgroundColor: Colors.brand },
  upgradeBtnText:     { fontSize: 15, fontWeight: '700', color: Colors.light.ink },
  upgradeBtnTextHighlight: { color: '#fff' },
  laterBtn:           { marginTop: 24, alignItems: 'center', paddingVertical: 12 },
  laterText:          { fontSize: 14, color: Colors.light.ink3 },
});
