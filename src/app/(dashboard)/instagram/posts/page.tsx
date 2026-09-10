"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type PostStatus = "DRAFT" | "SCHEDULED" | "PUBLISHED" | "FAILED";

interface Post {
  id: string;
  mediaUrls: string[];
  caption: string | null;
  hashtags: string[];
  status: PostStatus;
  scheduledAt: string | null;
  publishedAt: string | null;
  aiGenerated: boolean;
  createdAt: string;
}

const STATUS_TABS: { key: PostStatus | "ALL"; label: string }[] = [
  { key: "ALL",       label: "الكل" },
  { key: "DRAFT",     label: "مسودات" },
  { key: "SCHEDULED", label: "مجدولة" },
  { key: "PUBLISHED", label: "منشورة" },
  { key: "FAILED",    label: "فشل" },
];

const STATUS_BADGE: Record<PostStatus, { label: string; cls: string }> = {
  DRAFT:     { label: "مسودة",  cls: "bg-gray-100 text-gray-600" },
  SCHEDULED: { label: "مجدول", cls: "bg-blue-100 text-blue-700" },
  PUBLISHED: { label: "منشور", cls: "bg-green-100 text-green-700" },
  FAILED:    { label: "فشل",   cls: "bg-red-100 text-red-700" },
};

export default function InstagramPostsPage() {
  const [tab, setTab] = useState<PostStatus | "ALL">("ALL");
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const PAGE_SIZE = 12;

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE),
    });
    if (tab !== "ALL") params.set("status", tab);
    const res = await fetch(`/api/instagram/posts?${params}`);
    if (res.ok) {
      const data = await res.json() as { posts: Post[]; total: number };
      setPosts(data.posts);
      setTotal(data.total);
    }
    setLoading(false);
  }, [tab, page]);

  useEffect(() => { void load(); }, [load]);

  const handleTabChange = (t: PostStatus | "ALL") => {
    setTab(t);
    setPage(1);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("حذف هذا المنشور؟")) return;
    setDeleting(id);
    await fetch(`/api/instagram/posts/${id}`, { method: "DELETE" });
    setDeleting(null);
    void load();
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📋 المنشورات</h1>
          <p className="text-gray-500 text-sm mt-1">{total} منشور</p>
        </div>
        <Link href="/instagram/posts/create" className="btn-primary">
          ✏️ منشور جديد
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => handleTabChange(t.key)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              tab === t.key
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square rounded-xl bg-gray-100 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-3/4 mb-1" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📷</div>
          <p className="text-gray-500 mb-4">لا توجد منشورات</p>
          <Link href="/instagram/posts/create" className="btn-primary">
            إنشاء أول منشور
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {posts.map((p) => {
            const badge = STATUS_BADGE[p.status];
            return (
              <div key={p.id} className="group relative">
                <Link href={`/instagram/posts/${p.id}`} className="block">
                  <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 mb-2 relative">
                    {p.mediaUrls[0] ? (
                      <img
                        src={p.mediaUrls[0]}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300">
                        📷
                      </div>
                    )}
                    {p.aiGenerated && (
                      <span className="absolute top-2 left-2 bg-purple-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                        AI
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-700 truncate">
                    {p.caption ?? "بدون تسمية"}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${badge.cls}`}>
                      {badge.label}
                    </span>
                    {p.scheduledAt && p.status === "SCHEDULED" && (
                      <span className="text-xs text-gray-400">
                        {new Date(p.scheduledAt).toLocaleDateString("ar", { month: "short", day: "numeric" })}
                      </span>
                    )}
                  </div>
                </Link>

                {/* Delete button */}
                {p.status !== "PUBLISHED" && (
                  <button
                    onClick={() => void handleDelete(p.id)}
                    disabled={deleting === p.id}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm transition-opacity shadow"
                    title="حذف"
                  >
                    {deleting === p.id ? "…" : "×"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50"
          >
            السابق
          </button>
          <span className="px-3 py-1.5 text-sm text-gray-600">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50"
          >
            التالي
          </button>
        </div>
      )}
    </div>
  );
}
