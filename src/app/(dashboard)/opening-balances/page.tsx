"use client";
import { useEffect, useState, useCallback } from "react";
import { useLang } from "@/components/LanguageProvider";

interface Account {
  id: string;
  code: string;
  name: string;
  nameAr: string | null;
  type: string;
}

interface BalanceLine {
  accountId: string;
  debit: number;
  credit: number;
}

const TYPE_ORDER = ["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"];
const TYPE_LABELS: Record<string, Record<string, string>> = {
  ASSET: { ar: "أصول", en: "Assets" },
  LIABILITY: { ar: "خصوم", en: "Liabilities" },
  EQUITY: { ar: "حقوق ملكية", en: "Equity" },
  REVENUE: { ar: "إيرادات", en: "Revenue" },
  EXPENSE: { ar: "مصروفات", en: "Expenses" },
};

export default function OpeningBalancesPage() {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const locale = isAr ? "ar" : "en";

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [lines, setLines] = useState<Record<string, BalanceLine>>({});
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [existing, setExisting] = useState<{ date: string; id: string } | null>(null);

  const fmt = (n: number) => n.toLocaleString(locale, { minimumFractionDigits: 2 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [aRes, obRes] = await Promise.all([
        fetch("/api/accounts"),
        fetch("/api/opening-balances"),
      ]);
      const [aData, obData] = await Promise.all([aRes.json(), obRes.json()]);
      const accs = aData.accounts ?? [];
      setAccounts(accs);

      if (obData.existing) {
        setExisting({ date: obData.existing.date, id: obData.existing.id });
        // Pre-fill from existing entry
        const filled: Record<string, BalanceLine> = {};
        for (const line of obData.existing.lines ?? []) {
          filled[line.account.id] = { accountId: line.account.id, debit: Number(line.debit), credit: Number(line.credit) };
        }
        setLines(filled);
      } else {
        const init: Record<string, BalanceLine> = {};
        for (const a of accs) { init[a.id] = { accountId: a.id, debit: 0, credit: 0 }; }
        setLines(init);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function setDebit(accountId: string, value: number) {
    setLines((l) => ({ ...l, [accountId]: { ...l[accountId], accountId, debit: value, credit: 0 } }));
  }

  function setCredit(accountId: string, value: number) {
    setLines((l) => ({ ...l, [accountId]: { ...l[accountId], accountId, debit: 0, credit: value } }));
  }

  const totalDebit = Object.values(lines).reduce((s, l) => s + l.debit, 0);
  const totalCredit = Object.values(lines).reduce((s, l) => s + l.credit, 0);
  const imbalance = Math.abs(totalDebit - totalCredit);
  const isBalanced = imbalance < 0.01;

  const grouped = TYPE_ORDER.map((type) => ({
    type,
    accounts: accounts.filter((a) => a.type === type),
  }));

  async function handleSubmit() {
    if (!isBalanced) {
      setError(isAr ? `القيد غير متوازن — الفارق: ${fmt(imbalance)}` : `Entry not balanced — difference: ${fmt(imbalance)}`);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload = Object.values(lines).filter((l) => l.debit > 0 || l.credit > 0);
      const res = await fetch("/api/opening-balances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, lines: payload }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "خطأ"); return; }
      setSuccess(isAr ? "تم حفظ الأرصدة الافتتاحية بنجاح" : "Opening balances saved successfully");
      setExisting({ date, id: data.entryId });
    } catch {
      setError(isAr ? "خطأ في الاتصال" : "Connection error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{isAr ? "الأرصدة الافتتاحية" : "Opening Balances"}</h1>
        <p className="text-gray-500 text-sm mt-1">
          {isAr ? "أدخل أرصدة الحسابات عند البدء بالنظام لضمان دقة التقارير" : "Enter account balances at system start to ensure accurate reports"}
        </p>
      </div>

      {existing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
          ℹ️ {isAr
            ? `يوجد قيد أرصدة افتتاحية بتاريخ ${new Date(existing.date).toLocaleDateString(locale)} — سيتم استبداله عند الحفظ.`
            : `Existing opening balance entry dated ${new Date(existing.date).toLocaleDateString(locale)} — it will be replaced on save.`}
        </div>
      )}

      {(error || success) && (
        <div className={`rounded-lg p-3 text-sm flex justify-between ${error ? "bg-red-50 border border-red-200 text-red-700" : "bg-green-50 border border-green-200 text-green-700"}`}>
          <span>{error ?? success}</span>
          <button onClick={() => { setError(null); setSuccess(null); }}>✕</button>
        </div>
      )}

      <div className="flex items-center gap-4 flex-wrap">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">{isAr ? "تاريخ الأرصدة الافتتاحية" : "Opening balance date"}</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input text-sm" />
        </div>
        <div className={`mt-4 text-sm font-mono px-3 py-2 rounded-lg ${isBalanced ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {isAr
            ? `مدين: ${fmt(totalDebit)} | دائن: ${fmt(totalCredit)} ${!isBalanced ? `| فارق: ${fmt(imbalance)}` : "✓"}`
            : `Dr: ${fmt(totalDebit)} | Cr: ${fmt(totalCredit)} ${!isBalanced ? `| Diff: ${fmt(imbalance)}` : "✓"}`}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400"><div className="animate-spin text-3xl">⚙️</div></div>
      ) : (
        <div className="space-y-4">
          {grouped.map(({ type, accounts: accs }) => {
            if (accs.length === 0) return null;
            const hasValues = accs.some((a) => (lines[a.id]?.debit ?? 0) > 0 || (lines[a.id]?.credit ?? 0) > 0);
            return (
              <div key={type} className="card overflow-hidden">
                <div className={`px-4 py-2 border-b border-gray-100 ${hasValues ? "bg-blue-50" : "bg-gray-50"}`}>
                  <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    {isAr ? TYPE_LABELS[type]?.ar : TYPE_LABELS[type]?.en}
                  </h3>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-right py-2 px-4 font-medium text-gray-500 text-xs">{isAr ? "الحساب" : "Account"}</th>
                      <th className="py-2 px-4 font-medium text-gray-500 text-xs w-36">{isAr ? "مدين" : "Debit"}</th>
                      <th className="py-2 px-4 font-medium text-gray-500 text-xs w-36">{isAr ? "دائن" : "Credit"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accs.map((acc) => {
                      const line = lines[acc.id] ?? { accountId: acc.id, debit: 0, credit: 0 };
                      return (
                        <tr key={acc.id} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-2 px-4">
                            <span className="text-gray-400 text-xs mr-1">{acc.code}</span>
                            <span className="text-gray-700">{isAr ? (acc.nameAr ?? acc.name) : acc.name}</span>
                          </td>
                          <td className="py-1.5 px-4">
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              value={line.debit || ""}
                              onChange={(e) => setDebit(acc.id, parseFloat(e.target.value) || 0)}
                              className="input w-full text-xs text-right font-mono"
                              placeholder="0.00"
                            />
                          </td>
                          <td className="py-1.5 px-4">
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              value={line.credit || ""}
                              onChange={(e) => setCredit(acc.id, parseFloat(e.target.value) || 0)}
                              className="input w-full text-xs text-right font-mono"
                              placeholder="0.00"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}

      {!loading && (
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={submitting || !isBalanced}
            className="btn-primary"
          >
            {submitting ? (isAr ? "جاري الحفظ..." : "Saving...") : (isAr ? "حفظ الأرصدة الافتتاحية" : "Save Opening Balances")}
          </button>
        </div>
      )}
    </div>
  );
}
