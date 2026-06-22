"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/LanguageProvider";

interface Account {
  id: string;
  code: string;
  name: string;
  nameAr: string | null;
  type: string;
}

interface JournalLine {
  accountId: string;
  debit: string;
  credit: string;
  description: string;
}

const emptyLine = (): JournalLine => ({
  accountId: "",
  debit: "",
  credit: "",
  description: "",
});

export default function NewJournalEntryPage() {
  const { lang, t } = useLang();
  const router = useRouter();

  const today = new Date().toISOString().split("T")[0];

  const [date, setDate] = useState(today);
  const [description, setDescription] = useState("");
  const [lines, setLines] = useState<JournalLine[]>([emptyLine(), emptyLine()]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // جلب الحسابات
  useEffect(() => {
    fetch("/api/accounts")
      .then((r) => r.json())
      .then((data: Account[]) => setAccounts(data))
      .catch(() => {/* fail silently */});
  }, []);

  // تجميع الحسابات حسب النوع لـ optgroup
  const groupedAccounts = accounts.reduce<Record<string, Account[]>>((acc, acct) => {
    const key = acct.type;
    if (!acc[key]) acc[key] = [];
    acc[key].push(acct);
    return acc;
  }, {});

  const typeLabel: Record<string, string> = {
    ASSET: lang === "ar" ? "أصول" : "Assets",
    LIABILITY: lang === "ar" ? "خصوم" : "Liabilities",
    EQUITY: lang === "ar" ? "حقوق الملكية" : "Equity",
    REVENUE: lang === "ar" ? "إيرادات" : "Revenue",
    EXPENSE: lang === "ar" ? "مصروفات" : "Expenses",
  };

  // حساب الإجماليات
  const totalDebit = lines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0);
  const diff = Math.abs(totalDebit - totalCredit);
  const isBalanced = diff < 0.001;
  const hasMinimumLines = lines.filter(
    (l) => l.accountId && ((parseFloat(l.debit) || 0) > 0 || (parseFloat(l.credit) || 0) > 0)
  ).length >= 2;

  const canSubmit = isBalanced && hasMinimumLines && totalDebit > 0;

  function updateLine(index: number, field: keyof JournalLine, value: string) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
  }

  function addLine() {
    setLines((prev) => [...prev, emptyLine()]);
  }

  function removeLine(index: number) {
    if (lines.length <= 2) return;
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  async function submitEntry(statusValue: "DRAFT" | "POSTED") {
    if (!canSubmit) return;

    setLoading(true);
    setError(null);

    const payload = {
      date,
      description,
      status: statusValue,
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
      const res = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? "حدث خطأ");
      }

      router.push("/journal");
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submitEntry("POSTED");
  }

  const fmt = (n: number) => n.toLocaleString(lang === "ar" ? "ar" : "en", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {lang === "ar" ? "قيد يومية جديد" : "New Journal Entry"}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {lang === "ar" ? "أدخل تفاصيل القيد المحاسبي" : "Enter journal entry details"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* حقول الرأس */}
        <div className="card grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">{t("journal.date")}</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="input"
            />
          </div>
          <div>
            <label className="label">{t("journal.description")}</label>
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

        {/* سطور القيد */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">
            {lang === "ar" ? "سطور القيد" : "Entry Lines"}
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="pb-2 text-right font-medium text-gray-600 text-xs w-5/12">
                    {t("journal.account")}
                  </th>
                  <th className="pb-2 text-right font-medium text-gray-600 text-xs w-2/12">
                    {t("journal.debit")}
                  </th>
                  <th className="pb-2 text-right font-medium text-gray-600 text-xs w-2/12">
                    {t("journal.credit")}
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
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.debit}
                        onChange={(e) => updateLine(i, "debit", e.target.value)}
                        placeholder="0.00"
                        className="input text-sm font-mono"
                      />
                    </td>
                    <td className="py-2 pe-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
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

          {/* ميزان القيد */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-end gap-8 text-sm">
              <div className="text-right">
                <div className="text-gray-500 text-xs">{t("journal.debit")}</div>
                <div className="font-mono font-semibold text-gray-800">{fmt(totalDebit)}</div>
              </div>
              <div className="text-right">
                <div className="text-gray-500 text-xs">{t("journal.credit")}</div>
                <div className="font-mono font-semibold text-gray-800">{fmt(totalCredit)}</div>
              </div>
              <div className="text-right">
                <div className="text-gray-500 text-xs">{lang === "ar" ? "الفرق" : "Diff"}</div>
                <div className={`font-mono font-semibold ${isBalanced ? "text-green-600" : "text-red-500"}`}>
                  {fmt(diff)}
                  {isBalanced && " ✓"}
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
          <button
            type="submit"
            disabled={!canSubmit || loading}
            className="btn-primary"
          >
            {loading
              ? (lang === "ar" ? "جاري الحفظ..." : "Saving...")
              : (lang === "ar" ? "حفظ وترحيل" : "Save & Post")}
          </button>
          <button
            type="button"
            disabled={!canSubmit || loading}
            onClick={() => submitEntry("DRAFT")}
            className="btn-secondary"
          >
            {lang === "ar" ? "حفظ كمسودة" : "Save as Draft"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/journal")}
            className="btn-secondary"
          >
            {t("common.cancel")}
          </button>
        </div>
      </form>
    </div>
  );
}
