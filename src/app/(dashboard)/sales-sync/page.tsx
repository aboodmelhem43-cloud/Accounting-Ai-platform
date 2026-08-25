"use client";
import { useState, useEffect, useCallback } from "react";

interface SuggestedLine {
  accountId: string;
  accountName: string;
  debit: number;
  credit: number;
  description?: string;
}

interface SuggestedEntry {
  description: string;
  lines: SuggestedLine[];
}

interface JournalEntry {
  id: string;
  status: string;
}

interface Integration {
  id: string;
  name: string;
  platform: string;
}

interface SalesEvent {
  id: string;
  platform: string;
  orderNumber: string;
  occurredAt: string;
  customerName: string | null;
  subtotal: number;
  vatAmount: number;
  total: number;
  currency: string;
  paymentMethod: string;
  status: string;
  suggestedEntry: SuggestedEntry | null;
  journalEntry: JournalEntry | null;
  integration: Integration | null;
}

const PLATFORM_LABELS: Record<string, string> = {
  shopify: "Shopify",
  salla: "سلة",
  zid: "زد",
  foodics: "Foodics",
  generic: "Generic",
};

const STATUS_TABS = [
  { value: "PENDING", label: "قيد المراجعة" },
  { value: "APPROVED", label: "معتمد" },
  { value: "REJECTED", label: "مرفوض" },
  { value: "ALL", label: "الكل" },
];

export default function SalesSyncPage() {
  const [status, setStatus] = useState("PENDING");
  const [page, setPage] = useState(1);
  const [events, setEvents] = useState<SalesEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [processing, setProcessing] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [batchLoading, setBatchLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sales-sync?status=${status}&page=${page}`);
      const data = await res.json();
      setEvents(data.events ?? []);
      setTotal(data.total ?? 0);
      setPages(data.pages ?? 1);
    } finally {
      setLoading(false);
    }
  }, [status, page]);

  useEffect(() => {
    fetchEvents();
    setSelected(new Set());
  }, [fetchEvents]);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  async function approveEvent(id: string) {
    setProcessing((p) => new Set([...p, id]));
    try {
      const res = await fetch(`/api/sales-sync/${id}/approve`, { method: "POST" });
      if (res.ok) {
        showToast("تم اعتماد القيد بنجاح", true);
        fetchEvents();
      } else {
        const data = await res.json();
        showToast(data.error ?? "حدث خطأ", false);
      }
    } finally {
      setProcessing((p) => { const n = new Set(p); n.delete(id); return n; });
    }
  }

  async function rejectEvent(id: string) {
    setProcessing((p) => new Set([...p, id]));
    try {
      const res = await fetch(`/api/sales-sync/${id}/reject`, { method: "POST" });
      if (res.ok) {
        showToast("تم رفض الحدث", true);
        fetchEvents();
      } else {
        showToast("حدث خطأ أثناء الرفض", false);
      }
    } finally {
      setProcessing((p) => { const n = new Set(p); n.delete(id); return n; });
    }
  }

  async function batchAction(action: "approve" | "reject") {
    if (selected.size === 0) return;
    setBatchLoading(true);
    try {
      const res = await fetch("/api/sales-sync/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, eventIds: [...selected] }),
      });
      const data = await res.json();
      showToast(`${data.succeeded} تم معالجتها، ${data.failed} فشلت`, data.failed === 0);
      setSelected(new Set());
      fetchEvents();
    } finally {
      setBatchLoading(false);
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    const pendingIds = events.filter((e) => e.status === "PENDING").map((e) => e.id);
    if (pendingIds.every((id) => selected.has(id))) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pendingIds));
    }
  }

  const pendingEvents = events.filter((e) => e.status === "PENDING");
  const allPendingSelected = pendingEvents.length > 0 && pendingEvents.every((e) => selected.has(e.id));

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6" dir="rtl">
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all ${toast.ok ? "bg-green-600" : "bg-red-600"}`}>
          {toast.msg}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-gray-900">مزامنة المبيعات</h1>
        <p className="text-gray-500 mt-1 text-sm">مراجعة المبيعات الواردة من المتاجر والأنظمة المرتبطة — اعتمد أو ارفض القيد المقترح قبل ترحيله</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setStatus(tab.value); setPage(1); }}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${status === tab.value ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            {tab.label}
          </button>
        ))}
        <div className="ms-auto flex items-center text-xs text-gray-400 pb-2">
          {total} حدث
        </div>
      </div>

      {/* Batch actions */}
      {status === "PENDING" && pendingEvents.length > 0 && (
        <div className="flex items-center gap-3 bg-blue-50 px-4 py-2 rounded-lg">
          <input
            type="checkbox"
            checked={allPendingSelected}
            onChange={toggleSelectAll}
            className="w-4 h-4"
          />
          <span className="text-sm text-blue-700">
            {selected.size > 0 ? `${selected.size} محدد` : "تحديد الكل"}
          </span>
          {selected.size > 0 && (
            <>
              <button
                onClick={() => batchAction("approve")}
                disabled={batchLoading}
                className="ms-2 px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {batchLoading ? "..." : "اعتماد المحدد"}
              </button>
              <button
                onClick={() => batchAction("reject")}
                disabled={batchLoading}
                className="px-3 py-1 bg-red-100 text-red-700 text-xs rounded-lg hover:bg-red-200 disabled:opacity-50"
              >
                رفض المحدد
              </button>
            </>
          )}
        </div>
      )}

      {/* Events list */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">جاري التحميل...</div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">🛍️</div>
          <p>لا توجد أحداث في هذه الفئة</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <div key={event.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
              <div className="flex items-start gap-3 p-4">
                {event.status === "PENDING" && (
                  <input
                    type="checkbox"
                    checked={selected.has(event.id)}
                    onChange={() => toggleSelect(event.id)}
                    className="mt-1 w-4 h-4 flex-shrink-0"
                  />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {PLATFORM_LABELS[event.platform] ?? event.platform}
                    </span>
                    <span className="font-semibold text-gray-900 text-sm">طلب #{event.orderNumber}</span>
                    {event.customerName && (
                      <span className="text-gray-500 text-sm">— {event.customerName}</span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      event.status === "PENDING" ? "bg-amber-100 text-amber-700" :
                      event.status === "APPROVED" ? "bg-green-100 text-green-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {event.status === "PENDING" ? "قيد المراجعة" : event.status === "APPROVED" ? "معتمد" : "مرفوض"}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-2">
                    <span>{new Date(event.occurredAt).toLocaleDateString("ar-EG")}</span>
                    <span className="font-mono font-semibold text-gray-900">
                      {event.total.toFixed(2)} {event.currency}
                    </span>
                    {event.vatAmount > 0 && (
                      <span className="text-xs text-gray-400">ضريبة: {event.vatAmount.toFixed(2)}</span>
                    )}
                    <span className="text-xs text-gray-400">{event.paymentMethod}</span>
                  </div>

                  {event.integration && (
                    <div className="text-xs text-gray-400">{event.integration.name}</div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  {event.status === "PENDING" && (
                    <>
                      <button
                        onClick={() => approveEvent(event.id)}
                        disabled={processing.has(event.id)}
                        className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 disabled:opacity-50 min-w-[80px]"
                      >
                        {processing.has(event.id) ? "..." : "اعتماد"}
                      </button>
                      <button
                        onClick={() => rejectEvent(event.id)}
                        disabled={processing.has(event.id)}
                        className="px-3 py-1.5 bg-red-50 text-red-600 text-xs rounded-lg hover:bg-red-100 disabled:opacity-50 min-w-[80px]"
                      >
                        رفض
                      </button>
                    </>
                  )}
                  {event.journalEntry && (
                    <a
                      href={`/journal/${event.journalEntry.id}`}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      عرض القيد ←
                    </a>
                  )}
                  <button
                    onClick={() => setExpandedId(expandedId === event.id ? null : event.id)}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    {expandedId === event.id ? "إخفاء التفاصيل" : "القيد المقترح"}
                  </button>
                </div>
              </div>

              {/* Expanded: AI suggested journal entry */}
              {expandedId === event.id && (
                <div className="border-t border-gray-100 bg-gray-50 p-4">
                  {event.suggestedEntry ? (
                    <div>
                      <div className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                        <span>🤖</span> القيد المقترح من الذكاء الاصطناعي
                      </div>
                      <p className="text-sm text-gray-700 mb-3">{event.suggestedEntry.description}</p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-xs text-gray-400 border-b border-gray-200">
                              <th className="text-right py-1 font-medium">الحساب</th>
                              <th className="text-left py-1 font-medium w-24">مدين</th>
                              <th className="text-left py-1 font-medium w-24">دائن</th>
                              <th className="text-right py-1 font-medium">البيان</th>
                            </tr>
                          </thead>
                          <tbody>
                            {event.suggestedEntry.lines.map((line, i) => (
                              <tr key={i} className="border-b border-gray-100 last:border-0">
                                <td className="py-1.5 text-gray-800">{line.accountName}</td>
                                <td className="py-1.5 text-left font-mono text-sm tabular-nums">
                                  {line.debit > 0 ? line.debit.toFixed(2) : ""}
                                </td>
                                <td className="py-1.5 text-left font-mono text-sm tabular-nums">
                                  {line.credit > 0 ? line.credit.toFixed(2) : ""}
                                </td>
                                <td className="py-1.5 text-gray-500 text-xs">{line.description}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="text-xs font-semibold text-gray-600 border-t-2 border-gray-300">
                              <td className="py-1.5">المجموع</td>
                              <td className="py-1.5 text-left font-mono tabular-nums">
                                {event.suggestedEntry.lines.reduce((s, l) => s + l.debit, 0).toFixed(2)}
                              </td>
                              <td className="py-1.5 text-left font-mono tabular-nums">
                                {event.suggestedEntry.lines.reduce((s, l) => s + l.credit, 0).toFixed(2)}
                              </td>
                              <td />
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">
                      لم يتمكن الذكاء الاصطناعي من اقتراح قيد — يرجى الاعتماد اليدوي عبر نافذة القيد
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
          >
            السابق
          </button>
          <span className="px-3 py-1.5 text-sm text-gray-600">
            {page} / {pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page === pages}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
          >
            التالي
          </button>
        </div>
      )}
    </div>
  );
}
