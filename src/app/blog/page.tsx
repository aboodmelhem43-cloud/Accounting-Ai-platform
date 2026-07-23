import Link from "next/link";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import { BLOG_POSTS } from "@/lib/blog";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const isAr = cookieStore.get("lang")?.value !== "en";
  return {
    title: isAr
      ? "مدونة محاسب اي — نصائح محاسبية وأدلة الفاتورة الإلكترونية"
      : "MohasabAi Blog — Accounting Tips & E-Invoice Guides",
    description: isAr
      ? "مقالات ونصائح عملية في المحاسبة، إدارة الفواتير، الفاتورة الإلكترونية ZATCA وETA، والتقارير المالية للمشاريع الصغيرة والمتوسطة في المنطقة العربية."
      : "Practical articles on accounting, invoice management, ZATCA & ETA e-invoicing, and financial reports for small and medium businesses in the Arab world.",
    alternates: { canonical: "https://www.mohasabai.com/blog" },
    openGraph: {
      title: isAr
        ? "مدونة محاسب اي — نصائح محاسبية عملية"
        : "MohasabAi Blog — Practical Accounting Tips",
      description: isAr
        ? "مقالات في المحاسبة، الفاتورة الإلكترونية، والتقارير المالية للأعمال العربية"
        : "Articles on accounting, e-invoicing, and financial reports for Arab businesses",
      url: "https://www.mohasabai.com/blog",
      type: "website",
    },
  };
}

export default async function BlogPage() {
  const cookieStore = await cookies();
  const lang = cookieStore.get("lang")?.value === "en" ? "en" : "ar";
  const isAr = lang === "ar";
  const sorted = [...BLOG_POSTS].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div
      className="min-h-screen bg-white"
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-blue-700">
            MohasabAi · محاسب اي
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/#pricing" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
              {isAr ? "الأسعار" : "Pricing"}
            </Link>
            <Link href="/register" className="btn-primary text-sm">
              {isAr ? "ابدأ مجاناً" : "Start Free"}
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-14">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {isAr ? "مدونة محاسب اي" : "MohasabAi Blog"}
          </h1>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            {isAr
              ? "نصائح عملية في المحاسبة، إدارة الفواتير، والتقارير المالية للأعمال العربية"
              : "Practical tips on accounting, invoice management, and financial reports for Arab businesses"}
          </p>
        </div>

        {/* Articles grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sorted.map((post) => {
            const p = isAr ? { title: post.title.ar, excerpt: post.excerpt.ar, category: post.category.ar } : { title: post.title.en, excerpt: post.excerpt.en, category: post.category.en };
            return (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group block border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md hover:border-blue-200 transition-all"
              >
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
                      {p.category}
                    </span>
                    <span className="text-xs text-gray-400">
                      {post.readMinutes} {isAr ? "دقائق قراءة" : "min read"}
                    </span>
                  </div>
                  <h2 className="font-bold text-gray-900 text-base mb-2 group-hover:text-blue-700 transition-colors leading-snug">
                    {p.title}
                  </h2>
                  <p className="text-gray-500 text-sm leading-relaxed line-clamp-3">
                    {p.excerpt}
                  </p>
                  <div className="mt-4 text-xs text-gray-400">
                    {new Date(post.date).toLocaleDateString(isAr ? "ar-SA" : "en-GB", {
                      year: "numeric", month: "long", day: "numeric",
                    })}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-blue-50 border-t border-blue-100 py-14 text-center px-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          {isAr ? "جرّب محاسب اي مجاناً لمدة 35 يوماً" : "Try MohasabAi free for 35 days"}
        </h2>
        <p className="text-gray-500 mb-6 text-sm">
          {isAr ? "بدون بطاقة ائتمان — إلغاء في أي وقت" : "No credit card — cancel anytime"}
        </p>
        <Link href="/register" className="btn-primary">
          {isAr ? "ابدأ الآن" : "Get Started"}
        </Link>
      </div>
    </div>
  );
}
