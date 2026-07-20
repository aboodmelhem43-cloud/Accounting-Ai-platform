"use client";
import { useEffect, useState, useCallback } from "react";
import { useLang } from "@/components/LanguageProvider";

interface Period {
  id: string;
  year: number;
  month: number;
  status: "OPEN" | "CLOSED";
  closedAt: string | null;
  notes: string | null;
}

const MONTH_NAMES_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
const MONTH_NAMES_EN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function PeriodsPage() {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const [periods, setPeriods] = useState<Period[]>([]);
  const [countMap, setCountMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ year: number; month: number; action: "close" | "open" } | null>(null);
  const [notes, setNotes] = useState("");

  const currentYear = new Date().getFullYear();
  const [displayYear, setDisplayYear] = useState(currentYear);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/periods");
      const data = await res.json();
      setPeriods(data.periods ?? []);
      setCountMap(data.countMap ?? {});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const periodMap = Object.fromEntries(
    periods.map((p) => [`${p.year}-${p.month}`, p])
  );

  async function handleAction() {
    if (!confirmAction) return;
    setActionLoading(`${confirmAction.year}-${confirmAction.month}`);
    setError(null);
    try {
      const res = await fetch("/api/periods/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...confirmAction, notes }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "خطأ"); return; }
      setConfirmAction(null);
      setNotes("");
      await load();
    } catch {
      setError(isAr ? "خطأ في الاتصال" : "Connection error");
    } finally {
      setActionLoading(null);
    }
  }

  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="space-y-6">
      {confirmAction && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full space-y-4">
            <div className="text-center">
              <div className="text-4xl mb-2">{confirmAction.action === "close" ? "🔒" : "🔓"}</div>
              <h3 className="text-lg font-semibold text-gray-900">
                {confirmAction.action === "close"
                  ? (isAr ? "إقفال الفترة؟" : "Close Period?")
                  : (isAr ? "فتح الفترة؟" : "Reopen Period?")}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {isAr
                  ? `${MONTH_NAMES_AR[confirmAction.month - 1]} ${confirmAction.year}`
                  : `${MONTH_NAMES_EN[confirmAction.month - 1]} ${confirmAction.year}`}
              </p>
              {confirmAction.action === "close" && (
                <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mt-2">
                  ⚠️ {isAr
                    ? "سيتم قفل جميع قيود هذه الفترة ولن يمكن تعديلها أو حذفها."
                    : "All entries in this period will be locked and cannot be edited or deleted."}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {isAr ? "ملاحظات (اختياري)" : "Notes (optional)"}
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input w-full text-sm"
                placeholder={isAr ? "سبب الإقفال..." : "Reason for closing..."}
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setConfirmAction(null); setNotes(""); }} className="btn-secondary flex-1 text-sm">
                {isAr ? "إلغاء" : "Cancel"}
              </button>
              <button
                onClick={handleAction}
                disabled={!!actionLoading}
                className={`flex-1 text-sm font-medium py-2 px-4 rounded-lg transition-colors text-white ${
                  confirmAction.action === "close"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {actionLoading ? "..." : (confirmAction.action === "close"
                  ? (isAr ? "إقفال" : "Close")
                  : (isAr ? "فتح" : "Reopen"))}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isAr ? "الفترات المحاسبية" : "Accounting Periods"}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {isAr ? "أقفل الفترة لمنع التعديل على قيودها" : "Lock periods to prevent retroactive edits"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setDisplayYear((y) => y - 1)} className="btn-secondary py-1.5 px-3 text-sm">←</button>
          <span className="font-semibold text-gray-700 w-14 text-center">{displayYear}</span>
          <button onClick={() => setDisplayYear((y) => y + 1)} className="btn-secondary py-1.5 px-3 text-sm">→</button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm flex justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">
          <div className="animate-spin text-3xl mb-2">⚙️</div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {months.map((month) => {
            const key = `${displayYear}-${month}`;
            const period = periodMap[key];
            const isClosed = period?.status === "CLOSED";
            const entryCount = countMap[key] ?? 0;
            const monthName = isAr ? MONTH_NAMES_AR[month - 1] : MONTH_NAMES_EN[month - 1];
            const isCurrentMonth = displayYear === currentYear && month === new Date().getMonth() + 1;
            const isFuture = displayYear > currentYear || (displayYear === currentYear && month > new Date().getMonth() + 1);

            return (
              <div
                key={key}
                className={`card p-4 space-y-3 ${isClosed ? "border-red-200 bg-red-50" : isCurrentMonth ? "border-blue-200 bg-blue-50" : ""}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{monthName}</p>
                    <p className="text-xs text-gray-400">{displayYear}</p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    isClosed
                      ? "bg-red-100 text-red-700"
                      : "bg-green-100 text-green-700"
                  }`}>
                    {isClosed ? (isAr ? "مقفلة" : "Closed") : (isAr ? "مفتوحة" : "Open")}
                  </span>
                </div>

                <p className="text-xs text-gray-500">
                  {entryCount} {isAr ? "قيد" : "entries"}
                </p>

                {!isFuture && (
                  <button
                    onClick={() => setConfirmAction({ year: displayYear, month, action: isClosed ? "open" : "close" })}
                    disabled={actionLoading === key}
                    className={`w-full text-xs py-1.5 rounded-lg font-medium transition-colors ${
                      isClosed
                        ? "bg-white border border-green-300 text-green-700 hover:bg-green-50"
                        : "bg-white border border-red-300 text-red-700 hover:bg-red-50"
                    }`}
                  >
                    {actionLoading === key ? "..." : isClosed
                      ? (isAr ? "🔓 فتح" : "🔓 Reopen")
                      : (isAr ? "🔒 إقفال" : "🔒 Close")}
                  </button>
                )}

                {period?.notes && (
                  <p className="text-xs text-gray-400 truncate" title={period.notes}>{period.notes}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="card p-4">
        <h3 className="font-semibold text-gray-700 text-sm mb-2">
          {isAr ? "ملاحظة" : "How it works"}
        </h3>
        <ul className="text-xs text-gray-500 space-y-1 list-disc list-inside">
          <li>{isAr ? "إقفال الفترة يقفل جميع القيود المرحلة فيها تلقائياً" : "Closing a period automatically locks all posted entries in it"}</li>
          <li>{isAr ? "القيود المقفلة لا يمكن حذفها أو تعديلها" : "Locked entries cannot be deleted or edited"}</li>
          <li>{isAr ? "لا يمكن إنشاء قيد جديد بتاريخ في فترة مقفلة" : "New entries cannot be dated in a closed period"}</li>
          <li>{isAr ? "يمكن إعادة فتح الفترة بشرط تحمل المسؤولية" : "Periods can be reopened — use with care"}</li>
        </ul>
      </div>
    </div>
  );
}
