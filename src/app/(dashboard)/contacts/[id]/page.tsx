"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useLang } from "@/components/LanguageProvider";

interface ContactDetail {
  id: string;
  name: string;
  type: "CUSTOMER" | "SUPPLIER" | "BOTH";
  email: string | null;
  phone: string | null;
  taxNumber: string | null;
  address: string | null;
  notes: string | null;
  createdAt: string;
}

interface ContactInvoice {
  id: string;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  dueDate: string | null;
  total: number;
  paid: number;
  outstanding: number;
  paymentStatus: string;
  invoiceType: string;
}

interface ContactHistory {
  contact: ContactDetail;
  summary: { totalBilled: number; totalPaid: number; outstanding: number; currency: string };
  invoices: ContactInvoice[];
}

const STATUS_STYLES: Record<string, string> = {
  CONFIRMED: "bg-green-100 text-green-700",
  PAID: "bg-blue-100 text-blue-700",
  PARTIALLY_PAID: "bg-yellow-100 text-yellow-700",
  DRAFT: "bg-gray-100 text-gray-500",
  VOIDED: "bg-red-100 text-red-400",
  PENDING: "bg-orange-100 text-orange-700",
};

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { lang } = useLang();
  const isAr = lang === "ar";
  const locale = isAr ? "ar" : "en";

  const [data, setData] = useState<ContactHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<"ALL" | "SALES" | "PURCHASE">("ALL");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/contacts/${id}/transactions`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((d) => setData(d))
      .catch(() => setError(isAr ? "تعذّر تحميل بيانات الجهة" : "Failed to load contact data"))
      .finally(() => setLoading(false));
  }, [id, isAr]);

  const fmt = (n: number, currency = "SAR") =>
    n.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });

  const typeLabel = (t: string) => {
    const m: Record<string, { ar: string; en: string }> = {
      CUSTOMER: { ar: "عميل", en: "Customer" },
      SUPPLIER: { ar: "مورّد", en: "Supplier" },
      BOTH: { ar: "عميل ومورّد", en: "Customer & Supplier" },
    };
    return isAr ? (m[t]?.ar ?? t) : (m[t]?.en ?? t);
  };

  const statusLabel = (s: string) => {
    const m: Record<string, { ar: string; en: string }> = {
      CONFIRMED: { ar: "مؤكّد", en: "Confirmed" },
      PAID: { ar: "مدفوع", en: "Paid" },
      PARTIALLY_PAID: { ar: "مدفوع جزئياً", en: "Partial" },
      DRAFT: { ar: "مسودة", en: "Draft" },
      VOIDED: { ar: "ملغي", en: "Voided" },
      PENDING: { ar: "معلّق", en: "Pending" },
    };
    return isAr ? (m[s]?.ar ?? s) : (m[s]?.en ?? s);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <div className="animate-spin text-3xl mr-3">⚙️</div>
        <span>{isAr ? "جاري التحميل..." : "Loading..."}</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card text-center py-16 text-gray-400">
        <div className="text-4xl mb-3">👥</div>
        <p className="font-medium">{error ?? (isAr ? "جهة الاتصال غير موجودة" : "Contact not found")}</p>
        <button onClick={() => router.push("/contacts")} className="btn-secondary mt-4">
          {isAr ? "← رجوع للقائمة" : "← Back to Contacts"}
        </button>
      </div>
    );
  }

  const { contact, summary, invoices } = data;
  const { totalBilled, totalPaid, outstanding } = summary;
  const currency = summary.currency ?? "SAR";
  const filteredInvoices = invoices.filter((inv) =>
    typeFilter === "ALL" || inv.invoiceType === typeFilter
  );

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back + header */}
      <div>
        <button
          onClick={() => router.push("/contacts")}
          className="text-sm text-gray-400 hover:text-gray-600 mb-3 flex items-center gap-1"
        >
          ← {isAr ? "رجوع لجهات الاتصال" : "Back to Contacts"}
        </button>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{contact.name}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                {typeLabel(contact.type)}
              </span>
              {contact.taxNumber && (
                <span className="text-xs text-gray-400 font-mono">{isAr ? "ر.ض:" : "Tax:"} {contact.taxNumber}</span>
              )}
              {contact.email && (
                <a href={`mailto:${contact.email}`} className="text-xs text-blue-600 hover:underline">{contact.email}</a>
              )}
              {contact.phone && (
                <span className="text-xs text-gray-400">{contact.phone}</span>
              )}
            </div>
            {contact.address && (
              <p className="text-xs text-gray-400 mt-1">{contact.address}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Link href={`/invoices/create?contactId=${id}`} className="btn-secondary text-sm py-1.5 px-3">
              + {isAr ? "فاتورة مبيعات" : "Sales Invoice"}
            </Link>
            <Link href={`/invoices/create-purchase?supplierId=${id}`} className="btn-secondary text-sm py-1.5 px-3">
              + {isAr ? "فاتورة شراء" : "Purchase Invoice"}
            </Link>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            {isAr ? "إجمالي الفواتير" : "Total Billed"}
          </div>
          <div className="text-xl font-bold text-gray-900 tabular-nums">{fmt(totalBilled)}</div>
          <div className="text-xs text-gray-400 mt-0.5">{invoices.length} {isAr ? "فاتورة" : "invoices"}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            {isAr ? "إجمالي المدفوع" : "Total Paid"}
          </div>
          <div className="text-xl font-bold text-green-600 tabular-nums">{fmt(totalPaid)}</div>
          <div className="text-xs text-gray-400 mt-0.5">
            {totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 100) : 0}% {isAr ? "من الإجمالي" : "of total"}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            {isAr ? "المستحق" : "Outstanding"}
          </div>
          <div className={`text-xl font-bold tabular-nums ${outstanding > 0 ? "text-red-600" : "text-gray-400"}`}>
            {fmt(outstanding)}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            {outstanding > 0 ? (isAr ? "⚠️ مستحق" : "⚠️ Due") : (isAr ? "✓ لا شيء مستحق" : "✓ Fully settled")}
          </div>
        </div>
      </div>

      {/* Invoice history */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-wrap gap-3">
          <h2 className="font-semibold text-gray-800 text-sm">{isAr ? "تاريخ الفواتير" : "Invoice History"}</h2>
          <div className="flex gap-1.5">
            {(["ALL", "SALES", "PURCHASE"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setTypeFilter(f)}
                className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                  typeFilter === f ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {f === "ALL" ? (isAr ? "الكل" : "All") : f === "SALES" ? (isAr ? "مبيعات" : "Sales") : (isAr ? "مشتريات" : "Purchase")}
              </button>
            ))}
          </div>
        </div>

        {filteredInvoices.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            {isAr ? "لا توجد فواتير" : "No invoices found"}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-start py-2 px-4 font-semibold text-gray-500 text-xs">{isAr ? "رقم الفاتورة" : "Invoice #"}</th>
                <th className="text-start py-2 px-4 font-semibold text-gray-500 text-xs">{isAr ? "النوع" : "Type"}</th>
                <th className="text-start py-2 px-4 font-semibold text-gray-500 text-xs">{isAr ? "التاريخ" : "Date"}</th>
                <th className="text-start py-2 px-4 font-semibold text-gray-500 text-xs">{isAr ? "الاستحقاق" : "Due"}</th>
                <th className="text-end py-2 px-4 font-semibold text-gray-500 text-xs">{isAr ? "الإجمالي" : "Total"}</th>
                <th className="text-end py-2 px-4 font-semibold text-gray-500 text-xs">{isAr ? "المدفوع" : "Paid"}</th>
                <th className="py-2 px-4 font-semibold text-gray-500 text-xs">{isAr ? "الحالة" : "Status"}</th>
                <th className="py-2 px-4 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="border-t border-gray-50 hover:bg-gray-50">
                    <td className="py-2.5 px-4 font-mono text-gray-600 text-xs">{inv.invoiceNumber ?? "—"}</td>
                    <td className="py-2.5 px-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        inv.invoiceType === "SALES" ? "bg-blue-50 text-blue-700" : "bg-orange-50 text-orange-700"
                      }`}>
                        {inv.invoiceType === "SALES" ? (isAr ? "مبيعات" : "Sales") : (isAr ? "مشتريات" : "Purchase")}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-gray-500 text-xs whitespace-nowrap">
                      {inv.invoiceDate ? fmtDate(inv.invoiceDate) : "—"}
                    </td>
                    <td className="py-2.5 px-4 text-xs whitespace-nowrap">
                      {inv.dueDate ? (
                        <span className={inv.outstanding > 0 && new Date(inv.dueDate) < new Date() ? "text-red-500" : "text-gray-400"}>
                          {fmtDate(inv.dueDate)}
                        </span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="py-2.5 px-4 text-end tabular-nums text-gray-700 font-medium text-xs">
                      {currency} {fmt(inv.total)}
                    </td>
                    <td className="py-2.5 px-4 text-end tabular-nums text-xs">
                      <span className={inv.paid >= inv.total ? "text-green-600" : "text-gray-500"}>
                        {currency} {fmt(inv.paid)}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLES[inv.paymentStatus] ?? "bg-gray-100 text-gray-500"}`}>
                        {statusLabel(inv.paymentStatus)}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <Link href={`/invoices/${inv.id}/view`} className="text-blue-600 hover:text-blue-800 text-xs font-medium whitespace-nowrap">
                        {isAr ? "عرض" : "View"}
                      </Link>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Contact notes */}
      {contact.notes && (
        <div className="card p-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{isAr ? "ملاحظات" : "Notes"}</h3>
          <p className="text-sm text-gray-600">{contact.notes}</p>
        </div>
      )}
    </div>
  );
}
