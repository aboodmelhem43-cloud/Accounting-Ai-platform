"use client";
import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useLang } from "@/components/LanguageProvider";
import { FadeIn } from "@/components/ui/FadeIn";
import { CountUp } from "@/components/ui/CountUp";
import { Marquee } from "@/components/ui/Marquee";

type PricingPlan = {
  id: string;
  monthlyPrice: number;
  yearlyPrice: number;
  localHint: { monthly: { ar: string; en: string }; yearly: { ar: string; en: string } };
  ar: { name: string; desc: string; features: string[] };
  en: { name: string; desc: string; features: string[] };
  highlight: boolean;
};

const FEATURES = [
  {
    icon: "🤖", color: "blue",
    ar: { title: "قراءة الفواتير بالذكاء الاصطناعي", desc: "ارفع صورة أو PDF لأي فاتورة وسيستخرج النظام البيانات تلقائياً ويقترح القيود المحاسبية." },
    en: { title: "AI Invoice Scanning", desc: "Upload any invoice image or PDF — the AI extracts data and suggests journal entries automatically." },
  },
  {
    icon: "📒", color: "purple",
    ar: { title: "دفتر يومية مزدوج القيد", desc: "محرك محاسبي احترافي بالقيد المزدوج. كل حركة مالية = قيد متوازن. القوائم المالية تُحسب مباشرة من الدفتر." },
    en: { title: "Double-Entry Ledger", desc: "Professional accounting engine. Every transaction is a balanced journal entry. Financial statements computed directly from the ledger." },
  },
  {
    icon: "📊", color: "green",
    ar: { title: "تقارير مالية فورية", desc: "قائمة الدخل، الميزانية العمومية، دفتر الأستاذ — كلها جاهزة في ثوانٍ دون إدخال يدوي." },
    en: { title: "Instant Financial Reports", desc: "Income statement, balance sheet, general ledger — all ready in seconds, no manual input required." },
  },
  {
    icon: "⚡", color: "blue",
    ar: { title: "فاتورة إلكترونية متوافقة", desc: "دعم كامل لـ JoFotara (الأردن)، ETA (مصر)، ZATCA (السعودية) — مع رمز QR ضريبي تلقائي." },
    en: { title: "E-Invoice Compliance", desc: "Full support for JoFotara (Jordan), ETA (Egypt), ZATCA (Saudi Arabia) — with automatic tax QR codes." },
  },
  {
    icon: "💬", color: "purple",
    ar: { title: "مساعد مالي ذكي", desc: "اسأل بالعربية أو الإنجليزية: «ما ربحي هذا الشهر؟» — يجيبك النظام بناءً على بياناتك الفعلية." },
    en: { title: "AI Financial Assistant", desc: "Ask in Arabic or English: \"What's my profit this month?\" — answers are based on your real data." },
  },
  {
    icon: "🌍", color: "green",
    ar: { title: "8 دول عربية", desc: "الأردن، مصر، السعودية، الإمارات، الكويت، البحرين، قطر، عُمان — عملة وضريبة وفاتورة صحيحة لكل دولة." },
    en: { title: "8 Arab Countries", desc: "Jordan, Egypt, Saudi Arabia, UAE, Kuwait, Bahrain, Qatar, Oman — correct currency, tax, and invoice format per country." },
  },
];

const STEPS = [
  {
    num: "01",
    icon: "🏢",
    ar: { title: "أنشئ حسابك", desc: "سجّل منشأتك في دقيقتين. لا بطاقة ائتمان، لا إعداد معقد. حدّد بلدك ويُضبط كل شيء تلقائياً." },
    en: { title: "Create your account", desc: "Register your business in 2 minutes. No credit card, no complex setup. Pick your country and everything is auto-configured." },
  },
  {
    num: "02",
    icon: "🧾",
    ar: { title: "ارفع فواتيرك", desc: "صوّر أو ارفع الفاتورة — الذكاء الاصطناعي يقرأها ويقترح القيود. أنت تراجع وتؤكد فقط." },
    en: { title: "Upload your invoices", desc: "Photograph or upload invoices — AI reads them and suggests entries. You just review and confirm." },
  },
  {
    num: "03",
    icon: "📊",
    ar: { title: "اعرض تقاريرك المالية", desc: "قائمة الدخل، الميزانية، دفتر الأستاذ — كلها محدثة لحظياً بدون أي عمل إضافي." },
    en: { title: "View your financial reports", desc: "Income statement, balance sheet, general ledger — all updated instantly with no extra work." },
  },
];

const COMPARE = [
  { feature: { ar: "قراءة الفواتير تلقائياً", en: "Automatic invoice reading" }, m: true, e: false, manual: false },
  { feature: { ar: "دفتر مزدوج القيد", en: "Double-entry ledger" }, m: true, e: false, manual: true },
  { feature: { ar: "تقارير مالية فورية", en: "Instant financial reports" }, m: true, e: "partial", manual: false },
  { feature: { ar: "فاتورة إلكترونية متوافقة", en: "E-invoice compliance" }, m: true, e: false, manual: false },
  { feature: { ar: "مساعد AI للأسئلة المالية", en: "AI financial assistant" }, m: true, e: false, manual: false },
  { feature: { ar: "دعم 8 دول عربية", en: "8 Arab country support" }, m: true, e: false, manual: false },
  { feature: { ar: "لا تحتاج محاسب متفرغ", en: "No full-time accountant needed" }, m: true, e: false, manual: false },
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

const TESTIMONIALS = [
  {
    avatar: "🍽️",
    ar: { quote: "وفّرت ساعات كل أسبوع بعد ما بدأت أرفع الفواتير بالذكاء الاصطناعي. القيود بتتسجل لحالها وما عدت أحتاج محاسب خارجي.", name: "صاحب مطعم", country: "🇸🇦 السعودية" },
    en: { quote: "I save hours every week since I started uploading invoices with AI. Entries post themselves — I no longer need an external accountant.", name: "Restaurant Owner", country: "🇸🇦 Saudi Arabia" },
  },
  {
    avatar: "📊",
    ar: { quote: "أخيراً برنامج محاسبة عربي يفهم فاتورة ETA ويولد القيود تلقائياً. التقارير اللي كانت تاخد يومين دلوقتي جاهزة في دقيقتين.", name: "مدير مكتب محاسبة", country: "🇪🇬 مصر" },
    en: { quote: "Finally an Arabic accounting software that understands ETA invoices and auto-generates entries. Reports that took two days now take two minutes.", name: "Accounting Firm Manager", country: "🇪🇬 Egypt" },
  },
  {
    avatar: "🛍️",
    ar: { quote: "الواجهة بسيطة جداً لأي شخص غير متخصص. المساعد الذكي يجاوب على أسئلتي المحاسبية مباشرةً بناءً على بياناتي الفعلية.", name: "صاحبة متجر إلكتروني", country: "🇦🇪 الإمارات" },
    en: { quote: "The interface is simple enough for any non-accountant. The AI assistant answers my accounting questions directly from my real data.", name: "E-commerce Store Owner", country: "🇦🇪 UAE" },
  },
];

function CheckCell({ val }: { val: boolean | string }) {
  if (val === true)      return <span className="lp-check-yes">✓</span>;
  if (val === "partial") return <span className="lp-check-part">~</span>;
  return <span className="lp-check-no">✕</span>;
}

export default function LandingPage({ pricingData }: { pricingData: PricingPlan[] }) {
  const { lang, toggleLang } = useLang();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const isAr = lang === "ar";

  const handleFaq = useCallback((i: number) => {
    setOpenFaq(prev => prev === i ? null : i);
  }, []);

  return (
    <div
      className={`landing-page ${isAr ? "font-cairo" : "font-inter"}`}
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* ── NAV ─────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl" style={{ background: "rgba(5,8,15,.85)", borderBottom: "1px solid rgba(255,255,255,.09)" }}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* logo */}
          <Link href="/" className="flex items-center gap-2.5 text-lg font-bold no-underline" style={{ color: "var(--lp-fg)" }}>
            <div className="lp-logo-mark">M</div>
            <span>Mohasab<span style={{ color: "var(--lp-accent2)" }}>Ai</span></span>
          </Link>

          {/* desktop links */}
          <ul className="hidden md:flex items-center gap-1 list-none" style={{ margin: 0, padding: 0 }}>
            {[
              { href: "#how", ar: "كيف يعمل", en: "How it works" },
              { href: "#features", ar: "المزايا", en: "Features" },
              { href: "#pricing", ar: "الأسعار", en: "Pricing" },
              { href: "/blog", ar: "المدونة", en: "Blog" },
            ].map(l => (
              <li key={l.href}>
                <a href={l.href} className="lp-nav-ghost">{isAr ? l.ar : l.en}</a>
              </li>
            ))}
          </ul>

          {/* actions */}
          <div className="flex items-center gap-2">
            <button onClick={toggleLang} className="lp-nav-ghost">{isAr ? "English" : "عربي"}</button>
            <Link href="/login" className="lp-nav-ghost hidden sm:block">{isAr ? "دخول" : "Sign In"}</Link>
            <Link href="/register" className="lp-btn">{isAr ? "ابدأ مجاناً" : "Start Free"}</Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden text-center" style={{ paddingBlock: "96px 80px" }}>
        <div className="lp-hero-grid" />
        <div className="lp-glow lp-glow-1" />
        <div className="lp-glow lp-glow-2" />
        <div className="lp-glow lp-glow-3" />

        <div className="max-w-6xl mx-auto px-4 relative" style={{ zIndex: 1 }}>
          <FadeIn direction="down" delay={0}>
            <div className="lp-badge mb-6">
              <div className="lp-badge-dot" />
              {isAr ? "35 يوم تجربة مجانية — بدون بطاقة ائتمان" : "35-day free trial — no credit card required"}
            </div>
          </FadeIn>

          <FadeIn direction="up" delay={80}>
            <h1 className="font-extrabold leading-tight mb-5" style={{ fontSize: "clamp(36px,6vw,68px)", letterSpacing: "-1.5px", textWrap: "balance" }}>
              {isAr ? (
                <>محاسبة ذكية<br /><span style={{ color: "var(--lp-accent2)" }}>لأعمالك العربية</span></>
              ) : (
                <>Smart Accounting<br /><span style={{ color: "var(--lp-accent2)" }}>for Arab Businesses</span></>
              )}
            </h1>
          </FadeIn>

          <FadeIn direction="up" delay={160}>
            <p className="mx-auto mb-9" style={{ fontSize: "clamp(15px,2vw,18px)", color: "var(--lp-fg2)", maxWidth: 560, lineHeight: 1.7 }}>
              {isAr
                ? "ارفع فواتيرك، واتركها للذكاء الاصطناعي. قوائم مالية فورية، فاتورة إلكترونية متوافقة، وبدون محاسب متفرغ."
                : "Upload your invoices and let AI do the rest. Instant financial reports, e-invoice compliance, no full-time accountant needed."}
            </p>
          </FadeIn>

          <FadeIn direction="up" delay={240}>
            <div className="flex flex-wrap justify-center gap-3 mb-16">
              <Link href="/register" className="lp-btn-hero solid">
                {isAr ? "ابدأ تجربتك المجانية ←" : "Start Your Free Trial →"}
              </Link>
              <a href="#how" className="lp-btn-hero outline">
                {isAr ? "كيف يعمل ؟" : "How it works"}
              </a>
            </div>
          </FadeIn>

          {/* stats */}
          <FadeIn direction="up" delay={320}>
            <div className="lp-stats">
              <div className="lp-stat">
                <div className="text-3xl font-extrabold mb-1" style={{ letterSpacing: "-1px" }}>
                  <CountUp end={8} suffix="+" />
                </div>
                <div className="text-xs" style={{ color: "var(--lp-fg3)" }}>{isAr ? "دول عربية" : "Arab countries"}</div>
              </div>
              <div className="lp-stat">
                <div className="text-3xl font-extrabold mb-1" style={{ letterSpacing: "-1px" }}>
                  <CountUp end={35} />
                </div>
                <div className="text-xs" style={{ color: "var(--lp-fg3)" }}>{isAr ? "يوم مجاناً" : "days free"}</div>
              </div>
              <div className="lp-stat">
                <div className="text-3xl font-extrabold mb-1" style={{ letterSpacing: "-1px" }}>
                  ~<CountUp end={8} suffix="h" />
                </div>
                <div className="text-xs" style={{ color: "var(--lp-fg3)" }}>{isAr ? "توفير أسبوعي" : "saved/week"}</div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────── */}
      <section id="how" style={{ paddingBlock: "96px", background: "var(--lp-bg2)" }}>
        <div className="max-w-6xl mx-auto px-4">
          <FadeIn direction="up">
            <div className="text-center mb-14">
              <div className="lp-eyebrow mb-3">{isAr ? "كيف يعمل" : "How it works"}</div>
              <h2 className="font-extrabold" style={{ fontSize: "clamp(24px,4vw,40px)", letterSpacing: "-1px", textWrap: "balance" }}>
                {isAr ? "ثلاث خطوات للتحكم الكامل" : "Three steps to full control"}
              </h2>
              <p className="mt-3 text-base mx-auto" style={{ color: "var(--lp-fg2)", maxWidth: 440 }}>
                {isAr ? "من التسجيل حتى القوائم المالية في دقائق — لا خبرة محاسبية مطلوبة" : "From sign-up to financial reports in minutes — no accounting experience required"}
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map((step, i) => (
              <FadeIn key={step.num} direction="up" delay={i * 100}>
                <div className="lp-card lp-step-card relative p-8 h-full">
                  <div className="text-xs font-bold mb-5 font-mono" style={{ color: "var(--lp-accent)", letterSpacing: "2px" }}>— {step.num}</div>
                  <div className="lp-feat-icon blue mb-5 text-2xl">{step.icon}</div>
                  <h3 className="font-bold text-base mb-2" style={{ color: "var(--lp-fg)" }}>
                    {isAr ? step.ar.title : step.en.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--lp-fg2)" }}>
                    {isAr ? step.ar.desc : step.en.desc}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────── */}
      <section id="features" style={{ paddingBlock: "96px", background: "var(--lp-bg)" }}>
        <div className="max-w-6xl mx-auto px-4">
          <FadeIn direction="up">
            <div className="text-center mb-14">
              <div className="lp-eyebrow mb-3">{isAr ? "المزايا" : "Features"}</div>
              <h2 className="font-extrabold" style={{ fontSize: "clamp(24px,4vw,40px)", letterSpacing: "-1px", textWrap: "balance" }}>
                {isAr ? "كل ما تحتاجه في منصة واحدة" : "Everything you need in one platform"}
              </h2>
              <p className="mt-3 text-base mx-auto" style={{ color: "var(--lp-fg2)", maxWidth: 480 }}>
                {isAr ? "مصمّمة للمحاسبين وأصحاب الأعمال في المنطقة العربية" : "Designed for accountants and SMB owners across the Arab world"}
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <FadeIn key={f.icon} direction="up" delay={i * 70}>
                <div className="lp-card p-7 h-full">
                  <div className={`lp-feat-icon ${f.color} mb-5`}>{f.icon}</div>
                  <h3 className="font-bold text-base mb-2" style={{ color: "var(--lp-fg)" }}>
                    {isAr ? f.ar.title : f.en.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--lp-fg2)" }}>
                    {isAr ? f.ar.desc : f.en.desc}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── COUNTRIES MARQUEE ───────────────────────────────────── */}
      <section style={{ paddingBlock: "72px", overflow: "hidden", background: "var(--lp-bg2)" }}>
        <div className="max-w-6xl mx-auto px-4">
          <FadeIn direction="up">
            <div className="text-center mb-10">
              <div className="lp-eyebrow mb-3">{isAr ? "التغطية الجغرافية" : "Geographic coverage"}</div>
              <h2 className="font-extrabold" style={{ fontSize: "clamp(20px,3vw,28px)", letterSpacing: "-0.5px" }}>
                {isAr ? "متوفر في 8 دول عربية" : "Available in 8 Arab Countries"}
              </h2>
            </div>
          </FadeIn>
        </div>
        <Marquee speed={30}>
          {COUNTRIES.map(c => (
            <div key={c.en} className="lp-country-chip shrink-0">
              <span className="text-2xl">{c.flag}</span>
              <div>
                <div className="text-sm font-semibold" style={{ color: "var(--lp-fg)" }}>{isAr ? c.ar : c.en}</div>
                {c.system && <div className="text-xs font-mono" style={{ color: "var(--lp-accent2)" }}>{c.system}</div>}
              </div>
            </div>
          ))}
        </Marquee>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────────── */}
      <section style={{ paddingBlock: "96px", background: "var(--lp-bg)" }}>
        <div className="max-w-6xl mx-auto px-4">
          <FadeIn direction="up">
            <div className="text-center mb-12">
              <div className="lp-eyebrow mb-3">{isAr ? "آراء العملاء" : "Customer reviews"}</div>
              <h2 className="font-extrabold" style={{ fontSize: "clamp(24px,4vw,40px)", letterSpacing: "-1px" }}>
                {isAr ? "ماذا يقول عملاؤنا" : "What our customers say"}
              </h2>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => {
              const item = isAr ? t.ar : t.en;
              return (
                <FadeIn key={i} direction="up" delay={i * 100}>
                  <div className="lp-card p-7 flex flex-col h-full">
                    <div className="text-yellow-400 text-sm mb-4" style={{ letterSpacing: "1px" }}>★★★★★</div>
                    <p className="text-sm leading-relaxed flex-1 mb-6" style={{ color: "var(--lp-fg2)", fontStyle: "italic" }}>
                      &ldquo;{item.quote}&rdquo;
                    </p>
                    <div className="flex items-center gap-3 pt-4" style={{ borderTop: "1px solid var(--lp-border)" }}>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0"
                        style={{ background: "linear-gradient(135deg, rgba(79,142,255,.2), rgba(155,111,255,.2))", border: "1px solid var(--lp-border)" }}>
                        {t.avatar}
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "var(--lp-fg)" }}>{item.name}</p>
                        <p className="text-xs" style={{ color: "var(--lp-fg3)" }}>{item.country}</p>
                      </div>
                    </div>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── COMPARE TABLE ───────────────────────────────────────── */}
      <section style={{ paddingBlock: "96px", background: "var(--lp-bg2)" }}>
        <div className="max-w-4xl mx-auto px-4">
          <FadeIn direction="up">
            <div className="text-center mb-12">
              <div className="lp-eyebrow mb-3">{isAr ? "المقارنة" : "Comparison"}</div>
              <h2 className="font-extrabold" style={{ fontSize: "clamp(24px,4vw,40px)", letterSpacing: "-1px" }}>
                {isAr ? "لماذا محاسب Ai؟" : "Why MohasabAi?"}
              </h2>
            </div>
          </FadeIn>
          <FadeIn direction="up" delay={100}>
            <div className="overflow-x-auto" style={{ borderRadius: 20, border: "1px solid var(--lp-border)" }}>
              <table className="lp-table">
                <thead>
                  <tr>
                    <th>{isAr ? "الميزة" : "Feature"}</th>
                    <th style={{ color: "var(--lp-accent2)" }}>{isAr ? "محاسب Ai" : "MohasabAi"}</th>
                    <th style={{ color: "var(--lp-fg3)" }}>Excel</th>
                    <th style={{ color: "var(--lp-fg3)" }}>{isAr ? "يدوي" : "Manual"}</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARE.map(row => (
                    <tr key={row.feature.en}>
                      <td>{isAr ? row.feature.ar : row.feature.en}</td>
                      <td><CheckCell val={row.m} /></td>
                      <td><CheckCell val={row.e} /></td>
                      <td><CheckCell val={row.manual} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────────────── */}
      <section id="pricing" style={{ paddingBlock: "96px", background: "var(--lp-bg)" }}>
        <div className="max-w-6xl mx-auto px-4">
          <FadeIn direction="up">
            <div className="text-center mb-10">
              <div className="lp-eyebrow mb-3">{isAr ? "الأسعار" : "Pricing"}</div>
              <h2 className="font-extrabold" style={{ fontSize: "clamp(24px,4vw,40px)", letterSpacing: "-1px" }}>
                {isAr ? "خطط واضحة بدون مفاجآت" : "Simple, transparent pricing"}
              </h2>
              <p className="mt-3 text-base" style={{ color: "var(--lp-fg2)" }}>
                {isAr ? "ابدأ مجاناً 35 يوماً — لا بطاقة ائتمان مطلوبة" : "Start free for 35 days — no credit card required"}
              </p>
            </div>
          </FadeIn>

          {/* billing toggle */}
          <div className="flex justify-center mb-10">
            <div className="lp-toggle">
              <button
                className={`lp-toggle-btn font-cairo${billing === "monthly" ? " active" : ""}`}
                onClick={() => setBilling("monthly")}
              >
                {isAr ? "شهري" : "Monthly"}
              </button>
              <button
                className={`lp-toggle-btn font-cairo${billing === "yearly" ? " active" : ""}`}
                onClick={() => setBilling("yearly")}
              >
                {isAr ? "سنوي" : "Yearly"}
                <span className="lp-save-badge">{isAr ? "شهران مجاناً" : "2 months free"}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto items-start">
            {pricingData.map(plan => {
              const p = isAr ? plan.ar : plan.en;
              const price = billing === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
              const period = billing === "monthly" ? (isAr ? "/شهر" : "/mo") : (isAr ? "/سنة" : "/yr");
              const hint = billing === "monthly"
                ? (isAr ? plan.localHint.monthly.ar : plan.localHint.monthly.en)
                : (isAr ? plan.localHint.yearly.ar : plan.localHint.yearly.en);
              return (
                <FadeIn key={plan.id} direction="up" delay={pricingData.indexOf(plan) * 80}>
                  <div className={`lp-card p-8 flex flex-col${plan.highlight ? " lp-price-featured" : ""}`}>
                    {plan.highlight && (
                      <div className="lp-popular mb-5">★ {isAr ? "الأكثر شيوعاً" : "Most Popular"}</div>
                    )}
                    <div className="text-sm font-semibold mb-1" style={{ color: plan.highlight ? "var(--lp-accent3)" : "var(--lp-fg2)" }}>
                      {p.name}
                    </div>
                    <div className="text-xs mb-5" style={{ color: plan.highlight ? "rgba(160,196,255,.55)" : "var(--lp-fg3)" }}>
                      {p.desc}
                    </div>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-xl font-semibold font-inter" style={{ color: plan.highlight ? "var(--lp-accent3)" : "var(--lp-fg2)" }}>$</span>
                      <span className="font-extrabold font-inter" style={{ fontSize: 48, letterSpacing: "-2px", lineHeight: 1 }}>{price}</span>
                      <span className="text-sm pb-1.5" style={{ color: plan.highlight ? "rgba(160,196,255,.5)" : "var(--lp-fg3)" }}>{period}</span>
                    </div>
                    <div className="text-xs mb-7" style={{ color: plan.highlight ? "rgba(160,196,255,.5)" : "var(--lp-fg3)" }}>{hint}</div>
                    <ul className="flex flex-col gap-3 flex-1 mb-7" style={{ listStyle: "none", padding: 0, margin: 0 }}>
                      {p.features.map(f => (
                        <li key={f} className="flex items-start gap-2.5 text-sm" style={{ color: plan.highlight ? "rgba(228,233,245,.8)" : "var(--lp-fg2)" }}>
                          <div className="lp-check">✓</div>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link href="/register" className={`lp-plan-btn${plan.highlight ? " solid" : " outline"}`}>
                      {isAr ? "ابدأ مجاناً" : "Start Free"}
                    </Link>
                  </div>
                </FadeIn>
              );
            })}
          </div>

          <p className="text-center mt-8" style={{ fontSize: 12, color: "var(--lp-fg3)" }}>
            {isAr
              ? "الأسعار بالدولار الأمريكي. المعادلات التقريبية للعملات المحلية معروضة للتوضيح."
              : "Prices in USD. Local currency equivalents shown for reference."}
          </p>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────── */}
      <section style={{ paddingBlock: "96px", background: "var(--lp-bg2)" }}>
        <div className="max-w-3xl mx-auto px-4">
          <FadeIn direction="up">
            <div className="text-center mb-12">
              <div className="lp-eyebrow mb-3">{isAr ? "الأسئلة الشائعة" : "FAQ"}</div>
              <h2 className="font-extrabold" style={{ fontSize: "clamp(24px,4vw,40px)", letterSpacing: "-1px" }}>
                {isAr ? "أسئلة وأجوبة" : "Frequently Asked Questions"}
              </h2>
            </div>
          </FadeIn>

          <div className="flex flex-col gap-2">
            {FAQS.map((faq, i) => {
              const f = isAr ? faq.ar : faq.en;
              const isOpen = openFaq === i;
              return (
                <FadeIn key={i} direction="up" delay={i * 50}>
                  <div className={`lp-faq-item${isOpen ? " open" : ""}`} style={{ background: "var(--lp-surf)", border: `1px solid ${isOpen ? "var(--lp-border2)" : "var(--lp-border)"}`, borderRadius: 14, overflow: "hidden", transition: "border-color .15s" }}>
                    <button
                      onClick={() => handleFaq(i)}
                      className="w-full text-start px-6 py-5 flex items-center justify-between gap-4"
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--lp-fg)", fontFamily: "inherit" }}
                    >
                      <span className="font-semibold text-sm">{f.q}</span>
                      <div className="lp-faq-icon lp-faq-icon-el">+</div>
                    </button>
                    <div className="lp-faq-answer px-6 pb-5 text-sm leading-relaxed" style={{ color: "var(--lp-fg2)", borderTop: "1px solid var(--lp-border)", paddingTop: 14 }}>
                      {f.a}
                    </div>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden text-center" style={{ paddingBlock: "96px", background: "var(--lp-bg)" }}>
        <div className="lp-cta-glow" />
        <div className="lp-hero-grid" style={{ opacity: .5 }} />
        <div className="max-w-3xl mx-auto px-4 relative" style={{ zIndex: 1 }}>
          <FadeIn direction="up">
            <h2 className="font-extrabold mb-4" style={{ fontSize: "clamp(28px,5vw,52px)", letterSpacing: "-1.5px", textWrap: "balance", lineHeight: 1.15 }}>
              {isAr ? "جاهز لتنظيم محاسبتك؟" : "Ready to organize your accounting?"}
            </h2>
            <p className="text-base mb-3" style={{ color: "var(--lp-fg2)" }}>
              {isAr
                ? "انضم إلى أصحاب الأعمال الذين يثقون بمحاسب Ai لإدارة حساباتهم"
                : "Join business owners who trust MohasabAi to manage their accounts"}
            </p>
            <div className="flex justify-center flex-wrap gap-2 mb-9">
              {[
                { ar: "35 يوماً مجاناً", en: "35 days free" },
                { ar: "لا بطاقة ائتمان", en: "No credit card" },
                { ar: "إلغاء في أي وقت", en: "Cancel anytime" },
              ].map(pill => (
                <div key={pill.en} className="lp-pill">
                  <div className="lp-pill-dot" />
                  {isAr ? pill.ar : pill.en}
                </div>
              ))}
            </div>
            <Link href="/register" className="lp-btn-hero solid" style={{ fontSize: 16, padding: "16px 36px" }}>
              {isAr ? "ابدأ تجربتك المجانية — 35 يوم →" : "Start Your Free Trial — 35 Days →"}
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────── */}
      <footer style={{ background: "var(--lp-bg)", borderTop: "1px solid var(--lp-border)", paddingBlock: "56px 32px" }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="lp-logo-mark">M</div>
                <span className="font-bold text-lg" style={{ color: "var(--lp-fg)" }}>
                  Mohasab<span style={{ color: "var(--lp-accent2)" }}>Ai</span>
                </span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "var(--lp-fg3)", maxWidth: 220 }}>
                {isAr
                  ? "منصة محاسبة بمساعدة الذكاء الاصطناعي للأعمال الصغيرة والمتوسطة في المنطقة العربية."
                  : "AI-powered accounting platform for SMBs across the Arab world."}
              </p>
            </div>

            <div>
              <div className="text-sm font-bold mb-4" style={{ color: "var(--lp-fg)" }}>{isAr ? "روابط سريعة" : "Quick Links"}</div>
              <ul className="flex flex-col gap-2.5" style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {[
                  { href: "/login", ar: "تسجيل الدخول", en: "Sign In" },
                  { href: "/register", ar: "إنشاء حساب", en: "Create Account" },
                  { href: "#pricing", ar: "الأسعار", en: "Pricing" },
                  { href: "/blog", ar: "المدونة", en: "Blog" },
                ].map(l => (
                  <li key={l.href}><Link href={l.href} className="lp-footer-link">{isAr ? l.ar : l.en}</Link></li>
                ))}
              </ul>
            </div>

            <div>
              <div className="text-sm font-bold mb-4" style={{ color: "var(--lp-fg)" }}>{isAr ? "الدول" : "Countries"}</div>
              <ul className="flex flex-col gap-2.5" style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {[
                  { href: "/jo", ar: "الأردن — JoFotara", en: "Jordan — JoFotara" },
                  { href: "/eg", ar: "مصر — ETA", en: "Egypt — ETA" },
                  { href: "/sa", ar: "السعودية — ZATCA", en: "Saudi Arabia — ZATCA" },
                  { href: "/ae", ar: "الإمارات", en: "UAE" },
                ].map(l => (
                  <li key={l.href}><Link href={l.href} className="lp-footer-link">{isAr ? l.ar : l.en}</Link></li>
                ))}
              </ul>
            </div>

            <div>
              <div className="text-sm font-bold mb-4" style={{ color: "var(--lp-fg)" }}>{isAr ? "الدعم" : "Support"}</div>
              <ul className="flex flex-col gap-2.5" style={{ listStyle: "none", padding: 0, margin: 0 }}>
                <li><a href="mailto:support@mohasabai.com" className="lp-footer-link">support@mohasabai.com</a></li>
                <li><Link href="/privacy" className="lp-footer-link">{isAr ? "سياسة الخصوصية" : "Privacy Policy"}</Link></li>
                <li><Link href="/terms" className="lp-footer-link">{isAr ? "شروط الاستخدام" : "Terms of Use"}</Link></li>
              </ul>
            </div>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-3 pt-6" style={{ borderTop: "1px solid var(--lp-border)" }}>
            <span style={{ fontSize: 12.5, color: "var(--lp-fg3)" }}>
              © 2025 MohasabAi · محاسب Ai. {isAr ? "جميع الحقوق محفوظة." : "All rights reserved."}
            </span>
            <span style={{ fontSize: 12.5, color: "var(--lp-fg3)", fontFamily: "Inter, sans-serif" }}>
              Made with ❤️ for Arab businesses
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
