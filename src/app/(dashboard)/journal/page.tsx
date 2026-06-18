"use client";
import { useEffect, useState } from "react";

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
        <h1 className="text-2xl font-bold text-gray-900">دفتر اليومية</h1>
        <p className="text-gray-500 text-sm mt-1">{total} قيد محاسبي</p>
      </div>

      {loading && (
        <div className="text-center py-8 text-gray-500">
          <div className="animate-spin text-2xl mb-2">⚙️</div>
          <p>جاري التحميل...</p>
        </div>
      )}

      {!loading && entries.length === 0 && (
        <div className="card text-center py-12">
          <div className="text-5xl mb-4">📒</div>
          <p className="text-gray-500">لا توجد قيود بعد.</p>
          <p className="text-gray-400 text-sm mt-1">سيظهر هنا القيود المُرحَّلة من الفواتير أو المدخلة يدويًا.</p>
        </div>
      )}

      {!loading && entries.map((entry) => (
        <div key={entry.id} className="card">
          {/* رأس القيد */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="font-semibold text-gray-800">{entry.description}</p>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                <span>📅 {new Date(entry.date).toLocaleDateString("ar")}</span>
                <span>
                  {entry.sourceType === "AI_INVOICE" ? "🤖 فاتورة ذكاء اصطناعي" : "✏️ يدوي"}
                </span>
                <span>بواسطة: {entry.creator.name ?? entry.creator.email}</span>
              </div>
            </div>
          </div>

          {/* سطور القيد */}
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-right pb-2 font-medium text-gray-500 text-xs">الحساب</th>
                <th className="text-left pb-2 font-medium text-gray-500 text-xs">مدين</th>
                <th className="text-left pb-2 font-medium text-gray-500 text-xs">دائن</th>
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
                    {Number(line.debit) > 0 ? Number(line.debit).toLocaleString("ar") : ""}
                  </td>
                  <td className="py-1.5 text-left font-mono text-xs">
                    {Number(line.credit) > 0 ? Number(line.credit).toLocaleString("ar") : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {/* pagination */}
      {total > 20 && (
        <div className="flex justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-secondary"
          >
            ← السابق
          </button>
          <span className="py-2 text-sm text-gray-500">صفحة {page}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={entries.length < 20}
            className="btn-secondary"
          >
            التالي →
          </button>
        </div>
      )}
    </div>
  );
}
