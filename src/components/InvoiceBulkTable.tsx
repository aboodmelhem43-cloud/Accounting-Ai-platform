"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type InvoiceRow = {
  id: string;
  invoiceNum: string;
  party: string;
  isCreated: boolean;
  invoiceType: string;
  amount: string;
  date: string;
  status: string;
  statusLabel: string;
  statusCls: string;
};

type Props = {
  invoices: InvoiceRow[];
  isAr: boolean;
};

export default function InvoiceBulkTable({ invoices, isAr }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const pendingInvoices = invoices.filter((i) => i.status === "PENDING_REVIEW");
  const pendingIds = new Set(pendingInvoices.map((i) => i.id));
  const selectedPending = [...selected].filter((id) => pendingIds.has(id));

  const toggleAll = () => {
    if (selectedPending.length === pendingInvoices.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pendingInvoices.map((i) => i.id)));
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const runBulk = async (action: "reject" | "confirm") => {
    setActionMsg(null);
    const res = await fetch("/api/invoices/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selectedPending, action }),
    });
    const data = await res.json();
    setSelected(new Set());
    if (action === "confirm") {
      const skipped = (data.skippedNoData ?? 0) + (data.errors ?? 0);
      setActionMsg(
        isAr
          ? `تم تأكيد ${data.confirmed} فاتورة${skipped ? ` — تخطى ${skipped} (بيانات ناقصة)` : ""}`
          : `Confirmed ${data.confirmed} invoice(s)${skipped ? ` — skipped ${skipped} (insufficient data)` : ""}`
      );
    } else {
      setActionMsg(
        isAr
          ? `تم رفض ${data.updated} فاتورة`
          : `Rejected ${data.updated} invoice(s)`
      );
    }
    startTransition(() => router.refresh());
  };

  const allPendingChecked =
    pendingInvoices.length > 0 && selectedPending.length === pendingInvoices.length;

  return (
    <div>
      {/* Action bar */}
      {selectedPending.length > 0 && (
        <div className="sticky top-0 z-10 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-3 shadow-sm flex-wrap">
          <span className="text-sm font-medium text-blue-800">
            {isAr ? `${selectedPending.length} محدد` : `${selectedPending.length} selected`}
          </span>
          <button
            onClick={() => setShowConfirmDialog(true)}
            disabled={isPending}
            className="btn-primary text-xs py-1 px-3"
          >
            {isAr ? "تأكيد المحدد" : "Confirm Selected"}
          </button>
          <button
            onClick={() => runBulk("reject")}
            disabled={isPending}
            className="btn-secondary text-xs py-1 px-3 !text-red-600 !border-red-300 hover:!bg-red-50"
          >
            {isAr ? "رفض المحدد" : "Reject Selected"}
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            {isAr ? "إلغاء التحديد" : "Deselect All"}
          </button>
        </div>
      )}

      {/* Result message */}
      {actionMsg && (
        <div className="mb-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
          {actionMsg}
        </div>
      )}

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 w-8">
                {pendingInvoices.length > 0 && (
                  <input
                    type="checkbox"
                    checked={allPendingChecked}
                    onChange={toggleAll}
                    aria-label={isAr ? "تحديد الكل" : "Select all"}
                    className="rounded border-gray-300"
                  />
                )}
              </th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">
                {isAr ? "رقم الفاتورة" : "Invoice #"}
              </th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">
                {isAr ? "الطرف" : "Party"}
              </th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">
                {isAr ? "النوع" : "Type"}
              </th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">
                {isAr ? "المبلغ" : "Amount"}
              </th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">
                {isAr ? "التاريخ" : "Date"}
              </th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">
                {isAr ? "الحالة" : "Status"}
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {invoices.map((inv) => {
              const isPending = pendingIds.has(inv.id);
              const isChecked = selected.has(inv.id);
              return (
                <tr key={inv.id} className={`hover:bg-gray-50 ${isChecked ? "bg-blue-50" : ""}`}>
                  <td className="px-4 py-3">
                    {isPending && (
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleOne(inv.id)}
                        className="rounded border-gray-300"
                      />
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-700 text-xs">{inv.invoiceNum}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{inv.party}</td>
                  <td className="px-4 py-3 text-gray-500">
                    <span className="flex items-center gap-1">
                      {inv.isCreated && (
                        <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                          {isAr ? "يدوية" : "Manual"}
                        </span>
                      )}
                      {inv.invoiceType}
                    </span>
                  </td>
                  <td className="px-4 py-3">{inv.amount}</td>
                  <td className="px-4 py-3 text-gray-500">{inv.date}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${inv.statusCls}`}>
                      {inv.statusLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {inv.isCreated ? (
                      <Link href={`/invoices/${inv.id}/view`} className="text-blue-600 text-xs hover:underline">
                        {isAr ? "عرض / طباعة" : "View / Print"}
                      </Link>
                    ) : isPending ? (
                      <Link href={`/invoices/${inv.id}/review`} className="text-blue-600 text-xs hover:underline">
                        {isAr ? "مراجعة" : "Review"}
                      </Link>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Confirm bulk dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {isAr ? "تأكيد الفواتير المحددة" : "Confirm Selected Invoices"}
            </h2>
            <p className="text-sm text-gray-600">
              {isAr
                ? "سيستخدم النظام القيود المقترحة من الذكاء الاصطناعي لكل فاتورة. للتحكم الكامل في القيد راجع كل فاتورة منفردة."
                : "The system will use AI-suggested journal entries for each invoice. For precise control, review each invoice individually."}
            </p>
            <p className="text-sm font-medium text-blue-700">
              {isAr
                ? `سيتم تأكيد ${selectedPending.length} فاتورة`
                : `${selectedPending.length} invoice(s) will be confirmed`}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="btn-secondary"
              >
                {isAr ? "إلغاء" : "Cancel"}
              </button>
              <button
                onClick={() => {
                  setShowConfirmDialog(false);
                  runBulk("confirm");
                }}
                className="btn-primary"
              >
                {isAr ? "متابعة" : "Proceed"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
