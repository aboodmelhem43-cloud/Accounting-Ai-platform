"use client";
import { useState, useEffect, useCallback } from "react";
import { useLang } from "@/components/LanguageProvider";

interface BankAccount {
  id: string;
  name: string;
  bankName: string;
  accountNumber: string | null;
  iban: string | null;
  currency: string;
  openingBalance: number;
  createdAt: string;
}

const CURRENCIES = ["EGP", "USD", "EUR", "SAR", "AED", "KWD", "GBP", "JOD", "LBP"];

const emptyForm = () => ({
  name: "",
  bankName: "",
  accountNumber: "",
  iban: "",
  currency: "EGP",
  openingBalance: 0,
});

export default function BankAccountsPage() {
  const { lang } = useLang();
  const isAr = lang === "ar";

  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editAccount, setEditAccount] = useState<BankAccount | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bank-accounts");
      const data = await res.json();
      setAccounts(Array.isArray(data) ? data : []);
    } catch {
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openAdd() {
    setEditAccount(null);
    setForm(emptyForm());
    setError(null);
    setShowModal(true);
  }

  function openEdit(a: BankAccount) {
    setEditAccount(a);
    setForm({
      name: a.name,
      bankName: a.bankName,
      accountNumber: a.accountNumber ?? "",
      iban: a.iban ?? "",
      currency: a.currency,
      openingBalance: Number(a.openingBalance),
    });
    setError(null);
    setShowModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const body = {
        ...form,
        accountNumber: form.accountNumber || null,
        iban: form.iban || null,
        openingBalance: Number(form.openingBalance),
      };
      const url = editAccount ? `/api/bank-accounts/${editAccount.id}` : "/api/bank-accounts";
      const method = editAccount ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        throw new Error(d.error ?? "Error");
      }
      setShowModal(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(isAr ? "هل تريد حذف هذا الحساب؟" : "Delete this bank account?")) return;
    await fetch(`/api/bank-accounts/${id}`, { method: "DELETE" });
    load();
  }

  const fmt = (n: number, currency: string) =>
    n.toLocaleString(isAr ? "ar" : "en", { style: "currency", currency, minimumFractionDigits: 2 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isAr ? "الحسابات البنكية" : "Bank Accounts"}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {isAr ? "إدارة حسابات بنكية منشأتك" : "Manage your business bank accounts"}
          </p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          + {isAr ? "إضافة حساب" : "Add Account"}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">
          <div className="animate-spin text-2xl mb-2">⚙️</div>
          <p>{isAr ? "جاري التحميل..." : "Loading..."}</p>
        </div>
      ) : accounts.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">🏦</div>
          <p className="text-gray-500 font-medium">
            {isAr ? "لا توجد حسابات بنكية بعد" : "No bank accounts yet"}
          </p>
          <button onClick={openAdd} className="mt-4 btn-primary text-sm">
            + {isAr ? "إضافة حساب بنكي" : "Add Bank Account"}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <div key={account.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">
                  🏦
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(account)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50"
                  >
                    {isAr ? "تعديل" : "Edit"}
                  </button>
                  <button
                    onClick={() => handleDelete(account.id)}
                    className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50"
                  >
                    {isAr ? "حذف" : "Delete"}
                  </button>
                </div>
              </div>

              <h3 className="font-bold text-gray-900 text-lg">{account.name}</h3>
              <p className="text-gray-500 text-sm mb-3">{account.bankName}</p>

              <div className="space-y-2 text-sm">
                {account.accountNumber && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">{isAr ? "رقم الحساب" : "Account No."}</span>
                    <span className="font-mono text-gray-700">{account.accountNumber}</span>
                  </div>
                )}
                {account.iban && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">IBAN</span>
                    <span className="font-mono text-gray-700 text-xs">{account.iban}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-400">{isAr ? "العملة" : "Currency"}</span>
                  <span className="font-medium text-gray-700">{account.currency}</span>
                </div>
                <div className="flex justify-between border-t border-gray-100 pt-2 mt-2">
                  <span className="text-gray-500 font-medium">{isAr ? "الرصيد الافتتاحي" : "Opening Balance"}</span>
                  <span className="font-bold text-blue-700">
                    {fmt(Number(account.openingBalance), account.currency)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* مودال */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {editAccount
                  ? (isAr ? "تعديل الحساب" : "Edit Account")
                  : (isAr ? "إضافة حساب بنكي" : "Add Bank Account")}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">{isAr ? "اسم الحساب *" : "Account Name *"}</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="input"
                    placeholder={isAr ? "مثال: حساب الرواتب" : "e.g. Payroll Account"}
                  />
                </div>
                <div>
                  <label className="label">{isAr ? "اسم البنك *" : "Bank Name *"}</label>
                  <input
                    type="text"
                    required
                    value={form.bankName}
                    onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))}
                    className="input"
                    placeholder={isAr ? "مثال: البنك الأهلي" : "e.g. National Bank"}
                  />
                </div>
                <div>
                  <label className="label">{isAr ? "رقم الحساب" : "Account Number"}</label>
                  <input
                    type="text"
                    value={form.accountNumber}
                    onChange={(e) => setForm((f) => ({ ...f, accountNumber: e.target.value }))}
                    className="input"
                    placeholder={isAr ? "اختياري" : "Optional"}
                  />
                </div>
                <div>
                  <label className="label">IBAN</label>
                  <input
                    type="text"
                    value={form.iban}
                    onChange={(e) => setForm((f) => ({ ...f, iban: e.target.value }))}
                    className="input"
                    placeholder="EG00 0000..."
                  />
                </div>
                <div>
                  <label className="label">{isAr ? "العملة" : "Currency"}</label>
                  <select
                    value={form.currency}
                    onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                    className="input"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">{isAr ? "الرصيد الافتتاحي" : "Opening Balance"}</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.openingBalance}
                    onChange={(e) => setForm((f) => ({ ...f, openingBalance: parseFloat(e.target.value) || 0 }))}
                    className="input"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? (isAr ? "جاري الحفظ..." : "Saving...") : (isAr ? "حفظ" : "Save")}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">
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
