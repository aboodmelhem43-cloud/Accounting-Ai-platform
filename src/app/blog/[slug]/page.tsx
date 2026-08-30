import { notFound } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import { BLOG_POSTS } from "@/lib/blog";
import ShareBar from "./ShareBar";

const SITE_URL = "https://www.mohasabai.com";

export async function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  if (!post) return {};
  const cookieStore = await cookies();
  const isAr = cookieStore.get("lang")?.value !== "en";
  const title = isAr ? post.title.ar : post.title.en;
  const description = isAr ? post.excerpt.ar : post.excerpt.en;
  const url = `${SITE_URL}/blog/${slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      publishedTime: post.date,
      authors: [isAr ? "محاسب اي" : "MohasabAi"],
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  if (!post) notFound();

  const cookieStore = await cookies();
  const lang = cookieStore.get("lang")?.value === "en" ? "en" : "ar";
  const isAr = lang === "ar";

  const title = isAr ? post.title.ar : post.title.en;
  const excerpt = isAr ? post.excerpt.ar : post.excerpt.en;
  const content = isAr ? post.content.ar : post.content.en;
  const category = isAr ? post.category.ar : post.category.en;
  const postUrl = `${SITE_URL}/blog/${slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: excerpt,
    datePublished: post.date,
    dateModified: post.date,
    author: { "@type": "Organization", name: "محاسب اي | MohasabAi", url: SITE_URL },
    publisher: { "@type": "Organization", name: "محاسب اي | MohasabAi", url: SITE_URL },
    url: postUrl,
    inLanguage: lang,
    articleSection: category,
  };

  const dateFormatted = new Date(post.date).toLocaleDateString(
    isAr ? "ar-SA" : "en-GB",
    { year: "numeric", month: "long", day: "numeric" }
  );

  return (
    <div className="min-h-screen bg-gray-50" dir={isAr ? "rtl" : "ltr"}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-blue-700 tracking-tight">
            MohasabAi · محاسب اي
          </Link>
          <Link
            href="/blog"
            className="text-sm text-gray-500 hover:text-blue-600 transition-colors flex items-center gap-1"
          >
            {isAr ? "→" : "←"} {isAr ? "المدونة" : "Blog"}
          </Link>
        </div>
      </nav>

      {/* Hero band */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-10 md:py-14">
          {/* Breadcrumb + meta row */}
          <div className="flex flex-wrap items-center gap-2 mb-5 text-xs text-gray-400">
            <Link href="/blog" className="hover:text-blue-600 transition-colors">
              {isAr ? "المدونة" : "Blog"}
            </Link>
            <span>/</span>
            <span className="bg-blue-50 text-blue-700 font-semibold px-2.5 py-0.5 rounded-full">
              {category}
            </span>
            <span className="ms-auto flex items-center gap-3">
              <span>{dateFormatted}</span>
              <span>·</span>
              <span>{post.readMinutes} {isAr ? "دقائق قراءة" : "min read"}</span>
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-snug mb-4" style={{ textWrap: "balance" }}>
            {title}
          </h1>

          {/* Excerpt */}
          <p className="text-lg text-gray-500 leading-relaxed max-w-2xl">
            {excerpt}
          </p>

          {/* Share bar */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <ShareBar url={postUrl} title={title} />
          </div>
        </div>
      </div>

      {/* Article body */}
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-10">
          <div
            className={`prose prose-lg max-w-none
              prose-headings:font-bold prose-headings:text-gray-900
              prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-gray-100
              prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
              prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4
              prose-li:text-gray-700 prose-li:mb-1
              prose-strong:text-gray-900 prose-strong:font-semibold
              prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
              prose-table:border-collapse prose-table:w-full
              prose-th:bg-gray-50 prose-th:text-gray-700 prose-th:font-semibold prose-th:text-sm prose-th:px-4 prose-th:py-3 prose-th:border prose-th:border-gray-200 prose-th:text-start
              prose-td:px-4 prose-td:py-3 prose-td:border prose-td:border-gray-200 prose-td:text-sm prose-td:text-gray-700
              prose-ul:my-4 prose-ol:my-4
              prose-blockquote:border-s-4 prose-blockquote:border-blue-400 prose-blockquote:bg-blue-50 prose-blockquote:px-4 prose-blockquote:py-3 prose-blockquote:rounded-e-lg prose-blockquote:not-italic
              ${isAr ? "text-right" : "text-left"}`}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>

        {/* Bottom share */}
        <div className="mt-8 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-sm font-medium text-gray-700">
            {isAr ? "هل وجدت المقال مفيداً؟ شاركه مع زملائك" : "Found this useful? Share it with your team"}
          </p>
          <ShareBar url={postUrl} title={title} />
        </div>

        {/* CTA */}
        <div className="mt-6 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-8 text-center text-white">
          <div className="text-4xl mb-3">🚀</div>
          <h2 className="text-xl font-bold mb-2">
            {isAr ? "جرّب محاسب اي مجاناً — 35 يوماً" : "Try MohasabAi free for 35 days"}
          </h2>
          <p className="text-blue-100 text-sm mb-6 max-w-md mx-auto">
            {isAr
              ? "بدون بطاقة ائتمان. قراءة فواتير بالذكاء الاصطناعي، قوائم مالية فورية، ومساعد مالي ذكي — كل شيء جاهز من اليوم الأول."
              : "No credit card required. AI invoice scanning, real-time financial statements, and a financial AI assistant — all ready from day one."}
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/register"
              className="bg-white text-blue-700 font-semibold px-6 py-2.5 rounded-lg hover:bg-blue-50 transition-colors text-sm"
            >
              {isAr ? "ابدأ مجاناً ←" : "Start Free →"}
            </Link>
            <Link
              href="/#pricing"
              className="border border-blue-400 text-white font-medium px-6 py-2.5 rounded-lg hover:bg-blue-600 transition-colors text-sm"
            >
              {isAr ? "عرض الأسعار" : "View Pricing"}
            </Link>
          </div>
        </div>

        {/* Back to blog */}
        <div className="mt-8 text-center">
          <Link href="/blog" className="text-blue-600 hover:underline text-sm">
            {isAr ? "→ العودة إلى المدونة" : "← Back to Blog"}
          </Link>
        </div>
      </div>
    </div>
  );
}
