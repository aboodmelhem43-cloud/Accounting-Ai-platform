"use client";
import { useState } from "react";
import Link from "next/link";
import { useLang } from "@/components/LanguageProvider";

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

const STEPS = [
  {
    num: "01",
    ar: { title: "أنشئ حسابك", desc: "سجّل منشأتك في دقيقتين. لا بطاقة ائتمان، لا إعداد معقد." },
    en: { title: "Create your account", desc: "Register your business in 2 minutes. No credit card, no complex setup." },
    icon: "🏢",
  },
  {
    num: "02",
    ar: { title: "ارفع فواتيرك أو أنشئها", desc: "ارفع صور الفواتير وسيقرأها الذكاء الاصطناعي، أو أنشئ فاتورتك من الصفر بالتنسيق الصحيح لبلدك." },
    en: { title: "Upload or create invoices", desc: "Upload invoice photos — AI reads them — or create invoices from scratch in your country's correct format." },
    icon: "🧾",
  },
  {
    num: "03",
    ar: { title: "اعرض تقاريرك المالية", desc: "قائمة الدخل، الميزانية، دفتر الأستاذ — كلها محدثة لحظياً بدون أي عمل إضافي." },
    en: { title: "View your financial reports", desc: "Income statement, balance sheet, general ledger — all updated instantly with no extra work." },
    icon: "📊",
  },
];

const COMPARE = [
  {
    feature: { ar: "قراءة الفواتير تلقائياً", en: "Automatic invoice reading" },
    mohasabai: true, excel: false, manual: false,
  },
  {
    feature: { ar: "دفتر مزدوج القيد", en: "Double-entry ledger" },
    mohasabai: true, excel: false, manual: true,
  },
  {
    feature: { ar: "تقارير مالية فورية", en: "Instant financial reports" },
    mohasabai: true, excel: "partial", manual: false,
  },
  {
    feature: { ar: "فاتورة إلكترونية متوافقة", en: "E-invoice compliance" },
    mohasabai: true, excel: false, manual: false,
  },
  {
    feature: { ar: "مساعد AI للأسئلة المالية", en: "AI financial assistant" },
    mohasabai: true, excel: false, manual: false,
  },
  {
    feature: { ar: "دعم 8 دول عربية", en: "8 Arab country support" },
    mohasabai: true, excel: false, manual: false,
  },
  {
    feature: { ar: "لا تحتاج محاسب متفرغ", en: "No full-time accountant needed" },
    mohasabai: true, excel: false, manual: false,
  },
];

const PRICING = [
  {
    id: "STARTER",
    monthlyPrice: 69,
    yearlyPrice: 690,
    localHint: {
      monthly: { ar: "≈ 260 ر.س / 3,500 ج.م", en: "≈ SAR 260 / EGP 3,500" },
      yearly: { ar: "≈ 2,590 ر.س / 35,000 ج.م", en: "≈ SAR 2,590 / EGP 35,000" },
    },
    ar: { name: "المبتدئ", desc: "للأعمال الناشئة", features: ["50 فاتورة/شهر", "20 سؤال AI/شهر", "رفع وإنشاء الفواتير", "دفتر اليومية", "تقارير أساسية", "دعم عملاء"] },
    en: { name: "Starter", desc: "For new businesses", features: ["50 invoices/month", "20 AI queries/month", "Upload & create invoices", "Journal ledger", "Basic reports", "Customer support"] },
    highlight: false,
  },
  {
    id: "PRO",
    monthlyPrice: 149,
    yearlyPrice: 1490,
    localHint: {
      monthly: { ar: "≈ 560 ر.س / 7,500 ج.م", en: "≈ SAR 560 / EGP 7,500" },
      yearly: { ar: "≈ 5,590 ر.س / 75,000 ج.م", en: "≈ SAR 5,590 / EGP 75,000" },
    },
    ar: { name: "الاحترافي", desc: "للأعمال النامية", features: ["500 فاتورة/شهر", "AI غير محدود", "كل مميزات المبتدئ", "3 مستخدمين", "تقارير متقدمة", "دعم أولوية"] },
    en: { name: "Pro", desc: "For growing businesses", features: ["500 invoices/month", "Unlimited AI", "Everything in Starter", "3 users", "Advanced reports", "Priority support"] },
    highlight: true,
  },
  {
    id: "BUSINESS",
    monthlyPrice: 199,
    yearlyPrice: 1990,
    localHint: {
      monthly: { ar: "≈ 746 ر.س / 10,000 ج.م", en: "≈ SAR 746 / EGP 10,000" },
      yearly: { ar: "≈ 7,460 ر.س / 100,000 ج.م", en: "≈ SAR 7,460 / EGP 100,000" },
    },
    ar: { name: "الأعمال", desc: "للشركات المتوسطة", features: ["فواتير غير محدودة", "AI غير محدود", "كل مميزات الاحترافي", "10 مستخدمين", "API access", "دعم VIP"] },
    en: { name: "Business", desc: "For mid-size companies", features: ["Unlimited invoices", "Unlimited AI", "Everything in Pro", "10 users", "API access", "VIP support"] },
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

const FAQS = [
  {
    ar: { q: "هل بياناتي آمنة؟", a: "نعم. كل منشأة معزولة تماماً عن الأخرى. البيانات مشفّرة، والخوادم في مراكز بيانات موثّقة. لا نشارك بياناتك مع أي طرف ثالث." },
    en: { q: "Is my data secure?", a: "Yes. Each business is fully isolated from others. Data is encrypted, hosted on certified data centers. We never share your data with third parties." },
  },
  {
    ar: { q: "هل أحتاج خبرة محاسبية لاستخدام المنصة؟", a: "لا. الواجهة مصممة لأصحاب الأعمال غير المتخصصين. الذكاء الاصطناعي يقترح القيود، وأنت تراجع وتؤكد فقط." },
    en: { q: "Do I need accounting experience?", a: "No. The interface is designed for non-accountants. The AI suggests journal entries, you just review and confirm." },
  },
  {
    ar: { q: "هل المنصة متوافقة مع الفاتورة الإلكترونية في بلدي؟", a: "ندعم JoFotara (الأردن)، ETA (مصر)، وZATCA (السعودية) حالياً — مع توليد رمز QR ضريبي للسعودية. الدول الأخرى ستُضاف قريباً." },
    en: { q: "Is the platform e-invoice compliant in my country?", a: "We support JoFotara (Jordan), ETA (Egypt), and ZATCA (Saudi Arabia) — including automatic tax QR codes for Saudi. Other countries coming soon." },
  },
  {
    ar: { q: "ماذا يحدث بعد انتهاء التجربة المجانية؟", a: "تتلقى إشعاراً قبل الانتهاء. إذا لم تشترك، تبقى بياناتك محفوظة لمدة 30 يوماً إضافية يمكنك خلالها تصديرها." },
    en: { q: "What happens after the free trial ends?", a: "You'll receive a reminder before it expires. If you don't subscribe, your data is kept for 30 more days so you can export it." },
  },
  {
    ar: { q: "هل يمكنني إلغاء الاشتراك في أي وقت؟", a: "نعم. لا عقود، لا رسوم إلغاء. يمكنك الإلغاء من لوحة الإعدادات في أي وقت وتأثيره فوري." },
    en: { q: "Can I cancel anytime?", a: "Yes. No contracts, no cancellation fees. Cancel from your settings panel at any time — effective immediately." },
  },
];

export default function LandingPage() {
  const { lang, toggleLang } = useLang();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const isAr = lang === "ar";

  return (
    <div className={`min-h-screen bg-white ${isAr ? "font-cairo" : "font-inter"}`} dir={isAr ? "rtl" : "ltr"}>
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="text-xl font-bold text-blue-700">Mohasabai · محاسباي</div>
          <div className="flex items-center gap-1 md:gap-3">
            <a href="#how" className="hidden md:block text-sm text-gray-500 hover:text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
              {isAr ? "كيف يعمل" : "How it works"}
            </a>
            <a href="#pricing" className="hidden md:block text-sm text-gray-500 hover:text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
              {isAr ? "الأسعار" : "Pricing"}
            </a>
            <button
              onClick={toggleLang}
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
              ? "ارفع فواتيرك، واتركها للذكاء الاصطناعي. قوائم مالية فورية، فاتورة إلكترونية متوافقة، وبدون محاسب متفرغ."
              : "Upload your invoices and let AI do the rest. Instant financial reports, e-invoice compliance, and no full-time accountant needed."}
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
              { num: "~8h", label: isAr ? "توفير أسبوعي" : "saved/week" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-3xl font-bold">{s.num}</div>
                <div className="text-blue-200 text-sm mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900">
              {isAr ? "كيف يعمل محاسباي؟" : "How does Mohasabai work?"}
            </h2>
            <p className="text-gray-500 mt-3 text-base">
              {isAr ? "ثلاث خطوات فقط للتحكم الكامل بمحاسبتك" : "Just three steps to full control of your accounting"}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* connecting line — desktop only */}
            <div className="hidden md:block absolute top-10 left-1/4 right-1/4 h-0.5 bg-blue-100" />
            {STEPS.map((step, i) => (
              <div key={step.num} className="relative text-center">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 border-2 border-blue-100 flex items-center justify-center text-2xl mx-auto mb-4">
                  {step.icon}
                </div>
                <div className="text-xs font-bold text-blue-400 mb-1 tracking-widest">{step.num}</div>
                <h3 className="font-bold text-gray-900 text-base mb-2">
                  {isAr ? step.ar.title : step.en.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {isAr ? step.ar.desc : step.en.desc}
                </p>
                {i < STEPS.length - 1 && (
                  <div className="md:hidden text-2xl text-blue-200 mt-4">↓</div>
                )}
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

      {/* Comparison table */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              {isAr ? "لماذا محاسباي؟" : "Why Mohasabai?"}
            </h2>
            <p className="text-gray-500 mt-3 text-base">
              {isAr ? "مقارنة مع البدائل الشائعة" : "Compared to common alternatives"}
            </p>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-right px-6 py-4 font-semibold text-gray-600 w-1/2">
                    {isAr ? "الميزة" : "Feature"}
                  </th>
                  <th className="px-4 py-4 font-bold text-blue-700 text-center">
                    {isAr ? "محاسباي" : "Mohasabai"}
                  </th>
                  <th className="px-4 py-4 font-semibold text-gray-400 text-center">Excel</th>
                  <th className="px-4 py-4 font-semibold text-gray-400 text-center">
                    {isAr ? "يدوي" : "Manual"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {COMPARE.map((row) => (
                  <tr key={row.feature.en} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-gray-700 font-medium">
                      {isAr ? row.feature.ar : row.feature.en}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.mohasabai === true && <span className="text-green-500 font-bold text-base">✓</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.excel === true ? (
                        <span className="text-green-500 font-bold text-base">✓</span>
                      ) : row.excel === "partial" ? (
                        <span className="text-yellow-400 font-bold text-base">~</span>
                      ) : (
                        <span className="text-red-300 text-base">✕</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.manual === true ? (
                        <span className="text-green-500 font-bold text-base">✓</span>
                      ) : (
                        <span className="text-red-300 text-base">✕</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Countries */}
      <section className="py-16 bg-gray-50">
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
              <div key={c.en} className="bg-white border border-gray-200 rounded-xl p-4 text-center hover:border-blue-300 hover:bg-blue-50/30 transition-all">
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
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900">
              {isAr ? "خطط واضحة بدون مفاجآت" : "Simple, transparent pricing"}
            </h2>
            <p className="text-gray-500 mt-3 text-base">
              {isAr ? "ابدأ مجاناً 35 يوماً — لا بطاقة ائتمان مطلوبة" : "Start free for 35 days — no credit card required"}
            </p>
          </div>

          {/* Billing toggle */}
          <div className="flex justify-center mb-10">
            <div className="inline-flex items-center bg-gray-100 rounded-xl p-1 gap-1">
              <button
                onClick={() => setBilling("monthly")}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                  billing === "monthly" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {isAr ? "شهري" : "Monthly"}
              </button>
              <button
                onClick={() => setBilling("yearly")}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                  billing === "yearly" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {isAr ? "سنوي" : "Yearly"}
                <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {isAr ? "شهران مجاناً" : "2 months free"}
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {PRICING.map((plan) => {
              const p = isAr ? plan.ar : plan.en;
              const price = billing === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
              const period = billing === "monthly" ? (isAr ? "/شهر" : "/mo") : (isAr ? "/سنة" : "/yr");
              const saving = plan.monthlyPrice * 2;
              const hint = billing === "monthly"
                ? (isAr ? plan.localHint.monthly.ar : plan.localHint.monthly.en)
                : (isAr ? plan.localHint.yearly.ar : plan.localHint.yearly.en);
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
                  <div className={`text-sm font-semibold mb-0.5 ${plan.highlight ? "text-blue-100" : "text-gray-400"}`}>
                    {p.name}
                  </div>
                  <div className={`text-xs mb-3 ${plan.highlight ? "text-blue-200" : "text-gray-400"}`}>
                    {p.desc}
                  </div>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-4xl font-bold">${price}</span>
                    <span className={`text-sm ${plan.highlight ? "text-blue-200" : "text-gray-400"}`}>{period}</span>
                  </div>
                  {billing === "yearly" && (
                    <div className={`text-xs font-semibold mb-1 ${plan.highlight ? "text-green-300" : "text-green-600"}`}>
                      {isAr ? `وفّر $${saving}` : `Save $${saving}`}
                    </div>
                  )}
                  <div className={`text-xs mb-6 ${plan.highlight ? "text-blue-200" : "text-gray-400"}`}>
                    {hint}
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
          <p className="text-center text-xs text-gray-400 mt-8">
            {isAr
              ? "الأسعار بالدولار الأمريكي. المعادلات التقريبية للعملات المحلية معروضة للتوضيح."
              : "Prices in USD. Local currency equivalents shown for reference."}
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              {isAr ? "أسئلة شائعة" : "Frequently Asked Questions"}
            </h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => {
              const f = isAr ? faq.ar : faq.en;
              const isOpen = openFaq === i;
              return (
                <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full text-right px-6 py-4 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-semibold text-gray-800 text-sm">{f.q}</span>
                    <span className={`text-blue-500 text-lg transition-transform flex-shrink-0 ${isOpen ? "rotate-45" : ""}`}>+</span>
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
                      {f.a}
                    </div>
                  )}
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
          <p className="text-blue-100 text-lg mb-2">
            {isAr
              ? "انضم إلى أصحاب الأعمال الذين يثقون بمحاسباي لإدارة حساباتهم"
              : "Join business owners who trust Mohasabai to manage their accounts"}
          </p>
          <p className="text-blue-200 text-sm mb-8">
            {isAr ? "35 يوماً مجاناً — لا بطاقة ائتمان — إلغاء في أي وقت" : "35 days free — no credit card — cancel anytime"}
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
