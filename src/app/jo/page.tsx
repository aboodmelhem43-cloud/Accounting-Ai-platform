import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "برنامج محاسبة للأردن | متوافق مع JoFotara | ضريبة المبيعات 16% | محاسباي",
  description:
    "برنامج محاسبة سحابي للشركات الأردنية. متوافق مع منظومة الفواتير الإلكترونية JoFotara وضريبة المبيعات 16%. دعم الدينار الأردني. جرّبه 35 يوماً مجاناً بدون بطاقة ائتمان.",
  keywords: [
    "برنامج محاسبة الأردن",
    "برنامج محاسبة أردني",
    "برنامج محاسبة للشركات الأردنية",
    "نظام محاسبة الأردن",
    "برنامج محاسبة JoFotara",
    "الفاتورة الإلكترونية الأردن",
    "JoFotara الأردن",
    "ضريبة المبيعات الأردن",
    "برنامج محاسبة عمان",
    "برنامج محاسبة إربد",
    "محاسبة سحابية الأردن",
    "برنامج محاسبة للمنشآت الصغيرة الأردن",
  ],
  alternates: {
    canonical: "https://www.mohasabai.com/jo",
  },
  openGraph: {
    title: "برنامج محاسبة للأردن | متوافق مع JoFotara | محاسباي",
    description:
      "برنامج محاسبة سحابي للشركات الأردنية. متوافق مع JoFotara وضريبة المبيعات 16%. جرّبه مجاناً.",
    url: "https://www.mohasabai.com/jo",
    locale: "ar_JO",
  },
};

const FEATURES = [
  {
    icon: "🧾",
    title: "الفاتورة الإلكترونية JoFotara",
    desc: "إصدار فواتير إلكترونية متوافقة مع منظومة JoFotara التابعة لدائرة ضريبة الدخل والمبيعات في الأردن.",
  },
  {
    icon: "📊",
    title: "ضريبة المبيعات 16%",
    desc: "حساب ضريبة المبيعات تلقائياً بنسبة 16% وإعداد الإقرار الضريبي الشهري جاهزاً للتقديم لدائرة الضريبة.",
  },
  {
    icon: "🤖",
    title: "قراءة الفواتير بالذكاء الاصطناعي",
    desc: "ارفع صورة الفاتورة أو ملف PDF والذكاء الاصطناعي يستخرج البيانات ويُنشئ القيد المحاسبي في ثواني.",
  },
  {
    icon: "💰",
    title: "تقارير بالدينار الأردني",
    desc: "قائمة الدخل والميزانية العمومية وقائمة التدفقات النقدية بالدينار الأردني وفق المعايير المحاسبية المعتمدة.",
  },
  {
    icon: "📁",
    title: "إدارة الموردين والعملاء",
    desc: "دليل كامل للعملاء والموردين مع تتبع الذمم المدينة والدائنة وتقارير أعمار الديون التلقائية.",
  },
  {
    icon: "🌐",
    title: "واجهة عربية بالكامل",
    desc: "مصممة للمستخدم الأردني بمصطلحات محاسبية مألوفة ودعم لغوي كامل باللغتين العربية والإنجليزية.",
  },
];

const FAQS = [
  {
    q: "هل محاسباي متوافق مع منظومة JoFotara في الأردن؟",
    a: "نعم. يدعم محاسباي إصدار الفواتير الإلكترونية المتوافقة مع متطلبات منظومة JoFotara التابعة لدائرة ضريبة الدخل والمبيعات في الأردن.",
  },
  {
    q: "هل يحسب البرنامج ضريبة المبيعات 16% تلقائياً؟",
    a: "نعم، يحسب ضريبة المبيعات تلقائياً بنسبة 16% على الفواتير ويُعدّ الإقرار الضريبي الشهري جاهزاً للمراجعة والتقديم.",
  },
  {
    q: "هل البرنامج مناسب للمنشآت الصغيرة والمتوسطة في الأردن؟",
    a: "نعم، صُمِّم محاسباي للمنشآت الصغيرة والمتوسطة. الواجهة بسيطة ولا تحتاج خبرة محاسبية — الذكاء الاصطناعي يُبسّط كل العمليات.",
  },
  {
    q: "هل يمكنني تجربة البرنامج مجاناً؟",
    a: "نعم، تحصل على 35 يوماً مجانية بدون بطاقة ائتمان. يمكنك إدخال فواتيرك الحقيقية وإصدار تقاريرك المالية خلال فترة التجربة.",
  },
  {
    q: "ما الفرق بين محاسباي والبرامج الأخرى المتاحة في السوق الأردني؟",
    a: "محاسباي يدمج الذكاء الاصطناعي في صميم العمل المحاسبي: يقرأ الفواتير تلقائياً، يُنشئ القيود المحاسبية، ويُجيب عن أسئلتك المالية — وهو مبني من الأساس للسوق العربي وليس ترجمة لبرنامج غربي.",
  },
];

export default function JordanLandingPage() {
  return (
    <div dir="rtl" lang="ar" style={{ fontFamily: "'Cairo', 'Segoe UI', sans-serif", background: "#f8fafc", minHeight: "100vh" }}>

      {/* Nav */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ fontWeight: 800, fontSize: 20, color: "#2563eb", textDecoration: "none" }}>
          محاسباي
        </Link>
        <div style={{ display: "flex", gap: 12 }}>
          <Link href="/login" style={{ fontSize: 14, color: "#6b7280", textDecoration: "none", padding: "6px 14px" }}>تسجيل الدخول</Link>
          <Link href="/register" style={{ fontSize: 14, background: "#2563eb", color: "#fff", textDecoration: "none", padding: "8px 18px", borderRadius: 8, fontWeight: 600 }}>ابدأ مجاناً</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: 800, margin: "0 auto", padding: "80px 24px 60px", textAlign: "center" }}>
        <div style={{ display: "inline-block", background: "#fef3c7", color: "#92400e", fontSize: 13, fontWeight: 700, padding: "4px 14px", borderRadius: 20, marginBottom: 20 }}>
          🇯🇴 متوافق مع JoFotara · السوق الأردني
        </div>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 46px)", fontWeight: 900, color: "#111827", lineHeight: 1.3, marginBottom: 20 }}>
          برنامج محاسبة للأردن<br />
          <span style={{ color: "#2563eb" }}>متوافق مع JoFotara بالكامل</span>
        </h1>
        <p style={{ fontSize: 18, color: "#4b5563", lineHeight: 1.8, maxWidth: 600, margin: "0 auto 36px" }}>
          الحل المحاسبي السحابي للشركات الأردنية. فاتورة إلكترونية JoFotara، ضريبة المبيعات 16%، وقوائم مالية فورية بالدينار الأردني — بواجهة عربية حقيقية.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/register" style={{ background: "#2563eb", color: "#fff", textDecoration: "none", padding: "14px 32px", borderRadius: 10, fontWeight: 700, fontSize: 16 }}>
            ابدأ التجربة المجانية 35 يوماً
          </Link>
          <Link href="/#demo" style={{ background: "#fff", color: "#374151", textDecoration: "none", padding: "14px 24px", borderRadius: 10, fontWeight: 600, fontSize: 15, border: "1px solid #d1d5db" }}>
            شاهد كيف يعمل
          </Link>
        </div>
        <p style={{ marginTop: 14, fontSize: 13, color: "#9ca3af" }}>بدون بطاقة ائتمان · لا عقود · إلغاء في أي وقت</p>
      </section>

      {/* Features */}
      <section style={{ maxWidth: 1000, margin: "0 auto", padding: "0 24px 80px" }}>
        <h2 style={{ textAlign: "center", fontSize: 26, fontWeight: 800, color: "#111827", marginBottom: 8 }}>
          كل ما يحتاجه عملك في الأردن
        </h2>
        <p style={{ textAlign: "center", color: "#6b7280", marginBottom: 48 }}>من الفاتورة الإلكترونية حتى القوائم المالية — في مكان واحد</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          {FEATURES.map((f) => (
            <div key={f.title} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "24px 20px" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>{f.icon}</div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: "#111827", marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* JoFotara callout */}
      <section style={{ background: "#1e3a8a", color: "#fff", padding: "60px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🧾</div>
          <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 16 }}>فاتورة إلكترونية JoFotara جاهزة</h2>
          <p style={{ fontSize: 17, opacity: 0.9, lineHeight: 1.8, marginBottom: 28 }}>
            أصدر فواتير إلكترونية متوافقة مع متطلبات دائرة ضريبة الدخل والمبيعات الأردنية عبر منظومة JoFotara. التنسيق الصحيح وحقول الضريبة المطلوبة — تلقائياً بضغطة واحدة.
          </p>
          <Link href="/register" style={{ background: "#fff", color: "#1e3a8a", textDecoration: "none", padding: "12px 28px", borderRadius: 8, fontWeight: 700, fontSize: 15 }}>
            جرّبها مجاناً الآن
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ maxWidth: 700, margin: "0 auto", padding: "80px 24px" }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "#111827", marginBottom: 36, textAlign: "center" }}>أسئلة شائعة</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {FAQS.map((item) => (
            <div key={item.q} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "20px 24px" }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 8 }}>{item.q}</h3>
              <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.7 }}>{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section style={{ background: "#f1f5f9", borderTop: "1px solid #e5e7eb", padding: "60px 24px", textAlign: "center" }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#111827", marginBottom: 12 }}>
          ابدأ محاسبة شركتك الأردنية اليوم
        </h2>
        <p style={{ color: "#6b7280", marginBottom: 24 }}>35 يوماً مجاناً · بدون بطاقة ائتمان · دعم كامل باللغة العربية</p>
        <Link href="/register" style={{ background: "#2563eb", color: "#fff", textDecoration: "none", padding: "14px 36px", borderRadius: 10, fontWeight: 700, fontSize: 16 }}>
          سجّل مجاناً الآن
        </Link>
        <p style={{ marginTop: 16, fontSize: 13, color: "#9ca3af" }}>
          للمزيد من المعلومات: <a href="mailto:support@mohasabai.com" style={{ color: "#2563eb" }}>support@mohasabai.com</a>
        </p>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQS.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        }}
      />
    </div>
  );
}
