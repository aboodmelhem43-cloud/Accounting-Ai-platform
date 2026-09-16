import { View, Text, TextInput, TextInputProps } from 'react-native';
import { Colors } from '@/constants/colors';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  rtl?: boolean;
}

export function Input({ label, error, rtl = true, style, ...props }: Props) {
  return (
    <View style={{ gap: 6 }}>
      {label ? (
        <Text
          style={{
            fontSize: 13,
            fontWeight: '600',
            color: Colors.light.ink2,
            textAlign: rtl ? 'right' : 'left',
          }}
        >
          {label}
        </Text>
      ) : null}
      <TextInput
        {...props}
        writingDirection={rtl ? 'rtl' : 'ltr'}
        textAlign={rtl ? 'right' : 'left'}
        style={[
          {
            backgroundColor: Colors.light.bg,
            borderWidth: 1.5,
            borderColor: error ? Colors.danger : Colors.light.border,
            borderRadius: 10,
            paddingVertical: 12,
            paddingHorizontal: 14,
            fontSize: 15,
            color: Colors.light.ink,
          },
          style,
        ]}
        placeholderTextColor={Colors.light.ink3}
      />
      {error ? (
        <Text style={{ fontSize: 12, color: Colors.danger, textAlign: rtl ? 'right' : 'left' }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
