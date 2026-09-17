"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLang } from "@/components/LanguageProvider";
import type { ExtractedInvoiceData, SuggestedJournalEntry } from "@/types";

interface Invoice {
  id: string;
  invoiceType: "PURCHASE" | "SALES";
  fileUrl: string;
  fileType: string;
  extractedData: ExtractedInvoiceData;
  status: string;
}

interface SuggestionLine {
  accountId: string | null;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
}

interface Suggestion extends SuggestedJournalEntry {
  lines: SuggestionLine[];
}

export default function ReviewInvoicePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { lang } = useLang();
  const isAr = lang === "ar";

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");

  const [extracted, setExtracted] = useState<ExtractedInvoiceData | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [invRes, sugRes] = await Promise.all([
          fetch(`/api/invoices/${id}`),
          fetch(`/api/invoices/${id}/confirm`),
        ]);
        const inv = await invRes.json();
        const sug = sugRes.ok ? await sugRes.json() : null;
        setInvoice(inv);
        setExtracted(inv.extractedData);
        setSuggestion(sug);
      } catch {
        setError(isAr ? "تعذّر تحميل بيانات الفاتورة" : "Failed to load invoice data");
      } finally {
        setLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleConfirm() {
    if (!suggestion || !extracted) return;
    setConfirming(true);
    setError("");

    const lines = suggestion.lines.map((l) => ({
      accountId: l.accountId ?? "",
      debit: l.debit,
      credit: l.credit,
    }));

    if (lines.some((l) => !l.accountId)) {
      setError(
        isAr
          ? "بعض سطور القيد لا تحتوي على حساب — يرجى إعداد دليل الحسابات أولًا"
          : "Some journal lines have no account — please set up your chart of accounts first",
      );
      setConfirming(false);
      return;
    }

    try {
      const res = await fetch(`/api/invoices/${id}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          journalLines: lines,
          description: suggestion.description,
          date: suggestion.date,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? (isAr ? "فشل في تأكيد الفاتورة" : "Failed to confirm invoice"));
        return;
      }

      router.push("/invoices?confirmed=1");
    } catch {
      setError(isAr ? "حدث خطأ في الاتصال" : "Connection error");
    } finally {
      setConfirming(false);
    }
  }

  async function handleReject() {
    if (!confirm(isAr ? "هل تريد رفض هذه الفاتورة؟" : "Are you sure you want to reject this invoice?")) return;
    await fetch(`/api/invoices/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ extractedData: extracted, status: "REJECTED" }),
    });
    router.push("/invoices");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="spinner-lg mb-2" />
          <p className="text-gray-500">{isAr ? "جاري التحميل..." : "Loading..."}</p>
        </div>
      </div>
    );
  }

  if (!invoice || !extracted) {
    return (
      <div className="text-red-600 text-center p-8">
        {isAr ? "الفاتورة غير موجودة" : "Invoice not found"}
      </div>
    );
  }

  const locale = isAr ? "ar" : "en";

  return (
    <div className="space-y-6" dir={isAr ? "rtl" : "ltr"}>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isAr ? "مراجعة الفاتورة" : "Review Invoice"}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {isAr
            ? "راجع البيانات المستخرجة وعدّلها إذا لزم، ثم أكّد لترحيل القيد"
            : "Review the extracted data, edit if needed, then confirm to post the journal entry"}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Original invoice */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-3">
            {isAr ? "الفاتورة الأصلية" : "Original Invoice"}
          </h2>
          {invoice.fileType.startsWith("image/") ? (
            <img
              src={invoice.fileUrl}
              alt={isAr ? "الفاتورة" : "Invoice"}
              className="w-full rounded-lg border border-gray-200"
            />
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <div className="text-4xl mb-2">📄</div>
              <p className="text-gray-500 text-sm">PDF</p>
              <a href={invoice.fileUrl} target="_blank" className="text-blue-600 text-sm hover:underline mt-1 block">
                {isAr ? "فتح الملف ↗" : "Open File ↗"}
              </a>
            </div>
          )}
          <div className="mt-2 text-xs text-gray-400">
            {isAr ? "الثقة في الاستخراج:" : "Extraction confidence:"}{" "}
            {Math.round((extracted.confidence ?? 0) * 100)}%
          </div>
        </div>

        {/* Extracted data */}
        <div className="space-y-4">
          <div className="card">
            <h2 className="font-semibold text-gray-800 mb-4">
              {isAr ? "البيانات المستخرجة" : "Extracted Data"}
            </h2>
            <div className="space-y-3">
              <Field
                label={isAr ? "المورد / البائع" : "Vendor / Seller"}
                value={extracted.vendorName ?? ""}
                onChange={(v) => setExtracted((p) => p && ({ ...p, vendorName: v }))}
              />
              <Field
                label={isAr ? "العميل / المشتري" : "Customer / Buyer"}
                value={extracted.customerName ?? ""}
                onChange={(v) => setExtracted((p) => p && ({ ...p, customerName: v }))}
              />
              <Field
                label={isAr ? "رقم الفاتورة" : "Invoice Number"}
                value={extracted.invoiceNumber ?? ""}
                onChange={(v) => setExtracted((p) => p && ({ ...p, invoiceNumber: v }))}
              />
              <Field
                label={isAr ? "تاريخ الفاتورة" : "Invoice Date"}
                value={extracted.invoiceDate ?? ""}
                onChange={(v) => setExtracted((p) => p && ({ ...p, invoiceDate: v }))}
                type="date"
              />
              <div className="grid grid-cols-3 gap-2">
                <Field
                  label={isAr ? "المجموع قبل الضريبة" : "Subtotal"}
                  value={String(extracted.subtotal ?? "")}
                  onChange={(v) => setExtracted((p) => p && ({ ...p, subtotal: parseFloat(v) || 0 }))}
                  type="number"
                />
                <Field
                  label={isAr ? "الضريبة" : "Tax"}
                  value={String(extracted.taxAmount ?? "")}
                  onChange={(v) => setExtracted((p) => p && ({ ...p, taxAmount: parseFloat(v) || 0 }))}
                  type="number"
                />
                <Field
                  label={isAr ? "الإجمالي" : "Total"}
                  value={String(extracted.totalAmount ?? "")}
                  onChange={(v) => setExtracted((p) => p && ({ ...p, totalAmount: parseFloat(v) || 0 }))}
                  type="number"
                />
              </div>
            </div>
          </div>

          {/* Suggested journal entry */}
          {suggestion && (
            <div className="card">
              <h2 className="font-semibold text-gray-800 mb-3">
                {isAr ? "القيد المحاسبي المقترح" : "Suggested Journal Entry"}
              </h2>
              <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded mb-3">
                {isAr
                  ? "⚠️ مقترح من الذكاء الاصطناعي — راجعه قبل التأكيد"
                  : "⚠️ AI suggested — review before confirming"}
              </p>
              <div className="text-sm text-gray-600 mb-2">{suggestion.description}</div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-end pb-2 font-medium text-gray-500">
                      {isAr ? "الحساب" : "Account"}
                    </th>
                    <th className="text-end pb-2 font-medium text-gray-500">
                      {isAr ? "مدين" : "Debit"}
                    </th>
                    <th className="text-end pb-2 font-medium text-gray-500">
                      {isAr ? "دائن" : "Credit"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {suggestion.lines.map((line, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="py-1.5">
                        <span className="text-gray-400 ms-1">{line.accountCode}</span>
                        {line.accountName}
                      </td>
                      <td className="py-1.5 text-end">
                        {line.debit > 0 ? line.debit.toLocaleString(locale) : "—"}
                      </td>
                      <td className="py-1.5 text-end">
                        {line.credit > 0 ? line.credit.toLocaleString(locale) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}

      {invoice.status === "PENDING_REVIEW" && (
        <div className="flex gap-3">
          <button onClick={handleConfirm} disabled={confirming} className="btn-primary flex-1">
            {confirming
              ? (isAr ? "جاري الترحيل..." : "Posting...")
              : (isAr ? "✅ تأكيد وترحيل القيد" : "✅ Confirm & Post Journal Entry")}
          </button>
          <button onClick={handleReject} disabled={confirming} className="btn-secondary">
            {isAr ? "❌ رفض الفاتورة" : "❌ Reject Invoice"}
          </button>
        </div>
      )}

      {invoice.status !== "PENDING_REVIEW" && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-700 text-sm">
          {isAr
            ? "✅ تم تأكيد هذه الفاتورة وترحيل قيدها المحاسبي"
            : "✅ Invoice confirmed and journal entry posted"}
        </div>
      )}
    </div>
  );
}

function Field({
  label, value, onChange, type = "text",
}: {
  label: string; value: string; onChange: (v: string) => void; type?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        type={type}
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
