"use client";
import { useState, useEffect, useCallback } from "react";
import { useLang } from "@/components/LanguageProvider";
import * as XLSX from "xlsx";

interface Account {
  id: string;
  code: string;
  name: string;
  nameAr: string | null;
  type: string;
}

interface LedgerLine {
  id: string;
  debit: number;
  credit: number;
  description: string | null;
  journalEntry: {
    id: string;
    date: string;
    description: string;
    sourceType: string;
  };
}

interface LedgerData {
  account: Account;
  lines: LedgerLine[];
  from: string;
  to: string;
}

export default function LedgerPage() {
  const { lang } = useLang();
  const isAr = lang === "ar";

  const now = new Date();
  const defaultFrom = `${now.getFullYear()}-01-01`;
  const defaultTo = now.toISOString().split("T")[0];

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [data, setData] = useState<LedgerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/accounts")
      .then((r) => r.json())
      .then((d: Account[]) => {
        setAccounts(Array.isArray(d) ? d : []);
        if (d.length > 0) setSelectedAccountId(d[0].id);
      })
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    if (!selectedAccountId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/reports/ledger?accountId=${selectedAccountId}&from=${from}&to=${to}`);
      if (!res.ok) throw new Error("Failed");
      setData(await res.json());
    } catch {
      setError(isAr ? "خطأ في تحميل الدفتر" : "Failed to load ledger");
    } finally {
      setLoading(false);
    }
  }, [selectedAccountId, from, to, isAr]);

  function exportCSV() {
    if (!data) return;
    let balance = 0;
    const headers = isAr
      ? ["التاريخ", "البيان", "مدين", "دائن", "الرصيد"]
      : ["Date", "Description", "Debit", "Credit", "Balance"];

    const rows = data.lines.map((l) => {
      const debit = Number(l.debit);
      const credit = Number(l.credit);
      balance += debit - credit;
      return [
        new Date(l.journalEntry.date).toLocaleDateString("en"),
        l.journalEntry.description.replace(/,/g, " "),
        debit.toFixed(2),
        credit.toFixed(2),
        balance.toFixed(2),
      ];
    });

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ledger-${data.account.code}-${from}-${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportExcel() {
    if (!data) return;
    let balance = 0;
    const headers: (string | number)[] = isAr
      ? ["التاريخ", "البيان", "مدين", "دائن", "الرصيد"]
      : ["Date", "Description", "Debit", "Credit", "Balance"];
    const rows: (string | number)[][] = [headers];
    for (const l of data.lines) {
      const debit = Number(l.debit);
      const credit = Number(l.credit);
      balance += debit - credit;
      rows.push([
        new Date(l.journalEntry.date).toLocaleDateString("en"),
        l.journalEntry.description,
        debit || "",
        credit || "",
        balance,
      ]);
    }
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [{ wch: 14 }, { wch: 40 }, { wch: 14 }, { wch: 14 }, { wch: 14 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, isAr ? "دفتر الأستاذ" : "Ledger");
    XLSX.writeFile(wb, `ledger-${data.account.code}-${from}-${to}.xlsx`);
  }

  const fmt = (n: number) =>
    n.toLocaleString(isAr ? "ar" : "en", { minimumFractionDigits: 2 });

  // حساب الرصيد التراكمي
  let runningBalance = 0;

  const groupedAccounts = accounts.reduce<Record<string, Account[]>>((acc, a) => {
    if (!acc[a.type]) acc[a.type] = [];
    acc[a.type].push(a);
    return acc;
  }, {});

  const typeLabel: Record<string, string> = {
    ASSET: isAr ? "أصول" : "Assets",
    LIABILITY: isAr ? "خصوم" : "Liabilities",
    EQUITY: isAr ? "حقوق الملكية" : "Equity",
    REVENUE: isAr ? "إيرادات" : "Revenue",
    EXPENSE: isAr ? "مصروفات" : "Expenses",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isAr ? "دفتر الأستاذ العام" : "General Ledger"}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {isAr ? "تفاصيل حركات الحسابات مع الرصيد التراكمي" : "Account movements with running balance"}
        </p>
      </div>

      {/* أدوات */}
      <div className="card flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-48">
          <label className="label">{isAr ? "الحساب" : "Account"}</label>
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="input"
          >
            {Object.entries(groupedAccounts).map(([type, accts]) => (
              <optgroup key={type} label={typeLabel[type] ?? type}>
                {accts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.code} — {isAr ? (a.nameAr ?? a.name) : a.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div>
          <label className="label">{isAr ? "من" : "From"}</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input" />
        </div>
        <div>
          <label className="label">{isAr ? "إلى" : "To"}</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input" />
        </div>
        <button onClick={load} disabled={loading || !selectedAccountId} className="btn-primary">
          {loading ? "..." : (isAr ? "عرض" : "Show")}
        </button>
        {data && data.lines.length > 0 && (
          <button onClick={exportCSV} className="btn-secondary">
            ⬇ {isAr ? "تصدير CSV" : "Export CSV"}
          </button>
        )}
        {data && data.lines.length > 0 && (
          <button onClick={exportExcel} className="btn-secondary">
            ⬇ {isAr ? "تصدير Excel" : "Export Excel"}
          </button>
        )}
      </div>

      {loading && (
        <div className="text-center py-12 text-gray-400">
          <div className="animate-spin text-2xl mb-2">⚙️</div>
          <p>{isAr ? "جاري التحميل..." : "Loading..."}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">{error}</div>
      )}

      {!loading && data && (
        <div className="card p-0 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">
              {data.account.code} — {isAr ? (data.account.nameAr ?? data.account.name) : data.account.name}
            </h2>
            <span className="text-xs text-gray-400">
              {new Date(data.from).toLocaleDateString(isAr ? "ar" : "en")} →{" "}
              {new Date(data.to).toLocaleDateString(isAr ? "ar" : "en")}
            </span>
          </div>

          {data.lines.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p>{isAr ? "لا توجد حركات في هذه الفترة" : "No movements in this period"}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                  <tr>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">{isAr ? "التاريخ" : "Date"}</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">{isAr ? "البيان" : "Description"}</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">{isAr ? "مدين" : "Debit"}</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">{isAr ? "دائن" : "Credit"}</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">{isAr ? "الرصيد" : "Balance"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.lines.map((line) => {
                    const debit = Number(line.debit);
                    const credit = Number(line.credit);
                    runningBalance += debit - credit;
                    return (
                      <tr key={line.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-600 whitespace-nowrap">
                          {new Date(line.journalEntry.date).toLocaleDateString(isAr ? "ar" : "en")}
                        </td>
                        <td className="px-4 py-2 text-gray-800 max-w-xs">
                          <div>{line.journalEntry.description}</div>
                          {line.description && (
                            <div className="text-xs text-gray-400">{line.description}</div>
                          )}
                        </td>
                        <td className="px-4 py-2 text-right font-mono text-gray-700">
                          {debit > 0 ? fmt(debit) : ""}
                        </td>
                        <td className="px-4 py-2 text-right font-mono text-gray-700">
                          {credit > 0 ? fmt(credit) : ""}
                        </td>
                        <td className={`px-4 py-2 text-right font-mono font-semibold ${runningBalance >= 0 ? "text-gray-800" : "text-red-600"}`}>
                          {fmt(runningBalance)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
