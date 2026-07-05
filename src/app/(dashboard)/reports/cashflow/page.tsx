"use client";
import { useState, useEffect, useCallback } from "react";
import { useLang } from "@/components/LanguageProvider";
import * as XLSX from "xlsx";
import type { CashFlowStatement } from "@/types";

export default function CashFlowPage() {
  const { lang } = useLang();
  const isAr = lang === "ar";

  const now = new Date();
  const defaultFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const defaultTo = now.toISOString().split("T")[0];

  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [data, setData] = useState<CashFlowStatement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/reports/cashflow?from=${from}&to=${to}`);
      if (!res.ok) throw new Error("Failed");
      setData(await res.json());
    } catch {
      setError(isAr ? "خطأ في تحميل التدفقات النقدية" : "Failed to load cash flow");
    } finally {
      setLoading(false);
    }
  }, [from, to, isAr]);

  useEffect(() => { load(); }, [load]);

  const fmt = (n: number) => {
    const abs = Math.abs(n).toLocaleString(isAr ? "ar" : "en", { minimumFractionDigits: 2 });
    return n < 0 ? `(${abs})` : abs;
  };

  function exportExcel() {
    if (!data) return;
    const rows: (string | number)[][] = [];
    rows.push([isAr ? "أنشطة التشغيل" : "Operating Activities"]);
    rows.push([isAr ? "البيان" : "Description", isAr ? "المبلغ" : "Amount"]);
    for (const a of data.operatingActivities) {
      rows.push([a.description, a.amount]);
    }
    rows.push([isAr ? "الصافي" : "Net", data.netOperating]);
    rows.push([]);
    rows.push([isAr ? "أنشطة الاستثمار" : "Investing Activities"]);
    rows.push([isAr ? "البيان" : "Description", isAr ? "المبلغ" : "Amount"]);
    for (const a of data.investingActivities) {
      rows.push([a.description, a.amount]);
    }
    rows.push([isAr ? "الصافي" : "Net", data.netInvesting]);
    rows.push([]);
    rows.push([isAr ? "أنشطة التمويل" : "Financing Activities"]);
    rows.push([isAr ? "البيان" : "Description", isAr ? "المبلغ" : "Amount"]);
    for (const a of data.financingActivities) {
      rows.push([a.description, a.amount]);
    }
    rows.push([isAr ? "الصافي" : "Net", data.netFinancing]);
    rows.push([]);
    rows.push([isAr ? "صافي التغير في النقدية" : "Net Change in Cash", data.netChange]);
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [{ wch: 50 }, { wch: 18 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, isAr ? "التدفقات النقدية" : "Cash Flow");
    XLSX.writeFile(wb, `cashflow-${from.substring(0, 7)}.xlsx`);
  }

  function Section({
    title,
    activities,
    net,
    color,
  }: {
    title: string;
    activities: { description: string; amount: number }[];
    net: number;
    color: string;
  }) {
    return (
      <div className="card">
        <h3 className={`font-bold text-lg mb-3 ${color}`}>{title}</h3>
        {activities.length === 0 ? (
          <p className="text-gray-400 text-sm">{isAr ? "لا توجد حركات" : "No activities"}</p>
        ) : (
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-100">
              {activities.map((a, i) => (
                <tr key={i}>
                  <td className="py-1.5 text-gray-600 truncate max-w-xs">{a.description}</td>
                  <td className={`py-1.5 text-right font-mono ${a.amount >= 0 ? "text-green-600" : "text-red-500"}`}>
                    {fmt(a.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="border-t-2 border-gray-800 pt-3 mt-3 flex justify-between font-bold">
          <span className="text-gray-700">{isAr ? "الصافي" : "Net"}</span>
          <span className={`font-mono ${net >= 0 ? "text-green-700" : "text-red-600"}`}>{fmt(net)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isAr ? "قائمة التدفقات النقدية" : "Cash Flow Statement"}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {isAr ? "الطريقة المباشرة المبسطة" : "Simplified direct method"}
        </p>
      </div>

      {/* أدوات */}
      <div className="card flex items-end gap-4 flex-wrap">
        <div>
          <label className="label">{isAr ? "من" : "From"}</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input" />
        </div>
        <div>
          <label className="label">{isAr ? "إلى" : "To"}</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input" />
        </div>
        <button onClick={load} disabled={loading} className="btn-primary">
          {loading ? "..." : (isAr ? "تحديث" : "Update")}
        </button>
        {data && (
          <button onClick={exportExcel} className="btn-secondary">
            ⬇ {isAr ? "تصدير Excel" : "Export Excel"}
          </button>
        )}
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
        <div className="space-y-4">
          <Section
            title={isAr ? "أنشطة التشغيل" : "Operating Activities"}
            activities={data.operatingActivities}
            net={data.netOperating}
            color="text-blue-700"
          />
          <Section
            title={isAr ? "أنشطة الاستثمار" : "Investing Activities"}
            activities={data.investingActivities}
            net={data.netInvesting}
            color="text-green-700"
          />
          <Section
            title={isAr ? "أنشطة التمويل" : "Financing Activities"}
            activities={data.financingActivities}
            net={data.netFinancing}
            color="text-purple-700"
          />

          {/* الصافي الإجمالي */}
          <div className={`card border-2 ${data.netChange >= 0 ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"}`}>
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-800 text-lg">
                {isAr ? "صافي التغير في النقدية" : "Net Change in Cash"}
              </span>
              <span className={`font-mono font-bold text-xl ${data.netChange >= 0 ? "text-green-700" : "text-red-600"}`}>
                {fmt(data.netChange)} {data.currency}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
