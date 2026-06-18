"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { ExtractedInvoiceData, SuggestedJournalEntry } from "@/types";

interface Invoice {
  id: string;
  invoiceType: "PURCHASE" | "SALES";
  fileUrl: string;
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

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");

  // البيانات القابلة للتعديل من المستخدم
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
        setError("تعذّر تحميل بيانات الفاتورة");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleConfirm() {
    if (!suggestion || !extracted) return;
    setConfirming(true);
    setError("");

    // التحقق من وجود accountId لكل سطر
    const lines = suggestion.lines.map((l) => ({
      accountId: l.accountId ?? "",
      debit: l.debit,
      credit: l.credit,
    }));

    if (lines.some((l) => !l.accountId)) {
      setError("بعض سطور القيد لا تحتوي على حساب — يرجى إعداد دليل الحسابات أولًا");
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
        setError(data.error ?? "فشل في تأكيد الفاتورة");
        return;
      }

      router.push("/invoices?confirmed=1");
    } catch {
      setError("حدث خطأ في الاتصال");
    } finally {
      setConfirming(false);
    }
  }

  async function handleReject() {
    if (!confirm("هل تريد رفض هذه الفاتورة؟")) return;
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
          <div className="animate-spin text-3xl mb-2">⚙️</div>
          <p className="text-gray-500">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!invoice || !extracted) {
    return <div className="text-red-600 text-center p-8">الفاتورة غير موجودة</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">مراجعة الفاتورة</h1>
        <p className="text-gray-500 text-sm mt-1">
          راجع البيانات المستخرجة وعدّلها إذا لزم، ثم أكّد لترحيل القيد
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* صورة الفاتورة */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-3">الفاتورة الأصلية</h2>
          {invoice.fileType.startsWith("image/") ? (
            <img src={invoice.fileUrl} alt="الفاتورة" className="w-full rounded-lg border border-gray-200" />
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <div className="text-4xl mb-2">📄</div>
              <p className="text-gray-500 text-sm">ملف PDF</p>
              <a href={invoice.fileUrl} target="_blank" className="text-blue-600 text-sm hover:underline mt-1 block">
                فتح الملف ↗
              </a>
            </div>
          )}
          <div className="mt-2 text-xs text-gray-400">
            الثقة في الاستخراج: {Math.round((extracted.confidence ?? 0) * 100)}%
          </div>
        </div>

        {/* البيانات المستخرجة */}
        <div className="space-y-4">
          <div className="card">
            <h2 className="font-semibold text-gray-800 mb-4">البيانات المستخرجة</h2>
            <div className="space-y-3">
              <Field
                label="المورد / البائع"
                value={extracted.vendorName ?? ""}
                onChange={(v) => setExtracted((p) => p && ({ ...p, vendorName: v }))}
              />
              <Field
                label="العميل / المشتري"
                value={extracted.customerName ?? ""}
                onChange={(v) => setExtracted((p) => p && ({ ...p, customerName: v }))}
              />
              <Field
                label="رقم الفاتورة"
                value={extracted.invoiceNumber ?? ""}
                onChange={(v) => setExtracted((p) => p && ({ ...p, invoiceNumber: v }))}
              />
              <Field
                label="تاريخ الفاتورة"
                value={extracted.invoiceDate ?? ""}
                onChange={(v) => setExtracted((p) => p && ({ ...p, invoiceDate: v }))}
                type="date"
              />
              <div className="grid grid-cols-3 gap-2">
                <Field
                  label={`المجموع قبل الضريبة`}
                  value={String(extracted.subtotal ?? "")}
                  onChange={(v) => setExtracted((p) => p && ({ ...p, subtotal: parseFloat(v) || 0 }))}
                  type="number"
                />
                <Field
                  label="الضريبة"
                  value={String(extracted.taxAmount ?? "")}
                  onChange={(v) => setExtracted((p) => p && ({ ...p, taxAmount: parseFloat(v) || 0 }))}
                  type="number"
                />
                <Field
                  label="الإجمالي"
                  value={String(extracted.totalAmount ?? "")}
                  onChange={(v) => setExtracted((p) => p && ({ ...p, totalAmount: parseFloat(v) || 0 }))}
                  type="number"
                />
              </div>
            </div>
          </div>

          {/* القيد المقترح */}
          {suggestion && (
            <div className="card">
              <h2 className="font-semibold text-gray-800 mb-3">القيد المحاسبي المقترح</h2>
              <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded mb-3">
                ⚠️ مقترح من الذكاء الاصطناعي — راجعه قبل التأكيد
              </p>
              <div className="text-sm text-gray-600 mb-2">{suggestion.description}</div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-right pb-2 font-medium text-gray-500">الحساب</th>
                    <th className="text-left pb-2 font-medium text-gray-500">مدين</th>
                    <th className="text-left pb-2 font-medium text-gray-500">دائن</th>
                  </tr>
                </thead>
                <tbody>
                  {suggestion.lines.map((line, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="py-1.5">
                        <span className="text-gray-400 ml-1">{line.accountCode}</span>
                        {line.accountName}
                      </td>
                      <td className="py-1.5 text-left">
                        {line.debit > 0 ? line.debit.toLocaleString("ar") : "—"}
                      </td>
                      <td className="py-1.5 text-left">
                        {line.credit > 0 ? line.credit.toLocaleString("ar") : "—"}
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
            {confirming ? "جاري الترحيل..." : "✅ تأكيد وترحيل القيد"}
          </button>
          <button onClick={handleReject} disabled={confirming} className="btn-secondary">
            ❌ رفض الفاتورة
          </button>
        </div>
      )}

      {invoice.status !== "PENDING_REVIEW" && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-700 text-sm">
          ✅ تم تأكيد هذه الفاتورة وترحيل قيدها المحاسبي
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
