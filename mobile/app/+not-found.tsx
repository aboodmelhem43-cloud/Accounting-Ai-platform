import { View, Text } from 'react-native';
import { Link } from 'expo-router';
import { Colors } from '@/constants/colors';

export default function NotFound() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, backgroundColor: Colors.light.bg }}>
      <Text style={{ fontSize: 48 }}>🔍</Text>
      <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.light.ink }}>الصفحة غير موجودة</Text>
      <Link href="/(tabs)/dashboard" style={{ color: Colors.brand, fontWeight: '600' }}>
        العودة للرئيسية
      </Link>
    </View>
  );
}
