import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';

type Step = 'credentials' | 'otp';

export default function LoginScreen() {
  const { t } = useTranslation();
  const { sendLoginOtp, login } = useAuth();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp]           = useState('');
  const [step, setStep]         = useState<Step>('credentials');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  async function handleSendOtp() {
    if (!email.trim() || !password.trim()) {
      setError('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await sendLoginOtp(email.trim());
      setStep('otp');
    } catch (e: any) {
      setError(e.message ?? t('auth.loginError'));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    if (!otp.trim()) {
      setError('يرجى إدخال رمز التحقق');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password, otp.trim());
    } catch (e: any) {
      setError(e.message ?? t('auth.loginError'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, backgroundColor: Colors.light.bg }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={{ backgroundColor: Colors.brand, paddingTop: 80, paddingBottom: 48, paddingHorizontal: 24, alignItems: 'center', gap: 8 }}>
          <View style={{ width: 56, height: 56, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 28, fontWeight: '900', color: '#fff' }}>م</Text>
          </View>
          <Text style={{ fontSize: 26, fontWeight: '900', color: '#fff' }}>محاسب AI</Text>
          <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)' }}>محاسبة ذكية لأعمالك</Text>
        </View>

        {/* Form */}
        <View style={{ flex: 1, padding: 24, gap: 20 }}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: Colors.light.ink, textAlign: 'right' }}>
            {step === 'credentials' ? t('auth.login') : t('auth.otp')}
          </Text>

          {step === 'credentials' ? (
            <>
              <Input
                label={t('auth.email')}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                rtl={false}
                textAlign="left"
                placeholder="you@example.com"
              />
              <Input
                label={t('auth.password')}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                rtl={false}
                textAlign="left"
                placeholder="••••••••"
              />
              {error ? <Text style={{ color: Colors.danger, textAlign: 'right', fontSize: 13 }}>{error}</Text> : null}
              <Button label={t('auth.sendOtp')} onPress={handleSendOtp} loading={loading} />
            </>
          ) : (
            <>
              <View style={{ backgroundColor: '#EFF6FF', borderRadius: 10, padding: 14 }}>
                <Text style={{ color: Colors.brand, fontSize: 13, textAlign: 'right', lineHeight: 20 }}>
                  {t('auth.otpSent')} {email}
                </Text>
              </View>
              <Input
                label={t('auth.otp')}
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                rtl={false}
                textAlign="center"
                placeholder="_ _ _ _ _ _"
              />
              {error ? <Text style={{ color: Colors.danger, textAlign: 'right', fontSize: 13 }}>{error}</Text> : null}
              <Button label={t('auth.verifyOtp')} onPress={handleVerify} loading={loading} />
              <TouchableOpacity onPress={() => setStep('credentials')} style={{ alignItems: 'center' }}>
                <Text style={{ color: Colors.light.ink2, fontSize: 13 }}>← تغيير البريد الإلكتروني</Text>
              </TouchableOpacity>
            </>
          )}

          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 8 }}>
            <Link href="/(auth)/register">
              <Text style={{ color: Colors.brand, fontWeight: '700', fontSize: 14 }}>{t('auth.register')}</Text>
            </Link>
            <Text style={{ color: Colors.light.ink3, fontSize: 14 }}>ليس لديك حساب؟</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
