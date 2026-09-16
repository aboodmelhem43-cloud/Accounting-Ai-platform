import { useState, useEffect, createContext, useContext } from 'react';
import { router } from 'expo-router';
import {
  loadSession,
  saveSession,
  clearSession,
  sendOtp,
  verifyOtp,
  registerAndVerify,
} from '@/lib/auth';
import type { MobileSession } from '@/types';

interface AuthContext {
  session: MobileSession | null;
  isLoading: boolean;
  login: (email: string, password: string, otp: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    name: string,
    businessName: string,
    country: string,
    currency: string,
    otp: string,
  ) => Promise<void>;
  sendLoginOtp: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

import React from 'react';

const AuthCtx = createContext<AuthContext | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<MobileSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSession().then((s) => {
      setSession(s);
      setIsLoading(false);
    });
  }, []);

  async function login(email: string, password: string, otp: string) {
    const s = await verifyOtp(email, otp, password);
    await saveSession(s);
    setSession(s);
    router.replace('/(tabs)/dashboard');
  }

  async function register(
    email: string,
    password: string,
    name: string,
    businessName: string,
    country: string,
    currency: string,
    otp: string,
  ) {
    const s = await registerAndVerify(email, password, name, businessName, country, currency, otp);
    await saveSession(s);
    setSession(s);
    router.replace('/(tabs)/dashboard');
  }

  async function logout() {
    await clearSession();
    setSession(null);
    router.replace('/(auth)/login');
  }

  return React.createElement(
    AuthCtx.Provider,
    { value: { session, isLoading, login, register, sendLoginOtp: sendOtp, logout } },
    children,
  );
}

export function useAuth(): AuthContext {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
