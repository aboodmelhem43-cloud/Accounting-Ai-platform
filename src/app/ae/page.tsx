import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "برنامج محاسبة للإمارات | ضريبة القيمة المضافة 5% | محاسباي",
  description:
    "برنامج محاسبة سحابي للشركات الإماراتية. ضريبة القيمة المضافة 5%، الفاتورة الإلكترونية، ودعم الدرهم الإماراتي. متوافق مع متطلبات الهيئة الاتحادية للضرائب. جرّبه 35 يوماً مجاناً.",
  keywords: [
    "برنامج محاسبة الإمارات",
    "برنامج محاسبة اماراتي",
    "برنامج محاسبة للشركات الإماراتية",
    "نظام محاسبة الإمارات",
    "برنامج محاسبة دبي",
    "برنامج محاسبة أبوظبي",
    "ضريبة القيمة المضافة الإمارات",
    "الفاتورة الإلكترونية الإمارات",
    "هيئة الضرائب الإماراتية",
    "برنامج محاسبة للمشاريع الصغيرة الإمارات",
    "محاسبة سحابية دبي",
  ],
  alternates: {
    canonical: "https://www.mohasabai.com/ae",
  },
  openGraph: {
    title: "برنامج محاسبة للإمارات | ضريبة القيمة المضافة 5% | محاسباي",
    description:
      "برنامج محاسبة سحابي للشركات الإماراتية. ضريبة القيمة المضافة 5% وفاتورة إلكترونية. جرّبه مجاناً.",
    url: "https://www.mohasabai.com/ae",
    locale: "ar_AE",
  },
};

const FEATURES = [
  { icon: "📊", title: "ضريبة القيمة المضافة 5%", desc: "حساب ضريبة القيمة المضافة تلقائياً بنسبة 5% وإعداد الإقرار الضريبي الفصلي وفق متطلبات الهيئة الاتحادية للضرائب." },
  { icon: "🧾", title: "الفاتورة الإلكترونية", desc: "إصدار فواتير إلكترونية احترافية بالدرهم الإماراتي متوافقة مع المتطلبات الضريبية الإماراتية." },
  { icon: "🤖", title: "ذكاء اصطناعي لقراءة الفواتير", desc: "ارفع صورة الفاتورة أو PDF والذكاء الاصطناعي يستخرج البيانات ويُنشئ القيد المحاسبي في ثواني." },
  { icon: "💱", title: "دعم الدرهم الإماراتي", desc: "تقارير مالية كاملة بالدرهم الإماراتي وفق المعايير المحاسبية المعمول بها في الإمارات." },
  { icon: "📈", title: "قوائم مالية فورية", desc: "قائمة الدخل والميزانية العمومية وقائمة التدفقات النقدية جاهزة في أي وقت — بدون انتظار المحاسب." },
  { icon: "🌐", title: "عربي وإنجليزي", desc: "الواجهة متاحة بالكامل باللغتين العربية والإنجليزية لتناسب بيئة العمل متعددة الثقافات في الإمارات." },
];

const FAQS = [
  { q: "هل محاسباي يحسب ضريبة القيمة المضافة 5% للإمارات؟", a: "نعم، يحسب ضريبة القيمة المضافة تلقائياً بنسبة 5% على المبيعات والمشتريات ويُعدّ الإقرار الضريبي الفصلي جاهزاً للمراجعة." },
  { q: "هل البرنامج مناسب للشركات الصغيرة في دبي وأبوظبي؟", a: "نعم، صُمِّم محاسباي للمشاريع الصغيرة والمتوسطة. الواجهة بسيطة ولا تحتاج خبرة محاسبية. يدعم كلاً من اللغتين العربية والإنجليزية." },
  { q: "هل يمكنني تجربة البرنامج مجاناً؟", a: "نعم، 35 يوماً مجانية بدون بطاقة ائتمان. يمكنك إدخال فواتيرك الحقيقية وإصدار تقاريرك المالية خلال فترة التجربة." },
  { q: "ما الفرق بين محاسباي والبرامج الأخرى مثل Zoho Books وQuickBooks؟", a: "محاسباي مبنية للسوق العربي من الأساس: ذكاء اصطناعي يقرأ الفواتير بالعربي، امتثال ضريبي مدمج للإمارات، وواجهة مصممة لأصحاب الأعمال العرب." },
];

export default function UAELandingPage() {
  return (
    <div dir="rtl" lang="ar" style={{ fontFamily: "'Cairo', 'Segoe UI', sans-serif", background: "#f8fafc", minHeight: "100vh" }}>
      <nav style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ fontWeight: 800, fontSize: 20, color: "#2563eb", textDecoration: "none" }}>محاسباي</Link>
        <div style={{ display: "flex", gap: 12 }}>
          <Link href="/login" style={{ fontSize: 14, color: "#6b7280", textDecoration: "none", padding: "6px 14px" }}>تسجيل الدخول</Link>
          <Link href="/register" style={{ fontSize: 14, background: "#2563eb", color: "#fff", textDecoration: "none", padding: "8px 18px", borderRadius: 8, fontWeight: 600 }}>ابدأ مجاناً</Link>
        </div>
      </nav>

      <section style={{ maxWidth: 800, margin: "0 auto", padding: "80px 24px 60px", textAlign: "center" }}>
        <div style={{ display: "inline-block", background: "#f0fdf4", color: "#166534", fontSize: 13, fontWeight: 700, padding: "4px 14px", borderRadius: 20, marginBottom: 20 }}>
          🇦🇪 ضريبة القيمة المضافة 5% · السوق الإماراتي
        </div>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 46px)", fontWeight: 900, color: "#111827", lineHeight: 1.3, marginBottom: 20 }}>
          برنامج محاسبة للإمارات<br />
          <span style={{ color: "#2563eb" }}>ضريبة القيمة المضافة 5% تلقائياً</span>
        </h1>
        <p style={{ fontSize: 18, color: "#4b5563", lineHeight: 1.8, maxWidth: 600, margin: "0 auto 36px" }}>
          الحل المحاسبي السحابي للشركات الإماراتية. ضريبة القيمة المضافة 5%، فاتورة إلكترونية، وقوائم مالية فورية بالدرهم الإماراتي — بواجهة عربية وإنجليزية.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/register" style={{ background: "#2563eb", color: "#fff", textDecoration: "none", padding: "14px 32px", borderRadius: 10, fontWeight: 700, fontSize: 16 }}>ابدأ التجربة المجانية 35 يوماً</Link>
          <Link href="/#demo" style={{ background: "#fff", color: "#374151", textDecoration: "none", padding: "14px 24px", borderRadius: 10, fontWeight: 600, fontSize: 15, border: "1px solid #d1d5db" }}>شاهد كيف يعمل</Link>
        </div>
        <p style={{ marginTop: 14, fontSize: 13, color: "#9ca3af" }}>بدون بطاقة ائتمان · لا عقود · إلغاء في أي وقت</p>
      </section>

      <section style={{ maxWidth: 1000, margin: "0 auto", padding: "0 24px 80px" }}>
        <h2 style={{ textAlign: "center", fontSize: 26, fontWeight: 800, color: "#111827", marginBottom: 8 }}>كل ما يحتاجه عملك في الإمارات</h2>
        <p style={{ textAlign: "center", color: "#6b7280", marginBottom: 48 }}>من ضريبة القيمة المضافة حتى القوائم المالية — في مكان واحد</p>
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

      <section style={{ maxWidth: 700, margin: "0 auto", padding: "0 24px 80px" }}>
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

      <section style={{ background: "#f1f5f9", borderTop: "1px solid #e5e7eb", padding: "60px 24px", textAlign: "center" }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#111827", marginBottom: 12 }}>ابدأ محاسبة شركتك الإماراتية اليوم</h2>
        <p style={{ color: "#6b7280", marginBottom: 24 }}>35 يوماً مجاناً · بدون بطاقة ائتمان · دعم كامل باللغة العربية والإنجليزية</p>
        <Link href="/register" style={{ background: "#2563eb", color: "#fff", textDecoration: "none", padding: "14px 36px", borderRadius: 10, fontWeight: 700, fontSize: 16 }}>سجّل مجاناً الآن</Link>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }) }} />
    </div>
  );
}
