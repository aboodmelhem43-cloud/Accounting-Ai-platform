"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useLang } from "@/components/LanguageProvider";

const COMMON_CURRENCIES = ["USD", "EUR", "GBP", "SAR", "AED", "KWD", "EGP", "JOD", "QAR", "BHD", "OMR", "LBP", "TRY", "CNY", "JPY", "CAD", "AUD"];

export default function CurrencyPage() {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const { data: session } = useSession();

  const baseCurrency = (session?.user as { baseCurrency?: string })?.baseCurrency ?? "USD";

  const [fromCurrency, setFromCurrency] = useState(baseCurrency);
  const [amount, setAmount] = useState("1000");
  const [rates, setRates] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchRates = useCallback(async (base: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/currency?base=${base}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json() as { rates: Record<string, number> };
      setRates(data.rates ?? {});
      setLastUpdated(new Date());
    } catch {
      setError(isAr ? "فشل تحميل أسعار الصرف" : "Failed to load exchange rates");
    } finally {
      setLoading(false);
    }
  }, [isAr]);

  useEffect(() => {
    fetchRates(fromCurrency);
  }, [fromCurrency, fetchRates]);

  const parsedAmount = parseFloat(amount) || 0;

  function convert(to: string): string {
    if (!rates[to]) return "—";
    return (parsedAmount * rates[to]).toLocaleString(isAr ? "ar" : "en", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });
  }

  const quickTargets = ["USD", "EUR", "KWD", "SAR", "GBP"].filter((c) => c !== fromCurrency);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isAr ? "محوّل العملات" : "Currency Converter"}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {isAr ? "أسعار الصرف الحية" : "Live exchange rates"}
          {lastUpdated && (
            <span className="ms-2 text-xs text-gray-400">
              ({isAr ? "آخر تحديث:" : "Updated:"} {lastUpdated.toLocaleTimeString(isAr ? "ar" : "en")})
            </span>
          )}
        </p>
      </div>

      {/* المحوّل */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">{isAr ? "التحويل السريع" : "Quick Convert"}</h2>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-36">
            <label className="label">{isAr ? "المبلغ" : "Amount"}</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input text-lg font-semibold"
              placeholder="0.00"
            />
          </div>
          <div className="min-w-36">
            <label className="label">{isAr ? "من" : "From"}</label>
            <select
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
              className="input"
            >
              {COMMON_CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* نتائج سريعة */}
        {!loading && Object.keys(rates).length > 0 && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {quickTargets.map((to) => (
              <div key={to} className="bg-blue-50 rounded-xl p-3 text-center">
                <div className="text-xs text-gray-500 mb-1">{to}</div>
                <div className="font-bold text-blue-700 text-sm">{convert(to)}</div>
              </div>
            ))}
          </div>
        )}

        {loading && (
          <div className="mt-4 text-center text-gray-400 text-sm">
            <span className="animate-spin inline-block">⚙️</span>{" "}
            {isAr ? "جاري التحميل..." : "Loading..."}
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
            {error}
            <button onClick={() => fetchRates(fromCurrency)} className="ms-2 underline">
              {isAr ? "إعادة المحاولة" : "Retry"}
            </button>
          </div>
        )}
      </div>

      {/* جدول الأسعار */}
      {!loading && Object.keys(rates).length > 0 && (
        <div className="card p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">
              {isAr ? `أسعار الصرف (1 ${fromCurrency})` : `Exchange Rates (1 ${fromCurrency})`}
            </h2>
            <button
              onClick={() => fetchRates(fromCurrency)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              {isAr ? "تحديث" : "Refresh"}
            </button>
          </div>
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                <tr>
                  <th className="text-right px-4 py-2 font-medium text-gray-600">{isAr ? "العملة" : "Currency"}</th>
                  <th className="text-right px-4 py-2 font-medium text-gray-600">{isAr ? "السعر" : "Rate"}</th>
                  <th className="text-right px-4 py-2 font-medium text-gray-600">
                    {isAr ? `${parsedAmount} ${fromCurrency} =` : `${parsedAmount} ${fromCurrency} =`}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {COMMON_CURRENCIES.filter((c) => c !== fromCurrency && rates[c]).map((currency) => (
                  <tr key={currency} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-800">{currency}</td>
                    <td className="px-4 py-2 font-mono text-gray-600">
                      {(rates[currency] ?? 0).toLocaleString(isAr ? "ar" : "en", {
                        minimumFractionDigits: 4,
                        maximumFractionDigits: 6,
                      })}
                    </td>
                    <td className="px-4 py-2 font-mono font-semibold text-blue-700">
                      {convert(currency)} {currency}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
