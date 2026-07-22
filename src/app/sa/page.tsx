import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "برنامج محاسبة للسعودية | متوافق مع ZATCA وضريبة القيمة المضافة | محاسباي",
  description:
    "برنامج محاسبة سحابي للشركات السعودية. متوافق مع فاتورة ZATCA الإلكترونية، ضريبة القيمة المضافة 15%، ويدعم اللغة العربية. جرّبه 35 يوماً مجاناً بدون بطاقة ائتمان.",
  keywords: [
    "برنامج محاسبة السعودية",
    "برنامج محاسبة سعودي",
    "برنامج محاسبة للشركات السعودية",
    "نظام محاسبة السعودية",
    "برنامج محاسبة ZATCA",
    "فاتورة إلكترونية السعودية",
    "فاتورة ضريبية ZATCA",
    "برنامج محاسبة الرياض",
    "برنامج محاسبة جدة",
    "ضريبة القيمة المضافة السعودية",
    "برنامج المحاسبة للمشاريع الصغيرة السعودية",
    "نظام ERP سعودي للشركات الصغيرة",
  ],
  alternates: {
    canonical: "https://www.mohasabai.com/sa",
  },
  openGraph: {
    title: "برنامج محاسبة للسعودية | متوافق مع ZATCA | محاسباي",
    description:
      "برنامج محاسبة سحابي للشركات السعودية. متوافق مع ZATCA وضريبة القيمة المضافة 15%. جرّبه مجاناً.",
    url: "https://www.mohasabai.com/sa",
    locale: "ar_SA",
  },
};

const FEATURES = [
  {
    icon: "🧾",
    title: "فاتورة إلكترونية ZATCA",
    desc: "إصدار فواتير ضريبية متوافقة مع متطلبات هيئة الزكاة والضريبة والجمارك مع رمز QR تلقائي.",
  },
  {
    icon: "📊",
    title: "ضريبة القيمة المضافة 15%",
    desc: "حساب ضريبة القيمة المضافة تلقائياً على كل فاتورة وإعداد الإقرار الضريبي الشهري والربع سنوي.",
  },
  {
    icon: "🤖",
    title: "قراءة الفواتير بالذكاء الاصطناعي",
    desc: "ارفع صورة الفاتورة أو PDF والذكاء الاصطناعي يستخرج البيانات ويُنشئ القيد المحاسبي في ثواني.",
  },
  {
    icon: "📈",
    title: "قوائم مالية بالريال السعودي",
    desc: "قائمة الدخل والميزانية العمومية وقائمة التدفقات النقدية جاهزة في أي وقت بالريال السعودي.",
  },
  {
    icon: "🔒",
    title: "بيانات آمنة ومعزولة",
    desc: "بيانات كل شركة معزولة تماماً. مشفّرة ومخزّنة في مراكز بيانات موثّقة.",
  },
  {
    icon: "🌐",
    title: "واجهة عربية كاملة",
    desc: "مصممة من الأساس للمستخدم العربي. دعم اللغتين العربية والإنجليزية في كل صفحة.",
  },
];

const FAQS = [
  {
    q: "هل محاسباي متوافق مع ZATCA في السعودية؟",
    a: "نعم. يدعم محاسباي الفاتورة الإلكترونية المتوافقة مع متطلبات هيئة الزكاة والضريبة والجمارك (ZATCA) مع توليد رمز QR الضريبي تلقائياً على كل فاتورة.",
  },
  {
    q: "هل يحسب البرنامج ضريبة القيمة المضافة 15% تلقائياً؟",
    a: "نعم، يحسب ضريبة القيمة المضافة تلقائياً على المبيعات والمشتريات، ويُعدّ تقرير الإقرار الضريبي الشهري والربع سنوي جاهزاً للتقديم.",
  },
  {
    q: "هل يمكنني تجربة البرنامج مجاناً؟",
    a: "نعم، تحصل على 35 يوماً مجانية بدون بطاقة ائتمان. يمكنك إدخال فواتيرك وإصدار تقاريرك المالية خلال فترة التجربة.",
  },
  {
    q: "هل البرنامج مناسب للمشاريع الصغيرة والمتوسطة؟",
    a: "نعم، صُمِّم محاسباي خصيصاً للمشاريع الصغيرة والمتوسطة في السعودية. لا تحتاج خبرة محاسبية — الذكاء الاصطناعي يُبسّط كل العمليات.",
  },
  {
    q: "كيف تختلف محاسباي عن QuickBooks وZoho Books؟",
    a: "محاسباي مبنية من الأساس للسوق السعودي والعربي: واجهة عربية حقيقية، امتثال ZATCA مدمج، ودعم للممارسات المحاسبية المحلية — بدلاً من ترجمة برامج غربية.",
  },
];

export default function SaudiLandingPage() {
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
        <div style={{ display: "inline-block", background: "#dbeafe", color: "#1d4ed8", fontSize: 13, fontWeight: 700, padding: "4px 14px", borderRadius: 20, marginBottom: 20 }}>
          🇸🇦 متوافق مع ZATCA · السوق السعودي
        </div>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 46px)", fontWeight: 900, color: "#111827", lineHeight: 1.3, marginBottom: 20 }}>
          برنامج محاسبة للسعودية<br />
          <span style={{ color: "#2563eb" }}>متوافق مع ZATCA بالكامل</span>
        </h1>
        <p style={{ fontSize: 18, color: "#4b5563", lineHeight: 1.8, maxWidth: 600, margin: "0 auto 36px" }}>
          الحل المحاسبي الأول المصمم للشركات السعودية الصغيرة والمتوسطة. فاتورة إلكترونية ZATCA، ضريبة القيمة المضافة 15%، وقوائم مالية فورية — كل ذلك بواجهة عربية بالكامل.
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
          كل ما يحتاجه عملك في السعودية
        </h2>
        <p style={{ textAlign: "center", color: "#6b7280", marginBottom: 48 }}>من الفاتورة الضريبية حتى القوائم المالية — في مكان واحد</p>
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

      {/* ZATCA callout */}
      <section style={{ background: "#1d4ed8", color: "#fff", padding: "60px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🧾</div>
          <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 16 }}>فاتورة إلكترونية ZATCA جاهزة</h2>
          <p style={{ fontSize: 17, opacity: 0.9, lineHeight: 1.8, marginBottom: 28 }}>
            أصدر فواتير ضريبية متوافقة مع متطلبات هيئة الزكاة والضريبة والجمارك. رمز QR تلقائي، حقول ضريبية صحيحة، وتنسيق PDF احترافي — بضغطة واحدة.
          </p>
          <Link href="/register" style={{ background: "#fff", color: "#1d4ed8", textDecoration: "none", padding: "12px 28px", borderRadius: 8, fontWeight: 700, fontSize: 15 }}>
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
          ابدأ محاسبة شركتك السعودية اليوم
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
