"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

type Tone = "professional" | "casual" | "witty" | "promotional";
type Lang = "ar" | "en";

interface HashtagSet { id: string; name: string; hashtags: string[] }
interface HashtagSuggestions { broad: string[]; niche: string[]; branded: string[] }

const TONE_LABELS: Record<Tone, string> = {
  professional: "احترافي",
  casual:       "ودود",
  witty:        "طريف",
  promotional:  "تسويقي",
};

export default function CreatePostPage() {
  const router = useRouter();

  // Media
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Caption
  const [caption, setCaption] = useState("");
  const [captionBrief, setCaptionBrief] = useState("");
  const [tone, setTone] = useState<Tone>("casual");
  const [lang, setLang] = useState<Lang>("ar");
  const [generatingCaption, setGeneratingCaption] = useState(false);

  // Hashtags
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState("");
  const [hashtagSets, setHashtagSets] = useState<HashtagSet[] | null>(null);
  const [suggestions, setSuggestions] = useState<HashtagSuggestions | null>(null);
  const [generatingTags, setGeneratingTags] = useState(false);
  const [setsLoading, setSetsLoading] = useState(false);
  const [showSets, setShowSets] = useState(false);

  // Schedule
  const [status, setStatus] = useState<"DRAFT" | "SCHEDULED">("DRAFT");
  const [scheduledAt, setScheduledAt] = useState("");

  // IG connection
  const [igConnected, setIgConnected] = useState(false);
  useEffect(() => {
    fetch("/api/instagram/profile").then(async (r) => {
      if (r.ok) {
        const { profile } = await r.json() as { profile: unknown };
        setIgConnected(!!profile);
      }
    }).catch(() => { /* ignore */ });
  }, []);

  // Save
  const [saving, setSaving] = useState(false);
  const [publishingNow, setPublishingNow] = useState(false);
  const [error, setError] = useState("");

  /* ---- Upload ---- */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    if (mediaUrls.length + files.length > 10) {
      setError("الحد الأقصى 10 صور/فيديوهات"); return;
    }
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

  /* ---- AI Caption ---- */
  const generateCaption = async () => {
    if (!captionBrief.trim()) { setError("أدخل وصفًا موجزًا أولاً"); return; }
    setGeneratingCaption(true); setError(""); setCaption("");
    const res = await fetch("/api/instagram/ai/caption", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brief: captionBrief, tone, lang }),
    });
    if (!res.ok || !res.body) { setGeneratingCaption(false); setError("فشل توليد التسمية"); return; }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let done = false;
    while (!done) {
      const { value, done: d } = await reader.read();
      done = d;
      if (value) setCaption((prev) => prev + decoder.decode(value));
    }
    setGeneratingCaption(false);
  };

  /* ---- AI Hashtags ---- */
  const generateHashtags = async () => {
    if (!caption.trim()) { setError("أدخل أو ولّد تسمية أولاً"); return; }
    setGeneratingTags(true); setError(""); setSuggestions(null);
    const res = await fetch("/api/instagram/ai/hashtags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caption, lang }),
    });
    if (res.ok) setSuggestions(await res.json() as HashtagSuggestions);
    else setError("فشل توليد الهاشتاقات");
    setGeneratingTags(false);
  };

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

  /* ---- Hashtag Sets ---- */
  const loadSets = useCallback(async () => {
    if (hashtagSets !== null) { setShowSets(true); return; }
    setSetsLoading(true);
    const res = await fetch("/api/instagram/hashtag-sets");
    if (res.ok) {
      const { sets } = await res.json() as { sets: HashtagSet[] };
      setHashtagSets(sets);
    }
    setSetsLoading(false);
    setShowSets(true);
  }, [hashtagSets]);

  const applySet = (set: HashtagSet) => {
    const merged = Array.from(new Set([...hashtags, ...set.hashtags])).slice(0, 30);
    setHashtags(merged);
    setShowSets(false);
  };

  /* ---- Save ---- */
  const save = async (draft = false) => {
    setSaving(true); setError("");
    const payload = {
      mediaUrls,
      caption: caption.trim() || null,
      hashtags,
      status: draft ? "DRAFT" : status,
      scheduledAt: status === "SCHEDULED" && !draft ? scheduledAt || null : null,
      aiGenerated: generatingCaption ? false : caption !== "",
    };
    const res = await fetch("/api/instagram/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      router.push("/instagram/posts");
    } else {
      const { error: e } = await res.json() as { error: string };
      setError(e ?? "فشل الحفظ");
    }
    setSaving(false);
  };

  /* ---- Publish Now ---- */
  const publishNow = async () => {
    if (mediaUrls.length === 0) { setError("أضف صورة أو فيديو قبل النشر"); return; }
    setPublishingNow(true); setError("");
    // Save as DRAFT first to get an ID, then publish immediately
    const saveRes = await fetch("/api/instagram/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mediaUrls,
        caption:     caption.trim() || null,
        hashtags,
        status:      "DRAFT",
        aiGenerated: caption !== "",
      }),
    });
    if (!saveRes.ok) {
      const { error: e } = await saveRes.json() as { error: string };
      setError(e ?? "فشل الحفظ");
      setPublishingNow(false);
      return;
    }
    const { post } = await saveRes.json() as { post: { id: string } };
    const pubRes = await fetch(`/api/instagram/posts/${post.id}/publish`, { method: "POST" });
    if (pubRes.ok) {
      router.push(`/instagram/posts/${post.id}`);
    } else {
      const { message } = await pubRes.json() as { message?: string };
      setError(message ?? "فشل النشر");
    }
    setPublishingNow(false);
  };

  const totalChars = caption.length + (hashtags.length ? hashtags.map((h) => `#${h}`).join(" ").length + 1 : 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6" dir="rtl">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 text-xl">←</button>
        <h1 className="text-xl font-bold text-gray-900">✏️ منشور جديد</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        {/* Left column */}
        <div className="space-y-5">
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
                  <button
                    onClick={() => removeMedia(i)}
                    className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                  >×</button>
                </div>
              ))}
              {mediaUrls.length < 10 && (
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors flex-shrink-0"
                >
                  {uploading ? <span className="text-xs">جارٍ…</span> : <><span className="text-2xl">+</span><span className="text-xs mt-0.5">رفع</span></>}
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,video/mp4"
              multiple
              className="hidden"
              onChange={(e) => void handleFileChange(e)}
            />
            <p className="text-xs text-gray-400 mt-2">JPEG · PNG · WEBP · GIF · MP4 — حد 10 MB لكل ملف — حد 10 ملفات</p>
          </div>

          {/* Caption */}
          <div className="card space-y-3">
            <h2 className="text-sm font-semibold text-gray-800">📝 التسمية التوضيحية</h2>

            {/* AI panel */}
            <div className="bg-purple-50 rounded-xl p-3 space-y-3">
              <p className="text-xs font-medium text-purple-700">✨ توليد بالذكاء الاصطناعي</p>
              <textarea
                value={captionBrief}
                onChange={(e) => setCaptionBrief(e.target.value)}
                placeholder="وصف موجز للمنشور…"
                rows={2}
                className="w-full text-sm border border-purple-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none bg-white"
              />
              <div className="flex flex-wrap gap-2 items-center">
                <div className="flex gap-1 flex-wrap">
                  {(["casual", "professional", "witty", "promotional"] as Tone[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTone(t)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                        tone === t ? "bg-purple-600 text-white border-purple-600" : "border-purple-300 text-purple-700 hover:bg-purple-100"
                      }`}
                    >
                      {TONE_LABELS[t]}
                    </button>
                  ))}
                </div>
                <div className="flex gap-1 mr-auto">
                  {(["ar", "en"] as Lang[]).map((l) => (
                    <button
                      key={l}
                      onClick={() => setLang(l)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                        lang === l ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {l === "ar" ? "عربي" : "English"}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => void generateCaption()}
                disabled={generatingCaption || !captionBrief.trim()}
                className="w-full py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {generatingCaption ? "جارٍ التوليد…" : "توليد التسمية"}
              </button>
            </div>

            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="اكتب التسمية التوضيحية هنا…"
              rows={6}
              maxLength={2200}
              className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
              dir={lang === "en" ? "ltr" : "rtl"}
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>{totalChars}/2200 حرف</span>
              {totalChars > 2200 && <span className="text-red-500">تجاوزت الحد</span>}
            </div>
          </div>

          {/* Hashtags */}
          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-800">🏷 الهاشتاقات ({hashtags.length}/30)</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => void loadSets()}
                  disabled={setsLoading}
                  className="text-xs text-gray-600 border px-2.5 py-1 rounded-lg hover:bg-gray-50"
                >
                  {setsLoading ? "…" : "📁 مجموعاتي"}
                </button>
                <button
                  onClick={() => void generateHashtags()}
                  disabled={generatingTags || !caption.trim()}
                  className="text-xs text-purple-600 border border-purple-300 px-2.5 py-1 rounded-lg hover:bg-purple-50 disabled:opacity-50"
                >
                  {generatingTags ? "جارٍ…" : "✨ اقتراح AI"}
                </button>
              </div>
            </div>

            {/* Hashtag sets dropdown */}
            {showSets && hashtagSets && (
              <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
                {hashtagSets.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">لا توجد مجموعات محفوظة</p>
                ) : (
                  hashtagSets.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => applySet(s)}
                      className="w-full text-right px-4 py-2.5 hover:bg-gray-50 border-b last:border-0 text-sm"
                    >
                      <span className="font-medium">{s.name}</span>
                      <span className="text-gray-400 text-xs mr-2">({s.hashtags.length} هاشتاق)</span>
                    </button>
                  ))
                )}
                <button onClick={() => setShowSets(false)} className="w-full text-center text-xs text-gray-400 py-2 hover:bg-gray-50">
                  إغلاق
                </button>
              </div>
            )}

            {/* AI suggestions */}
            {suggestions && (
              <div className="space-y-2">
                {(["broad", "niche", "branded"] as const).map((tier) => (
                  <div key={tier}>
                    <p className="text-xs text-gray-500 mb-1.5">
                      {tier === "broad" ? "واسع الانتشار" : tier === "niche" ? "متوسط" : "متخصص"}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {suggestions[tier].map((tag) => (
                        <button
                          key={tag}
                          onClick={() => toggleHashtag(tag)}
                          className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                            hashtags.includes(tag)
                              ? "bg-blue-600 text-white border-blue-600"
                              : "border-gray-300 text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Manual input */}
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

            {/* Selected tags */}
            {hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {hashtags.map((tag) => (
                  <span key={tag} className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                    #{tag}
                    <button onClick={() => toggleHashtag(tag)} className="text-blue-400 hover:text-blue-600">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Schedule */}
          <div className="card space-y-3">
            <h2 className="text-sm font-semibold text-gray-800">🗓 الجدولة</h2>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="status" checked={status === "DRAFT"} onChange={() => setStatus("DRAFT")} />
                <span className="text-sm">حفظ كمسودة</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="status" checked={status === "SCHEDULED"} onChange={() => setStatus("SCHEDULED")} />
                <span className="text-sm">جدولة</span>
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
        </div>

        {/* Right column — Preview */}
        <div className="space-y-4">
          <div className="card sticky top-20">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">👁 معاينة</h2>
            <div className="border rounded-xl overflow-hidden bg-white shadow-sm max-w-[280px] mx-auto">
              {/* fake IG header */}
              <div className="flex items-center gap-2 px-3 py-2.5 border-b">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600" />
                <span className="text-xs font-semibold text-gray-800">your_account</span>
                <span className="mr-auto text-gray-400 text-sm">···</span>
              </div>
              {/* media */}
              <div className="aspect-square bg-gray-100">
                {mediaUrls[0] ? (
                  mediaUrls[0].endsWith(".mp4") ? (
                    <video src={mediaUrls[0]} className="w-full h-full object-cover" controls />
                  ) : (
                    <img src={mediaUrls[0]} alt="" className="w-full h-full object-cover" />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl text-gray-200">📷</div>
                )}
              </div>
              {/* actions */}
              <div className="px-3 py-2 flex gap-3 text-gray-500">
                <span>🤍</span><span>💬</span><span>↗</span><span className="mr-auto">🔖</span>
              </div>
              {/* caption */}
              <div className="px-3 pb-3">
                <p className="text-xs leading-relaxed text-gray-800 whitespace-pre-wrap line-clamp-4">
                  {caption || <span className="text-gray-300">التسمية التوضيحية ستظهر هنا…</span>}
                </p>
                {hashtags.length > 0 && (
                  <p className="text-xs text-blue-500 mt-1 line-clamp-2">
                    {hashtags.map((h) => `#${h}`).join(" ")}
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 space-y-2">
              {igConnected && (
                <button
                  onClick={() => void publishNow()}
                  disabled={publishingNow || saving}
                  className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-90 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-opacity"
                >
                  {publishingNow ? "جارٍ النشر…" : "🚀 نشر الآن"}
                </button>
              )}
              <button
                onClick={() => void save(false)}
                disabled={saving || publishingNow}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
              >
                {saving ? "جارٍ الحفظ…" : status === "SCHEDULED" ? "جدولة المنشور" : "حفظ كمسودة"}
              </button>
              {status !== "DRAFT" && (
                <button
                  onClick={() => void save(true)}
                  disabled={saving || publishingNow}
                  className="w-full py-2 border text-sm text-gray-600 rounded-xl hover:bg-gray-50 disabled:opacity-50"
                >
                  حفظ كمسودة فقط
                </button>
              )}
              {!igConnected && (
                <a
                  href="/instagram/connect"
                  className="block text-center text-xs text-gray-400 hover:text-blue-600 mt-1"
                >
                  ربط حساب إنستغرام للنشر المباشر
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
