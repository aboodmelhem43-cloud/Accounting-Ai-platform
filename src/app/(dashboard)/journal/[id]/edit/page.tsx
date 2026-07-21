"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLang } from "@/components/LanguageProvider";

interface Account {
  id: string;
  code: string;
  name: string;
  nameAr: string | null;
  type: string;
}

interface LineForm {
  accountId: string;
  debit: string;
  credit: string;
  description: string;
}

const emptyLine = (): LineForm => ({ accountId: "", debit: "", credit: "", description: "" });

export default function EditJournalEntryPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { lang } = useLang();
  const { data: session } = useSession();
  const currency = session?.user?.currency ?? "";

  const [loadingEntry, setLoadingEntry] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [lines, setLines] = useState<LineForm[]>([emptyLine(), emptyLine()]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [accountsRes, entryRes] = await Promise.all([
        fetch("/api/accounts"),
        fetch(`/api/journal/${id}`),
      ]);

      if (entryRes.status === 404 || entryRes.status === 403) {
        setNotFound(true);
        setLoadingEntry(false);
        return;
      }

      type EntryResponse = {
        entry: {
          id: string;
          date: string;
          description: string;
          status: string;
          isLocked: boolean;
          lines: Array<{ accountId: string; debit: number; credit: number; description: string | null }>;
        };
      };

      const [accountsData, entryData] = await Promise.all([
        accountsRes.json() as Promise<Account[]>,
        entryRes.json() as Promise<EntryResponse>,
      ]);

      setAccounts(accountsData);

      const entry = entryData.entry;

      if (!["DRAFT", "REJECTED"].includes(entry.status) || entry.isLocked) {
        router.replace(`/journal/${id}`);
        return;
      }

      setDate(new Date(entry.date).toISOString().split("T")[0]);
      setDescription(entry.description);
      setLines(
        entry.lines.map((l) => ({
          accountId: l.accountId,
          debit: l.debit > 0 ? String(l.debit) : "",
          credit: l.credit > 0 ? String(l.credit) : "",
          description: l.description ?? "",
        }))
      );
      setLoadingEntry(false);
    }
    load();
  }, [id, router]);

  const groupedAccounts = accounts.reduce<Record<string, Account[]>>((acc, acct) => {
    if (!acc[acct.type]) acc[acct.type] = [];
    acc[acct.type].push(acct);
    return acc;
  }, {});

  const typeLabel: Record<string, string> = {
    ASSET:     lang === "ar" ? "أصول"          : "Assets",
    LIABILITY: lang === "ar" ? "خصوم"          : "Liabilities",
    EQUITY:    lang === "ar" ? "حقوق الملكية"  : "Equity",
    REVENUE:   lang === "ar" ? "إيرادات"       : "Revenue",
    EXPENSE:   lang === "ar" ? "مصروفات"       : "Expenses",
  };

  const totalDebit  = lines.reduce((s, l) => s + (parseFloat(l.debit)  || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0);
  const diff = Math.abs(totalDebit - totalCredit);
  const isBalanced = diff < 0.001;
  const hasMinimumLines = lines.filter(
    (l) => l.accountId && ((parseFloat(l.debit) || 0) > 0 || (parseFloat(l.credit) || 0) > 0)
  ).length >= 2;
  const canSave = isBalanced && hasMinimumLines && totalDebit > 0;

  function updateLine(index: number, field: keyof LineForm, value: string) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
  }
  function addLine() { setLines((prev) => [...prev, emptyLine()]); }
  function removeLine(index: number) {
    if (lines.length <= 2) return;
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    setError(null);

    const payload = {
      date,
      description,
      lines: lines
        .filter((l) => l.accountId)
        .map((l) => ({
          accountId: l.accountId,
          debit: parseFloat(l.debit) || 0,
          credit: parseFloat(l.credit) || 0,
          description: l.description || undefined,
        })),
    };

    try {
      const res = await fetch(`/api/journal/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? (lang === "ar" ? "حدث خطأ" : "An error occurred"));
      }
      router.push(`/journal/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : (lang === "ar" ? "حدث خطأ" : "An error occurred"));
      setSaving(false);
    }
  }

  const fmt = (n: number) =>
    n.toLocaleString(lang === "ar" ? "ar" : "en", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (loadingEntry) {
    return (
      <div className="text-center py-20 text-gray-400">
        <div className="animate-spin text-3xl mb-3">⚙️</div>
        <p>{lang === "ar" ? "جاري التحميل..." : "Loading..."}</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4">📭</div>
        <p className="text-gray-500">{lang === "ar" ? "القيد غير موجود" : "Entry not found"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {lang === "ar" ? "تعديل قيد اليومية" : "Edit Journal Entry"}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {lang === "ar" ? "عدّل تفاصيل القيد ثم احفظ" : "Modify the entry details then save"}
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="card grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">{lang === "ar" ? "التاريخ" : "Date"}</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="input"
            />
          </div>
          <div>
            <label className="label">{lang === "ar" ? "البيان" : "Description"}</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              placeholder={lang === "ar" ? "بيان القيد..." : "Entry description..."}
              className="input"
            />
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">
            {lang === "ar" ? "سطور القيد" : "Entry Lines"}
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="pb-2 text-right font-medium text-gray-600 text-xs w-5/12">
                    {lang === "ar" ? "الحساب" : "Account"}
                  </th>
                  <th className="pb-2 text-right font-medium text-gray-600 text-xs w-2/12">
                    {lang === "ar" ? "مدين" : "Debit"}{currency ? ` (${currency})` : ""}
                  </th>
                  <th className="pb-2 text-right font-medium text-gray-600 text-xs w-2/12">
                    {lang === "ar" ? "دائن" : "Credit"}{currency ? ` (${currency})` : ""}
                  </th>
                  <th className="pb-2 text-right font-medium text-gray-600 text-xs w-2/12">
                    {lang === "ar" ? "بيان" : "Note"}
                  </th>
                  <th className="pb-2 w-1/12" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {lines.map((line, i) => (
                  <tr key={i}>
                    <td className="py-2 pe-2">
                      <select
                        value={line.accountId}
                        onChange={(e) => updateLine(i, "accountId", e.target.value)}
                        className="input text-sm"
                      >
                        <option value="">{lang === "ar" ? "اختر حساب..." : "Select account..."}</option>
                        {Object.entries(groupedAccounts).map(([type, accts]) => (
                          <optgroup key={type} label={typeLabel[type] ?? type}>
                            {accts.map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.code} — {lang === "ar" ? (a.nameAr ?? a.name) : a.name}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 pe-2">
                      <input
                        type="number" min="0" step="0.01"
                        value={line.debit}
                        onChange={(e) => updateLine(i, "debit", e.target.value)}
                        placeholder="0.00"
                        className="input text-sm font-mono"
                      />
                    </td>
                    <td className="py-2 pe-2">
                      <input
                        type="number" min="0" step="0.01"
                        value={line.credit}
                        onChange={(e) => updateLine(i, "credit", e.target.value)}
                        placeholder="0.00"
                        className="input text-sm font-mono"
                      />
                    </td>
                    <td className="py-2 pe-2">
                      <input
                        type="text"
                        value={line.description}
                        onChange={(e) => updateLine(i, "description", e.target.value)}
                        placeholder={lang === "ar" ? "اختياري" : "Optional"}
                        className="input text-sm"
                      />
                    </td>
                    <td className="py-2">
                      <button
                        type="button"
                        onClick={() => removeLine(i)}
                        disabled={lines.length <= 2}
                        className="text-red-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed text-lg"
                        title={lang === "ar" ? "حذف السطر" : "Remove row"}
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={addLine}
            className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            + {lang === "ar" ? "إضافة سطر" : "Add Row"}
          </button>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-end gap-8 text-sm">
              <div className="text-right">
                <div className="text-gray-500 text-xs">{lang === "ar" ? "مجموع المدين" : "Total Debit"}</div>
                <div className="font-mono font-semibold text-gray-800">
                  {fmt(totalDebit)} <span className="text-xs text-gray-400">{currency}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-gray-500 text-xs">{lang === "ar" ? "مجموع الدائن" : "Total Credit"}</div>
                <div className="font-mono font-semibold text-gray-800">
                  {fmt(totalCredit)} <span className="text-xs text-gray-400">{currency}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-gray-500 text-xs">{lang === "ar" ? "الفرق" : "Diff"}</div>
                <div className={`font-mono font-semibold ${isBalanced ? "text-green-600" : "text-red-500"}`}>
                  {fmt(diff)}{isBalanced && " ✓"}
                </div>
              </div>
            </div>
            {!isBalanced && totalDebit > 0 && (
              <p className="text-xs text-red-500 mt-2 text-right">
                {lang === "ar"
                  ? "القيد غير متوازن — مجموع المدين يجب أن يساوي مجموع الدائن"
                  : "Entry is unbalanced — total debit must equal total credit"}
              </p>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3 flex-wrap">
          <button type="submit" disabled={!canSave || saving} className="btn-primary">
            {saving
              ? (lang === "ar" ? "جاري الحفظ..." : "Saving...")
              : (lang === "ar" ? "حفظ التعديلات" : "Save Changes")}
          </button>
          <button
            type="button"
            onClick={() => router.push(`/journal/${id}`)}
            className="btn-secondary"
          >
            {lang === "ar" ? "إلغاء" : "Cancel"}
          </button>
        </div>
      </form>
    </div>
  );
}
