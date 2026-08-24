"use client";
import { useState, useEffect, useRef } from "react";
import { useLang } from "@/components/LanguageProvider";

interface MonthData {
  month: string;
  monthEn: string;
  revenue: number;
  expenses: number;
  net: number;
}

interface ExpenseItem {
  name: string;
  value: number;
}

const PALETTE = [
  "#3b82f6", "#ef4444", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899", "#6b7280",
];

function ExpenseBreakdown() {
  const { lang } = useLang();
  const [data, setData] = useState<ExpenseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/reports/expense-breakdown")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="card animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
      <div className="h-40 bg-gray-100 rounded" />
    </div>
  );
  if (!data.length) return null;

  const total = data.reduce((s, d) => s + d.value, 0);
  const fmt = (n: number) => n.toLocaleString(lang === "ar" ? "ar" : "en", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  // Build SVG donut
  const R = 60; const r = 38; const cx = 80; const cy = 80;
  let angle = -Math.PI / 2;
  const slices = data.map((d, i) => {
    const sweep = (d.value / total) * 2 * Math.PI;
    const x1 = cx + R * Math.cos(angle); const y1 = cy + R * Math.sin(angle);
    angle += sweep;
    const x2 = cx + R * Math.cos(angle); const y2 = cy + R * Math.sin(angle);
    const xi1 = cx + r * Math.cos(angle - sweep); const yi1 = cy + r * Math.sin(angle - sweep);
    const xi2 = cx + r * Math.cos(angle); const yi2 = cy + r * Math.sin(angle);
    const large = sweep > Math.PI ? 1 : 0;
    const path = `M${x1},${y1} A${R},${R},0,${large},1,${x2},${y2} L${xi2},${yi2} A${r},${r},0,${large},0,${xi1},${yi1} Z`;
    return { path, color: PALETTE[i % PALETTE.length], name: d.name, value: d.value, pct: (d.value / total * 100).toFixed(1) };
  });

  return (
    <div className="card">
      <h2 className="font-semibold text-gray-800 mb-4">
        {lang === "ar" ? "توزيع المصروفات — آخر 6 أشهر" : "Expense Breakdown — Last 6 Months"}
      </h2>
      <div className="flex flex-col sm:flex-row gap-6 items-center">
        <svg width="160" height="160" viewBox="0 0 160 160" className="flex-shrink-0">
          {slices.map((s, i) => (
            <path
              key={i} d={s.path} fill={s.color}
              opacity={hovered === null || hovered === i ? 1 : 0.4}
              className="cursor-pointer transition-opacity"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
          <text x={cx} y={cy - 6} textAnchor="middle" fontSize="11" fill="#6b7280">
            {lang === "ar" ? "الإجمالي" : "Total"}
          </text>
          <text x={cx} y={cy + 10} textAnchor="middle" fontSize="13" fontWeight="bold" fill="#111827">
            {fmt(total)}
          </text>
        </svg>
        <div className="flex-1 space-y-2 w-full">
          {slices.map((s, i) => (
            <div
              key={i}
              className="flex items-center gap-2 cursor-pointer"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: s.color, opacity: hovered === null || hovered === i ? 1 : 0.4 }} />
              <span className="text-xs text-gray-600 truncate flex-1">{s.name}</span>
              <span className="text-xs font-medium text-gray-800 flex-shrink-0">{s.pct}%</span>
              <span className="text-xs text-gray-400 flex-shrink-0">{fmt(s.value)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export { ExpenseBreakdown };

export default function DashboardCharts() {
  const { lang } = useLang();
  const [data, setData] = useState<MonthData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/reports/monthly");
        if (!res.ok) throw new Error("فشل تحميل البيانات");
        const json = await res.json();
        setData(json as MonthData[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "حدث خطأ");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">
          {lang === "ar" ? "الأداء المالي — آخر 6 أشهر" : "Financial Performance — Last 6 Months"}
        </h2>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="flex items-end gap-2 h-40">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex-1 flex gap-1 items-end h-full">
                <div className="flex-1 bg-gray-200 rounded" style={{ height: `${30 + Math.random() * 60}%` }} />
                <div className="flex-1 bg-gray-200 rounded" style={{ height: `${20 + Math.random() * 50}%` }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  if (!data.length) return null;

  // حساب القيمة القصوى لتحديد نسبة الأعمدة
  const maxValue = Math.max(...data.flatMap((d) => [d.revenue, d.expenses]), 1);

  const fmt = (n: number) =>
    n.toLocaleString(lang === "ar" ? "ar" : "en", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-800">
          {lang === "ar" ? "الأداء المالي — آخر 6 أشهر" : "Financial Performance — Last 6 Months"}
        </h2>
        {/* مفتاح الأسطورة */}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm bg-green-500" />
            {lang === "ar" ? "إيرادات" : "Revenue"}
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm bg-red-400" />
            {lang === "ar" ? "مصروفات" : "Expenses"}
          </span>
        </div>
      </div>

      {/* الرسم البياني — دائمًا من اليسار إلى اليمين */}
      <div dir="ltr" className="overflow-x-auto">
        <div className="min-w-[400px]">
          {/* أعمدة الرسم */}
          <div className="flex items-end gap-3 h-48 px-2">
            {data.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                {/* الأعمدة */}
                <div className="w-full flex items-end gap-1" style={{ height: "160px" }}>
                  {/* عمود الإيرادات */}
                  <div className="flex-1 flex flex-col justify-end group relative">
                    <div
                      className="w-full bg-green-500 rounded-t transition-all duration-300 hover:bg-green-600 cursor-default"
                      style={{ height: `${(d.revenue / maxValue) * 100}%`, minHeight: d.revenue > 0 ? "4px" : "0" }}
                    >
                      {/* tooltip */}
                      <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                        {fmt(d.revenue)}
                      </div>
                    </div>
                  </div>
                  {/* عمود المصروفات */}
                  <div className="flex-1 flex flex-col justify-end group relative">
                    <div
                      className="w-full bg-red-400 rounded-t transition-all duration-300 hover:bg-red-500 cursor-default"
                      style={{ height: `${(d.expenses / maxValue) * 100}%`, minHeight: d.expenses > 0 ? "4px" : "0" }}
                    >
                      {/* tooltip */}
                      <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                        {fmt(d.expenses)}
                      </div>
                    </div>
                  </div>
                </div>
                {/* اسم الشهر */}
                <span className="text-xs text-gray-500 mt-1 select-none">
                  {lang === "ar" ? d.month : d.monthEn}
                </span>
              </div>
            ))}
          </div>

          {/* صافي الدخل لكل شهر */}
          <div className="flex gap-3 mt-3 px-2 border-t border-gray-100 pt-3">
            {data.map((d, i) => (
              <div key={i} className="flex-1 text-center">
                <span
                  className={`text-xs font-medium ${d.net >= 0 ? "text-green-600" : "text-red-500"}`}
                >
                  {d.net >= 0 ? "+" : ""}{fmt(d.net)}
                </span>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-400 mt-1">
            {lang === "ar" ? "صافي الدخل" : "Net Income"}
          </p>
        </div>
      </div>
    </div>
  );
}
