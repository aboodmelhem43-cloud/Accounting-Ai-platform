"use client";
import { useState, useEffect } from "react";
import { useLang } from "@/components/LanguageProvider";

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
}

interface ExpenseEntry {
  id: string;
  date: string;
  description: string;
  lines: { debit: number; credit: number; account: { name: string; type: string } }[];
}

export default function ExpensesPage() {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const locale = isAr ? "ar" : "en";

  const [expenseAccounts, setExpenseAccounts] = useState<Account[]>([]);
  const [paymentAccounts, setPaymentAccounts] = useState<Account[]>([]);
  const [recent, setRecent] = useState<ExpenseEntry[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  // Form state
  const [amount, setAmount] = useState("");
  const [expenseAccountId, setExpenseAccountId] = useState("");
  const [paymentAccountId, setPaymentAccountId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [reference, setReference] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/accounts")
      .then((r) => r.json())
      .then((data: Account[]) => {
        const all = Array.isArray(data) ? data : [];
        setExpenseAccounts(all.filter((a) => a.type === "EXPENSE"));
        setPaymentAccounts(all.filter((a) => ["ASSET", "BANK", "CASH"].includes(a.type)));
        if (all.length) {
          const defaultExpense = all.find((a) => a.type === "EXPENSE");
          const defaultPayment = all.find((a) => ["ASSET", "BANK", "CASH"].includes(a.type));
          if (defaultExpense) setExpenseAccountId(defaultExpense.id);
          if (defaultPayment) setPaymentAccountId(defaultPayment.id);
        }
      })
      .finally(() => setLoadingAccounts(false));

    loadRecent();
  }, []);

  function loadRecent() {
    fetch("/api/journal?page=1")
      .then((r) => r.json())
      .then((data) => {
        const entries: ExpenseEntry[] = (data.entries ?? []).filter((e: ExpenseEntry) =>
          e.lines.some((l) => l.account.type === "EXPENSE" && l.debit > 0)
        ).slice(0, 8);
        setRecent(entries);
      })
      .catch(() => {});
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0 || !expenseAccountId || !paymentAccountId) return;

    setSaving(true);
    setSuccess(false);
    try {
      const res = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          description: description || (isAr ? "مصروف سريع" : "Quick expense"),
          reference: reference || undefined,
          status: "POSTED",
          lines: [
            { accountId: expenseAccountId, debit: amt, credit: 0 },
            { accountId: paymentAccountId, debit: 0, credit: amt },
          ],
        }),
      });

      if (!res.ok) throw new Error();
      setAmount("");
      setDescription("");
      setReference("");
      setDate(new Date().toISOString().slice(0, 10));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      loadRecent();
    } catch {
      alert(isAr ? "فشل تسجيل المصروف" : "Failed to save expense");
    } finally {
      setSaving(false);
    }
  }

  const fmt = (n: number) =>
    n.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isAr ? "تسجيل مصروف سريع" : "Quick Expense Entry"}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {isAr
            ? "سجّل مصروفاً في ثوانٍ — يُنشئ النظام قيد اليومية تلقائياً"
            : "Log an expense in seconds — journal entry is created automatically"}
        </p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount — prominent */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isAr ? "المبلغ *" : "Amount *"}
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              className="input text-2xl font-bold"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Expense category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isAr ? "نوع المصروف *" : "Expense Category *"}
              </label>
              {loadingAccounts ? (
                <div className="input animate-pulse bg-gray-100" />
              ) : (
                <select
                  className="input"
                  value={expenseAccountId}
                  onChange={(e) => setExpenseAccountId(e.target.value)}
                  required
                >
                  <option value="">{isAr ? "اختر الحساب..." : "Select account..."}</option>
                  {expenseAccounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Payment source */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isAr ? "طريقة الدفع *" : "Pay From *"}
              </label>
              {loadingAccounts ? (
                <div className="input animate-pulse bg-gray-100" />
              ) : (
                <select
                  className="input"
                  value={paymentAccountId}
                  onChange={(e) => setPaymentAccountId(e.target.value)}
                  required
                >
                  <option value="">{isAr ? "اختر الحساب..." : "Select account..."}</option>
                  {paymentAccounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isAr ? "التاريخ *" : "Date *"}
              </label>
              <input
                type="date"
                className="input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            {/* Reference */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isAr ? "رقم المرجع" : "Reference #"}
              </label>
              <input
                className="input"
                placeholder={isAr ? "اختياري" : "Optional"}
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isAr ? "الوصف" : "Description"}
            </label>
            <input
              className="input"
              placeholder={isAr ? "وصف المصروف (اختياري)" : "Expense description (optional)"}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={saving || !amount || !expenseAccountId || !paymentAccountId}
            className="btn-primary w-full text-base py-3"
          >
            {saving
              ? (isAr ? "جارٍ الحفظ..." : "Saving...")
              : (isAr ? "💾 تسجيل المصروف" : "💾 Save Expense")}
          </button>

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 text-center">
              ✅ {isAr ? "تم تسجيل المصروف وترحيل القيد بنجاح" : "Expense saved and journal entry posted successfully"}
            </div>
          )}
        </form>
      </div>

      {/* Recent expenses */}
      {recent.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">
            {isAr ? "آخر المصروفات المسجّلة" : "Recent Expenses"}
          </h2>
          <div className="divide-y divide-gray-100">
            {recent.map((entry) => {
              const expLine = entry.lines.find((l) => l.account.type === "EXPENSE" && l.debit > 0);
              const payLine = entry.lines.find((l) => l.credit > 0);
              return (
                <div key={entry.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{entry.description}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(entry.date).toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" })}
                      {expLine && <span className="mx-1">·</span>}
                      {expLine && <span>{expLine.account.name}</span>}
                      {payLine && <span className="mx-1">←</span>}
                      {payLine && <span>{payLine.account.name}</span>}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-red-600 flex-shrink-0">
                    -{fmt(expLine?.debit ?? 0)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
