import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PLANS } from "@/lib/plans";
import LandingPage from "./LandingPage";

export const metadata: Metadata = {
  title: "محاسب اي — برنامج محاسبة ذكي للأعمال العربية | MohasabAi",
  description:
    "برنامج محاسبة سحابي بالذكاء الاصطناعي. قراءة الفواتير تلقائياً، دفتر يومية مزدوج القيد، تقارير مالية فورية، ومتوافق مع ZATCA (السعودية) وETA (مصر) وJoFotara (الأردن). جرّب 35 يوماً مجاناً.",
  alternates: { canonical: "https://www.mohasabai.com" },
  openGraph: {
    title: "محاسب اي — برنامج محاسبة ذكي للأعمال العربية",
    description:
      "قراءة الفواتير بالذكاء الاصطناعي، دفتر يومية مزدوج القيد، فاتورة إلكترونية متوافقة مع ZATCA/ETA/JoFotara. 35 يوماً مجاناً.",
    url: "https://www.mohasabai.com",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "محاسب اي",
  alternateName: "MohasabAi",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: "https://www.mohasabai.com",
  description:
    "برنامج محاسبة سحابي بالذكاء الاصطناعي للأعمال الصغيرة والمتوسطة في المنطقة العربية. قراءة الفواتير تلقائياً، دفتر يومية مزدوج القيد، وفاتورة إلكترونية متوافقة.",
  inLanguage: ["ar", "en"],
  offers: [
    {
      "@type": "Offer",
      name: "المبتدئ",
      price: "15",
      priceCurrency: "USD",
      priceSpecification: { "@type": "UnitPriceSpecification", billingDuration: "P1M" },
    },
    {
      "@type": "Offer",
      name: "الاحترافي",
      price: "35",
      priceCurrency: "USD",
      priceSpecification: { "@type": "UnitPriceSpecification", billingDuration: "P1M" },
    },
    {
      "@type": "Offer",
      name: "الأعمال",
      price: "69",
      priceCurrency: "USD",
      priceSpecification: { "@type": "UnitPriceSpecification", billingDuration: "P1M" },
    },
  ],
  featureList: [
    "قراءة الفواتير بالذكاء الاصطناعي",
    "دفتر يومية مزدوج القيد",
    "تقارير مالية فورية",
    "فاتورة إلكترونية ZATCA",
    "فاتورة إلكترونية ETA",
    "فاتورة إلكترونية JoFotara",
    "مساعد مالي ذكي",
    "دعم 8 دول عربية",
  ],
  areaServed: ["SA", "EG", "JO", "AE", "KW", "BH", "QA", "OM"],
};

const YEARLY_PRICES: Record<string, number> = { STARTER: 120, PRO: 280, BUSINESS: 549 };
const LOCAL_HINTS = {
  STARTER: { monthly: { ar: "≈ 56 ر.س / 750 ج.م", en: "≈ SAR 56 / EGP 750" }, yearly: { ar: "≈ 450 ر.س / 6,000 ج.م", en: "≈ SAR 450 / EGP 6,000" } },
  PRO:     { monthly: { ar: "≈ 131 ر.س / 1,750 ج.م", en: "≈ SAR 131 / EGP 1,750" }, yearly: { ar: "≈ 1,050 ر.س / 14,000 ج.م", en: "≈ SAR 1,050 / EGP 14,000" } },
  BUSINESS:{ monthly: { ar: "≈ 259 ر.س / 3,450 ج.م", en: "≈ SAR 259 / EGP 3,450" }, yearly: { ar: "≈ 2,059 ر.س / 27,500 ج.م", en: "≈ SAR 2,059 / EGP 27,500" } },
};
const PLAN_FEATURES = {
  STARTER: { ar: { name: "المبتدئ", desc: "للأعمال الناشئة", features: ["50 فاتورة/شهر", "50 سؤال AI/شهر", "رفع وإنشاء الفواتير", "دفتر اليومية", "تقارير أساسية", "دعم عملاء"] }, en: { name: "Starter", desc: "For new businesses", features: ["50 invoices/month", "50 AI queries/month", "Upload & create invoices", "Journal ledger", "Basic reports", "Customer support"] }, highlight: false },
  PRO:     { ar: { name: "الاحترافي", desc: "للأعمال النامية", features: ["500 فاتورة/شهر", "AI غير محدود", "كل مميزات المبتدئ", "3 مستخدمين", "تقارير متقدمة", "دعم أولوية"] }, en: { name: "Pro", desc: "For growing businesses", features: ["500 invoices/month", "Unlimited AI", "Everything in Starter", "3 users", "Advanced reports", "Priority support"] }, highlight: true },
  BUSINESS:{ ar: { name: "الأعمال", desc: "للشركات المتوسطة", features: ["فواتير غير محدودة", "AI غير محدود", "كل مميزات الاحترافي", "10 مستخدمين", "API access", "دعم VIP"] }, en: { name: "Business", desc: "For mid-size companies", features: ["Unlimited invoices", "Unlimited AI", "Everything in Pro", "10 users", "API access", "VIP support"] }, highlight: false },
};

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");

  const pricingData = (["STARTER", "PRO", "BUSINESS"] as const).map((id) => ({
    id,
    monthlyPrice: PLANS[id].price,
    yearlyPrice: YEARLY_PRICES[id],
    localHint: LOCAL_HINTS[id],
    ar: PLAN_FEATURES[id].ar,
    en: PLAN_FEATURES[id].en,
    highlight: PLAN_FEATURES[id].highlight,
  }));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPage pricingData={pricingData} />
    </>
  );
}
