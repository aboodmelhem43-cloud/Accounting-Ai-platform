"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useLang } from "@/components/LanguageProvider";

interface JournalLine {
  id: string;
  account: { code: string; name: string; nameAr: string | null };
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
  createdAt: string;
  updatedAt: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  lines: JournalLine[];
  creator: UserRef;
  updater: UserRef | null;
  submitter: UserRef | null;
  reviewer: UserRef | null;
  invoice: { id: string; invoiceType: string } | null;
}

const STATUS_STYLE: Record<string, string> = {
  DRAFT:          "bg-gray-100 text-gray-600 border-gray-200",
  PENDING_REVIEW: "bg-yellow-100 text-yellow-700 border-yellow-200",
  REJECTED:       "bg-red-100 text-red-600 border-red-200",
  POSTED:         "bg-green-100 text-green-700 border-green-200",
};

export default function JournalEntryPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { t, lang } = useLang();
  const { data: session } = useSession();
  const isAr = lang === "ar";
  const locale = isAr ? "ar" : "en";
  const isOwner = session?.user?.role === "OWNER";

  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

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

  async function doAction(url: string, method = "PATCH", body?: object): Promise<boolean> {
    setActionError(null);
    try {
      const res = await fetch(url, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as { error?: string };
        setActionError(d.error ?? (isAr ? "فشلت العملية" : "Action failed"));
        return false;
      }
      return true;
    } catch {
      setActionError(isAr ? "خطأ في الاتصال" : "Connection error");
      return false;
    }
  }

  async function handleSubmit() {
    if (!entry) return;
    setActionId("submit");
    if (await doAction(`/api/journal/${entry.id}/submit`)) {
      setEntry((e) => e ? { ...e, status: "PENDING_REVIEW" } : e);
    }
    setActionId(null);
  }

  async function handleApprove() {
    if (!entry) return;
    setActionId("approve");
    if (await doAction(`/api/journal/${entry.id}/approve`)) {
      setEntry((e) => e ? { ...e, status: "POSTED" } : e);
    }
    setActionId(null);
  }

  async function handlePost() {
    if (!entry) return;
    setActionId("post");
    if (await doAction(`/api/journal/${entry.id}/post`)) {
      setEntry((e) => e ? { ...e, status: "POSTED" } : e);
    }
    setActionId(null);
  }

  async function handleReject() {
    if (!entry || !rejectReason.trim()) return;
    setActionId("reject");
    const reason = rejectReason;
    if (await doAction(`/api/journal/${entry.id}/reject`, "PATCH", { reason })) {
      setEntry((e) => e ? { ...e, status: "REJECTED", rejectionReason: reason } : e);
      setShowRejectModal(false);
      setRejectReason("");
    }
    setActionId(null);
  }

  async function handleDelete() {
    if (!entry) return;
    setActionId("delete");
    const res = await fetch(`/api/journal/${entry.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/journal");
    } else {
      const d = await res.json().catch(() => ({})) as { error?: string };
      setActionError(d.error ?? (isAr ? "فشل الحذف" : "Delete failed"));
      setActionId(null);
    }
    setConfirmDelete(false);
  }

  const statusLabel = (s: string) => {
    const m: Record<string, { ar: string; en: string }> = {
      DRAFT:          { ar: "مسودة",           en: "Draft" },
      PENDING_REVIEW: { ar: "بانتظار الموافقة", en: "Pending Review" },
      REJECTED:       { ar: "مرفوض",           en: "Rejected" },
      POSTED:         { ar: "مُرحَّل",          en: "Posted" },
    };
    return isAr ? (m[s]?.ar ?? s) : (m[s]?.en ?? s);
  };

  const userLabel = (u: UserRef | null) => u ? (u.name ?? u.email) : "—";

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });

  const fmtDateTime = (d: string) =>
    new Date(d).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" }) +
    " " + new Date(d).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });

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
  const canEdit = (entry.status === "DRAFT" || entry.status === "REJECTED") && !entry.isLocked;
  const canDelete = entry.status !== "POSTED" && !entry.isLocked;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Reject modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {isAr ? "سبب الرفض" : "Rejection Reason"}
            </h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder={isAr ? "اكتب سبب الرفض..." : "Write the reason for rejection..."}
              className="input w-full resize-none"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowRejectModal(false); setRejectReason(""); }}
                className="btn-secondary flex-1"
              >
                {isAr ? "إلغاء" : "Cancel"}
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || actionId === "reject"}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg text-sm"
              >
                {isAr ? "رفض القيد" : "Reject Entry"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
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
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(false)} className="btn-secondary flex-1">
                {isAr ? "إلغاء" : "Cancel"}
              </button>
              <button
                onClick={handleDelete}
                disabled={actionId === "delete"}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
              >
                {actionId === "delete"
                  ? (isAr ? "جاري..." : "Deleting...")
                  : (isAr ? "حذف" : "Delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error banner */}
      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-red-400 hover:text-red-600 ms-2">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Link href="/journal" className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1">
          {isAr ? "→ الدفتر" : "← Journal"}
        </Link>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Edit — DRAFT or REJECTED */}
          {canEdit && (
            <Link
              href={`/journal/${entry.id}/edit`}
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:bg-gray-100 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors"
            >
              ✏️ {isAr ? "تعديل" : "Edit"}
            </Link>
          )}

          {/* ACCOUNTANT: submit */}
          {!isOwner && (entry.status === "DRAFT" || entry.status === "REJECTED") && !entry.isLocked && (
            <button
              onClick={handleSubmit}
              disabled={!!actionId}
              className="btn-primary text-sm py-1.5 px-4"
            >
              {actionId === "submit"
                ? (isAr ? "جاري..." : "...")
                : (isAr ? "تقديم للمراجعة" : "Submit for Review")}
            </button>
          )}
          {!isOwner && entry.status === "PENDING_REVIEW" && (
            <span className="text-xs text-yellow-600 font-medium bg-yellow-50 px-3 py-1.5 rounded border border-yellow-200">
              ⏳ {isAr ? "بانتظار الموافقة" : "Awaiting Approval"}
            </span>
          )}

          {/* OWNER: approve & reject on PENDING_REVIEW */}
          {isOwner && entry.status === "PENDING_REVIEW" && (
            <>
              <button
                onClick={handleApprove}
                disabled={!!actionId}
                className="text-sm py-1.5 px-3 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium transition-colors"
              >
                {actionId === "approve" ? "..." : (isAr ? "موافقة وترحيل" : "Approve & Post")}
              </button>
              <button
                onClick={() => { setShowRejectModal(true); setRejectReason(""); }}
                disabled={!!actionId}
                className="text-sm py-1.5 px-3 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 font-medium"
              >
                {isAr ? "رفض" : "Reject"}
              </button>
            </>
          )}

          {/* OWNER: post directly on DRAFT/REJECTED */}
          {isOwner && (entry.status === "DRAFT" || entry.status === "REJECTED") && !entry.isLocked && (
            <button
              onClick={handlePost}
              disabled={!!actionId}
              className="btn-primary text-sm py-1.5 px-4"
            >
              {actionId === "post"
                ? (isAr ? "جاري..." : "Posting...")
                : (isAr ? "ترحيل مباشر" : "Post Directly")}
            </button>
          )}

          {/* Delete — only for non-POSTED entries */}
          {canDelete && (
            <button
              onClick={() => setConfirmDelete(true)}
              disabled={!!actionId}
              className="flex items-center gap-1.5 text-sm text-red-600 hover:bg-red-50 border border-red-200 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {isAr ? "حذف" : "Delete"}
            </button>
          )}
        </div>
      </div>

      {/* Rejection reason banner */}
      {entry.status === "REJECTED" && entry.rejectionReason && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          <div className="font-semibold mb-1">❌ {isAr ? "سبب الرفض:" : "Rejection Reason:"}</div>
          <p>{entry.rejectionReason}</p>
          {entry.reviewer && (
            <p className="text-xs text-red-500 mt-1.5">
              — {userLabel(entry.reviewer)}
              {entry.reviewedAt && ` · ${fmtDate(entry.reviewedAt)}`}
            </p>
          )}
        </div>
      )}

      {/* Entry info card */}
      <div className="card space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">{entry.description}</h1>
              <span className={`inline-flex px-2 py-0.5 text-xs rounded-full font-medium border ${STATUS_STYLE[entry.status] ?? "bg-gray-100 text-gray-500"}`}>
                {statusLabel(entry.status)}
              </span>
              {entry.isLocked && (
                <span className="inline-flex px-2 py-0.5 text-xs rounded-full font-medium bg-slate-100 text-slate-500 border border-slate-200">
                  🔒 {isAr ? "مقفل" : "Locked"}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                📅 {fmtDate(entry.date)}
              </span>
              <span className="flex items-center gap-1">
                {entry.sourceType === "AI_INVOICE" ? "🤖" : "✏️"}
                {entry.sourceType === "AI_INVOICE"
                  ? (isAr ? "فاتورة ذكاء اصطناعي" : "AI Invoice")
                  : (isAr ? "يدوي" : "Manual")}
              </span>
            </div>
          </div>

          {!isBalanced && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700 flex-shrink-0">
              ⚠️ {isAr ? "القيد غير متوازن!" : "Entry is unbalanced!"}
            </div>
          )}
        </div>

        {/* Audit trail */}
        <div className="border-t border-gray-100 pt-3 space-y-1.5 text-xs text-gray-500">
          <div>
            👤 {isAr ? "أنشأه:" : "Created by:"}{" "}
            <span className="font-medium text-gray-700">{userLabel(entry.creator)}</span>
            {" · "}{fmtDateTime(entry.createdAt)}
          </div>
          {entry.updater && (
            <div>
              ✏️ {isAr ? "عدّله:" : "Modified by:"}{" "}
              <span className="font-medium text-gray-700">{userLabel(entry.updater)}</span>
              {entry.updatedAt && ` · ${fmtDateTime(entry.updatedAt)}`}
            </div>
          )}
          {entry.submitter && (
            <div className="text-yellow-600">
              📤 {isAr ? "قدّمه:" : "Submitted by:"}{" "}
              <span className="font-medium">{userLabel(entry.submitter)}</span>
              {entry.submittedAt && ` · ${fmtDate(entry.submittedAt)}`}
            </div>
          )}
          {entry.reviewer && entry.status === "POSTED" && (
            <div className="text-green-600">
              ✅ {isAr ? "وافق عليه:" : "Approved by:"}{" "}
              <span className="font-medium">{userLabel(entry.reviewer)}</span>
              {entry.reviewedAt && ` · ${fmtDate(entry.reviewedAt)}`}
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
              {isAr
                ? (entry.invoice.invoiceType === "PURCHASE" ? "فاتورة مشتريات" : "فاتورة مبيعات")
                : (entry.invoice.invoiceType === "PURCHASE" ? "Purchase Invoice" : "Sales Invoice")}
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
