"use client";
import { useState, useEffect } from "react";
import { useLang } from "@/components/LanguageProvider";

interface MonthData {
  month: string;
  monthEn: string;
  revenue: number;
  expenses: number;
  net: number;
}

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
