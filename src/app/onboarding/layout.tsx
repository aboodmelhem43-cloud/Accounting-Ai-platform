"use client";
import { SessionProvider } from "next-auth/react";
import { LanguageProvider } from "@/components/LanguageProvider";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LanguageProvider>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="text-center pt-10 pb-4">
            <div className="text-3xl font-bold text-blue-700 mb-1">Mohasabai</div>
            <p className="text-gray-500 text-sm">Smart Accounting Platform</p>
          </div>
          {children}
        </div>
      </LanguageProvider>
    </SessionProvider>
  );
}
