"use client";
import { useState } from "react";
import { useLang } from "@/components/LanguageProvider";

interface VatLine {
  date: string;
  description: string;
  sourceType: string;
  journalEntryId: string;
  outputVat: number;
  inputVat: number;
}

interface VatData {
  from: string;
  to: string;
  outputVat: number;
  inputVat: number;
  netVat: number;
  lines: VatLine[];
  vatAccountCode?: string;
  warning?: string;
}

export default function VatReturnPage() {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const locale = isAr ? "ar" : "en";

  const now = new Date();
  const qStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  const qEnd = new Date(qStart.getFullYear(), qStart.getMonth() + 3, 0);

  const [from, setFrom] = useState(qStart.toISOString().split("T")[0]);
  const [to, setTo] = useState(qEnd.toISOString().split("T")[0]);
  const [data, setData] = useState<VatData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fmt = (n: number) => n.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  async function fetchVat() {
    if (!from || !to) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/vat-return?from=${from}&to=${to}`);
      const d = await res.json();
      if (!res.ok) { setError(d.error ?? "خطأ"); return; }
      setData(d);
    } catch {
      setError(isAr ? "خطأ في الاتصال" : "Connection error");
    } finally {
      setLoading(false);
    }
  }

  const presets = [
    { label: isAr ? "الربع الحالي" : "Current Quarter", from: qStart.toISOString().split("T")[0], to: qEnd.toISOString().split("T")[0] },
    {
      label: isAr ? "الشهر الحالي" : "This Month",
      from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0],
      to: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0],
    },
    {
      label: isAr ? "السنة الحالية" : "This Year",
      from: `${now.getFullYear()}-01-01`,
      to: `${now.getFullYear()}-12-31`,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{isAr ? "إقرار ضريبة القيمة المضافة" : "VAT Return"}</h1>
        <p className="text-gray-500 text-sm mt-1">
          {isAr ? "احسب ضريبة المخرجات والمدخلات وصافي الضريبة المستحقة" : "Compute output VAT, input VAT, and net amount payable"}
        </p>
      </div>

      <div className="card p-4 space-y-4">
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <button
              key={p.label}
              onClick={() => { setFrom(p.from); setTo(p.to); }}
              className="btn-secondary text-xs py-1.5 px-3"
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{isAr ? "من" : "From"}</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{isAr ? "إلى" : "To"}</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input text-sm" />
          </div>
          <button onClick={fetchVat} disabled={loading} className="btn-primary text-sm">
            {loading ? "..." : (isAr ? "احسب" : "Compute")}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>
      )}

      {data && (
        <>
          {data.warning && (
            <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-lg p-3 text-sm">
              ⚠️ {data.warning}
            </div>
          )}

          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-4 border-blue-200 bg-blue-50">
              <p className="text-xs font-semibold text-blue-500 uppercase mb-1">
                {isAr ? "ضريبة المخرجات (مبيعات)" : "Output VAT (Sales)"}
              </p>
              <p className="text-2xl font-bold text-blue-700">{fmt(data.outputVat)}</p>
              <p className="text-xs text-blue-400 mt-1">{isAr ? "مستحقة للجهة الضريبية" : "Owed to tax authority"}</p>
            </div>
            <div className="card p-4 border-green-200 bg-green-50">
              <p className="text-xs font-semibold text-green-500 uppercase mb-1">
                {isAr ? "ضريبة المدخلات (مشتريات)" : "Input VAT (Purchases)"}
              </p>
              <p className="text-2xl font-bold text-green-700">{fmt(data.inputVat)}</p>
              <p className="text-xs text-green-400 mt-1">{isAr ? "قابلة للاسترداد" : "Reclaimable"}</p>
            </div>
            <div className={`card p-4 ${data.netVat >= 0 ? "border-red-200 bg-red-50" : "border-teal-200 bg-teal-50"}`}>
              <p className={`text-xs font-semibold uppercase mb-1 ${data.netVat >= 0 ? "text-red-500" : "text-teal-500"}`}>
                {isAr ? "صافي الضريبة" : "Net VAT"}
              </p>
              <p className={`text-2xl font-bold ${data.netVat >= 0 ? "text-red-700" : "text-teal-700"}`}>
                {fmt(Math.abs(data.netVat))}
              </p>
              <p className={`text-xs mt-1 ${data.netVat >= 0 ? "text-red-400" : "text-teal-400"}`}>
                {data.netVat >= 0
                  ? (isAr ? "مستحق الدفع" : "Payable")
                  : (isAr ? "مستحق الاسترداد" : "Refundable")}
              </p>
            </div>
          </div>

          {/* Detail table */}
          {data.lines.length > 0 && (
            <div className="card overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-700 text-sm">
                  {isAr ? "تفاصيل الحركات الضريبية" : "VAT Transaction Detail"}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-right py-2 px-4 font-medium text-gray-500 text-xs">{isAr ? "التاريخ" : "Date"}</th>
                      <th className="text-right py-2 px-4 font-medium text-gray-500 text-xs">{isAr ? "البيان" : "Description"}</th>
                      <th className="text-right py-2 px-4 font-medium text-gray-500 text-xs">{isAr ? "ضريبة المخرجات" : "Output VAT"}</th>
                      <th className="text-right py-2 px-4 font-medium text-gray-500 text-xs">{isAr ? "ضريبة المدخلات" : "Input VAT"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.lines.map((line, i) => (
                      <tr key={i} className="border-t border-gray-50 hover:bg-gray-50">
                        <td className="py-2 px-4 text-gray-500 text-xs whitespace-nowrap">
                          {new Date(line.date).toLocaleDateString(locale)}
                        </td>
                        <td className="py-2 px-4 text-gray-700">
                          <div>{line.description}</div>
                          <div className="text-xs text-gray-400">
                            {line.sourceType === "AI_INVOICE"
                              ? (isAr ? "🤖 فاتورة ذكاء اصطناعي" : "🤖 AI Invoice")
                              : (isAr ? "✏️ يدوي" : "✏️ Manual")}
                          </div>
                        </td>
                        <td className="py-2 px-4 text-right font-mono text-xs text-blue-700">
                          {line.outputVat > 0 ? fmt(line.outputVat) : "—"}
                        </td>
                        <td className="py-2 px-4 text-right font-mono text-xs text-green-700">
                          {line.inputVat > 0 ? fmt(line.inputVat) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 font-semibold border-t-2 border-gray-200">
                    <tr>
                      <td colSpan={2} className="py-2 px-4 text-right text-xs text-gray-600">
                        {isAr ? "الإجمالي" : "Total"}
                      </td>
                      <td className="py-2 px-4 text-right font-mono text-xs text-blue-700">{fmt(data.outputVat)}</td>
                      <td className="py-2 px-4 text-right font-mono text-xs text-green-700">{fmt(data.inputVat)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {data.lines.length === 0 && !data.warning && (
            <div className="card text-center py-10 text-gray-400">
              <div className="text-4xl mb-2">📑</div>
              <p>{isAr ? "لا توجد حركات ضريبية في هذه الفترة" : "No VAT transactions in this period"}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
