import { notFound } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import { BLOG_POSTS } from "@/lib/blog";

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
      authors: [isAr ? "محاسباي" : "Mohasabai"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: excerpt,
    datePublished: post.date,
    dateModified: post.date,
    author: { "@type": "Organization", name: "محاسباي | Mohasabai", url: SITE_URL },
    publisher: { "@type": "Organization", name: "محاسباي | Mohasabai", url: SITE_URL },
    url: `${SITE_URL}/blog/${slug}`,
    inLanguage: lang,
    articleSection: category,
  };

  return (
    <div className="min-h-screen bg-white" dir={isAr ? "rtl" : "ltr"}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-blue-700">
            Mohasabai · محاسباي
          </Link>
          <Link href="/blog" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
            {isAr ? "← المدونة" : "← Blog"}
          </Link>
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-4 py-14">
        {/* Category + meta */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
            {category}
          </span>
          <span className="text-xs text-gray-400">
            {post.readMinutes} {isAr ? "دقائق قراءة" : "min read"}
          </span>
          <span className="text-xs text-gray-400">
            {new Date(post.date).toLocaleDateString(isAr ? "ar-SA" : "en-GB", {
              year: "numeric", month: "long", day: "numeric",
            })}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-4">
          {title}
        </h1>

        {/* Excerpt */}
        <p className="text-lg text-gray-500 leading-relaxed mb-10 border-b border-gray-100 pb-10">
          {excerpt}
        </p>

        {/* Content */}
        <div
          className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-li:text-gray-700 prose-h2:text-2xl prose-h2:mt-10 prose-h3:text-xl prose-h3:mt-8"
          dangerouslySetInnerHTML={{ __html: content }}
        />

        {/* CTA */}
        <div className="mt-16 bg-blue-50 border border-blue-200 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {isAr ? "جرّب محاسباي مجاناً" : "Try Mohasabai for free"}
          </h2>
          <p className="text-gray-500 text-sm mb-5">
            {isAr
              ? "35 يوماً مجاناً بدون بطاقة ائتمان — ابدأ الآن وتحكّم في محاسبتك"
              : "35 days free, no credit card required — start now and take control of your accounting"}
          </p>
          <Link href="/register" className="btn-primary">
            {isAr ? "ابدأ مجاناً" : "Start Free"}
          </Link>
        </div>

        {/* Back to blog */}
        <div className="mt-10 text-center">
          <Link href="/blog" className="text-blue-600 hover:underline text-sm">
            {isAr ? "← العودة إلى المدونة" : "← Back to Blog"}
          </Link>
        </div>
      </article>
    </div>
  );
}
