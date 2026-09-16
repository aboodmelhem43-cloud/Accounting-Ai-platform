import { View, ActivityIndicator, Text } from 'react-native';
import { Colors } from '@/constants/colors';

export function Loading({ label }: { label?: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: Colors.light.bg }}>
      <ActivityIndicator size="large" color={Colors.brand} />
      {label ? <Text style={{ color: Colors.light.ink2, fontSize: 14 }}>{label}</Text> : null}
    </View>
  );
}
