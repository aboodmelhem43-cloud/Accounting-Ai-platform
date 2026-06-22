"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useLang } from "@/components/LanguageProvider";
import type { IncomeStatement } from "@/types";

export default function IncomeStatementPage() {
  const { data: session } = useSession();
  const { t, lang } = useLang();
  const locale = lang === "ar" ? "ar" : "en";

  const now = new Date();
  const [from, setFrom] = useState(
    new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
  );
  const [to, setTo] = useState(
    new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0]
  );
  const [statement, setStatement] = useState<IncomeStatement | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchStatement() {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/income?from=${from}&to=${to}`);
      const data = await res.json();
      setStatement(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchStatement(); }, [from, to]);

  const fmt = (n: number) =>
    `${n.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${statement?.currency ?? ""}`;

  const quickRanges = [
    {
      label: lang === "ar" ? "هذا الشهر" : "This Month",
      fn: () => {
        const d = new Date();
        setFrom(new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0]);
        setTo(new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split("T")[0]);
      },
    },
    {
      label: lang === "ar" ? "الشهر الماضي" : "Last Month",
      fn: () => {
        const d = new Date();
        setFrom(new Date(d.getFullYear(), d.getMonth() - 1, 1).toISOString().split("T")[0]);
        setTo(new Date(d.getFullYear(), d.getMonth(), 0).toISOString().split("T")[0]);
      },
    },
    {
      label: lang === "ar" ? "هذا العام" : "This Year",
      fn: () => {
        const y = new Date().getFullYear();
        setFrom(`${y}-01-01`);
        setTo(`${y}-12-31`);
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("reports.income.title")}</h1>
        <p className="text-gray-500 text-sm mt-1">
          {lang === "ar" ? "محسوبة من القيود المرحّلة مباشرة" : "Calculated directly from posted journal entries"}
        </p>
      </div>

      <div className="card">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="label">{t("reports.income.from")}</label>
            <input type="date" className="input w-auto" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="label">{t("reports.income.to")}</label>
            <input type="date" className="input w-auto" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="flex gap-2 flex-wrap">
            {quickRanges.map((s) => (
              <button key={s.label} onClick={s.fn} className="btn-secondary text-xs py-1 px-3">
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && (
        <div className="text-center py-8 text-gray-500">
          <div className="animate-spin text-2xl mb-2">⚙️</div>
          <p>{t("reports.income.loading")}</p>
        </div>
      )}

      {statement && !loading && (
        <div className="space-y-4">
          <div className="card">
            <h2 className="font-semibold text-green-700 mb-4 flex items-center gap-2">
              📈 {t("reports.income.revenue")}
            </h2>
            {statement.revenue.length === 0 ? (
              <p className="text-gray-400 text-sm">
                {lang === "ar" ? "لا توجد إيرادات في هذه الفترة" : "No revenue in this period"}
              </p>
            ) : (
              <div className="space-y-2">
                {statement.revenue.map((acc) => (
                  <div key={acc.accountId} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                    <div>
                      <span className="text-sm text-gray-800">
                        {lang === "ar" ? (acc.accountNameAr ?? acc.accountName) : acc.accountName}
                      </span>
                      <span className="text-xs text-gray-400 mr-2">{acc.accountCode}</span>
                    </div>
                    <span className="font-medium text-green-700">{fmt(acc.balance)}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2 font-bold text-green-800 border-t border-green-200">
                  <span>{lang === "ar" ? "إجمالي الإيرادات" : "Total Revenue"}</span>
                  <span>{fmt(statement.totalRevenue)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="font-semibold text-red-700 mb-4 flex items-center gap-2">
              📉 {t("reports.income.expenses")}
            </h2>
            {statement.expenses.length === 0 ? (
              <p className="text-gray-400 text-sm">
                {lang === "ar" ? "لا توجد مصروفات في هذه الفترة" : "No expenses in this period"}
              </p>
            ) : (
              <div className="space-y-2">
                {statement.expenses.map((acc) => {
                  const isNegative = acc.balance < 0;
                  return (
                    <div key={acc.accountId} className={`flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0 ${isNegative ? "bg-amber-50 rounded px-2" : ""}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-800">
                          {lang === "ar" ? (acc.accountNameAr ?? acc.accountName) : acc.accountName}
                        </span>
                        <span className="text-xs text-gray-400">{acc.accountCode}</span>
                        {isNegative && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">
                            {lang === "ar" ? "⚠️ رصيد غير طبيعي" : "⚠️ Unusual balance"}
                          </span>
                        )}
                      </div>
                      <span className={`font-medium ${isNegative ? "text-amber-600" : "text-red-700"}`}>
                        {fmt(acc.balance)}
                      </span>
                    </div>
                  );
                })}
                <div className="flex justify-between items-center pt-2 font-bold text-red-800 border-t border-red-200">
                  <span>{lang === "ar" ? "إجمالي المصروفات" : "Total Expenses"}</span>
                  <span>{fmt(statement.totalExpenses)}</span>
                </div>
              </div>
            )}
          </div>

          <div className={`card ${statement.netProfit >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
            <div className="flex justify-between items-center">
              <div>
                <h2 className={`text-lg font-bold ${statement.netProfit >= 0 ? "text-green-800" : "text-red-800"}`}>
                  💰 {statement.netProfit >= 0
                    ? (lang === "ar" ? "صافي الربح" : "Net Profit")
                    : (lang === "ar" ? "صافي الخسارة" : "Net Loss")}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {new Date(statement.period.from).toLocaleDateString(locale)} —{" "}
                  {new Date(statement.period.to).toLocaleDateString(locale)}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {lang === "ar"
                    ? `إجمالي الإيرادات (${fmt(statement.totalRevenue)}) − إجمالي المصروفات (${fmt(statement.totalExpenses)})`
                    : `Total Revenue (${fmt(statement.totalRevenue)}) − Total Expenses (${fmt(statement.totalExpenses)})`}
                </p>
              </div>
              <span className={`text-2xl font-bold ${statement.netProfit >= 0 ? "text-green-700" : "text-red-700"}`}>
                {fmt(Math.abs(statement.netProfit))}
              </span>
            </div>
          </div>

          {statement.expenses.some((a) => a.balance < 0) && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
              <p className="font-semibold mb-1">
                ⚠️ {lang === "ar" ? "تنبيه: حسابات مصروفات بأرصدة غير طبيعية" : "Warning: Expense accounts with unusual balances"}
              </p>
              <p className="text-xs text-amber-700">
                {lang === "ar"
                  ? "بعض حسابات المصروفات لها رصيد دائن (سالب). هذا يعني أن هناك قيوداً مُرحَّلة في الجانب الدائن لحساب مصروف — تحقق من القيود وتأكد من استخدام الحساب الصحيح (مثل: حسابات الإيرادات 4xxx للمبيعات)."
                  : "Some expense accounts have a credit (negative) balance. This usually means a journal entry was posted to the wrong account. Check your journal entries and make sure sales are credited to Revenue accounts (4xxx), not Expense accounts (5xxx)."}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
