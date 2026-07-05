"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useLang } from "@/components/LanguageProvider";

interface AgingRow {
  contactName: string;
  current: number;
  days30: number;
  days60: number;
  days90: number;
  total: number;
}

export default function AgingPage() {
  const { data: session } = useSession();
  const { t, lang } = useLang();
  const locale = lang === "ar" ? "ar" : "en";

  const [agingType, setAgingType] = useState<"AR" | "AP">("AR");
  const [rows, setRows] = useState<AgingRow[]>([]);
  const [loading, setLoading] = useState(false);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/aging?type=${agingType}`);
      const json = await res.json();
      setRows(json.rows ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [agingType]);

  const fmt = (n: number) =>
    n.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const fmtCell = (n: number) => (n === 0 ? "" : fmt(n));

  const totals = rows.reduce(
    (acc, r) => ({
      current: acc.current + r.current,
      days30: acc.days30 + r.days30,
      days60: acc.days60 + r.days60,
      days90: acc.days90 + r.days90,
      total: acc.total + r.total,
    }),
    { current: 0, days30: 0, days60: 0, days90: 0, total: 0 }
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("reports.aging.title")}</h1>
        <p className="text-gray-500 text-sm mt-1">
          {lang === "ar"
            ? "تصنيف الفواتير المستحقة حسب عمرها"
            : "Outstanding invoices grouped by age"}
        </p>
      </div>

      <div className="card">
        <div className="flex gap-2">
          <button
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              agingType === "AR"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            onClick={() => setAgingType("AR")}
          >
            {t("reports.aging.ar")}
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              agingType === "AP"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            onClick={() => setAgingType("AP")}
          >
            {t("reports.aging.ap")}
          </button>
        </div>
      </div>

      {loading && (
        <div className="text-center py-8 text-gray-500">
          <div className="animate-spin text-2xl mb-2">⚙️</div>
          <p>{t("reports.aging.loading")}</p>
        </div>
      )}

      {!loading && (
        <div className="card overflow-x-auto">
          {rows.length === 0 ? (
            <p className="text-center text-gray-400 py-8">{t("reports.aging.empty")}</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-600">
                  <th className="text-start py-2 px-3 font-semibold">
                    {t("reports.aging.contact")}
                  </th>
                  <th className="text-end py-2 px-3 font-semibold">
                    {t("reports.aging.current")}
                  </th>
                  <th className="text-end py-2 px-3 font-semibold">
                    {t("reports.aging.days_30")}
                  </th>
                  <th className="text-end py-2 px-3 font-semibold">
                    {t("reports.aging.days_60")}
                  </th>
                  <th className="text-end py-2 px-3 font-semibold">
                    {t("reports.aging.days_90")}
                  </th>
                  <th className="text-end py-2 px-3 font-semibold">
                    {t("reports.aging.total")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.contactName}
                    className="border-b border-gray-50 hover:bg-gray-50"
                  >
                    <td className="py-2 px-3 text-gray-800 font-medium">{row.contactName}</td>
                    <td className="py-2 px-3 text-end tabular-nums text-gray-700">
                      {fmtCell(row.current)}
                    </td>
                    <td className="py-2 px-3 text-end tabular-nums text-amber-600">
                      {fmtCell(row.days30)}
                    </td>
                    <td className="py-2 px-3 text-end tabular-nums text-orange-600">
                      {fmtCell(row.days60)}
                    </td>
                    <td className="py-2 px-3 text-end tabular-nums text-red-600">
                      {fmtCell(row.days90)}
                    </td>
                    <td className="py-2 px-3 text-end tabular-nums font-bold text-gray-900">
                      {fmt(row.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-300 font-bold text-gray-900 bg-gray-50">
                  <td className="py-2 px-3">{t("reports.aging.total")}</td>
                  <td className="py-2 px-3 text-end tabular-nums">{fmt(totals.current)}</td>
                  <td className="py-2 px-3 text-end tabular-nums">{fmt(totals.days30)}</td>
                  <td className="py-2 px-3 text-end tabular-nums">{fmt(totals.days60)}</td>
                  <td className="py-2 px-3 text-end tabular-nums">{fmt(totals.days90)}</td>
                  <td className="py-2 px-3 text-end tabular-nums">{fmt(totals.total)}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
