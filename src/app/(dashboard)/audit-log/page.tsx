"use client";
import { useEffect, useState, useCallback } from "react";
import { useLang } from "@/components/LanguageProvider";

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  description: string | null;
  userName: string | null;
  userEmail: string | null;
  createdAt: string;
  metadata: Record<string, unknown> | null;
}

const ACTION_STYLES: Record<string, string> = {
  CREATE: "bg-green-100 text-green-700",
  UPDATE: "bg-blue-100 text-blue-700",
  DELETE: "bg-red-100 text-red-700",
  CLOSE: "bg-orange-100 text-orange-700",
  OPEN: "bg-teal-100 text-teal-700",
  DEPRECIATE: "bg-purple-100 text-purple-700",
  RUN: "bg-indigo-100 text-indigo-700",
};

const ENTITY_LABELS: Record<string, { ar: string; en: string }> = {
  JournalEntry:     { ar: "قيد يومية",        en: "Journal Entry" },
  Invoice:          { ar: "فاتورة",            en: "Invoice" },
  AccountingPeriod: { ar: "فترة محاسبية",     en: "Accounting Period" },
  FixedAsset:       { ar: "أصل ثابت",          en: "Fixed Asset" },
  RecurringTemplate:{ ar: "قيد متكرر",        en: "Recurring Template" },
  OpeningBalances:  { ar: "أرصدة افتتاحية",   en: "Opening Balances" },
};

const ALL_ENTITIES = Object.keys(ENTITY_LABELS);

export default function AuditLogPage() {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const locale = isAr ? "ar" : "en";

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (entityFilter) params.set("entity", entityFilter);
      const res = await fetch(`/api/audit-log?${params}`);
      const data = await res.json();
      setLogs(data.logs ?? []);
      setTotal(data.total ?? 0);
      setPages(data.pages ?? 1);
    } finally {
      setLoading(false);
    }
  }, [page, entityFilter]);

  useEffect(() => { load(); }, [load]);

  function actionStyle(action: string) {
    return ACTION_STYLES[action.toUpperCase()] ?? "bg-gray-100 text-gray-600";
  }

  function entityLabel(entity: string) {
    const label = ENTITY_LABELS[entity];
    if (!label) return entity;
    return isAr ? label.ar : label.en;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{isAr ? "سجل المراجعة" : "Audit Trail"}</h1>
        <p className="text-gray-500 text-sm mt-1">
          {isAr
            ? "جميع الإجراءات الحساسة المُسجَّلة مع المستخدم والتوقيت"
            : "All sensitive actions logged with user and timestamp"}
        </p>
      </div>

      {/* Filters + count */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={entityFilter}
          onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
          className="input text-sm w-auto"
        >
          <option value="">{isAr ? "كل الكيانات" : "All entities"}</option>
          {ALL_ENTITIES.map((e) => (
            <option key={e} value={e}>{entityLabel(e)}</option>
          ))}
        </select>
        <span className="text-sm text-gray-400">
          {total} {isAr ? "سجل" : "records"}
        </span>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">
          <div className="animate-spin text-3xl mb-2">⚙️</div>
        </div>
      ) : logs.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <div className="text-4xl mb-2">🗂️</div>
          <p>{isAr ? "لا توجد سجلات بعد" : "No audit records yet"}</p>
          <p className="text-xs mt-1">{isAr ? "ستظهر الإجراءات هنا تلقائياً" : "Actions will appear here automatically"}</p>
        </div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-right py-2.5 px-4 font-medium text-gray-500 text-xs">{isAr ? "التاريخ" : "Date"}</th>
                  <th className="text-right py-2.5 px-4 font-medium text-gray-500 text-xs">{isAr ? "الإجراء" : "Action"}</th>
                  <th className="text-right py-2.5 px-4 font-medium text-gray-500 text-xs">{isAr ? "الكيان" : "Entity"}</th>
                  <th className="text-right py-2.5 px-4 font-medium text-gray-500 text-xs">{isAr ? "المستخدم" : "User"}</th>
                  <th className="text-right py-2.5 px-4 font-medium text-gray-500 text-xs">{isAr ? "البيان" : "Description"}</th>
                  <th className="py-2.5 px-4 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <>
                    <tr
                      key={log.id}
                      className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                      onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                    >
                      <td className="py-2.5 px-4 text-gray-500 text-xs whitespace-nowrap tabular-nums">
                        {new Date(log.createdAt).toLocaleString(locale, {
                          dateStyle: "short", timeStyle: "short",
                        })}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${actionStyle(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-gray-700 text-xs">{entityLabel(log.entity)}</td>
                      <td className="py-2.5 px-4 text-gray-500 text-xs">
                        {log.userName ?? log.userEmail ?? (isAr ? "نظام" : "System")}
                      </td>
                      <td className="py-2.5 px-4 text-gray-700 max-w-xs truncate text-xs">
                        {log.description ?? "—"}
                      </td>
                      <td className="py-2.5 px-4 text-gray-300 text-xs">
                        {expandedId === log.id ? "▲" : "▼"}
                      </td>
                    </tr>
                    {expandedId === log.id && (
                      <tr key={`${log.id}-detail`} className="bg-gray-50 border-b border-gray-100">
                        <td colSpan={6} className="py-3 px-4">
                          <div className="text-xs text-gray-600 space-y-1">
                            <div><span className="font-medium">{isAr ? "معرّف الكيان:" : "Entity ID:"}</span> <span className="font-mono">{log.entityId}</span></div>
                            {log.metadata && (
                              <div>
                                <span className="font-medium">{isAr ? "بيانات إضافية:" : "Metadata:"}</span>
                                <pre className="mt-1 bg-white border border-gray-200 rounded p-2 text-xs overflow-x-auto font-mono leading-relaxed">
                                  {JSON.stringify(log.metadata, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between text-sm">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary py-1.5 px-4 disabled:opacity-40"
              >
                {isAr ? "السابق" : "Previous"}
              </button>
              <span className="text-gray-500">
                {isAr ? `صفحة ${page} من ${pages}` : `Page ${page} of ${pages}`}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="btn-secondary py-1.5 px-4 disabled:opacity-40"
              >
                {isAr ? "التالي" : "Next"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
