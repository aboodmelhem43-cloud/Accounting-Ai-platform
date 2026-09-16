import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View } from 'react-native';
import { Colors } from '@/constants/colors';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  fullWidth?: boolean;
}

const styles = {
  primary:   { bg: Colors.brand,   text: '#fff',           border: Colors.brand },
  secondary: { bg: '#F0F2F5',      text: Colors.light.ink, border: '#E5E7EB'    },
  danger:    { bg: Colors.danger,  text: '#fff',           border: Colors.danger },
  ghost:     { bg: 'transparent',  text: Colors.brand,     border: 'transparent' },
};

const sizes = {
  sm: { py: 8,  px: 14, text: 13, radius: 8  },
  md: { py: 12, px: 20, text: 15, radius: 10 },
  lg: { py: 16, px: 24, text: 16, radius: 12 },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = true,
}: Props) {
  const s = styles[variant];
  const sz = sizes[size];
  const opacity = disabled || loading ? 0.55 : 1;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={{
        backgroundColor: s.bg,
        borderColor: s.border,
        borderWidth: 1.5,
        borderRadius: sz.radius,
        paddingVertical: sz.py,
        paddingHorizontal: sz.px,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
        opacity,
        alignSelf: fullWidth ? 'stretch' : 'flex-start',
      }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={s.text} />
      ) : (
        <Text style={{ color: s.text, fontSize: sz.text, fontWeight: '700', letterSpacing: 0.3 }}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}
