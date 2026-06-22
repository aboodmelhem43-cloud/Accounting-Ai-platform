"use client";
import { useState, useEffect, useCallback } from "react";
import { useLang } from "@/components/LanguageProvider";
import type { BalanceSheet, AccountBalance } from "@/types";

export default function BalanceSheetPage() {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const today = new Date().toISOString().split("T")[0];
  const [asOf, setAsOf] = useState(today);
  const [data, setData] = useState<BalanceSheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/reports/balance-sheet?asOf=${asOf}`);
      if (!res.ok) throw new Error("Failed");
      setData(await res.json());
    } catch {
      setError(isAr ? "خطأ في تحميل الميزانية" : "Failed to load balance sheet");
    } finally {
      setLoading(false);
    }
  }, [asOf, isAr]);

  useEffect(() => { load(); }, [load]);

  function AccountsTable({ accounts, title }: { accounts: AccountBalance[]; title: string }) {
    return (
      <div>
        <h3 className="font-semibold text-gray-700 mb-2">{title}</h3>
        {accounts.length === 0 ? (
          <p className="text-gray-400 text-sm py-2">{isAr ? "لا توجد أرصدة" : "No balances"}</p>
        ) : (
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-100">
              {accounts.map((a) => (
                <tr key={a.accountId}>
                  <td className="py-1.5 text-gray-600">
                    <span className="text-gray-400 text-xs me-1">{a.accountCode}</span>
                    {isAr ? (a.accountNameAr ?? a.accountName) : a.accountName}
                  </td>
                  <td className="py-1.5 text-right font-mono text-gray-800">
                    {a.balance.toLocaleString(isAr ? "ar" : "en", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  }

  const fmt = (n: number) => n.toLocaleString(isAr ? "ar" : "en", { minimumFractionDigits: 2 });

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isAr ? "الميزانية العمومية" : "Balance Sheet"}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {isAr ? "الأصول = الخصوم + حقوق الملكية" : "Assets = Liabilities + Equity"}
        </p>
      </div>

      {/* أدوات التحكم */}
      <div className="card flex items-end gap-4 flex-wrap">
        <div>
          <label className="label">{isAr ? "التاريخ" : "As Of Date"}</label>
          <input
            type="date"
            value={asOf}
            max={today}
            onChange={(e) => setAsOf(e.target.value)}
            className="input"
          />
        </div>
        <button onClick={load} disabled={loading} className="btn-primary">
          {loading ? "..." : (isAr ? "تحديث" : "Update")}
        </button>
      </div>

      {loading && (
        <div className="text-center py-12 text-gray-400">
          <div className="animate-spin text-2xl mb-2">⚙️</div>
          <p>{isAr ? "جاري الحساب..." : "Calculating..."}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">{error}</div>
      )}

      {!loading && data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* الأصول */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">{isAr ? "الأصول" : "Assets"}</h2>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                {data.currency}
              </span>
            </div>
            <AccountsTable accounts={data.assets} title="" />
            <div className="border-t-2 border-gray-800 pt-3 mt-3 flex justify-between font-bold text-gray-900">
              <span>{isAr ? "إجمالي الأصول" : "Total Assets"}</span>
              <span className="font-mono">{fmt(data.totalAssets)}</span>
            </div>
          </div>

          {/* الخصوم وحقوق الملكية */}
          <div className="space-y-4">
            <div className="card">
              <h2 className="text-lg font-bold text-gray-800 mb-4">{isAr ? "الخصوم" : "Liabilities"}</h2>
              <AccountsTable accounts={data.liabilities} title="" />
              <div className="border-t border-gray-300 pt-2 mt-2 flex justify-between font-semibold text-gray-700">
                <span>{isAr ? "إجمالي الخصوم" : "Total Liabilities"}</span>
                <span className="font-mono">{fmt(data.totalLiabilities)}</span>
              </div>
            </div>

            <div className="card">
              <h2 className="text-lg font-bold text-gray-800 mb-4">{isAr ? "حقوق الملكية" : "Equity"}</h2>
              <AccountsTable accounts={data.equity} title="" />
              {data.netProfit !== 0 && (
                <div className="flex justify-between text-sm py-1.5 text-gray-600">
                  <span>{isAr ? "صافي الربح" : "Net Profit"}</span>
                  <span className={`font-mono font-medium ${data.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {fmt(data.netProfit)}
                  </span>
                </div>
              )}
              <div className="border-t border-gray-300 pt-2 mt-2 flex justify-between font-semibold text-gray-700">
                <span>{isAr ? "إجمالي حقوق الملكية" : "Total Equity"}</span>
                <span className="font-mono">{fmt(data.totalEquity)}</span>
              </div>
            </div>

            {/* التحقق */}
            <div className={`rounded-xl p-4 text-sm font-medium text-center ${
              Math.abs(data.totalAssets - (data.totalLiabilities + data.totalEquity)) < 0.01
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}>
              {Math.abs(data.totalAssets - (data.totalLiabilities + data.totalEquity)) < 0.01
                ? (isAr ? "✓ الميزانية متوازنة" : "✓ Balance sheet is balanced")
                : (isAr ? "⚠ الميزانية غير متوازنة" : "⚠ Balance sheet is unbalanced")}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
