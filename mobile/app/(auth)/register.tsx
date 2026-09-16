import { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { sendOtp } from '@/lib/auth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';

type Step = 'form' | 'otp';

const COUNTRIES = [
  { code: 'SA', label: '🇸🇦 السعودية', currency: 'SAR' },
  { code: 'EG', label: '🇪🇬 مصر',     currency: 'EGP' },
  { code: 'AE', label: '🇦🇪 الإمارات', currency: 'AED' },
  { code: 'JO', label: '🇯🇴 الأردن',   currency: 'JOD' },
  { code: 'LB', label: '🇱🇧 لبنان',   currency: 'LBP' },
];

export default function RegisterScreen() {
  const { t } = useTranslation();
  const { register } = useAuth();

  const [name, setName]               = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [businessName, setBusiness]   = useState('');
  const [countryIdx, setCountryIdx]   = useState(0);
  const [otp, setOtp]                 = useState('');
  const [step, setStep]               = useState<Step>('form');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  async function handleSendOtp() {
    if (!name || !email || !password || !businessName) {
      setError('يرجى ملء جميع الحقول');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await sendOtp(email.trim());
      setStep('otp');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    if (!otp.trim()) { setError('يرجى إدخال رمز التحقق'); return; }
    setError('');
    setLoading(true);
    try {
      const c = COUNTRIES[countryIdx];
      await register(email.trim(), password, name, businessName, c.code, c.currency, otp.trim());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, backgroundColor: Colors.light.bg, padding: 24, gap: 20 }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: 'center', paddingTop: 48, gap: 4 }}>
          <Text style={{ fontSize: 22, fontWeight: '900', color: Colors.brand }}>محاسب AI</Text>
          <Text style={{ fontSize: 20, fontWeight: '800', color: Colors.light.ink }}>{t('auth.register')}</Text>
        </View>

        {step === 'form' ? (
          <>
            <Input label={t('auth.name')} value={name} onChangeText={setName} placeholder="محمد أحمد" />
            <Input label={t('auth.email')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" rtl={false} textAlign="left" placeholder="you@example.com" />
            <Input label={t('auth.password')} value={password} onChangeText={setPassword} secureTextEntry rtl={false} textAlign="left" placeholder="8+ أحرف وأرقام" />
            <Input label={t('auth.businessName')} value={businessName} onChangeText={setBusiness} placeholder="اسم شركتك أو نشاطك" />

            {/* Country picker */}
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.light.ink2, textAlign: 'right' }}>{t('auth.country')}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {COUNTRIES.map((c, i) => (
                  <TouchableOpacity
                    key={c.code}
                    onPress={() => setCountryIdx(i)}
                    style={{
                      paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100,
                      backgroundColor: countryIdx === i ? Colors.brand : Colors.light.bg,
                      borderWidth: 1.5,
                      borderColor: countryIdx === i ? Colors.brand : Colors.light.border,
                    }}
                  >
                    <Text style={{ fontSize: 13, color: countryIdx === i ? '#fff' : Colors.light.ink2, fontWeight: '600' }}>{c.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {error ? <Text style={{ color: Colors.danger, textAlign: 'right', fontSize: 13 }}>{error}</Text> : null}
            <Button label={t('auth.sendOtp')} onPress={handleSendOtp} loading={loading} />
          </>
        ) : (
          <>
            <View style={{ backgroundColor: '#EFF6FF', borderRadius: 10, padding: 14 }}>
              <Text style={{ color: Colors.brand, fontSize: 13, textAlign: 'right', lineHeight: 20 }}>{t('auth.otpSent')} {email}</Text>
            </View>
            <Input label={t('auth.otp')} value={otp} onChangeText={setOtp} keyboardType="number-pad" maxLength={6} rtl={false} textAlign="center" placeholder="_ _ _ _ _ _" />
            {error ? <Text style={{ color: Colors.danger, textAlign: 'right', fontSize: 13 }}>{error}</Text> : null}
            <Button label={t('auth.register')} onPress={handleRegister} loading={loading} />
            <TouchableOpacity onPress={() => setStep('form')} style={{ alignItems: 'center' }}>
              <Text style={{ color: Colors.light.ink2, fontSize: 13 }}>← تعديل البيانات</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, paddingBottom: 24 }}>
          <Link href="/(auth)/login">
            <Text style={{ color: Colors.brand, fontWeight: '700', fontSize: 14 }}>{t('auth.login')}</Text>
          </Link>
          <Text style={{ color: Colors.light.ink3, fontSize: 14 }}>لديك حساب بالفعل؟</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
