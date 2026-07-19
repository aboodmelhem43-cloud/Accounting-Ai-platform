"use client";

import { useState } from "react";

type Account = { id: string; name: string; nameAr: string | null; code: string; type: string };

type Payment = {
  id: string;
  amount: number;
  date: string;
  note: string | null;
};

type Props = {
  invoiceId: string;
  invoiceType: "SALES" | "PURCHASE";
  paymentStatus: string;
  totalAmount: number;
  alreadyPaid: number;
  contactEmail?: string | null;
  assetAccounts: Account[];
  isAr: boolean;
  currencySymbol: string;
  payments: Payment[];
};

const statusColors: Record<string, string> = {
  UNPAID: "bg-yellow-100 text-yellow-800",
  PARTIALLY_PAID: "bg-blue-100 text-blue-800",
  PAID: "bg-green-100 text-green-800",
  VOIDED: "bg-gray-100 text-gray-600",
};
const statusLabels: Record<string, { ar: string; en: string }> = {
  UNPAID: { ar: "غير مدفوعة", en: "Unpaid" },
  PARTIALLY_PAID: { ar: "مدفوعة جزئياً", en: "Partially Paid" },
  PAID: { ar: "مدفوعة بالكامل", en: "Paid" },
  VOIDED: { ar: "ملغاة", en: "Voided" },
};

export default function InvoiceActions({
  invoiceId,
  invoiceType,
  paymentStatus: initialStatus,
  totalAmount,
  alreadyPaid: initialPaid,
  contactEmail,
  assetAccounts,
  isAr,
  currencySymbol,
  payments: initialPayments,
}: Props) {
  const [showPayment, setShowPayment] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(initialStatus);
  const [alreadyPaid, setAlreadyPaid] = useState(initialPaid);
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Payment form state
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);
  const [payAccount, setPayAccount] = useState(assetAccounts[0]?.id ?? "");
  const [payNote, setPayNote] = useState("");

  // Email form state
  const [emailTo, setEmailTo] = useState(contactEmail ?? "");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  const remaining = totalAmount - alreadyPaid;
  const status = statusLabels[paymentStatus] ?? statusLabels.UNPAID;

  async function handlePayment(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!payAccount) { setError(isAr ? "اختر الحساب" : "Select account"); return; }
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) { setError(isAr ? "أدخل مبلغاً صحيحاً" : "Enter valid amount"); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, date: payDate, accountId: payAccount, note: payNote || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "حدث خطأ"); return; }
      setPaymentStatus(data.paymentStatus);
      setAlreadyPaid((p) => p + amount);
      setPayments((prev) => [{ id: data.payment.id, amount, date: payDate, note: payNote || null }, ...prev]);
      setShowPayment(false);
      setPayAmount("");
      setPayNote("");
    } catch {
      setError(isAr ? "حدث خطأ في الاتصال" : "Connection error");
    } finally {
      setLoading(false);
    }
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: emailTo, subject: emailSubject || undefined, message: emailMessage || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "حدث خطأ"); return; }
      setEmailSent(true);
      setTimeout(() => { setShowEmail(false); setEmailSent(false); }, 2000);
    } catch {
      setError(isAr ? "حدث خطأ في الاتصال" : "Connection error");
    } finally {
      setLoading(false);
    }
  }

  const fmt = (n: number) => `${n.toLocaleString(isAr ? "ar-EG" : "en-US", { minimumFractionDigits: 2 })} ${currencySymbol}`;

  return (
    <div className="print:hidden">
      {/* Payment status + action bar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColors[paymentStatus] ?? statusColors.UNPAID}`}>
          {isAr ? status.ar : status.en}
        </span>
        {paymentStatus !== "PAID" && paymentStatus !== "VOIDED" && (
          <>
            <span className="text-sm text-gray-500">
              {isAr ? `المتبقي: ${fmt(remaining)}` : `Outstanding: ${fmt(remaining)}`}
            </span>
            <button
              onClick={() => setShowPayment(true)}
              className="btn-primary text-sm px-4 py-2"
            >
              {isAr ? "تسجيل دفعة" : "Record Payment"}
            </button>
          </>
        )}
        {invoiceType === "SALES" && (
          <button
            onClick={() => setShowEmail(true)}
            className="btn-secondary text-sm px-4 py-2"
          >
            {isAr ? "إرسال بالبريد" : "Send by Email"}
          </button>
        )}
      </div>

      {/* Payment history */}
      {payments.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">{isAr ? "سجل الدفعات" : "Payment History"}</h3>
          <div className="space-y-2">
            {payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm bg-green-50 rounded-lg px-4 py-2">
                <span className="text-gray-600">{new Date(p.date).toLocaleDateString(isAr ? "ar-EG" : "en-US")}</span>
                {p.note && <span className="text-gray-500 flex-1 px-3">{p.note}</span>}
                <span className="font-medium text-green-700">{fmt(Number(p.amount))}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md" dir={isAr ? "rtl" : "ltr"}>
            <h2 className="text-lg font-bold mb-4">{isAr ? "تسجيل دفعة" : "Record Payment"}</h2>
            {error && <div className="bg-red-50 text-red-700 rounded-lg px-4 py-2 text-sm mb-4">{error}</div>}
            <form onSubmit={handlePayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{isAr ? "المبلغ" : "Amount"}</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={remaining}
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder={`${isAr ? "أقصى:" : "Max:"} ${remaining.toFixed(2)}`}
                    className="input w-full"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setPayAmount(remaining.toFixed(2))}
                    className="absolute left-2 top-2 text-xs text-blue-600 hover:underline"
                  >
                    {isAr ? "كامل المبلغ" : "Full amount"}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{isAr ? "التاريخ" : "Date"}</label>
                <input
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{isAr ? "حساب النقدية / البنك" : "Cash / Bank Account"}</label>
                <select value={payAccount} onChange={(e) => setPayAccount(e.target.value)} className="input w-full" required>
                  {assetAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.code} — {isAr && a.nameAr ? a.nameAr : a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{isAr ? "ملاحظة (اختياري)" : "Note (optional)"}</label>
                <input
                  type="text"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  className="input w-full"
                  placeholder={isAr ? "مثال: تحويل بنكي" : "e.g. Bank transfer"}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={loading} className="btn-primary flex-1">
                  {loading ? "..." : isAr ? "حفظ الدفعة" : "Save Payment"}
                </button>
                <button type="button" onClick={() => { setShowPayment(false); setError(""); }} className="btn-secondary flex-1">
                  {isAr ? "إلغاء" : "Cancel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Send Email Modal */}
      {showEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md" dir={isAr ? "rtl" : "ltr"}>
            <h2 className="text-lg font-bold mb-4">{isAr ? "إرسال الفاتورة بالبريد" : "Send Invoice by Email"}</h2>
            {emailSent && (
              <div className="bg-green-50 text-green-700 rounded-lg px-4 py-2 text-sm mb-4">
                {isAr ? "تم الإرسال بنجاح ✓" : "Sent successfully ✓"}
              </div>
            )}
            {error && <div className="bg-red-50 text-red-700 rounded-lg px-4 py-2 text-sm mb-4">{error}</div>}
            <form onSubmit={handleEmail} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{isAr ? "البريد الإلكتروني للعميل" : "Customer Email"}</label>
                <input
                  type="email"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  className="input w-full"
                  required
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{isAr ? "موضوع الرسالة (اختياري)" : "Subject (optional)"}</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{isAr ? "رسالة إضافية (اختياري)" : "Additional message (optional)"}</label>
                <textarea
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  className="input w-full h-20"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={loading || emailSent} className="btn-primary flex-1">
                  {loading ? "..." : isAr ? "إرسال" : "Send"}
                </button>
                <button type="button" onClick={() => { setShowEmail(false); setError(""); }} className="btn-secondary flex-1">
                  {isAr ? "إلغاء" : "Cancel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
