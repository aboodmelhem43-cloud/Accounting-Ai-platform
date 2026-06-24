"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useLang } from "@/components/LanguageProvider";

interface JournalLine {
  id: string;
  account: { code: string; name: string; nameAr: string | null };
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
  createdAt: string;
  lines: JournalLine[];
  creator: { name: string | null; email: string };
  invoice: { id: string; vendorName: string | null } | null;
}

export default function JournalEntryPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { t, lang } = useLang();
  const isAr = lang === "ar";
  const locale = isAr ? "ar" : "en";

  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [posting, setPosting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/journal/${id}`);
      if (res.status === 404 || res.status === 403) { setNotFound(true); setLoading(false); return; }
      const data = await res.json();
      setEntry(data.entry);
      setLoading(false);
    }
    load();
  }, [id]);

  async function handlePost() {
    if (!entry) return;
    setPosting(true);
    const res = await fetch(`/api/journal/${id}/post`, { method: "PATCH" });
    if (res.ok) setEntry((e) => e ? { ...e, status: "POSTED" } : e);
    setPosting(false);
  }

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/journal/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/journal");
    else setDeleting(false);
    setConfirmDelete(false);
  }

  if (loading) {
    return (
      <div className="text-center py-20 text-gray-400">
        <div className="animate-spin text-3xl mb-3">⚙️</div>
        <p>{t("common.loading")}</p>
      </div>
    );
  }

  if (notFound || !entry) {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4">📭</div>
        <p className="text-gray-500 font-medium">{isAr ? "القيد غير موجود" : "Entry not found"}</p>
        <Link href="/journal" className="btn-secondary mt-4 inline-block">
          {isAr ? "← العودة للدفتر" : "← Back to Journal"}
        </Link>
      </div>
    );
  }

  const totalDebit = entry.lines.reduce((s, l) => s + Number(l.debit), 0);
  const totalCredit = entry.lines.reduce((s, l) => s + Number(l.credit), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Confirm delete modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4 space-y-4">
            <div className="text-center">
              <div className="text-3xl mb-2">🗑️</div>
              <h3 className="text-lg font-semibold text-gray-900">
                {isAr ? "حذف القيد؟" : "Delete Entry?"}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {isAr
                  ? "سيتم حذف القيد وسطوره نهائياً. هذا الإجراء لا يمكن التراجع عنه."
                  : "This entry and all its lines will be permanently deleted. This cannot be undone."}
              </p>
              {entry.status === "POSTED" && (
                <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mt-2">
                  ⚠️ {isAr
                    ? "هذا القيد مُرحَّل — حذفه سيؤثر على التقارير المالية."
                    : "This entry is posted — deleting it will affect financial reports."}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(false)} className="btn-secondary flex-1">
                {isAr ? "إلغاء" : "Cancel"}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
              >
                {deleting ? (isAr ? "جاري..." : "Deleting...") : (isAr ? "حذف" : "Delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/journal" className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1">
          {isAr ? "→ الدفتر" : "← Journal"}
        </Link>
        <div className="flex items-center gap-2">
          {entry.status === "DRAFT" && (
            <button
              onClick={handlePost}
              disabled={posting}
              className="btn-primary text-sm py-1.5 px-4"
            >
              {posting ? (isAr ? "جاري..." : "Posting...") : (isAr ? "ترحيل" : "Post")}
            </button>
          )}
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-1.5 text-sm text-red-600 hover:bg-red-50 border border-red-200 rounded-lg px-3 py-1.5 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {isAr ? "حذف" : "Delete"}
          </button>
        </div>
      </div>

      {/* Entry info card */}
      <div className="card space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">{entry.description}</h1>
              <span className={`inline-flex px-2 py-0.5 text-xs rounded-full font-medium border ${
                entry.status === "POSTED"
                  ? "bg-green-100 text-green-700 border-green-200"
                  : "bg-yellow-100 text-yellow-700 border-yellow-200"
              }`}>
                {entry.status === "POSTED"
                  ? (isAr ? "مُرحَّل" : "Posted")
                  : (isAr ? "مسودة" : "Draft")}
              </span>
            </div>

            <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                📅 {new Date(entry.date).toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" })}
              </span>
              <span className="flex items-center gap-1">
                {entry.sourceType === "AI_INVOICE" ? "🤖" : "✏️"}
                {entry.sourceType === "AI_INVOICE"
                  ? (isAr ? "فاتورة ذكاء اصطناعي" : "AI Invoice")
                  : (isAr ? "يدوي" : "Manual")}
              </span>
              <span className="flex items-center gap-1">
                👤 {entry.creator.name ?? entry.creator.email}
              </span>
              <span className="flex items-center gap-1 text-xs text-gray-400">
                🕐 {new Date(entry.createdAt).toLocaleDateString(locale)} {new Date(entry.createdAt).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>

          {!isBalanced && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
              ⚠️ {isAr ? "القيد غير متوازن!" : "Entry is unbalanced!"}
            </div>
          )}
        </div>

        {entry.invoice && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 flex items-center gap-2 text-sm">
            <span className="text-blue-500">🧾</span>
            <span className="text-blue-700">
              {isAr ? "مصدر الفاتورة:" : "From invoice:"}
            </span>
            <Link href={`/invoices/${entry.invoice.id}`} className="text-blue-600 hover:underline font-medium">
              {entry.invoice.vendorName ?? entry.invoice.id}
            </Link>
          </div>
        )}
      </div>

      {/* Journal lines table */}
      <div className="card">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">
          {isAr ? "سطور القيد" : "Journal Lines"}
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-100">
                <th className="pb-3 text-start font-medium text-gray-500 text-xs">{isAr ? "رقم" : "Code"}</th>
                <th className="pb-3 text-start font-medium text-gray-500 text-xs">{isAr ? "الحساب" : "Account"}</th>
                <th className="pb-3 text-start font-medium text-gray-500 text-xs">{isAr ? "البيان" : "Description"}</th>
                <th className="pb-3 text-end font-medium text-gray-500 text-xs">{t("journal.debit")}</th>
                <th className="pb-3 text-end font-medium text-gray-500 text-xs">{t("journal.credit")}</th>
              </tr>
            </thead>
            <tbody>
              {entry.lines.map((line) => (
                <tr key={line.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                  <td className="py-3 text-gray-400 text-xs font-mono">{line.account.code}</td>
                  <td className="py-3 font-medium text-gray-800">
                    {isAr ? (line.account.nameAr ?? line.account.name) : line.account.name}
                  </td>
                  <td className="py-3 text-gray-500 text-xs">{line.description ?? "—"}</td>
                  <td className="py-3 text-end font-mono text-green-700">
                    {Number(line.debit) > 0 ? Number(line.debit).toLocaleString(locale) : ""}
                  </td>
                  <td className="py-3 text-end font-mono text-blue-700">
                    {Number(line.credit) > 0 ? Number(line.credit).toLocaleString(locale) : ""}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50/50">
                <td colSpan={3} className="pt-3 pb-2 text-xs font-semibold text-gray-600">
                  {isAr ? "الإجمالي" : "Total"}
                </td>
                <td className="pt-3 pb-2 text-end font-mono font-bold text-green-700">
                  {totalDebit.toLocaleString(locale)}
                </td>
                <td className="pt-3 pb-2 text-end font-mono font-bold text-blue-700">
                  {totalCredit.toLocaleString(locale)}
                </td>
              </tr>
              {isBalanced && (
                <tr>
                  <td colSpan={5} className="pt-1 pb-2 text-xs text-green-600 text-center">
                    ✅ {isAr ? "القيد متوازن" : "Entry is balanced"}
                  </td>
                </tr>
              )}
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
