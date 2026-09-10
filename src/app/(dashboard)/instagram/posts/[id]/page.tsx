"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";

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
  notes: string | null;
  createdAt: string;
}

const STATUS_BADGE: Record<PostStatus, { label: string; cls: string }> = {
  DRAFT:     { label: "مسودة",  cls: "bg-gray-100 text-gray-600" },
  SCHEDULED: { label: "مجدول", cls: "bg-blue-100 text-blue-700" },
  PUBLISHED: { label: "منشور", cls: "bg-green-100 text-green-700" },
  FAILED:    { label: "فشل",   cls: "bg-red-100 text-red-700" },
};

export default function EditPostPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "SCHEDULED">("DRAFT");
  const [scheduledAt, setScheduledAt] = useState("");
  const [notes, setNotes] = useState("");

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/instagram/posts/${id}`);
      if (res.status === 404) { setNotFound(true); setLoading(false); return; }
      if (res.ok) {
        const { post: p } = await res.json() as { post: Post };
        setPost(p);
        setMediaUrls(p.mediaUrls);
        setCaption(p.caption ?? "");
        setHashtags(p.hashtags);
        setStatus(p.status === "SCHEDULED" ? "SCHEDULED" : "DRAFT");
        setScheduledAt(p.scheduledAt ? p.scheduledAt.slice(0, 16) : "");
        setNotes(p.notes ?? "");
      }
      setLoading(false);
    };
    void load();
  }, [id]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    if (mediaUrls.length + files.length > 10) { setError("الحد الأقصى 10 ملفات"); return; }
    setUploading(true); setError("");
    for (const file of files) {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/instagram/upload", { method: "POST", body: form });
      if (res.ok) {
        const { url } = await res.json() as { url: string };
        setMediaUrls((prev) => [...prev, url]);
      } else {
        const { error: e } = await res.json() as { error: string };
        setError(e ?? "فشل الرفع");
      }
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeMedia = (idx: number) =>
    setMediaUrls((prev) => prev.filter((_, i) => i !== idx));

  const toggleHashtag = (tag: string) =>
    setHashtags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag].slice(0, 30)
    );

  const addManualHashtag = () => {
    const tag = hashtagInput.trim().replace(/^#/, "");
    if (!tag) return;
    if (!hashtags.includes(tag)) setHashtags((prev) => [...prev, tag].slice(0, 30));
    setHashtagInput("");
  };

  const handleSave = async () => {
    setSaving(true); setError(""); setSaved(false);
    const payload = {
      mediaUrls,
      caption: caption.trim() || null,
      hashtags,
      status,
      scheduledAt: status === "SCHEDULED" ? scheduledAt || null : null,
      notes: notes.trim() || null,
    };
    const res = await fetch(`/api/instagram/posts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      const { error: e } = await res.json() as { error: string };
      setError(e ?? "فشل الحفظ");
    }
    setSaving(false);
  };

  if (loading) return <div className="text-center py-20 text-gray-400">جارٍ التحميل…</div>;
  if (notFound) return <div className="text-center py-20 text-gray-400">المنشور غير موجود</div>;
  if (!post) return null;

  const isReadonly = post.status === "PUBLISHED" || post.status === "FAILED";
  const badge = STATUS_BADGE[post.status];

  return (
    <div className="max-w-3xl mx-auto space-y-6" dir="rtl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 text-xl">←</button>
          <h1 className="text-xl font-bold text-gray-900">تعديل المنشور</h1>
          <span className={`text-xs px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>
        </div>
        <div className="flex gap-2 text-xs text-gray-400">
          <span>أُنشئ {new Date(post.createdAt).toLocaleDateString("ar")}</span>
          {post.aiGenerated && <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">AI</span>}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">
          ✅ تم الحفظ
        </div>
      )}

      {isReadonly && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm px-4 py-3 rounded-lg">
          ⚠️ هذا المنشور {badge.label} ولا يمكن تعديله
        </div>
      )}

      {/* Media */}
      <div className="card">
        <h2 className="text-sm font-semibold text-gray-800 mb-3">🖼 الوسائط</h2>
        <div className="flex flex-wrap gap-3">
          {mediaUrls.map((url, i) => (
            <div key={url} className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
              {url.endsWith(".mp4") ? (
                <video src={url} className="w-full h-full object-cover" />
              ) : (
                <img src={url} alt="" className="w-full h-full object-cover" />
              )}
              {!isReadonly && (
                <button
                  onClick={() => removeMedia(i)}
                  className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                >×</button>
              )}
            </div>
          ))}
          {!isReadonly && mediaUrls.length < 10 && (
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 flex-shrink-0"
            >
              {uploading ? <span className="text-xs">جارٍ…</span> : <><span className="text-2xl">+</span><span className="text-xs mt-0.5">رفع</span></>}
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4" multiple className="hidden"
          onChange={(e) => void handleFileChange(e)} />
      </div>

      {/* Caption */}
      <div className="card space-y-2">
        <h2 className="text-sm font-semibold text-gray-800">📝 التسمية</h2>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={5}
          maxLength={2200}
          disabled={isReadonly}
          className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none disabled:bg-gray-50 disabled:text-gray-500"
        />
        <p className="text-xs text-gray-400 text-left">{caption.length}/2200</p>
      </div>

      {/* Hashtags */}
      <div className="card space-y-3">
        <h2 className="text-sm font-semibold text-gray-800">🏷 الهاشتاقات ({hashtags.length}/30)</h2>
        {hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {hashtags.map((tag) => (
              <span key={tag} className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                #{tag}
                {!isReadonly && (
                  <button onClick={() => toggleHashtag(tag)} className="text-blue-400 hover:text-blue-600">×</button>
                )}
              </span>
            ))}
          </div>
        )}
        {!isReadonly && (
          <div className="flex gap-2">
            <input
              type="text"
              value={hashtagInput}
              onChange={(e) => setHashtagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addManualHashtag(); } }}
              placeholder="أضف هاشتاق…"
              className="flex-1 text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              dir="ltr"
            />
            <button onClick={addManualHashtag} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm">
              إضافة
            </button>
          </div>
        )}
      </div>

      {/* Schedule */}
      {!isReadonly && (
        <div className="card space-y-3">
          <h2 className="text-sm font-semibold text-gray-800">🗓 الجدولة</h2>
          <div className="flex gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="status" checked={status === "DRAFT"} onChange={() => setStatus("DRAFT")} />
              <span className="text-sm">مسودة</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="status" checked={status === "SCHEDULED"} onChange={() => setStatus("SCHEDULED")} />
              <span className="text-sm">مجدول</span>
            </label>
          </div>
          {status === "SCHEDULED" && (
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          )}
        </div>
      )}

      {/* Notes */}
      <div className="card space-y-2">
        <h2 className="text-sm font-semibold text-gray-800">🗒 ملاحظات</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          disabled={isReadonly}
          placeholder="ملاحظات داخلية…"
          className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none disabled:bg-gray-50"
        />
      </div>

      {!isReadonly && (
        <button
          onClick={() => void handleSave()}
          disabled={saving}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-xl transition-colors"
        >
          {saving ? "جارٍ الحفظ…" : "حفظ التغييرات"}
        </button>
      )}
    </div>
  );
}
