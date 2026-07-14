export interface BlogPost {
  slug: string;
  date: string;
  readMinutes: number;
  category: { ar: string; en: string };
  title: { ar: string; en: string };
  excerpt: { ar: string; en: string };
  content: { ar: string; en: string };
}

// Blog posts — placeholder until content is filled in
export const BLOG_POSTS: BlogPost[] = [];
