"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useLang } from "@/components/LanguageProvider";

interface JournalLine {
  id: string;
  account: { code: string; nameAr: string | null; name: string };
  debit: number;
  credit: number;
  description: string | null;
}

interface UserRef { name: string | null; email: string }

interface JournalEntry {
  id: string;
  date: string;
  description: string;
  sourceType: string;
  status: "DRAFT" | "PENDING_REVIEW" | "REJECTED" | "POSTED";
  isLocked: boolean;
  rejectionReason: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  updatedAt: string | null;
  lines: JournalLine[];
  creator:   UserRef;
  updater:   UserRef | null;
  submitter: UserRef | null;
  reviewer:  UserRef | null;
}

const STATUS_STYLE: Record<string, string> = {
  DRAFT:          "bg-gray-100 text-gray-500 border-gray-200",
  PENDING_REVIEW: "bg-yellow-100 text-yellow-700 border-yellow-200",
  REJECTED:       "bg-red-100 text-red-600 border-red-200",
  POSTED:         "bg-green-100 text-green-700 border-green-200",
};

export default function JournalPage() {
  const { t, lang } = useLang();
  const locale = lang === "ar" ? "ar" : "en";
  const { data: session } = useSession();
  const isOwner = session?.user?.role === "OWNER";

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  function setFilter(f: string) {
    setStatusFilter(f);
    setPage(1);
  }

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page) });
        if (statusFilter) params.set("status", statusFilter);
        const res = await fetch(`/api/journal?${params}`);
        const data = await res.json();
        setEntries(data.entries ?? []);
        setTotal(data.total ?? 0);
      } catch {
        // keep existing on error
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [page, statusFilter]);

  async function doAction(url: string, method = "PATCH", body?: object) {
    setActionError(null);
    try {
      const res = await fetch(url, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as { error?: string };
        setActionError(d.error ?? (lang === "ar" ? "فشلت العملية" : "Action failed"));
        return false;
      }
      return true;
    } catch {
      setActionError(lang === "ar" ? "خطأ في الاتصال" : "Connection error");
      return false;
    }
  }

  async function handlePost(id: string) {
    setActionId(id);
    if (await doAction(`/api/journal/${id}/post`)) {
      setEntries((prev) => prev.map((e) => e.id === id ? { ...e, status: "POSTED" as const } : e));
    }
    setActionId(null);
  }

  async function handleSubmit(id: string) {
    setActionId(id);
    if (await doAction(`/api/journal/${id}/submit`)) {
      setEntries((prev) => prev.map((e) => e.id === id ? { ...e, status: "PENDING_REVIEW" as const } : e));
    }
    setActionId(null);
  }

  async function handleApprove(id: string) {
    setActionId(id);
    if (await doAction(`/api/journal/${id}/approve`)) {
      setEntries((prev) => prev.map((e) => e.id === id ? { ...e, status: "POSTED" as const } : e));
    }
    setActionId(null);
  }

  async function handleReject(id: string) {
    if (!rejectReason.trim()) return;
    setActionId(id);
    const reason = rejectReason;
    if (await doAction(`/api/journal/${id}/reject`, "PATCH", { reason })) {
      setEntries((prev) => prev.map((e) =>
        e.id === id ? { ...e, status: "REJECTED" as const, rejectionReason: reason } : e
      ));
    }
    setRejectId(null);
    setRejectReason("");
    setActionId(null);
  }

  async function handleDelete(id: string) {
    setActionId(id);
    setConfirmDeleteId(null);
    if (await doAction(`/api/journal/${id}`, "DELETE")) {
      setEntries((prev) => prev.filter((e) => e.id !== id));
      setTotal((n) => n - 1);
    }
    setActionId(null);
  }

  const statusLabel = (s: string) => {
    const m: Record<string, { ar: string; en: string }> = {
      DRAFT:          { ar: "مسودة",           en: "Draft" },
      PENDING_REVIEW: { ar: "بانتظار الموافقة", en: "Pending Review" },
      REJECTED:       { ar: "مرفوض",           en: "Rejected" },
      POSTED:         { ar: "مُرحَّل",          en: "Posted" },
    };
    return lang === "ar" ? (m[s]?.ar ?? s) : (m[s]?.en ?? s);
  };

  const userLabel = (u: UserRef | null) => u ? (u.name ?? u.email) : "—";

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="space-y-6">
      {/* Reject modal */}
      {rejectId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {lang === "ar" ? "سبب الرفض" : "Rejection Reason"}
            </h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder={lang === "ar" ? "اكتب سبب الرفض..." : "Write the reason for rejection..."}
              className="input w-full resize-none"
            />
            <div className="flex gap-3">
              <button onClick={() => { setRejectId(null); setRejectReason(""); }} className="btn-secondary flex-1">
                {lang === "ar" ? "إلغاء" : "Cancel"}
              </button>
              <button
                onClick={() => handleReject(rejectId)}
                disabled={!rejectReason.trim() || actionId === rejectId}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg text-sm"
              >
                {lang === "ar" ? "رفض القيد" : "Reject Entry"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4 space-y-4">
            <div className="text-center">
              <div className="text-3xl mb-2">🗑️</div>
              <h3 className="text-lg font-semibold text-gray-900">
                {lang === "ar" ? "حذف القيد؟" : "Delete Entry?"}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {lang === "ar" ? "سيتم حذف القيد وسطوره نهائياً. هذا الإجراء لا يمكن التراجع عنه." : "This entry and all its lines will be permanently deleted. This cannot be undone."}
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDeleteId(null)} className="btn-secondary flex-1">
                {lang === "ar" ? "إلغاء" : "Cancel"}
              </button>
              <button onClick={() => handleDelete(confirmDeleteId)} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg text-sm">
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
          <p className="text-gray-500 text-sm mt-1">{total} {lang === "ar" ? "قيد محاسبي" : "entries"}</p>
        </div>
        <Link href="/journal/new" className="btn-primary">
          ✏️ {lang === "ar" ? "قيد جديد" : "New Entry"}
        </Link>
      </div>

      {/* Status filter tabs */}
      {(() => {
        const filters = [
          { key: "",               ar: "الكل",             en: "All" },
          { key: "DRAFT",          ar: "مسودة",            en: "Draft" },
          { key: "PENDING_REVIEW", ar: "بانتظار الموافقة", en: "Pending Review" },
          { key: "REJECTED",       ar: "مرفوض",            en: "Rejected" },
          { key: "POSTED",         ar: "مُرحَّل",          en: "Posted" },
        ];
        return (
          <div className="flex gap-2 flex-wrap">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  statusFilter === f.key
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600"
                }`}
              >
                {lang === "ar" ? f.ar : f.en}
              </button>
            ))}
          </div>
        );
      })()}

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
        </div>
      )}

      {!loading && entries.map((entry) => (
        <div key={entry.id} className="card">
          <div className="flex items-start justify-between mb-3 gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-gray-800">{entry.description}</p>
                <span className={`inline-flex px-2 py-0.5 text-xs rounded-full font-medium border ${STATUS_STYLE[entry.status] ?? "bg-gray-100 text-gray-500"}`}>
                  {statusLabel(entry.status)}
                </span>
                {entry.isLocked && (
                  <span className="inline-flex px-2 py-0.5 text-xs rounded-full font-medium bg-slate-100 text-slate-500 border border-slate-200">
                    🔒 {lang === "ar" ? "مقفل" : "Locked"}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                <span>📅 {fmtDate(entry.date)}</span>
                <span>{entry.sourceType === "AI_INVOICE" ? `🤖 ${t("journal.source.ai")}` : `✏️ ${t("journal.source.manual")}`}</span>
                <span>
                  {lang === "ar" ? "أنشأه:" : "Created by:"}
                  {" "}<span className="text-gray-600 font-medium">{userLabel(entry.creator)}</span>
                </span>
                {entry.updater && (
                  <span>
                    {lang === "ar" ? "عدّله:" : "Modified by:"}
                    {" "}<span className="text-gray-600 font-medium">{userLabel(entry.updater)}</span>
                    {entry.updatedAt && ` · ${fmtDate(entry.updatedAt)}`}
                  </span>
                )}
              </div>

              {entry.submitter && (
                <div className="mt-1 text-xs text-yellow-600">
                  📤 {lang === "ar" ? "قدّمه:" : "Submitted by:"} {userLabel(entry.submitter)}
                  {entry.submittedAt && ` · ${fmtDate(entry.submittedAt)}`}
                </div>
              )}
              {entry.reviewer && entry.status === "POSTED" && (
                <div className="mt-0.5 text-xs text-green-600">
                  ✅ {lang === "ar" ? "وافق عليه:" : "Approved by:"} {userLabel(entry.reviewer)}
                  {entry.reviewedAt && ` · ${fmtDate(entry.reviewedAt)}`}
                </div>
              )}
              {entry.status === "REJECTED" && entry.rejectionReason && (
                <div className="mt-1 text-xs text-red-600 bg-red-50 rounded px-2 py-1">
                  ❌ {lang === "ar" ? "سبب الرفض:" : "Rejection reason:"} {entry.rejectionReason}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {!isOwner && (entry.status === "DRAFT" || entry.status === "REJECTED") && !entry.isLocked && (
                <button
                  onClick={() => handleSubmit(entry.id)}
                  disabled={actionId === entry.id}
                  className="btn-primary text-xs py-1.5 px-3"
                >
                  {actionId === entry.id
                    ? (lang === "ar" ? "جاري..." : "...")
                    : (lang === "ar" ? "تقديم للمراجعة" : "Submit for Review")}
                </button>
              )}
              {!isOwner && entry.status === "PENDING_REVIEW" && (
                <span className="text-xs text-yellow-600 font-medium bg-yellow-50 px-2 py-1 rounded border border-yellow-200">
                  ⏳ {lang === "ar" ? "بانتظار الموافقة" : "Awaiting Approval"}
                </span>
              )}

              {isOwner && entry.status === "PENDING_REVIEW" && (
                <>
                  <button
                    onClick={() => handleApprove(entry.id)}
                    disabled={actionId === entry.id}
                    className="text-xs py-1.5 px-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-colors"
                  >
                    {actionId === entry.id ? "..." : (lang === "ar" ? "موافقة وترحيل" : "Approve & Post")}
                  </button>
                  <button
                    onClick={() => { setRejectId(entry.id); setRejectReason(""); }}
                    className="text-xs py-1.5 px-3 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-medium"
                  >
                    {lang === "ar" ? "رفض" : "Reject"}
                  </button>
                </>
              )}
              {isOwner && (entry.status === "DRAFT" || entry.status === "REJECTED") && !entry.isLocked && (
                <button
                  onClick={() => handlePost(entry.id)}
                  disabled={actionId === entry.id}
                  className="btn-primary text-xs py-1.5 px-3"
                >
                  {actionId === entry.id
                    ? (lang === "ar" ? "جاري..." : "...")
                    : (lang === "ar" ? "ترحيل مباشر" : "Post Directly")}
                </button>
              )}

              {/* Edit link — DRAFT/REJECTED only */}
              {!entry.isLocked && (entry.status === "DRAFT" || entry.status === "REJECTED") && (
                <Link
                  href={`/journal/${entry.id}/edit`}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  title={lang === "ar" ? "تعديل" : "Edit"}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </Link>
              )}
              <Link
                href={`/journal/${entry.id}`}
                className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                title={lang === "ar" ? "عرض" : "View"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
              </Link>
              {/* Delete — hidden for POSTED entries */}
              {!entry.isLocked && entry.status !== "POSTED" && (
                <button
                  onClick={() => setConfirmDeleteId(entry.id)}
                  disabled={actionId === entry.id}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title={lang === "ar" ? "حذف" : "Delete"}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
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
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary">
            {lang === "ar" ? "← السابق" : "← Prev"}
          </button>
          <span className="py-2 text-sm text-gray-500">{lang === "ar" ? `صفحة ${page}` : `Page ${page}`}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={entries.length < 20} className="btn-secondary">
            {lang === "ar" ? "التالي →" : "Next →"}
          </button>
        </div>
      )}
    </div>
  );
}
