"use client";
import { useState } from "react";
import Link from "next/link";

const FEATURES = [
  {
    icon: "🤖",
    ar: { title: "قراءة الفواتير بالذكاء الاصطناعي", desc: "ارفع صورة أو PDF لأي فاتورة وسيستخرج النظام البيانات تلقائياً ويقترح القيود المحاسبية." },
    en: { title: "AI Invoice Scanning", desc: "Upload any invoice image or PDF — the AI extracts data and suggests the journal entries automatically." },
  },
  {
    icon: "📒",
    ar: { title: "دفتر يومية مزدوج القيد", desc: "محرك محاسبي احترافي بالقيد المزدوج. كل حركة مالية = قيد متوازن. القوائم المالية تُحسب مباشرة من الدفتر." },
    en: { title: "Double-Entry Ledger", desc: "Professional double-entry accounting engine. Every transaction is a balanced journal entry. Financial statements computed directly from the ledger." },
  },
  {
    icon: "📊",
    ar: { title: "تقارير مالية فورية", desc: "قائمة الدخل، الميزانية العمومية، دفتر الأستاذ — كلها جاهزة في ثوانٍ دون إدخال يدوي." },
    en: { title: "Instant Financial Reports", desc: "Income statement, balance sheet, general ledger — all ready in seconds, no manual input required." },
  },
  {
    icon: "⚡",
    ar: { title: "فاتورة إلكترونية متوافقة", desc: "دعم كامل لـ JoFotara (الأردن)، ETA (مصر)، ZATCA (السعودية) — مع رمز QR ضريبي تلقائي للسعودية." },
    en: { title: "E-Invoice Compliance", desc: "Full support for JoFotara (Jordan), ETA (Egypt), ZATCA (Saudi Arabia) — with automatic tax QR codes for Saudi invoices." },
  },
  {
    icon: "💬",
    ar: { title: "مساعد مالي ذكي", desc: "اسأل بالعربية أو الإنجليزية: «ما ربحي هذا الشهر؟» — يجيبك النظام بناءً على بياناتك الفعلية." },
    en: { title: "AI Financial Assistant", desc: "Ask in Arabic or English: \"What's my profit this month?\" — answers are based on your real data." },
  },
  {
    icon: "🌍",
    ar: { title: "8 دول عربية", desc: "الأردن، مصر، السعودية، الإمارات، الكويت، البحرين، قطر، عُمان — عملة وضريبة وفاتورة صحيحة لكل دولة." },
    en: { title: "8 Arab Countries", desc: "Jordan, Egypt, Saudi Arabia, UAE, Kuwait, Bahrain, Qatar, Oman — correct currency, tax rate, and invoice format per country." },
  },
];

const PRICING = [
  {
    id: "STARTER",
    price: "$69",
    ar: { name: "المبتدئ", period: "/شهر", features: ["50 فاتورة/شهر", "20 سؤال AI/شهر", "رفع الفواتير", "إنشاء الفواتير", "دفتر اليومية", "دعم عملاء"] },
    en: { name: "Starter", period: "/mo", features: ["50 invoices/month", "20 AI queries/month", "Invoice scanning", "Invoice creation", "Journal ledger", "Customer support"] },
    highlight: false,
  },
  {
    id: "PRO",
    price: "$149",
    ar: { name: "الاحترافي", period: "/شهر", features: ["500 فاتورة/شهر", "AI غير محدود", "كل مميزات المبتدئ", "3 مستخدمين", "تقارير متقدمة", "دعم أولوية"] },
    en: { name: "Pro", period: "/mo", features: ["500 invoices/month", "Unlimited AI", "Everything in Starter", "3 users", "Advanced reports", "Priority support"] },
    highlight: true,
  },
  {
    id: "BUSINESS",
    price: "$199",
    ar: { name: "الأعمال", period: "/شهر", features: ["فواتير غير محدودة", "AI غير محدود", "كل مميزات الاحترافي", "10 مستخدمين", "API access", "دعم VIP"] },
    en: { name: "Business", period: "/mo", features: ["Unlimited invoices", "Unlimited AI", "Everything in Pro", "10 users", "API access", "VIP support"] },
    highlight: false,
  },
];

const COUNTRIES = [
  { flag: "🇯🇴", ar: "الأردن", en: "Jordan", system: "JoFotara" },
  { flag: "🇪🇬", ar: "مصر", en: "Egypt", system: "ETA" },
  { flag: "🇸🇦", ar: "السعودية", en: "Saudi Arabia", system: "ZATCA" },
  { flag: "🇦🇪", ar: "الإمارات", en: "UAE", system: "" },
  { flag: "🇰🇼", ar: "الكويت", en: "Kuwait", system: "" },
  { flag: "🇧🇭", ar: "البحرين", en: "Bahrain", system: "" },
  { flag: "🇶🇦", ar: "قطر", en: "Qatar", system: "" },
  { flag: "🇴🇲", ar: "عُمان", en: "Oman", system: "" },
];

export default function LandingPage() {
  const [lang, setLang] = useState<"ar" | "en">("ar");
  const isAr = lang === "ar";

  return (
    <div className={`min-h-screen bg-white ${isAr ? "font-cairo" : "font-inter"}`} dir={isAr ? "rtl" : "ltr"}>
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="text-xl font-bold text-blue-700">Mohasabai · محاسباي</div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLang(isAr ? "en" : "ar")}
              className="text-sm text-gray-500 hover:text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
            >
              {isAr ? "English" : "عربي"}
            </button>
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5">
              {isAr ? "تسجيل الدخول" : "Sign In"}
            </Link>
            <Link href="/register" className="btn-primary text-sm">
              {isAr ? "ابدأ مجاناً" : "Start Free"}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 text-white">
        <div className="max-w-6xl mx-auto px-4 py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 border border-white/25 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            ✨ {isAr ? "35 يوم تجربة مجانية — بدون بطاقة ائتمان" : "35-day free trial — no credit card required"}
          </div>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
            {isAr ? (
              <>محاسبة ذكية<br /><span className="text-blue-200">لأعمالك العربية</span></>
            ) : (
              <>Smart Accounting<br /><span className="text-blue-200">for Arab Businesses</span></>
            )}
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto mb-10 leading-relaxed">
            {isAr
              ? "منصة محاسبة بمساعدة الذكاء الاصطناعي — قراءة الفواتير تلقائياً، قوائم مالية فورية، ومتوافقة مع الفاتورة الإلكترونية في 8 دول عربية."
              : "AI-powered accounting platform — automatic invoice scanning, instant financial reports, and full e-invoice compliance across 8 Arab countries."}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="bg-white text-blue-700 hover:bg-blue-50 font-bold px-8 py-4 rounded-xl text-base transition-colors shadow-lg"
            >
              {isAr ? "ابدأ تجربتك المجانية ←" : "Start Your Free Trial →"}
            </Link>
            <Link
              href="/login"
              className="border border-white/40 hover:border-white text-white hover:bg-white/10 font-medium px-8 py-4 rounded-xl text-base transition-colors"
            >
              {isAr ? "تسجيل الدخول" : "Sign In"}
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto mt-16 pt-10 border-t border-white/20">
            {[
              { num: "8", label: isAr ? "دول عربية" : "Arab countries" },
              { num: "35", label: isAr ? "يوم مجاناً" : "days free" },
              { num: "100%", label: isAr ? "دفتر مزدوج القيد" : "Double-entry" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-3xl font-bold">{s.num}</div>
                <div className="text-blue-200 text-sm mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900">
              {isAr ? "كل ما تحتاجه في منصة واحدة" : "Everything you need in one platform"}
            </h2>
            <p className="text-gray-500 mt-3 text-base max-w-xl mx-auto">
              {isAr
                ? "مصمّمة للمحاسبين وأصحاب الأعمال الصغيرة والمتوسطة في المنطقة العربية"
                : "Designed for accountants and SMB owners across the Arab world"}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.icon} className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md hover:border-blue-200 transition-all">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-gray-900 text-base mb-2">
                  {isAr ? f.ar.title : f.en.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {isAr ? f.ar.desc : f.en.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Countries */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900">
              {isAr ? "متوفر في 8 دول عربية" : "Available in 8 Arab Countries"}
            </h2>
            <p className="text-gray-500 mt-2 text-sm">
              {isAr
                ? "عملة وضريبة وفاتورة إلكترونية صحيحة لكل دولة تلقائياً"
                : "Correct currency, tax rate, and e-invoice format per country — automatically"}
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {COUNTRIES.map((c) => (
              <div key={c.en} className="border border-gray-200 rounded-xl p-4 text-center hover:border-blue-300 hover:bg-blue-50/30 transition-all">
                <div className="text-3xl mb-2">{c.flag}</div>
                <div className="font-semibold text-gray-800 text-sm">{isAr ? c.ar : c.en}</div>
                {c.system && (
                  <div className="text-xs text-blue-600 mt-1 font-medium">{c.system}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900">
              {isAr ? "خطط واضحة بدون مفاجآت" : "Simple, transparent pricing"}
            </h2>
            <p className="text-gray-500 mt-3 text-base">
              {isAr ? "ابدأ مجاناً 35 يوماً — لا بطاقة ائتمان مطلوبة" : "Start free for 35 days — no credit card required"}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {PRICING.map((plan) => {
              const p = isAr ? plan.ar : plan.en;
              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl border-2 p-8 flex flex-col ${
                    plan.highlight
                      ? "border-blue-600 bg-blue-600 text-white shadow-xl scale-105"
                      : "border-gray-200 bg-white text-gray-900"
                  }`}
                >
                  {plan.highlight && (
                    <div className="text-xs font-bold bg-white/20 text-white border border-white/30 rounded-full px-3 py-1 w-fit mb-4">
                      {isAr ? "الأكثر شيوعاً" : "Most Popular"}
                    </div>
                  )}
                  <div className={`text-lg font-bold mb-1 ${plan.highlight ? "text-blue-100" : "text-gray-500"}`}>
                    {p.name}
                  </div>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className={`text-sm ${plan.highlight ? "text-blue-200" : "text-gray-400"}`}>{p.period}</span>
                  </div>
                  <ul className="space-y-3 flex-1 mb-8">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <span className={plan.highlight ? "text-blue-200" : "text-green-500"}>✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/register"
                    className={`text-center font-bold py-3 px-6 rounded-xl transition-colors ${
                      plan.highlight
                        ? "bg-white text-blue-600 hover:bg-blue-50"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {isAr ? "ابدأ مجاناً" : "Start Free"}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-700 to-indigo-700 text-white text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {isAr ? "جاهز لتنظيم محاسبتك؟" : "Ready to organize your accounting?"}
          </h2>
          <p className="text-blue-100 text-lg mb-8">
            {isAr
              ? "انضم إلى أصحاب الأعمال الذين يثقون بمحاسباي لإدارة حساباتهم"
              : "Join business owners who trust Mohasabai to manage their accounts"}
          </p>
          <Link
            href="/register"
            className="bg-white text-blue-700 hover:bg-blue-50 font-bold px-10 py-4 rounded-xl text-base transition-colors shadow-lg inline-block"
          >
            {isAr ? "ابدأ تجربتك المجانية — 35 يوم" : "Start Your Free Trial — 35 Days"}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="text-white font-bold text-lg mb-2">Mohasabai · محاسباي</div>
              <p className="text-sm leading-relaxed">
                {isAr
                  ? "منصة محاسبة بمساعدة الذكاء الاصطناعي للأعمال الصغيرة والمتوسطة في المنطقة العربية."
                  : "AI-powered accounting platform for SMBs across the Arab world."}
              </p>
            </div>
            <div>
              <div className="text-white font-semibold text-sm mb-3">
                {isAr ? "روابط سريعة" : "Quick Links"}
              </div>
              <ul className="space-y-2 text-sm">
                <li><Link href="/login" className="hover:text-white transition-colors">{isAr ? "تسجيل الدخول" : "Sign In"}</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">{isAr ? "إنشاء حساب" : "Create Account"}</Link></li>
              </ul>
            </div>
            <div>
              <div className="text-white font-semibold text-sm mb-3">
                {isAr ? "تواصل معنا" : "Contact"}
              </div>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="mailto:support@mohasabai.com" className="hover:text-white transition-colors">
                    support@mohasabai.com
                  </a>
                </li>
                <li>
                  <a href="mailto:vip@mohasabai.com" className="hover:text-white transition-colors">
                    vip@mohasabai.com {isAr ? "(خطة الأعمال)" : "(Business plan)"}
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 text-center text-xs">
            © {new Date().getFullYear()} Mohasabai. {isAr ? "جميع الحقوق محفوظة." : "All rights reserved."}
          </div>
        </div>
      </footer>
    </div>
  );
}
