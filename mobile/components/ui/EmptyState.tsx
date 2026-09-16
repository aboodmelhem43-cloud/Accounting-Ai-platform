import { View, Text } from 'react-native';
import { Colors } from '@/constants/colors';

interface Props {
  icon?: string;
  title: string;
  subtitle?: string;
}

export function EmptyState({ icon = '📭', title, subtitle }: Props) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 32 }}>
      <Text style={{ fontSize: 48 }}>{icon}</Text>
      <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.light.ink, textAlign: 'center' }}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={{ fontSize: 13, color: Colors.light.ink3, textAlign: 'center', lineHeight: 20 }}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
