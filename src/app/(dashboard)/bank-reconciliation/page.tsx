"use client";
import { useState, useEffect } from "react";
import { useLang } from "@/components/LanguageProvider";

interface BankAccount {
  id: string;
  name: string;
  bankName: string;
  currency: string;
}

interface BankTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  transactionType: string;
  balance: number | null;
  reference: string | null;
  matched: boolean;
}

interface BankStatement {
  id: string;
  fileName: string;
  uploadedAt: string;
  transactions: BankTransaction[];
}

interface LedgerAccount {
  id: string;
  name: string;
  nameAr: string | null;
  code: string;
  type: string;
}

interface CodingDialog {
  txId: string;
  description: string;
  amount: number;
  transactionType: string;
}

export default function BankReconciliationPage() {
  const { lang } = useLang();
  const isAr = lang === "ar";

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [selectedBankAccountId, setSelectedBankAccountId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [statement, setStatement] = useState<BankStatement | null>(null);
  const [matchingId, setMatchingId] = useState<string | null>(null);
  const [ledgerAccounts, setLedgerAccounts] = useState<LedgerAccount[]>([]);
  const [codingDialog, setCodingDialog] = useState<CodingDialog | null>(null);
  const [codingBankAccount, setCodingBankAccount] = useState("");
  const [codingCounterpart, setCodingCounterpart] = useState("");
  const [codingError, setCodingError] = useState("");

  useEffect(() => {
    fetch("/api/bank-accounts")
      .then((r) => r.json())
      .then((data: BankAccount[]) => {
        setBankAccounts(Array.isArray(data) ? data : []);
        if (data.length > 0) setSelectedBankAccountId(data[0].id);
      })
      .catch(() => {});

    fetch("/api/accounts")
      .then((r) => r.json())
      .then((data: LedgerAccount[]) => {
        setLedgerAccounts(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
  }, []);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (selectedBankAccountId) fd.append("bankAccountId", selectedBankAccountId);
      const res = await fetch("/api/bank-reconciliation/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        throw new Error(d.error ?? "Upload failed");
      }
      const data = await res.json() as BankStatement;
      setStatement(data);
      setFile(null);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Error");
    } finally {
      setUploading(false);
    }
  }

  function openCodingDialog(tx: BankTransaction) {
    setCodingError("");
    // Pre-select defaults: first ASSET for bank side, first REVENUE/EXPENSE for counterpart
    const assetAccounts = ledgerAccounts.filter((a) => a.type === "ASSET");
    const oppositeType = tx.transactionType === "CREDIT" ? "REVENUE" : "EXPENSE";
    const counterpartAccounts = ledgerAccounts.filter((a) => a.type === oppositeType);

    setCodingBankAccount(assetAccounts[0]?.id ?? "");
    setCodingCounterpart(counterpartAccounts[0]?.id ?? "");
    setCodingDialog({
      txId: tx.id,
      description: tx.description,
      amount: Number(tx.amount),
      transactionType: tx.transactionType,
    });
  }

  async function handleMatch() {
    if (!statement || !codingDialog) return;
    if (!codingBankAccount || !codingCounterpart) {
      setCodingError(isAr ? "يجب اختيار كلا الحسابين" : "Both accounts are required");
      return;
    }
    setCodingError("");
    setMatchingId(codingDialog.txId);
    try {
      const res = await fetch(
        `/api/bank-reconciliation/${statement.id}/transactions/${codingDialog.txId}/match`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bankAccountId: codingBankAccount,
            counterpartAccountId: codingCounterpart,
          }),
        }
      );
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        setCodingError(d.error ?? (isAr ? "حدث خطأ" : "Error occurred"));
        return;
      }
      setStatement((s) =>
        s
          ? { ...s, transactions: s.transactions.map((t) => t.id === codingDialog.txId ? { ...t, matched: true } : t) }
          : s
      );
      setCodingDialog(null);
    } finally {
      setMatchingId(null);
    }
  }

  const unmatchedCount = statement?.transactions.filter((t) => !t.matched).length ?? 0;
  const matchedCount = statement?.transactions.filter((t) => t.matched).length ?? 0;

  const accountName = (a: LedgerAccount) => (isAr && a.nameAr ? a.nameAr : a.name);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isAr ? "التسوية البنكية" : "Bank Reconciliation"}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {isAr ? "رفع كشف الحساب البنكي ومطابقة الحركات" : "Upload bank statement and match transactions"}
        </p>
      </div>

      {/* رفع الملف */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">
          {isAr ? "رفع كشف حساب" : "Upload Statement"}
        </h2>
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">{isAr ? "الحساب البنكي" : "Bank Account"}</label>
              <select
                value={selectedBankAccountId}
                onChange={(e) => setSelectedBankAccountId(e.target.value)}
                className="input"
              >
                <option value="">{isAr ? "اختر حساباً (اختياري)" : "Select account (optional)"}</option>
                {bankAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} — {a.bankName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">{isAr ? "ملف CSV" : "CSV File"}</label>
              <input
                type="file"
                accept=".csv,text/csv"
                required
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="input"
              />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700">
            {isAr
              ? "الأعمدة المدعومة: Date، Description، Debit، Credit (أو Amount)، Balance"
              : "Supported columns: Date, Description, Debit, Credit (or Amount), Balance"}
          </div>

          {uploadError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
              {uploadError}
            </div>
          )}

          <button type="submit" disabled={!file || uploading} className="btn-primary">
            {uploading
              ? (isAr ? "جاري الرفع..." : "Uploading...")
              : (isAr ? "رفع الكشف" : "Upload Statement")}
          </button>
        </form>
      </div>

      {/* نتائج الكشف */}
      {statement && (
        <div className="space-y-4">
          {/* ملخص */}
          <div className="grid grid-cols-3 gap-4">
            <div className="card text-center">
              <div className="text-3xl font-bold text-gray-800">{statement.transactions.length}</div>
              <div className="text-sm text-gray-500 mt-1">{isAr ? "إجمالي الحركات" : "Total Transactions"}</div>
            </div>
            <div className="card text-center">
              <div className="text-3xl font-bold text-green-600">{matchedCount}</div>
              <div className="text-sm text-gray-500 mt-1">{isAr ? "مطابق" : "Matched"}</div>
            </div>
            <div className="card text-center">
              <div className="text-3xl font-bold text-orange-500">{unmatchedCount}</div>
              <div className="text-sm text-gray-500 mt-1">{isAr ? "غير مطابق" : "Unmatched"}</div>
            </div>
          </div>

          {/* الجدول */}
          <div className="card p-0 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">
                {isAr ? `كشف: ${statement.fileName}` : `Statement: ${statement.fileName}`}
              </h3>
              <span className="text-xs text-gray-400">
                {new Date(statement.uploadedAt).toLocaleDateString(isAr ? "ar" : "en")}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">{isAr ? "التاريخ" : "Date"}</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">{isAr ? "البيان" : "Description"}</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">{isAr ? "المبلغ" : "Amount"}</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">{isAr ? "النوع" : "Type"}</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">{isAr ? "الرصيد" : "Balance"}</th>
                    <th className="px-4 py-3 font-medium text-gray-600">{isAr ? "الحالة" : "Status"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {statement.transactions.map((tx) => (
                    <tr key={tx.id} className={`hover:bg-gray-50 ${tx.matched ? "opacity-60" : ""}`}>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {new Date(tx.date).toLocaleDateString(isAr ? "ar" : "en")}
                      </td>
                      <td className="px-4 py-3 text-gray-800 max-w-xs truncate">{tx.description}</td>
                      <td className="px-4 py-3 font-mono font-medium">
                        <span className={tx.transactionType === "CREDIT" ? "text-green-600" : "text-red-500"}>
                          {tx.transactionType === "CREDIT" ? "+" : "-"}
                          {Number(tx.amount).toLocaleString(isAr ? "ar" : "en", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 text-xs rounded-full font-medium ${
                            tx.transactionType === "CREDIT"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {tx.transactionType === "CREDIT"
                            ? (isAr ? "دائن" : "Credit")
                            : (isAr ? "مدين" : "Debit")}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-gray-500 text-xs">
                        {tx.balance != null
                          ? Number(tx.balance).toLocaleString(isAr ? "ar" : "en", {
                              minimumFractionDigits: 2,
                            })
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {tx.matched ? (
                          <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                            ✓ {isAr ? "مطابق" : "Matched"}
                          </span>
                        ) : (
                          <button
                            onClick={() => openCodingDialog(tx)}
                            disabled={matchingId === tx.id}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium border border-blue-200 rounded px-2 py-1 hover:bg-blue-50 transition-colors disabled:opacity-50"
                          >
                            {matchingId === tx.id
                              ? "..."
                              : (isAr ? "ترحيل" : "Code & Post")}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Coding Dialog Modal */}
      {codingDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md" dir={isAr ? "rtl" : "ltr"}>
            <h2 className="text-lg font-bold mb-1">{isAr ? "ترحيل الحركة" : "Code & Post Transaction"}</h2>
            <p className="text-sm text-gray-500 mb-4 truncate">{codingDialog.description}</p>

            <div className="bg-gray-50 rounded-lg px-4 py-3 mb-4 flex justify-between text-sm">
              <span className="text-gray-600">{isAr ? "المبلغ" : "Amount"}</span>
              <span className={`font-bold ${codingDialog.transactionType === "CREDIT" ? "text-green-600" : "text-red-500"}`}>
                {codingDialog.transactionType === "CREDIT" ? "+" : "-"}
                {Math.abs(codingDialog.amount).toLocaleString(isAr ? "ar-EG" : "en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>

            {codingError && (
              <div className="bg-red-50 text-red-700 rounded-lg px-4 py-2 text-sm mb-4">{codingError}</div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {isAr ? "حساب البنك (في دليل الحسابات)" : "Bank Account (in Chart of Accounts)"}
                </label>
                <select
                  value={codingBankAccount}
                  onChange={(e) => setCodingBankAccount(e.target.value)}
                  className="input w-full"
                >
                  <option value="">{isAr ? "اختر الحساب..." : "Select account..."}</option>
                  {ledgerAccounts.filter((a) => a.type === "ASSET").map((a) => (
                    <option key={a.id} value={a.id}>{a.code} — {accountName(a)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {codingDialog.transactionType === "CREDIT"
                    ? (isAr ? "الحساب المقابل (إيرادات)" : "Counterpart Account (Revenue)")
                    : (isAr ? "الحساب المقابل (مصروفات)" : "Counterpart Account (Expense)")}
                </label>
                <select
                  value={codingCounterpart}
                  onChange={(e) => setCodingCounterpart(e.target.value)}
                  className="input w-full"
                >
                  <option value="">{isAr ? "اختر الحساب..." : "Select account..."}</option>
                  {ledgerAccounts
                    .filter((a) => codingDialog.transactionType === "CREDIT" ? a.type !== "ASSET" : a.type !== "ASSET")
                    .map((a) => (
                      <option key={a.id} value={a.id}>{a.code} — {accountName(a)}</option>
                    ))}
                </select>
              </div>

              <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
                {codingDialog.transactionType === "CREDIT"
                  ? (isAr ? "مدين: البنك | دائن: الحساب المقابل" : "Dr: Bank | Cr: Counterpart")
                  : (isAr ? "مدين: الحساب المقابل | دائن: البنك" : "Dr: Counterpart | Cr: Bank")}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleMatch}
                  disabled={!!matchingId}
                  className="btn-primary flex-1"
                >
                  {matchingId ? "..." : (isAr ? "ترحيل القيد" : "Post Journal Entry")}
                </button>
                <button
                  onClick={() => { setCodingDialog(null); setCodingError(""); }}
                  className="btn-secondary flex-1"
                >
                  {isAr ? "إلغاء" : "Cancel"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
