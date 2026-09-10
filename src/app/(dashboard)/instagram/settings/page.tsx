"use client";

import { useState, useEffect } from "react";

interface HashtagSet {
  id: string;
  name: string;
  hashtags: string[];
  createdAt: string;
}

export default function InstagramSettingsPage() {
  const [sets, setSets] = useState<HashtagSet[]>([]);
  const [loading, setLoading] = useState(true);

  // New set form
  const [newName, setNewName]     = useState("");
  const [tagInput, setTagInput]   = useState("");
  const [newTags, setNewTags]     = useState<string[]>([]);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");

  const [deleting, setDeleting] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/instagram/hashtag-sets");
    if (res.ok) {
      const { sets: s } = await res.json() as { sets: HashtagSet[] };
      setSets(s);
    }
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const addTag = () => {
    const tag = tagInput.trim().replace(/^#/, "");
    if (!tag) return;
    if (!newTags.includes(tag) && newTags.length < 30) {
      setNewTags((prev) => [...prev, tag]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => setNewTags((prev) => prev.filter((t) => t !== tag));

  const handleCreate = async () => {
    if (!newName.trim()) { setError("أدخل اسم المجموعة"); return; }
    if (newTags.length === 0) { setError("أضف هاشتاق واحداً على الأقل"); return; }
    setSaving(true); setError(""); setSuccess("");
    const res = await fetch("/api/instagram/hashtag-sets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), hashtags: newTags }),
    });
    if (res.ok) {
      setNewName(""); setNewTags([]);
      setSuccess("تم حفظ المجموعة");
      void load();
      setTimeout(() => setSuccess(""), 3000);
    } else {
      const { error: e } = await res.json() as { error: string };
      setError(e ?? "فشل الحفظ");
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("حذف هذه المجموعة؟")) return;
    setDeleting(id);
    await fetch(`/api/instagram/hashtag-sets/${id}`, { method: "DELETE" });
    setDeleting(null);
    void load();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">⚙️ إعدادات إنستغرام</h1>
        <p className="text-gray-500 text-sm mt-1">إدارة مجموعات الهاشتاقات المحفوظة</p>
      </div>

      {/* Create new set */}
      <div className="card space-y-4">
        <h2 className="text-base font-semibold text-gray-800">➕ مجموعة هاشتاقات جديدة</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">
            ✅ {success}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">اسم المجموعة</label>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="مثال: طعام وصحة"
            maxLength={80}
            className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            الهاشتاقات ({newTags.length}/30)
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
              placeholder="اكتب هاشتاق واضغط Enter"
              className="flex-1 text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              dir="ltr"
            />
            <button onClick={addTag} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm">
              إضافة
            </button>
          </div>
          {newTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {newTags.map((tag) => (
                <span key={tag} className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
                  #{tag}
                  <button onClick={() => removeTag(tag)} className="text-blue-400 hover:text-blue-600">×</button>
                </span>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => void handleCreate()}
          disabled={saving}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
        >
          {saving ? "جارٍ الحفظ…" : "حفظ المجموعة"}
        </button>
      </div>

      {/* Existing sets */}
      <div className="card">
        <h2 className="text-base font-semibold text-gray-800 mb-4">📁 المجموعات المحفوظة</h2>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse h-16 bg-gray-50 rounded-xl" />
            ))}
          </div>
        ) : sets.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">لا توجد مجموعات بعد</p>
        ) : (
          <div className="space-y-3">
            {sets.map((s) => (
              <div
                key={s.id}
                className="flex items-start gap-3 p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{s.name}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {s.hashtags.slice(0, 8).map((tag) => (
                      <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        #{tag}
                      </span>
                    ))}
                    {s.hashtags.length > 8 && (
                      <span className="text-xs text-gray-400">+{s.hashtags.length - 8} أخرى</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {s.hashtags.length} هاشتاق · أُنشئت {new Date(s.createdAt).toLocaleDateString("ar")}
                  </p>
                </div>
                <button
                  onClick={() => void handleDelete(s.id)}
                  disabled={deleting === s.id}
                  className="flex-shrink-0 text-red-400 hover:text-red-600 text-sm p-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                  title="حذف"
                >
                  {deleting === s.id ? "…" : "🗑"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
