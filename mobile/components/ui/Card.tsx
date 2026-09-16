import { View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  style?: object;
  padding?: number;
}

export function Card({ children, style, padding = 16 }: Props) {
  return (
    <View
      style={[
        {
          backgroundColor: Colors.light.card,
          borderRadius: 14,
          padding,
          borderWidth: 1.5,
          borderColor: Colors.light.border,
          shadowColor: '#000',
          shadowOpacity: 0.06,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          elevation: 2,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
