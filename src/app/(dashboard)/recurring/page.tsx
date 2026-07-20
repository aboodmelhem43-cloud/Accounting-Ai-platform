"use client";
import { useEffect, useState, useCallback } from "react";
import { useLang } from "@/components/LanguageProvider";

interface TemplateLine {
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description?: string;
}

interface Template {
  id: string;
  name: string;
  description: string;
  frequency: string;
  dayOfMonth: number | null;
  nextRunDate: string;
  endDate: string | null;
  isActive: boolean;
  lines: TemplateLine[];
}

interface Account {
  id: string;
  code: string;
  name: string;
  nameAr: string | null;
}

const FREQ_LABELS: Record<string, Record<string, string>> = {
  MONTHLY: { ar: "شهري", en: "Monthly" },
  WEEKLY: { ar: "أسبوعي", en: "Weekly" },
  QUARTERLY: { ar: "ربع سنوي", en: "Quarterly" },
  YEARLY: { ar: "سنوي", en: "Yearly" },
};

export default function RecurringPage() {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const locale = isAr ? "ar" : "en";

  const [templates, setTemplates] = useState<Template[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    frequency: "MONTHLY",
    dayOfMonth: "1",
    nextRunDate: new Date().toISOString().split("T")[0],
    endDate: "",
    lines: [
      { accountId: "", accountCode: "", accountName: "", debit: 0, credit: 0, description: "" },
      { accountId: "", accountCode: "", accountName: "", debit: 0, credit: 0, description: "" },
    ] as TemplateLine[],
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, aRes] = await Promise.all([
        fetch("/api/recurring"),
        fetch("/api/accounts"),
      ]);
      const [tData, aData] = await Promise.all([tRes.json(), aRes.json()]);
      setTemplates(tData.templates ?? []);
      setAccounts(aData.accounts ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const fmt = (n: number) => n.toLocaleString(locale, { minimumFractionDigits: 2 });

  function updateLine(i: number, field: string, value: string | number) {
    setForm((f) => {
      const lines = [...f.lines];
      if (field === "accountId") {
        const acc = accounts.find((a) => a.id === value);
        lines[i] = { ...lines[i], accountId: String(value), accountCode: acc?.code ?? "", accountName: (isAr ? acc?.nameAr : acc?.name) ?? acc?.name ?? "" };
      } else {
        lines[i] = { ...lines[i], [field]: value };
      }
      return { ...f, lines };
    });
  }

  function addLine() {
    setForm((f) => ({ ...f, lines: [...f.lines, { accountId: "", accountCode: "", accountName: "", debit: 0, credit: 0, description: "" }] }));
  }

  function removeLine(i: number) {
    setForm((f) => ({ ...f, lines: f.lines.filter((_, idx) => idx !== i) }));
  }

  async function handleSubmit() {
    setFormError(null);
    const totalDebit = form.lines.reduce((s, l) => s + l.debit, 0);
    const totalCredit = form.lines.reduce((s, l) => s + l.credit, 0);
    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      setFormError(isAr ? `القيد غير متوازن: مدين ${fmt(totalDebit)} ≠ دائن ${fmt(totalCredit)}` : `Entry not balanced: debit ${fmt(totalDebit)} ≠ credit ${fmt(totalCredit)}`);
      return;
    }
    if (form.lines.some((l) => !l.accountId)) {
      setFormError(isAr ? "يرجى اختيار حساب لكل سطر" : "Please select an account for every line");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/recurring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          dayOfMonth: form.dayOfMonth ? parseInt(form.dayOfMonth) : undefined,
          endDate: form.endDate || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error ?? "خطأ"); return; }
      setShowForm(false);
      setSuccess(isAr ? "تم إنشاء القالب" : "Template created");
      await load();
    } catch {
      setFormError(isAr ? "خطأ في الاتصال" : "Connection error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRun(id: string) {
    setRunningId(id);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/recurring/${id}/run`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "خطأ"); return; }
      setSuccess(isAr ? `تم إنشاء القيد بنجاح (${data.entryId?.slice(0, 8)}...)` : `Entry created (${data.entryId?.slice(0, 8)}...)`);
      await load();
    } catch {
      setError(isAr ? "خطأ في الاتصال" : "Connection error");
    } finally {
      setRunningId(null);
    }
  }

  async function handleToggle(t: Template) {
    setTogglingId(t.id);
    try {
      await fetch(`/api/recurring/${t.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !t.isActive }),
      });
      await load();
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    setConfirmDelete(null);
    try {
      await fetch(`/api/recurring/${id}`, { method: "DELETE" });
      await load();
    } finally {
      setDeletingId(null);
    }
  }

  const totalDebit = form.lines.reduce((s, l) => s + l.debit, 0);
  const totalCredit = form.lines.reduce((s, l) => s + l.credit, 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.001;

  return (
    <div className="space-y-6">
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full space-y-4">
            <div className="text-center">
              <div className="text-3xl mb-2">🗑️</div>
              <h3 className="font-semibold text-gray-900">{isAr ? "حذف القالب؟" : "Delete template?"}</h3>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="btn-secondary flex-1 text-sm">{isAr ? "إلغاء" : "Cancel"}</button>
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 bg-red-600 text-white rounded-lg text-sm font-medium py-2">{isAr ? "حذف" : "Delete"}</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isAr ? "القيود المتكررة" : "Recurring Entries"}</h1>
          <p className="text-gray-500 text-sm mt-1">{isAr ? "إيجارات ورواتب وأقساط وغيرها" : "Rent, salaries, loan installments, and more"}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary text-sm">
          + {isAr ? "قالب جديد" : "New Template"}
        </button>
      </div>

      {(error || success) && (
        <div className={`rounded-lg p-3 text-sm flex justify-between ${error ? "bg-red-50 border border-red-200 text-red-700" : "bg-green-50 border border-green-200 text-green-700"}`}>
          <span>{error ?? success}</span>
          <button onClick={() => { setError(null); setSuccess(null); }}>✕</button>
        </div>
      )}

      {showForm && (
        <div className="card p-5 space-y-4">
          <h3 className="font-semibold text-gray-800">{isAr ? "قالب قيد متكرر جديد" : "New Recurring Template"}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{isAr ? "اسم القالب" : "Template name"}</label>
              <input type="text" className="input w-full text-sm" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder={isAr ? "مثال: إيجار المكتب" : "e.g. Office Rent"} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{isAr ? "البيان" : "Description"}</label>
              <input type="text" className="input w-full text-sm" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder={isAr ? "يظهر في القيد المحاسبي" : "Appears in the journal entry"} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{isAr ? "التكرار" : "Frequency"}</label>
              <select className="input w-full text-sm" value={form.frequency} onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))}>
                {Object.entries(FREQ_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{isAr ? v.ar : v.en}</option>
                ))}
              </select>
            </div>
            {form.frequency === "MONTHLY" && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{isAr ? "يوم الشهر" : "Day of month"}</label>
                <input type="number" min={1} max={28} className="input w-full text-sm" value={form.dayOfMonth} onChange={(e) => setForm((f) => ({ ...f, dayOfMonth: e.target.value }))} />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{isAr ? "أول تاريخ تشغيل" : "First run date"}</label>
              <input type="date" className="input w-full text-sm" value={form.nextRunDate} onChange={(e) => setForm((f) => ({ ...f, nextRunDate: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{isAr ? "تاريخ الانتهاء (اختياري)" : "End date (optional)"}</label>
              <input type="date" className="input w-full text-sm" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-500">{isAr ? "سطور القيد" : "Journal lines"}</label>
              <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${isBalanced ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {isAr ? `مدين: ${fmt(totalDebit)} | دائن: ${fmt(totalCredit)}` : `Dr: ${fmt(totalDebit)} | Cr: ${fmt(totalCredit)}`}
              </span>
            </div>
            <div className="space-y-2">
              {form.lines.map((line, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <select
                    className="input flex-1 text-xs"
                    value={line.accountId}
                    onChange={(e) => updateLine(i, "accountId", e.target.value)}
                  >
                    <option value="">{isAr ? "اختر حساب..." : "Select account..."}</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.code} — {isAr ? (a.nameAr ?? a.name) : a.name}</option>
                    ))}
                  </select>
                  <input type="number" min={0} placeholder={isAr ? "مدين" : "Debit"} className="input w-24 text-xs" value={line.debit || ""} onChange={(e) => updateLine(i, "debit", parseFloat(e.target.value) || 0)} />
                  <input type="number" min={0} placeholder={isAr ? "دائن" : "Credit"} className="input w-24 text-xs" value={line.credit || ""} onChange={(e) => updateLine(i, "credit", parseFloat(e.target.value) || 0)} />
                  {form.lines.length > 2 && (
                    <button onClick={() => removeLine(i)} className="text-red-400 hover:text-red-600 text-sm">✕</button>
                  )}
                </div>
              ))}
            </div>
            <button onClick={addLine} className="text-xs text-blue-600 hover:text-blue-800 mt-2">+ {isAr ? "إضافة سطر" : "Add line"}</button>
          </div>

          {formError && <p className="text-xs text-red-600">{formError}</p>}

          <div className="flex gap-3">
            <button onClick={() => setShowForm(false)} className="btn-secondary text-sm">{isAr ? "إلغاء" : "Cancel"}</button>
            <button onClick={handleSubmit} disabled={submitting} className="btn-primary text-sm">
              {submitting ? "..." : (isAr ? "حفظ القالب" : "Save Template")}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400"><div className="animate-spin text-3xl">⚙️</div></div>
      ) : templates.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <div className="text-5xl mb-3">🔁</div>
          <p className="font-medium">{isAr ? "لا توجد قيود متكررة" : "No recurring templates"}</p>
          <p className="text-sm mt-1">{isAr ? "أضف قيوداً تتكرر شهرياً أو أسبوعياً تلقائياً" : "Add entries that repeat monthly, weekly, etc."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((t) => (
            <div key={t.id} className={`card p-4 ${!t.isActive ? "opacity-60" : ""}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-800">{t.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {t.isActive ? (isAr ? "نشط" : "Active") : (isAr ? "متوقف" : "Inactive")}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                      {isAr ? FREQ_LABELS[t.frequency]?.ar : FREQ_LABELS[t.frequency]?.en}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{t.description}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {isAr ? "التشغيل التالي:" : "Next run:"} {new Date(t.nextRunDate).toLocaleDateString(locale)}
                    {t.endDate && ` · ${isAr ? "ينتهي:" : "Ends:"} ${new Date(t.endDate).toLocaleDateString(locale)}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                  <button
                    onClick={() => handleRun(t.id)}
                    disabled={!t.isActive || runningId === t.id}
                    className="btn-primary text-xs py-1.5 px-3"
                    title={isAr ? "تشغيل الآن" : "Run now"}
                  >
                    {runningId === t.id ? "..." : (isAr ? "▶ تشغيل" : "▶ Run")}
                  </button>
                  <button
                    onClick={() => handleToggle(t)}
                    disabled={togglingId === t.id}
                    className="btn-secondary text-xs py-1.5 px-3"
                  >
                    {togglingId === t.id ? "..." : (t.isActive ? (isAr ? "إيقاف" : "Pause") : (isAr ? "تفعيل" : "Activate"))}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(t.id)}
                    disabled={deletingId === t.id}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    {deletingId === t.id ? "..." : "🗑️"}
                  </button>
                </div>
              </div>
              <div className="mt-3 border-t border-gray-100 pt-3">
                <table className="text-xs w-full">
                  <thead>
                    <tr className="text-gray-400">
                      <th className="text-right pb-1 font-medium">{isAr ? "الحساب" : "Account"}</th>
                      <th className="text-right pb-1 font-medium">{isAr ? "مدين" : "Debit"}</th>
                      <th className="text-right pb-1 font-medium">{isAr ? "دائن" : "Credit"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(t.lines as TemplateLine[]).map((line, i) => (
                      <tr key={i}>
                        <td className="py-0.5 text-gray-700">{line.accountCode} — {line.accountName}</td>
                        <td className="py-0.5 font-mono text-gray-600">{line.debit > 0 ? fmt(line.debit) : ""}</td>
                        <td className="py-0.5 font-mono text-gray-600">{line.credit > 0 ? fmt(line.credit) : ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
