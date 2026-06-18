"use client";
import { SessionProvider } from "next-auth/react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="text-4xl font-bold text-blue-700 mb-2">محاسبي</div>
            <p className="text-gray-500 text-sm">منصة المحاسبة الذكية</p>
          </div>
          {children}
        </div>
      </div>
    </SessionProvider>
  );
}
