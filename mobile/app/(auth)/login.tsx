import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { getBiometricType } from '@/lib/biometric';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';

type Step = 'credentials' | 'otp' | 'biometric-enroll';

export default function LoginScreen() {
  const { t } = useTranslation();
  const { sendLoginOtp, login, biometricLogin, enableBiometric, canUseBiometric, biometricEnabled } = useAuth();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp]           = useState('');
  const [step, setStep]         = useState<Step>('credentials');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [biometricLabel, setBiometricLabel] = useState('البصمة / الوجه');

  useEffect(() => {
    getBiometricType().then((type) => {
      if (type === 'face') setBiometricLabel('Face ID');
      else if (type === 'fingerprint') setBiometricLabel('بصمة الإصبع');
    });
  }, []);

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
      // After successful login, offer biometric enrollment if available but not yet enabled
      if (canUseBiometric && !biometricEnabled) {
        setStep('biometric-enroll');
      }
      // If biometric already enabled or not available, login() navigates to dashboard automatically
    } catch (e: any) {
      setError(e.message ?? t('auth.loginError'));
    } finally {
      setLoading(false);
    }
  }

  async function handleBiometricLogin() {
    setLoading(true);
    setError('');
    try {
      const success = await biometricLogin();
      if (!success) {
        setError('فشل التحقق البيومتري — يرجى تسجيل الدخول بكلمة المرور');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleEnableBiometric() {
    await enableBiometric();
    // login() already navigated to dashboard; step here is just UI — navigation already happened
    // If somehow still on this screen, go to credentials
    setStep('credentials');
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

          {/* Biometric enrollment prompt (shown right after first successful login) */}
          {step === 'biometric-enroll' ? (
            <>
              <Text style={{ fontSize: 20, fontWeight: '800', color: Colors.light.ink, textAlign: 'right' }}>
                تفعيل {biometricLabel}
              </Text>
              <View style={{ backgroundColor: '#EFF6FF', borderRadius: 12, padding: 16, gap: 8 }}>
                <Text style={{ fontSize: 32, textAlign: 'center' }}>
                  {biometricLabel === 'Face ID' ? '🔐' : '👆'}
                </Text>
                <Text style={{ color: Colors.light.ink, fontSize: 15, textAlign: 'center', fontWeight: '700' }}>
                  هل تريد تفعيل {biometricLabel}؟
                </Text>
                <Text style={{ color: Colors.light.ink2, fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
                  سجّل الدخول في المرة القادمة بلمسة واحدة بدلاً من كلمة المرور
                </Text>
              </View>
              <Button label={`✅ تفعيل ${biometricLabel}`} onPress={handleEnableBiometric} />
              <TouchableOpacity onPress={() => setStep('credentials')} style={{ alignItems: 'center' }}>
                <Text style={{ color: Colors.light.ink2, fontSize: 13 }}>لا شكراً، لاحقاً</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
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

                  {/* Biometric quick login — shown when available and enabled */}
                  {canUseBiometric && biometricEnabled && (
                    <TouchableOpacity
                      onPress={handleBiometricLogin}
                      disabled={loading}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        paddingVertical: 14,
                        borderRadius: 12,
                        borderWidth: 1.5,
                        borderColor: Colors.brand,
                        opacity: loading ? 0.5 : 1,
                      }}
                    >
                      <Text style={{ fontSize: 20 }}>
                        {biometricLabel === 'Face ID' ? '🔐' : '👆'}
                      </Text>
                      <Text style={{ color: Colors.brand, fontWeight: '700', fontSize: 15 }}>
                        الدخول بـ {biometricLabel}
                      </Text>
                    </TouchableOpacity>
                  )}
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
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
