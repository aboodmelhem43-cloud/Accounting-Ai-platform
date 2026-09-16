import * as SecureStore from 'expo-secure-store';
import type { MobileSession } from '@/types';

const SESSION_KEY = 'mohasabai_session';
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

// ── Secure storage helpers ────────────────────────────────────────────────────

export async function saveSession(session: MobileSession): Promise<void> {
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
}

export async function loadSession(): Promise<MobileSession | null> {
  try {
    const raw = await SecureStore.getItemAsync(SESSION_KEY);
    return raw ? (JSON.parse(raw) as MobileSession) : null;
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}

// ── Auth API calls ─────────────────────────────────────────────────────────────

/** Step 1: request OTP to email */
export async function sendOtp(email: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/mobile/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'فشل إرسال رمز التحقق');
  }
}

/** Step 2: verify OTP + password → get session token */
export async function verifyOtp(
  email: string,
  otp: string,
  password: string,
): Promise<MobileSession> {
  const res = await fetch(`${API_URL}/api/mobile/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp, password }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? 'رمز التحقق غير صحيح');
  return { token: body.token, ...body.session } as MobileSession;
}

/** Registration: create account + verify OTP */
export async function registerAndVerify(
  email: string,
  password: string,
  name: string,
  businessName: string,
  country: string,
  currency: string,
  otp: string,
): Promise<MobileSession> {
  const res = await fetch(`${API_URL}/api/mobile/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name, businessName, country, currency, otp }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? 'فشل إنشاء الحساب');
  return { token: body.token, ...body.session } as MobileSession;
}
