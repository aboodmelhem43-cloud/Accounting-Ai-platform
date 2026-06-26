"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useLang } from "@/components/LanguageProvider";

interface JournalLine {
  id: string;
  account: { code: string; nameAr: string | null; name: string };
  debit: number;
  credit: number;
  description: string | null;
}

interface JournalEntry {
  id: string;
  date: string;
  description: string;
  sourceType: string;
  status: "DRAFT" | "POSTED";
  lines: JournalLine[];
  creator: { name: string | null; email: string };
}

export default function JournalPage() {
  const { t, lang } = useLang();
  const locale = lang === "ar" ? "ar" : "en";
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [postingId, setPostingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/journal?page=${page}`);
      const data = await res.json();
      setEntries(data.entries ?? []);
      setTotal(data.total ?? 0);
    } catch {
      // keep existing entries on network error
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [page]);

  async function handlePost(id: string) {
    setPostingId(id);
    setActionError(null);
    try {
      const res = await fetch(`/api/journal/${id}/post`, { method: "PATCH" });
      if (res.ok) {
        setEntries((prev) =>
          prev.map((e) => (e.id === id ? { ...e, status: "POSTED" as const } : e))
        );
      } else {
        const d = await res.json().catch(() => ({})) as { error?: string };
        setActionError(d.error ?? (lang === "ar" ? "فشل ترحيل القيد" : "Failed to post entry"));
      }
    } catch {
      setActionError(lang === "ar" ? "خطأ في الاتصال" : "Connection error");
    } finally {
      setPostingId(null);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    setConfirmId(null);
    setActionError(null);
    try {
      const res = await fetch(`/api/journal/${id}`, { method: "DELETE" });
      if (res.ok) {
        setEntries((prev) => prev.filter((e) => e.id !== id));
        setTotal((t) => t - 1);
      } else {
        const d = await res.json().catch(() => ({})) as { error?: string };
        setActionError(d.error ?? (lang === "ar" ? "فشل حذف القيد" : "Failed to delete entry"));
      }
    } catch {
      setActionError(lang === "ar" ? "خطأ في الاتصال" : "Connection error");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Confirm delete modal */}
      {confirmId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4 space-y-4">
            <div className="text-center">
              <div className="text-3xl mb-2">🗑️</div>
              <h3 className="text-lg font-semibold text-gray-900">
                {lang === "ar" ? "حذف القيد؟" : "Delete Entry?"}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {lang === "ar"
                  ? "سيتم حذف القيد وسطوره نهائياً. هذا الإجراء لا يمكن التراجع عنه."
                  : "This entry and all its lines will be permanently deleted. This cannot be undone."}
              </p>
              {entries.find((e) => e.id === confirmId)?.status === "POSTED" && (
                <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mt-2">
                  ⚠️ {lang === "ar"
                    ? "هذا القيد مُرحَّل — حذفه سيؤثر على التقارير المالية."
                    : "This entry is posted — deleting it will affect financial reports."}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmId(null)}
                className="btn-secondary flex-1"
              >
                {lang === "ar" ? "إلغاء" : "Cancel"}
              </button>
              <button
                onClick={() => handleDelete(confirmId)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
              >
                {lang === "ar" ? "حذف" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-red-400 hover:text-red-600 ml-2">✕</button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("journal.title")}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {total} {lang === "ar" ? "قيد محاسبي" : "entries"}
          </p>
        </div>
        <Link href="/journal/new" className="btn-primary">
          ✏️ {lang === "ar" ? "قيد جديد" : "New Entry"}
        </Link>
      </div>

      {loading && (
        <div className="text-center py-8 text-gray-500">
          <div className="animate-spin text-2xl mb-2">⚙️</div>
          <p>{t("common.loading")}</p>
        </div>
      )}

      {!loading && entries.length === 0 && (
        <div className="card text-center py-12">
          <div className="text-5xl mb-4">📒</div>
          <p className="text-gray-500">{t("journal.empty")}</p>
          <p className="text-gray-400 text-sm mt-1">
            {lang === "ar"
              ? "سيظهر هنا القيود المُرحَّلة من الفواتير أو المدخلة يدويًا."
              : "Entries from confirmed invoices or manual input will appear here."}
          </p>
        </div>
      )}

      {!loading && entries.map((entry) => (
        <div key={entry.id} className="card">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-gray-800">{entry.description}</p>
                {entry.status === "DRAFT" && (
                  <span className="inline-flex px-2 py-0.5 text-xs rounded-full font-medium bg-yellow-100 text-yellow-700 border border-yellow-200">
                    {lang === "ar" ? "مسودة" : "Draft"}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                <span>📅 {new Date(entry.date).toLocaleDateString(locale)}</span>
                <span>
                  {entry.sourceType === "AI_INVOICE"
                    ? `🤖 ${t("journal.source.ai")}`
                    : `✏️ ${t("journal.source.manual")}`}
                </span>
                <span>
                  {lang === "ar" ? "بواسطة:" : "by:"} {entry.creator.name ?? entry.creator.email}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {entry.status === "DRAFT" && (
                <button
                  onClick={() => handlePost(entry.id)}
                  disabled={postingId === entry.id}
                  className="btn-primary text-xs py-1.5 px-3"
                >
                  {postingId === entry.id
                    ? (lang === "ar" ? "جاري..." : "Posting...")
                    : (lang === "ar" ? "ترحيل" : "Post")}
                </button>
              )}
              <Link
                href={`/journal/${entry.id}`}
                className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                title={lang === "ar" ? "عرض القيد" : "View entry"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
              </Link>
              <button
                onClick={() => setConfirmId(entry.id)}
                disabled={deletingId === entry.id}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                title={lang === "ar" ? "حذف القيد" : "Delete entry"}
              >
                {deletingId === entry.id ? (
                  <span className="text-xs animate-pulse">...</span>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-right pb-2 font-medium text-gray-500 text-xs">{t("journal.account")}</th>
                <th className="text-left pb-2 font-medium text-gray-500 text-xs">{t("journal.debit")}</th>
                <th className="text-left pb-2 font-medium text-gray-500 text-xs">{t("journal.credit")}</th>
              </tr>
            </thead>
            <tbody>
              {entry.lines.map((line) => (
                <tr key={line.id} className="border-b border-gray-50 last:border-0">
                  <td className="py-1.5">
                    <span className="text-gray-400 text-xs ml-1">{line.account.code}</span>
                    {lang === "ar" ? (line.account.nameAr ?? line.account.name) : line.account.name}
                  </td>
                  <td className="py-1.5 text-left font-mono text-xs">
                    {Number(line.debit) > 0 ? Number(line.debit).toLocaleString(locale) : ""}
                  </td>
                  <td className="py-1.5 text-left font-mono text-xs">
                    {Number(line.credit) > 0 ? Number(line.credit).toLocaleString(locale) : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {total > 20 && (
        <div className="flex justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-secondary"
          >
            {lang === "ar" ? "← السابق" : "← Prev"}
          </button>
          <span className="py-2 text-sm text-gray-500">
            {lang === "ar" ? `صفحة ${page}` : `Page ${page}`}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={entries.length < 20}
            className="btn-secondary"
          >
            {lang === "ar" ? "التالي →" : "Next →"}
          </button>
        </div>
      )}
    </div>
  );
}
