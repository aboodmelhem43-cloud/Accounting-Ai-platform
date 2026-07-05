"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useLang } from "@/components/LanguageProvider";
import type { AccountType } from "@/types";

interface TrialBalanceRow {
  accountCode: string;
  accountName: string;
  accountNameAr: string | null;
  accountType: AccountType;
  totalDebits: number;
  totalCredits: number;
  balance: number;
}

interface TrialBalanceData {
  asOf: string;
  rows: TrialBalanceRow[];
  totalDebits: number;
  totalCredits: number;
}

const TYPE_LABELS: Record<AccountType, { ar: string; en: string }> = {
  ASSET: { ar: "أصول", en: "Asset" },
  LIABILITY: { ar: "خصوم", en: "Liability" },
  EQUITY: { ar: "حقوق ملكية", en: "Equity" },
  REVENUE: { ar: "إيرادات", en: "Revenue" },
  EXPENSE: { ar: "مصروفات", en: "Expense" },
};

function getDebitCol(row: TrialBalanceRow): number {
  const isDebitNormal = row.accountType === "ASSET" || row.accountType === "EXPENSE";
  return isDebitNormal ? Math.max(row.balance, 0) : Math.max(-row.balance, 0);
}

function getCreditCol(row: TrialBalanceRow): number {
  const isDebitNormal = row.accountType === "ASSET" || row.accountType === "EXPENSE";
  return isDebitNormal ? Math.max(-row.balance, 0) : Math.max(row.balance, 0);
}

export default function TrialBalancePage() {
  const { data: session } = useSession();
  const { t, lang } = useLang();
  const locale = lang === "ar" ? "ar" : "en";

  const [asOf, setAsOf] = useState(new Date().toISOString().split("T")[0]);
  const [data, setData] = useState<TrialBalanceData | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/trial-balance?asOf=${asOf}`);
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [asOf]);

  const fmt = (n: number) =>
    n.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const fmtCell = (n: number) => (n === 0 ? "" : fmt(n));

  const isBalanced =
    data !== null && Math.abs(data.totalDebits - data.totalCredits) < 0.01;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("reports.trial_balance.title")}</h1>
        <p className="text-gray-500 text-sm mt-1">
          {lang === "ar"
            ? "أرصدة جميع الحسابات في تاريخ محدد"
            : "Balances of all accounts as of a specific date"}
        </p>
      </div>

      <div className="card">
        <div className="flex items-end gap-4">
          <div>
            <label className="label">{t("reports.trial_balance.as_of")}</label>
            <input
              type="date"
              className="input w-auto"
              value={asOf}
              onChange={(e) => setAsOf(e.target.value)}
            />
          </div>
        </div>
      </div>

      {loading && (
        <div className="text-center py-8 text-gray-500">
          <div className="animate-spin text-2xl mb-2">⚙️</div>
          <p>{t("reports.trial_balance.loading")}</p>
        </div>
      )}

      {data && !loading && (
        <div className="space-y-4">
          {data.rows.length === 0 ? (
            <div className="card text-center text-gray-400 py-8">
              {t("reports.trial_balance.empty")}
            </div>
          ) : (
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-600">
                    <th className="text-start py-2 px-3 font-semibold">
                      {t("reports.trial_balance.account_code")}
                    </th>
                    <th className="text-start py-2 px-3 font-semibold">
                      {t("reports.trial_balance.account_name")}
                    </th>
                    <th className="text-start py-2 px-3 font-semibold">
                      {t("reports.trial_balance.type")}
                    </th>
                    <th className="text-end py-2 px-3 font-semibold">
                      {t("reports.trial_balance.debit")}
                    </th>
                    <th className="text-end py-2 px-3 font-semibold">
                      {t("reports.trial_balance.credit")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row) => {
                    const debit = getDebitCol(row);
                    const credit = getCreditCol(row);
                    const typeLabel = TYPE_LABELS[row.accountType];
                    return (
                      <tr
                        key={row.accountCode}
                        className="border-b border-gray-50 hover:bg-gray-50"
                      >
                        <td className="py-2 px-3 font-mono text-gray-500">
                          {row.accountCode}
                        </td>
                        <td className="py-2 px-3 text-gray-800">
                          {lang === "ar"
                            ? (row.accountNameAr ?? row.accountName)
                            : row.accountName}
                        </td>
                        <td className="py-2 px-3">
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                            {lang === "ar" ? typeLabel.ar : typeLabel.en}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-end tabular-nums text-gray-800">
                          {fmtCell(debit)}
                        </td>
                        <td className="py-2 px-3 text-end tabular-nums text-gray-800">
                          {fmtCell(credit)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-300 font-bold text-gray-900 bg-gray-50">
                    <td className="py-2 px-3" colSpan={3}>
                      {t("reports.trial_balance.totals")}
                    </td>
                    <td className="py-2 px-3 text-end tabular-nums">{fmt(data.totalDebits)}</td>
                    <td className="py-2 px-3 text-end tabular-nums">{fmt(data.totalCredits)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          <div
            className={`rounded-xl p-4 text-sm font-medium flex items-center gap-2 ${
              isBalanced
                ? "bg-green-50 border border-green-200 text-green-700"
                : "bg-red-50 border border-red-200 text-red-700"
            }`}
          >
            <span>{isBalanced ? "✓" : "⚠️"}</span>
            <span>
              {isBalanced
                ? t("reports.trial_balance.balanced")
                : t("reports.trial_balance.imbalanced")}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
