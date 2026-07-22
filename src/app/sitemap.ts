import type { MetadataRoute } from "next";
import { BLOG_POSTS } from "@/lib/blog";

const BASE = "https://www.mohasabai.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE,                  lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${BASE}/register`,    lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/blog`,        lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    // Country-specific landing pages — local SEO
    { url: `${BASE}/sa`,          lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/eg`,          lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/ae`,          lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/jo`,          lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/kw`,          lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/login`,       lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];

  const blogPages: MetadataRoute.Sitemap = BLOG_POSTS.map((post) => ({
    url: `${BASE}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...blogPages];
}
