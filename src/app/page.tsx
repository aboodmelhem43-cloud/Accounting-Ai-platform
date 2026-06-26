import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import LandingPage from "./LandingPage";

export const metadata: Metadata = {
  title: "محاسباي — برنامج محاسبة ذكي للأعمال العربية | Mohasabai",
  description:
    "برنامج محاسبة سحابي بالذكاء الاصطناعي. قراءة الفواتير تلقائياً، دفتر يومية مزدوج القيد، تقارير مالية فورية، ومتوافق مع ZATCA (السعودية) وETA (مصر) وJoFotara (الأردن). جرّب 35 يوماً مجاناً.",
  alternates: { canonical: "https://www.mohasabai.com" },
  openGraph: {
    title: "محاسباي — برنامج محاسبة ذكي للأعمال العربية",
    description:
      "قراءة الفواتير بالذكاء الاصطناعي، دفتر يومية مزدوج القيد، فاتورة إلكترونية متوافقة مع ZATCA/ETA/JoFotara. 35 يوماً مجاناً.",
    url: "https://www.mohasabai.com",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "محاسباي",
  alternateName: "Mohasabai",
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
      price: "69",
      priceCurrency: "USD",
      priceSpecification: { "@type": "UnitPriceSpecification", billingDuration: "P1M" },
    },
    {
      "@type": "Offer",
      name: "الاحترافي",
      price: "149",
      priceCurrency: "USD",
      priceSpecification: { "@type": "UnitPriceSpecification", billingDuration: "P1M" },
    },
    {
      "@type": "Offer",
      name: "الأعمال",
      price: "199",
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

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPage />
    </>
  );
}
