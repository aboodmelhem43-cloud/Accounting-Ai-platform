"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import type { IncomeStatement } from "@/types";

export default function IncomeStatementPage() {
  const { data: session } = useSession();
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
    `${n.toLocaleString("ar", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${statement?.currency ?? ""}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">قائمة الدخل</h1>
        <p className="text-gray-500 text-sm mt-1">محسوبة من القيود المرحّلة مباشرة</p>
      </div>

      {/* اختيار الفترة */}
      <div className="card">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="label">من تاريخ</label>
            <input type="date" className="input w-auto" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="label">إلى تاريخ</label>
            <input type="date" className="input w-auto" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          {/* اختصارات سريعة */}
          <div className="flex gap-2 flex-wrap">
            {[
              { label: "هذا الشهر", fn: () => {
                const d = new Date();
                setFrom(new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0]);
                setTo(new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split("T")[0]);
              }},
              { label: "الشهر الماضي", fn: () => {
                const d = new Date();
                setFrom(new Date(d.getFullYear(), d.getMonth() - 1, 1).toISOString().split("T")[0]);
                setTo(new Date(d.getFullYear(), d.getMonth(), 0).toISOString().split("T")[0]);
              }},
              { label: "هذا العام", fn: () => {
                const y = new Date().getFullYear();
                setFrom(`${y}-01-01`);
                setTo(`${y}-12-31`);
              }},
            ].map((s) => (
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
          <p>جاري الحساب...</p>
        </div>
      )}

      {statement && !loading && (
        <div className="space-y-4">
          {/* الإيرادات */}
          <div className="card">
            <h2 className="font-semibold text-green-700 mb-4 flex items-center gap-2">
              📈 الإيرادات
            </h2>
            {statement.revenue.length === 0 ? (
              <p className="text-gray-400 text-sm">لا توجد إيرادات في هذه الفترة</p>
            ) : (
              <div className="space-y-2">
                {statement.revenue.map((acc) => (
                  <div key={acc.accountId} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                    <div>
                      <span className="text-sm text-gray-800">{acc.accountNameAr ?? acc.accountName}</span>
                      <span className="text-xs text-gray-400 mr-2">{acc.accountCode}</span>
                    </div>
                    <span className="font-medium text-green-700">{fmt(acc.balance)}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2 font-bold text-green-800 border-t border-green-200">
                  <span>إجمالي الإيرادات</span>
                  <span>{fmt(statement.totalRevenue)}</span>
                </div>
              </div>
            )}
          </div>

          {/* المصروفات */}
          <div className="card">
            <h2 className="font-semibold text-red-700 mb-4 flex items-center gap-2">
              📉 المصروفات
            </h2>
            {statement.expenses.length === 0 ? (
              <p className="text-gray-400 text-sm">لا توجد مصروفات في هذه الفترة</p>
            ) : (
              <div className="space-y-2">
                {statement.expenses.map((acc) => (
                  <div key={acc.accountId} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                    <div>
                      <span className="text-sm text-gray-800">{acc.accountNameAr ?? acc.accountName}</span>
                      <span className="text-xs text-gray-400 mr-2">{acc.accountCode}</span>
                    </div>
                    <span className="font-medium text-red-700">{fmt(acc.balance)}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2 font-bold text-red-800 border-t border-red-200">
                  <span>إجمالي المصروفات</span>
                  <span>{fmt(statement.totalExpenses)}</span>
                </div>
              </div>
            )}
          </div>

          {/* صافي الربح */}
          <div className={`card ${statement.netProfit >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
            <div className="flex justify-between items-center">
              <div>
                <h2 className={`text-lg font-bold ${statement.netProfit >= 0 ? "text-green-800" : "text-red-800"}`}>
                  💰 صافي {statement.netProfit >= 0 ? "الربح" : "الخسارة"}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {new Date(statement.period.from).toLocaleDateString("ar")} —{" "}
                  {new Date(statement.period.to).toLocaleDateString("ar")}
                </p>
              </div>
              <span className={`text-2xl font-bold ${statement.netProfit >= 0 ? "text-green-700" : "text-red-700"}`}>
                {fmt(Math.abs(statement.netProfit))}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
