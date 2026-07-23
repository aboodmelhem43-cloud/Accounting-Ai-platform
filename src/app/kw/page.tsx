import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "برنامج محاسبة للكويت | دعم الدينار الكويتي | محاسب اي",
  description:
    "برنامج محاسبة سحابي للشركات الكويتية. دعم الدينار الكويتي، فواتير إلكترونية احترافية، وقوائم مالية فورية. مصمم لبيئة الأعمال الكويتية. جرّبه 35 يوماً مجاناً بدون بطاقة ائتمان.",
  keywords: [
    "برنامج محاسبة الكويت",
    "برنامج محاسبة كويتي",
    "برنامج محاسبة للشركات الكويتية",
    "نظام محاسبة الكويت",
    "برنامج محاسبة الكويت العاصمة",
    "برنامج محاسبة حولي",
    "برنامج فواتير الكويت",
    "محاسبة سحابية الكويت",
    "برنامج محاسبة للمنشآت الصغيرة الكويت",
    "دينار كويتي محاسبة",
    "برنامج محاسبة للمقاولين الكويت",
  ],
  alternates: {
    canonical: "https://www.mohasabai.com/kw",
  },
  openGraph: {
    title: "برنامج محاسبة للكويت | دعم الدينار الكويتي | محاسب اي",
    description:
      "برنامج محاسبة سحابي للشركات الكويتية. فواتير إلكترونية، دينار كويتي، وقوائم مالية فورية. جرّبه مجاناً.",
    url: "https://www.mohasabai.com/kw",
    locale: "ar_KW",
  },
};

const FEATURES = [
  {
    icon: "🧾",
    title: "فواتير إلكترونية احترافية",
    desc: "إصدار فواتير إلكترونية بالدينار الكويتي بتصميم احترافي يليق بعملائك. يدعم الفواتير الضريبية ومذكرات الدائن والمدين.",
  },
  {
    icon: "🤖",
    title: "قراءة الفواتير بالذكاء الاصطناعي",
    desc: "ارفع صورة الفاتورة أو ملف PDF والذكاء الاصطناعي يستخرج البيانات ويُنشئ القيد المحاسبي في ثواني — بالعربي والإنجليزي.",
  },
  {
    icon: "💰",
    title: "تقارير بالدينار الكويتي",
    desc: "قائمة الدخل والميزانية العمومية وقائمة التدفقات النقدية بالدينار الكويتي (KWD) وفق المعايير المحاسبية الدولية.",
  },
  {
    icon: "📊",
    title: "تقارير مالية فورية",
    desc: "احصل على صورة مالية كاملة لشركتك في أي لحظة — بدون انتظار المحاسب أو إعداد ملفات Excel يدوياً.",
  },
  {
    icon: "📁",
    title: "إدارة العملاء والموردين",
    desc: "دليل كامل للعملاء والموردين مع تتبع الذمم المدينة والدائنة وتقارير أعمار الديون التلقائية.",
  },
  {
    icon: "🌐",
    title: "عربي وإنجليزي بالكامل",
    desc: "الواجهة متاحة بالكامل باللغتين العربية والإنجليزية لتناسب بيئة الأعمال متعددة الجنسيات في الكويت.",
  },
];

const FAQS = [
  {
    q: "هل محاسب اي يدعم الدينار الكويتي؟",
    a: "نعم، جميع الفواتير والتقارير والقوائم المالية تعمل بالدينار الكويتي (KWD) بالكامل. يمكنك أيضاً التعامل بعملات متعددة إذا كان عملك يشمل صفقات بعملات أخرى.",
  },
  {
    q: "هل البرنامج مناسب للشركات الصغيرة والمتوسطة في الكويت؟",
    a: "نعم، صُمِّم محاسب اي للمنشآت الصغيرة والمتوسطة. الواجهة بسيطة ولا تحتاج خبرة محاسبية — الذكاء الاصطناعي يُبسّط كل العمليات ويقترح التصنيفات الصحيحة.",
  },
  {
    q: "هل يمكنني تجربة البرنامج مجاناً؟",
    a: "نعم، تحصل على 35 يوماً مجانية بدون بطاقة ائتمان. يمكنك إدخال فواتيرك الحقيقية وإصدار تقاريرك المالية الكاملة خلال فترة التجربة.",
  },
  {
    q: "ما الفرق بين محاسب اي والبرامج الأخرى مثل QuickBooks وZoho Books؟",
    a: "محاسب اي مبني للسوق العربي من الأساس: ذكاء اصطناعي يقرأ الفواتير العربية، واجهة RTL حقيقية، ودعم كامل للدينار الكويتي — وليس مجرد ترجمة لبرنامج غربي.",
  },
  {
    q: "هل بياناتي المالية آمنة في محاسب اي؟",
    a: "نعم. كل منشأة معزولة تماماً عن الأخرى. البيانات مشفّرة وتُخزَّن في مراكز بيانات موثّقة. لا نشارك بياناتك مع أي طرف ثالث.",
  },
];

export default function KuwaitLandingPage() {
  return (
    <div dir="rtl" lang="ar" style={{ fontFamily: "'Cairo', 'Segoe UI', sans-serif", background: "#f8fafc", minHeight: "100vh" }}>

      {/* Nav */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ fontWeight: 800, fontSize: 20, color: "#2563eb", textDecoration: "none" }}>
          محاسب اي
        </Link>
        <div style={{ display: "flex", gap: 12 }}>
          <Link href="/login" style={{ fontSize: 14, color: "#6b7280", textDecoration: "none", padding: "6px 14px" }}>تسجيل الدخول</Link>
          <Link href="/register" style={{ fontSize: 14, background: "#2563eb", color: "#fff", textDecoration: "none", padding: "8px 18px", borderRadius: 8, fontWeight: 600 }}>ابدأ مجاناً</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: 800, margin: "0 auto", padding: "80px 24px 60px", textAlign: "center" }}>
        <div style={{ display: "inline-block", background: "#fef9c3", color: "#713f12", fontSize: 13, fontWeight: 700, padding: "4px 14px", borderRadius: 20, marginBottom: 20 }}>
          🇰🇼 دينار كويتي · السوق الكويتي
        </div>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 46px)", fontWeight: 900, color: "#111827", lineHeight: 1.3, marginBottom: 20 }}>
          برنامج محاسبة للكويت<br />
          <span style={{ color: "#2563eb" }}>بالدينار الكويتي وبالعربي الكامل</span>
        </h1>
        <p style={{ fontSize: 18, color: "#4b5563", lineHeight: 1.8, maxWidth: 600, margin: "0 auto 36px" }}>
          الحل المحاسبي السحابي للشركات الكويتية. فواتير إلكترونية احترافية، قوائم مالية فورية بالدينار الكويتي، وذكاء اصطناعي يقرأ فواتيرك تلقائياً — بواجهة عربية وإنجليزية.
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
          كل ما يحتاجه عملك في الكويت
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

      {/* Callout */}
      <section style={{ background: "#1d4ed8", color: "#fff", padding: "60px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🤖</div>
          <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 16 }}>ذكاء اصطناعي يفهم فواتيرك</h2>
          <p style={{ fontSize: 17, opacity: 0.9, lineHeight: 1.8, marginBottom: 28 }}>
            ارفع صورة الفاتورة أو ملف PDF — سواء كانت بالعربي أو الإنجليزي — والذكاء الاصطناعي يستخرج جميع البيانات ويُنشئ القيد المحاسبي في ثواني. وفّر ساعات من الإدخال اليدوي كل أسبوع.
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
          ابدأ محاسبة شركتك الكويتية اليوم
        </h2>
        <p style={{ color: "#6b7280", marginBottom: 24 }}>35 يوماً مجاناً · بدون بطاقة ائتمان · دعم كامل باللغة العربية والإنجليزية</p>
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
