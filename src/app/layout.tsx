import type { Metadata } from "next";
import { Cairo, Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/components/LanguageProvider";
import { Analytics } from "@vercel/analytics/next";
import { cookies } from "next/headers";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-cairo",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-inter",
});

const SITE_URL = "https://www.mohasabai.com";
const SITE_NAME = "محاسب اي | MohasabAi";
const DESCRIPTION =
  "محاسب اي — برنامج محاسبة سحابي بالذكاء الاصطناعي للمشاريع الصغيرة والمتوسطة في السعودية ومصر والإمارات والأردن. قراءة الفواتير تلقائياً، قوائم مالية فورية، فاتورة ZATCA وETA وJoFotara. جرّبه 35 يوماً مجاناً.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "محاسب اي — برنامج محاسبة سحابي للمشاريع الصغيرة | نظام محاسبة ذكي",
    template: "%s | محاسب اي",
  },
  description: DESCRIPTION,
  keywords: [
    // Arabic — high intent
    "برنامج محاسبة",
    "نظام محاسبة",
    "برنامج محاسبة سحابي",
    "برنامج محاسبة للمشاريع الصغيرة",
    "برنامج محاسبة للشركات الصغيرة",
    "برنامج محاسبة اون لاين",
    "برنامج محاسبة عربي",
    "محاسبة إلكترونية",
    // Arabic — by country
    "برنامج محاسبة سعودي",
    "برنامج محاسبة مصري",
    "برنامج محاسبة اماراتي",
    "برنامج محاسبة أردني",
    "برنامج محاسبة كويتي",
    // Arabic — features
    "برنامج فواتير إلكترونية",
    "فاتورة إلكترونية ZATCA",
    "فاتورة ضريبية",
    "فاتورة ETA مصر",
    "JoFotara الأردن",
    "قائمة الدخل",
    "الميزانية العمومية",
    "دفتر يومية",
    "قيد محاسبي",
    "تقارير مالية",
    "محاسبة ذكاء اصطناعي",
    "قراءة فواتير تلقائية",
    // English
    "accounting software",
    "cloud accounting software",
    "arabic accounting software",
    "accounting software for small business",
    "accounting system",
    "online accounting",
    "AI accounting software",
    "ZATCA e-invoice",
    "Saudi Arabia accounting software",
    "Egypt accounting software",
    "UAE accounting software",
    "Middle East accounting",
    "mohasabai",
    "محاسب اي",
  ],
  authors: [{ name: "MohasabAi", url: SITE_URL }],
  creator: "MohasabAi",
  publisher: "MohasabAi",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    type: "website",
    locale: "ar_AR",
    alternateLocale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "محاسب اي — برنامج محاسبة ذكي للأعمال العربية",
    description: DESCRIPTION,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "محاسب اي — برنامج محاسبة ذكي" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "محاسب اي — برنامج محاسبة ذكي للأعمال العربية",
    description: DESCRIPTION,
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: SITE_URL,
  },
  category: "technology",
  verification: {
    google: "PjsNKMnjUUWgPW4WCW5pvTFaALeiNr4bfek4SCT6vs4",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const lang = cookieStore.get("lang")?.value === "en" ? "en" : "ar";
  const dir = lang === "en" ? "ltr" : "rtl";

  return (
    <html lang={lang} dir={dir} className={`${cairo.variable} ${inter.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "SoftwareApplication",
                name: "محاسب اي | MohasabAi",
                alternateName: ["MohasabAi", "محاسبي", "برنامج محاسب اي"],
                url: "https://www.mohasabai.com",
                description:
                  "برنامج محاسبة سحابي بالذكاء الاصطناعي للمشاريع الصغيرة والمتوسطة في المنطقة العربية. قراءة الفواتير تلقائياً، قوائم مالية فورية، وفاتورة إلكترونية متوافقة مع ZATCA وETA وJoFotara.",
                applicationCategory: "BusinessApplication",
                applicationSubCategory: "Accounting Software",
                operatingSystem: "Web, iOS, Android",
                offers: [
                  { "@type": "Offer", name: "Starter", price: "69", priceCurrency: "USD", priceSpecification: { "@type": "UnitPriceSpecification", billingDuration: "P1M" } },
                  { "@type": "Offer", name: "Pro", price: "149", priceCurrency: "USD", priceSpecification: { "@type": "UnitPriceSpecification", billingDuration: "P1M" } },
                  { "@type": "Offer", name: "Business", price: "199", priceCurrency: "USD", priceSpecification: { "@type": "UnitPriceSpecification", billingDuration: "P1M" } },
                ],
                featureList: [
                  "قراءة الفواتير بالذكاء الاصطناعي",
                  "دفتر يومية مزدوج القيد",
                  "قوائم مالية فورية",
                  "فاتورة إلكترونية ZATCA",
                  "فاتورة إلكترونية ETA",
                  "فاتورة إلكترونية JoFotara",
                  "تقارير مالية تلقائية",
                  "مساعد ذكاء اصطناعي للأسئلة المالية",
                  "تسوية بنكية",
                  "دليل الحسابات",
                ],
                inLanguage: ["ar", "en"],
                availableInCountry: ["SA", "EG", "AE", "JO", "KW", "BH", "QA", "OM"],
                screenshot: "https://www.mohasabai.com/og-image.png",
                aggregateRating: { "@type": "AggregateRating", ratingValue: "4.8", reviewCount: "24" },
              },
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                name: "محاسب اي | MohasabAi",
                url: "https://www.mohasabai.com",
                logo: "https://www.mohasabai.com/og-image.png",
                contactPoint: { "@type": "ContactPoint", email: "support@mohasabai.com", contactType: "customer support", availableLanguage: ["Arabic", "English"] },
                sameAs: [],
                description: "برنامج محاسبة سحابي للمشاريع الصغيرة والمتوسطة في الدول العربية",
              },
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: "محاسب اي | MohasabAi",
                url: "https://www.mohasabai.com",
                potentialAction: {
                  "@type": "SearchAction",
                  target: { "@type": "EntryPoint", urlTemplate: "https://www.mohasabai.com/blog?q={search_term_string}" },
                  "query-input": "required name=search_term_string",
                },
              },
              {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: [
                  { "@type": "Question", name: "هل بياناتي آمنة في محاسب اي؟", acceptedAnswer: { "@type": "Answer", text: "نعم. كل منشأة معزولة تماماً عن الأخرى. البيانات مشفّرة وتُخزَّن في مراكز بيانات موثّقة. لا نشارك بياناتك مع أي طرف ثالث." } },
                  { "@type": "Question", name: "هل أحتاج خبرة محاسبية لاستخدام المنصة؟", acceptedAnswer: { "@type": "Answer", text: "لا. الواجهة مصممة لأصحاب الأعمال غير المتخصصين. الذكاء الاصطناعي يقترح القيود، وأنت تراجع وتؤكد فقط." } },
                  { "@type": "Question", name: "هل المنصة متوافقة مع فاتورة ZATCA في السعودية؟", acceptedAnswer: { "@type": "Answer", text: "نعم، ندعم فاتورة ZATCA الإلكترونية في السعودية مع توليد رمز QR الضريبي تلقائياً، إضافةً لـ ETA في مصر وJoFotara في الأردن." } },
                  { "@type": "Question", name: "ما هي مدة التجربة المجانية؟", acceptedAnswer: { "@type": "Answer", text: "تحصل على 35 يوماً مجانية بدون بطاقة ائتمان. بعد انتهاء التجربة يمكنك اختيار خطة مدفوعة أو تصدير بياناتك." } },
                  { "@type": "Question", name: "هل يمكنني إلغاء الاشتراك في أي وقت؟", acceptedAnswer: { "@type": "Answer", text: "نعم، لا عقود ولا رسوم إلغاء. يمكنك الإلغاء من لوحة الإعدادات في أي وقت." } },
                ],
              },
            ]),
          }}
        />
      </head>
      <body className="font-sans bg-gray-50 text-gray-900 antialiased">
        <LanguageProvider initialLang={lang}>{children}</LanguageProvider>
        <Analytics />
      </body>
    </html>
  );
}
