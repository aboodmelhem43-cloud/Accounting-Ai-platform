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
import {
  isBiometricAvailable,
  isBiometricEnabled,
  setBiometricEnabled,
  authenticateWithBiometric,
} from '@/lib/biometric';
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
  biometricLogin: () => Promise<boolean>;
  enableBiometric: () => Promise<void>;
  disableBiometric: () => Promise<void>;
  canUseBiometric: boolean;
  biometricEnabled: boolean;
}

import React from 'react';

const AuthCtx = createContext<AuthContext | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<MobileSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [canUseBiometric, setCanUseBiometric] = useState(false);
  const [biometricEnabled, setBiometricEnabledState] = useState(false);

  useEffect(() => {
    async function init() {
      const [s, available, enabled] = await Promise.all([
        loadSession(),
        isBiometricAvailable(),
        isBiometricEnabled(),
      ]);
      setSession(s);
      setCanUseBiometric(available);
      setBiometricEnabledState(enabled);
      setIsLoading(false);
    }
    init();
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

  // Returns true if biometric auth succeeded and session was resumed
  async function biometricLogin(): Promise<boolean> {
    const s = await loadSession();
    if (!s) return false;
    const success = await authenticateWithBiometric();
    if (!success) return false;
    setSession(s);
    router.replace('/(tabs)/dashboard');
    return true;
  }

  async function enableBiometric() {
    await setBiometricEnabled(true);
    setBiometricEnabledState(true);
  }

  async function disableBiometric() {
    await setBiometricEnabled(false);
    setBiometricEnabledState(false);
  }

  return React.createElement(
    AuthCtx.Provider,
    {
      value: {
        session,
        isLoading,
        login,
        register,
        sendLoginOtp: sendOtp,
        logout,
        biometricLogin,
        enableBiometric,
        disableBiometric,
        canUseBiometric,
        biometricEnabled,
      },
    },
    children,
  );
}

export function useAuth(): AuthContext {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
