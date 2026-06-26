import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/components/LanguageProvider";
import { Analytics } from "@vercel/analytics/next";
import { cookies } from "next/headers";

const SITE_URL = "https://www.mohasabai.com";
const SITE_NAME = "محاسباي | Mohasabai";
const DESCRIPTION =
  "برنامج محاسبة سحابي بالذكاء الاصطناعي للأعمال الصغيرة والمتوسطة في المنطقة العربية. قراءة الفواتير تلقائياً، قوائم مالية فورية، وفاتورة إلكترونية متوافقة مع ZATCA وETA وJoFotara. AI-powered accounting for Arab businesses.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "محاسباي — برنامج محاسبة ذكي للأعمال العربية",
    template: "%s | محاسباي",
  },
  description: DESCRIPTION,
  keywords: [
    "برنامج محاسبة",
    "محاسبة سحابية",
    "برنامج فواتير",
    "فاتورة إلكترونية",
    "برنامج محاسبة للمشاريع الصغيرة",
    "محاسبة اون لاين",
    "ZATCA",
    "ETA فاتورة",
    "JoFotara",
    "برنامج محاسبة سعودي",
    "برنامج محاسبة مصري",
    "برنامج محاسبة اردني",
    "برنامج محاسبة اماراتي",
    "accounting software arabic",
    "arabic accounting",
    "mohasabai",
    "محاسباي",
  ],
  authors: [{ name: "Mohasabai", url: SITE_URL }],
  creator: "Mohasabai",
  publisher: "Mohasabai",
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
    title: "محاسباي — برنامج محاسبة ذكي للأعمال العربية",
    description: DESCRIPTION,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "محاسباي — برنامج محاسبة ذكي" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "محاسباي — برنامج محاسبة ذكي للأعمال العربية",
    description: DESCRIPTION,
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: SITE_URL,
    languages: { ar: SITE_URL, en: SITE_URL },
  },
  category: "technology",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const lang = cookieStore.get("lang")?.value === "en" ? "en" : "ar";
  const dir = lang === "en" ? "ltr" : "rtl";

  return (
    <html lang={lang} dir={dir}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans bg-gray-50 text-gray-900 antialiased">
        <LanguageProvider initialLang={lang}>{children}</LanguageProvider>
        <Analytics />
      </body>
    </html>
  );
}
