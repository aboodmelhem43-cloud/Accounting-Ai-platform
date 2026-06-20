"use client";
import { useEffect, useState } from "react";
import { useLang } from "@/components/LanguageProvider";

interface JournalLine {
  id: string;
  account: { code: string; nameAr: string | null; name: string };
  debit: number;
  credit: number;
  description: string | null;
}

interface JournalEntry {
  id: string;
  date: string;
  description: string;
  sourceType: string;
  lines: JournalLine[];
  creator: { name: string | null; email: string };
}

export default function JournalPage() {
  const { t, lang } = useLang();
  const locale = lang === "ar" ? "ar" : "en";
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetch(`/api/journal?page=${page}`);
      const data = await res.json();
      setEntries(data.entries ?? []);
      setTotal(data.total ?? 0);
      setLoading(false);
    }
    load();
  }, [page]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("journal.title")}</h1>
        <p className="text-gray-500 text-sm mt-1">
          {total} {lang === "ar" ? "قيد محاسبي" : "entries"}
        </p>
      </div>

      {loading && (
        <div className="text-center py-8 text-gray-500">
          <div className="animate-spin text-2xl mb-2">⚙️</div>
          <p>{t("common.loading")}</p>
        </div>
      )}

      {!loading && entries.length === 0 && (
        <div className="card text-center py-12">
          <div className="text-5xl mb-4">📒</div>
          <p className="text-gray-500">{t("journal.empty")}</p>
          <p className="text-gray-400 text-sm mt-1">
            {lang === "ar"
              ? "سيظهر هنا القيود المُرحَّلة من الفواتير أو المدخلة يدويًا."
              : "Entries from confirmed invoices or manual input will appear here."}
          </p>
        </div>
      )}

      {!loading && entries.map((entry) => (
        <div key={entry.id} className="card">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="font-semibold text-gray-800">{entry.description}</p>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                <span>📅 {new Date(entry.date).toLocaleDateString(locale)}</span>
                <span>
                  {entry.sourceType === "AI_INVOICE"
                    ? `🤖 ${t("journal.source.ai")}`
                    : `✏️ ${t("journal.source.manual")}`}
                </span>
                <span>
                  {lang === "ar" ? "بواسطة:" : "by:"} {entry.creator.name ?? entry.creator.email}
                </span>
              </div>
            </div>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-right pb-2 font-medium text-gray-500 text-xs">{t("journal.account")}</th>
                <th className="text-left pb-2 font-medium text-gray-500 text-xs">{t("journal.debit")}</th>
                <th className="text-left pb-2 font-medium text-gray-500 text-xs">{t("journal.credit")}</th>
              </tr>
            </thead>
            <tbody>
              {entry.lines.map((line) => (
                <tr key={line.id} className="border-b border-gray-50 last:border-0">
                  <td className="py-1.5">
                    <span className="text-gray-400 text-xs ml-1">{line.account.code}</span>
                    {line.account.nameAr ?? line.account.name}
                  </td>
                  <td className="py-1.5 text-left font-mono text-xs">
                    {Number(line.debit) > 0 ? Number(line.debit).toLocaleString(locale) : ""}
                  </td>
                  <td className="py-1.5 text-left font-mono text-xs">
                    {Number(line.credit) > 0 ? Number(line.credit).toLocaleString(locale) : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {total > 20 && (
        <div className="flex justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-secondary"
          >
            {lang === "ar" ? "← السابق" : "← Prev"}
          </button>
          <span className="py-2 text-sm text-gray-500">
            {lang === "ar" ? `صفحة ${page}` : `Page ${page}`}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={entries.length < 20}
            className="btn-secondary"
          >
            {lang === "ar" ? "التالي →" : "Next →"}
          </button>
        </div>
      )}
    </div>
  );
}
