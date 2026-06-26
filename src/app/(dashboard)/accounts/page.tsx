"use client";
import { useState, useEffect, useCallback } from "react";
import { useLang } from "@/components/LanguageProvider";

interface Account {
  id: string;
  code: string;
  name: string;
  nameAr: string | null;
  type: AccountType;
  isSystem: boolean;
}

type AccountType = "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";

const TYPE_META: Record<AccountType, { ar: string; en: string; color: string; bg: string }> = {
  ASSET:     { ar: "الأصول",          en: "Assets",      color: "text-blue-700",   bg: "bg-blue-50 border-blue-200" },
  LIABILITY: { ar: "الخصوم",          en: "Liabilities", color: "text-orange-700", bg: "bg-orange-50 border-orange-200" },
  EQUITY:    { ar: "حقوق الملكية",    en: "Equity",      color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
  REVENUE:   { ar: "الإيرادات",       en: "Revenue",     color: "text-green-700",  bg: "bg-green-50 border-green-200" },
  EXPENSE:   { ar: "المصروفات",       en: "Expenses",    color: "text-red-700",    bg: "bg-red-50 border-red-200" },
};

// دليل الحسابات الموسّع — القائمة الكاملة للحسابات المقترحة
const PREDEFINED: { code: string; nameAr: string; name: string; type: AccountType }[] = [
  // أصول
  { code: "1100", nameAr: "النقدية والبنوك",             name: "Cash & Banks",              type: "ASSET" },
  { code: "1110", nameAr: "الصندوق النقدي",              name: "Petty Cash",                type: "ASSET" },
  { code: "1120", nameAr: "الحساب البنكي الرئيسي",       name: "Main Bank Account",         type: "ASSET" },
  { code: "1200", nameAr: "المدينون والعملاء",            name: "Accounts Receivable",       type: "ASSET" },
  { code: "1210", nameAr: "أوراق القبض",                  name: "Notes Receivable",          type: "ASSET" },
  { code: "1300", nameAr: "المخزون",                      name: "Inventory",                 type: "ASSET" },
  { code: "1310", nameAr: "البضاعة في الطريق",            name: "Goods in Transit",          type: "ASSET" },
  { code: "1400", nameAr: "المصروفات المدفوعة مقدماً",   name: "Prepaid Expenses",          type: "ASSET" },
  { code: "1410", nameAr: "الإيجار المدفوع مقدماً",      name: "Prepaid Rent",              type: "ASSET" },
  { code: "1420", nameAr: "التأمين المدفوع مقدماً",      name: "Prepaid Insurance",         type: "ASSET" },
  { code: "1500", nameAr: "الأصول الثابتة",              name: "Fixed Assets",              type: "ASSET" },
  { code: "1510", nameAr: "الأثاث والمعدات",             name: "Furniture & Equipment",     type: "ASSET" },
  { code: "1520", nameAr: "السيارات",                     name: "Vehicles",                  type: "ASSET" },
  { code: "1530", nameAr: "المباني",                      name: "Buildings",                 type: "ASSET" },
  { code: "1540", nameAr: "أجهزة الكمبيوتر",             name: "Computer Equipment",        type: "ASSET" },
  { code: "1600", nameAr: "مجمع الاهتلاك",               name: "Accumulated Depreciation",  type: "ASSET" },
  // خصوم
  { code: "2100", nameAr: "الدائنون والموردون",           name: "Accounts Payable",          type: "LIABILITY" },
  { code: "2110", nameAr: "أوراق الدفع",                  name: "Notes Payable",             type: "LIABILITY" },
  { code: "2200", nameAr: "ضريبة القيمة المضافة المستحقة", name: "VAT Payable",             type: "LIABILITY" },
  { code: "2210", nameAr: "ضريبة الدخل المستحقة",        name: "Income Tax Payable",        type: "LIABILITY" },
  { code: "2300", nameAr: "الرواتب المستحقة",             name: "Salaries Payable",          type: "LIABILITY" },
  { code: "2400", nameAr: "القروض قصيرة الأجل",          name: "Short-term Loans",          type: "LIABILITY" },
  { code: "2500", nameAr: "القروض طويلة الأجل",          name: "Long-term Loans",           type: "LIABILITY" },
  // حقوق الملكية
  { code: "3100", nameAr: "حقوق الملكية",                 name: "Owner Equity",              type: "EQUITY" },
  { code: "3110", nameAr: "رأس المال",                    name: "Capital",                   type: "EQUITY" },
  { code: "3120", nameAr: "الأرباح المبقّاة",             name: "Retained Earnings",         type: "EQUITY" },
  { code: "3130", nameAr: "المسحوبات",                    name: "Drawings / Withdrawals",    type: "EQUITY" },
  // إيرادات
  { code: "4100", nameAr: "إيرادات المبيعات",             name: "Sales Revenue",             type: "REVENUE" },
  { code: "4110", nameAr: "مردودات المبيعات",             name: "Sales Returns",             type: "REVENUE" },
  { code: "4200", nameAr: "إيرادات الخدمات",              name: "Service Revenue",           type: "REVENUE" },
  { code: "4300", nameAr: "إيرادات أخرى",                 name: "Other Revenue",             type: "REVENUE" },
  { code: "4310", nameAr: "إيرادات الفوائد",              name: "Interest Income",           type: "REVENUE" },
  { code: "4320", nameAr: "أرباح بيع الأصول",             name: "Gain on Asset Sale",        type: "REVENUE" },
  // مصروفات
  { code: "5100", nameAr: "تكلفة البضاعة المباعة",       name: "Cost of Goods Sold",        type: "EXPENSE" },
  { code: "5200", nameAr: "المصروفات التشغيلية",          name: "Operating Expenses",        type: "EXPENSE" },
  { code: "5210", nameAr: "مصروفات الكهرباء والمياه",    name: "Utilities",                 type: "EXPENSE" },
  { code: "5220", nameAr: "مصروفات الاتصالات",            name: "Communication",             type: "EXPENSE" },
  { code: "5230", nameAr: "مصروفات القرطاسية",            name: "Office Supplies",           type: "EXPENSE" },
  { code: "5240", nameAr: "مصروفات الصيانة",              name: "Maintenance",               type: "EXPENSE" },
  { code: "5300", nameAr: "مصروفات التسويق والإعلان",    name: "Marketing & Advertising",   type: "EXPENSE" },
  { code: "5400", nameAr: "الرواتب والأجور",              name: "Salaries & Wages",          type: "EXPENSE" },
  { code: "5410", nameAr: "مكافآت الموظفين",              name: "Employee Benefits",         type: "EXPENSE" },
  { code: "5420", nameAr: "تأمينات اجتماعية",             name: "Social Insurance",          type: "EXPENSE" },
  { code: "5500", nameAr: "الإيجار",                      name: "Rent",                      type: "EXPENSE" },
  { code: "5600", nameAr: "اهتلاك الأصول",                name: "Depreciation",              type: "EXPENSE" },
  { code: "5700", nameAr: "مصروفات مالية",                name: "Financial Expenses",        type: "EXPENSE" },
  { code: "5710", nameAr: "فوائد القروض",                  name: "Loan Interest",             type: "EXPENSE" },
  { code: "5800", nameAr: "مصروفات متنوعة",               name: "Miscellaneous Expenses",    type: "EXPENSE" },
];

const TYPE_ORDER: AccountType[] = ["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"];

export default function AccountsPage() {
  const { lang } = useLang();
  const isAr = lang === "ar";

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCode, setSelectedCode] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");

  // نموذج الحساب المخصص
  const [showCustom, setShowCustom] = useState(false);
  const [customCode, setCustomCode] = useState("");
  const [customNameAr, setCustomNameAr] = useState("");
  const [customNameEn, setCustomNameEn] = useState("");
  const [customType, setCustomType] = useState<AccountType>("ASSET");
  const [savingCustom, setSavingCustom] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/accounts");
      const data = await res.json();
      setAccounts(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // الحسابات المقترحة التي لم تُضف بعد
  const existingCodes = new Set(accounts.map((a) => a.code));
  const available = PREDEFINED.filter((p) => !existingCodes.has(p.code));

  async function addFromPredefined() {
    const item = PREDEFINED.find((p) => p.code === selectedCode);
    if (!item) return;
    setAdding(true);
    setAddError("");
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: item.code, name: item.name, nameAr: item.nameAr, type: item.type }),
      });
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        throw new Error(d.error ?? "Error");
      }
      setSelectedCode("");
      load();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Error");
    } finally {
      setAdding(false);
    }
  }

  async function addCustom(e: React.FormEvent) {
    e.preventDefault();
    if (!customCode.trim() || !customNameAr.trim()) return;
    setSavingCustom(true);
    setAddError("");
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: customCode.trim(),
          name: customNameEn.trim() || customNameAr.trim(),
          nameAr: customNameAr.trim(),
          type: customType,
        }),
      });
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        throw new Error(d.error ?? "Error");
      }
      setCustomCode("");
      setCustomNameAr("");
      setCustomNameEn("");
      setShowCustom(false);
      load();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Error");
    } finally {
      setSavingCustom(false);
    }
  }

  async function deleteAccount(id: string) {
    if (!confirm(isAr ? "هل تريد حذف هذا الحساب؟" : "Delete this account?")) return;
    const res = await fetch(`/api/accounts/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json() as { error?: string };
      alert(d.error ?? (isAr ? "فشل الحذف" : "Delete failed"));
      return;
    }
    load();
  }

  const grouped = TYPE_ORDER.reduce<Record<AccountType, Account[]>>(
    (acc, t) => {
      acc[t] = accounts.filter((a) => a.type === t);
      return acc;
    },
    { ASSET: [], LIABILITY: [], EQUITY: [], REVENUE: [], EXPENSE: [] }
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isAr ? "دليل الحسابات" : "Chart of Accounts"}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {accounts.length} {isAr ? "حساب" : "accounts"}
          </p>
        </div>
      </div>

      {/* إضافة حساب من القائمة */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-800">
          {isAr ? "➕ إضافة حساب من القائمة الموسّعة" : "➕ Add Account from Standard List"}
        </h2>
        <p className="text-sm text-gray-500">
          {isAr
            ? `${available.length} حساب متاح من الدليل الموسّع — اختر ما يناسب نشاطك`
            : `${available.length} accounts available from the standard chart — pick what fits your business`}
        </p>

        <div className="flex gap-3 flex-wrap">
          <select
            value={selectedCode}
            onChange={(e) => setSelectedCode(e.target.value)}
            className="input flex-1 min-w-0"
            disabled={available.length === 0}
          >
            <option value="">{isAr ? "— اختر حساباً —" : "— Select an account —"}</option>
            {TYPE_ORDER.map((type) => {
              const group = available.filter((p) => p.type === type);
              if (group.length === 0) return null;
              return (
                <optgroup key={type} label={isAr ? TYPE_META[type].ar : TYPE_META[type].en}>
                  {group.map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.code} — {isAr ? p.nameAr : p.name}
                    </option>
                  ))}
                </optgroup>
              );
            })}
          </select>
          <button
            onClick={addFromPredefined}
            disabled={!selectedCode || adding}
            className="btn-primary"
          >
            {adding ? (isAr ? "جاري الإضافة..." : "Adding...") : (isAr ? "إضافة" : "Add")}
          </button>
        </div>

        {/* حساب مخصص */}
        <div>
          <button
            onClick={() => setShowCustom((v) => !v)}
            className="text-sm text-blue-600 hover:underline"
          >
            {showCustom
              ? (isAr ? "▲ إخفاء نموذج الحساب المخصص" : "▲ Hide custom account form")
              : (isAr ? "▼ إضافة حساب مخصص" : "▼ Add custom account")}
          </button>

          {showCustom && (
            <form onSubmit={addCustom} className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div>
                <label className="label">{isAr ? "رمز الحساب *" : "Account Code *"}</label>
                <input
                  type="text"
                  required
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value)}
                  className="input"
                  placeholder="مثال: 5900"
                />
              </div>
              <div>
                <label className="label">{isAr ? "نوع الحساب *" : "Account Type *"}</label>
                <select
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value as AccountType)}
                  className="input"
                >
                  {TYPE_ORDER.map((t) => (
                    <option key={t} value={t}>{isAr ? TYPE_META[t].ar : TYPE_META[t].en}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">{isAr ? "الاسم بالعربي *" : "Arabic Name *"}</label>
                <input
                  type="text"
                  required
                  value={customNameAr}
                  onChange={(e) => setCustomNameAr(e.target.value)}
                  className="input"
                  placeholder="مثال: مصروفات التنقل"
                />
              </div>
              <div>
                <label className="label">{isAr ? "الاسم بالإنجليزي (اختياري)" : "English Name (optional)"}</label>
                <input
                  type="text"
                  value={customNameEn}
                  onChange={(e) => setCustomNameEn(e.target.value)}
                  className="input"
                  placeholder="e.g. Travel Expenses"
                />
              </div>
              <div className="sm:col-span-2 flex gap-3">
                <button type="submit" disabled={savingCustom} className="btn-primary">
                  {savingCustom ? (isAr ? "جاري الحفظ..." : "Saving...") : (isAr ? "إضافة الحساب" : "Add Account")}
                </button>
                <button type="button" onClick={() => setShowCustom(false)} className="btn-secondary">
                  {isAr ? "إلغاء" : "Cancel"}
                </button>
              </div>
            </form>
          )}
        </div>

        {addError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{addError}</div>
        )}
      </div>

      {/* الحسابات الحالية مجمّعة حسب النوع */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">
          <div className="animate-spin text-2xl mb-2">⚙️</div>
          <p>{isAr ? "جاري التحميل..." : "Loading..."}</p>
        </div>
      ) : accounts.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-5xl mb-3">📒</div>
          <p className="text-gray-500">{isAr ? "لا توجد حسابات بعد. أضف حسابات من القائمة أعلاه." : "No accounts yet. Add accounts from the list above."}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {TYPE_ORDER.map((type) => {
            const group = grouped[type];
            if (group.length === 0) return null;
            const meta = TYPE_META[type];
            return (
              <div key={type} className="card p-0 overflow-hidden">
                <div className={`flex items-center gap-3 px-4 py-3 border-b border-gray-100 ${meta.bg} border`}>
                  <span className={`text-sm font-bold ${meta.color}`}>
                    {isAr ? meta.ar : meta.en}
                  </span>
                  <span className="text-xs text-gray-400">{group.length} {isAr ? "حساب" : "accounts"}</span>
                </div>
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-gray-100">
                    {group.map((acc) => (
                      <tr key={acc.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 font-mono text-gray-400 w-16">{acc.code}</td>
                        <td className="px-4 py-2.5 font-medium text-gray-800">
                          {isAr ? (acc.nameAr ?? acc.name) : acc.name}
                        </td>
                        <td className="px-4 py-2.5 text-gray-400 text-xs hidden sm:table-cell">
                          {isAr ? acc.name : (acc.nameAr ?? "")}
                        </td>
                        <td className="px-4 py-2.5 w-20 text-right">
                          {acc.isSystem ? (
                            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                              {isAr ? "نظام" : "System"}
                            </span>
                          ) : (
                            <button
                              onClick={() => deleteAccount(acc.id)}
                              className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-2 py-0.5 rounded transition-colors"
                            >
                              {isAr ? "حذف" : "Delete"}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
