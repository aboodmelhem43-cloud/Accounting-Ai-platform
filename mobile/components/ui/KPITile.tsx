import { View, Text } from 'react-native';
import { Colors } from '@/constants/colors';

interface Props {
  label: string;
  value: string;
  sub?: string;
  color?: string;
  flex?: number;
}

export function KPITile({ label, value, sub, color = Colors.brand, flex = 1 }: Props) {
  return (
    <View
      style={{
        flex,
        backgroundColor: Colors.light.card,
        borderRadius: 14,
        padding: 16,
        borderWidth: 1.5,
        borderColor: Colors.light.border,
        gap: 4,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 1,
      }}
    >
      <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.light.ink3, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'right' }}>
        {label}
      </Text>
      <Text style={{ fontSize: 22, fontWeight: '900', color, textAlign: 'right' }}>
        {value}
      </Text>
      {sub ? (
        <Text style={{ fontSize: 12, color: Colors.light.ink3, textAlign: 'right' }}>
          {sub}
        </Text>
      ) : null}
    </View>
  );
}
