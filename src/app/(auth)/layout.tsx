"use client";
import { SessionProvider } from "next-auth/react";
import { useLang } from "@/components/LanguageProvider";
import Link from "next/link";

const PANEL_FEATURES = [
  { icon: "🤖", ar: "قراءة الفواتير تلقائياً بالذكاء الاصطناعي", en: "AI reads your invoices automatically" },
  { icon: "📒", ar: "دفتر يومية مزدوج القيد احترافي", en: "Professional double-entry ledger" },
  { icon: "📊", ar: "تقارير مالية فورية بدون جهد", en: "Instant financial reports, zero effort" },
  { icon: "⚡", ar: "فاتورة إلكترونية متوافقة مع بلدك", en: "E-invoice compliant for your country" },
];

function FeaturePanel() {
  const { lang } = useLang();
  const isAr = lang === "ar";
  return (
    <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800 text-white p-10 rounded-2xl min-h-[520px]">
      <div>
        <Link href="/" className="inline-block mb-8">
          <div className="text-2xl font-bold">MohasabAi · محاسب اي</div>
          <p className="text-blue-200 text-sm mt-1">
            {isAr ? "منصة محاسبة ذكية للأعمال العربية" : "Smart accounting for Arab businesses"}
          </p>
        </Link>
        <ul className="space-y-6">
          {PANEL_FEATURES.map((f) => (
            <li key={f.icon} className="flex items-start gap-3">
              <span className="text-2xl mt-0.5">{f.icon}</span>
              <span className="text-sm text-blue-100 leading-relaxed">{isAr ? f.ar : f.en}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="bg-white/10 border border-white/20 rounded-xl p-4 text-sm text-blue-100 mt-10">
        ✨ {isAr
          ? "35 يوم تجربة مجانية — بدون بطاقة ائتمان — إلغاء في أي وقت"
          : "35-day free trial — no credit card — cancel anytime"}
      </div>
    </div>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { lang } = useLang();
  const isAr = lang === "ar";
  return (
    <SessionProvider>
      <div
        className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4"
        dir={isAr ? "rtl" : "ltr"}
      >
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <FeaturePanel />
          <div>
            {/* Logo shown only on mobile (hidden when panel is visible) */}
            <div className="text-center mb-8 lg:hidden">
              <Link href="/" className="inline-block">
                <div className="text-3xl font-bold text-blue-700">MohasabAi · محاسب اي</div>
                <p className="text-gray-500 text-sm mt-1">
                  {isAr ? "منصة محاسبة ذكية للأعمال العربية" : "Smart accounting for Arab businesses"}
                </p>
              </Link>
            </div>
            {children}
          </div>
        </div>
      </div>
    </SessionProvider>
  );
}
