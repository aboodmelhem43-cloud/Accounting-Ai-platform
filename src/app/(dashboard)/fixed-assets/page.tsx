"use client";
import { useEffect, useState, useCallback } from "react";
import { useLang } from "@/components/LanguageProvider";

interface DepreciationEntry {
  id: string;
  periodYear: number;
  periodMonth: number;
  amount: number;
  journalEntryId: string | null;
}

interface AccountRef {
  id: string;
  code: string;
  name: string;
  nameAr: string | null;
}

interface FixedAsset {
  id: string;
  name: string;
  code: string | null;
  category: string | null;
  purchaseDate: string;
  purchaseCost: number;
  residualValue: number;
  usefulLifeMonths: number;
  depreciationMethod: string;
  assetAccountId: string;
  accumDeprecAccountId: string;
  deprecExpenseAccountId: string;
  status: string;
  notes: string | null;
  depreciationEntries: DepreciationEntry[];
  totalDepreciation: number;
  bookValue: number;
  assetAccount?: AccountRef;
  accumDeprecAccount?: AccountRef;
  deprecExpenseAccount?: AccountRef;
}

interface Account {
  id: string;
  code: string;
  name: string;
  nameAr: string | null;
  type: string;
}

const MONTH_NAMES_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
const MONTH_NAMES_EN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function FixedAssetsPage() {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const locale = isAr ? "ar" : "en";

  const [assets, setAssets] = useState<FixedAsset[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [runningAll, setRunningAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const now = new Date();
  const [deprecYear, setDeprecYear] = useState(now.getFullYear());
  const [deprecMonth, setDeprecMonth] = useState(now.getMonth() + 1);

  const [form, setForm] = useState({
    name: "",
    code: "",
    category: "",
    purchaseDate: "",
    purchaseCost: "",
    residualValue: "0",
    usefulLifeMonths: "60",
    depreciationMethod: "STRAIGHT_LINE",
    assetAccountId: "",
    accumDeprecAccountId: "",
    deprecExpenseAccountId: "",
    notes: "",
  });
  const [formError, setFormError] = useState<string | null>(null);

  const fmt = (n: number) => Number(n).toLocaleString(locale, { minimumFractionDigits: 2 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [aRes, accRes] = await Promise.all([
        fetch("/api/fixed-assets"),
        fetch("/api/accounts"),
      ]);
      const [aData, accData] = await Promise.all([aRes.json(), accRes.json()]);
      setAssets(aData.assets ?? []);
      setAccounts(accData.accounts ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate() {
    setFormError(null);
    if (!form.name || !form.purchaseDate || !form.purchaseCost || !form.assetAccountId || !form.accumDeprecAccountId || !form.deprecExpenseAccountId) {
      setFormError(isAr ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill all required fields");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/fixed-assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          purchaseCost: parseFloat(form.purchaseCost),
          residualValue: parseFloat(form.residualValue) || 0,
          usefulLifeMonths: parseInt(form.usefulLifeMonths),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error ?? "خطأ"); return; }
      setShowForm(false);
      setSuccess(isAr ? "تم إضافة الأصل بنجاح" : "Asset added successfully");
      await load();
    } catch {
      setFormError(isAr ? "خطأ في الاتصال" : "Connection error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDepreciate(assetId: string) {
    setRunningId(assetId);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/fixed-assets/${assetId}/depreciate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year: deprecYear, month: deprecMonth }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "خطأ"); return; }
      setSuccess(isAr ? `تم تسجيل إهلاك ${fmt(data.amount)}` : `Depreciation of ${fmt(data.amount)} recorded`);
      await load();
    } catch {
      setError(isAr ? "خطأ في الاتصال" : "Connection error");
    } finally {
      setRunningId(null);
    }
  }

  async function handleDepreciateAll() {
    setRunningAll(true);
    setError(null);
    setSuccess(null);
    const activeAssets = assets.filter((a) => a.status === "ACTIVE");
    let done = 0;
    let skipped = 0;
    for (const asset of activeAssets) {
      const alreadyDone = asset.depreciationEntries.some(
        (e) => e.periodYear === deprecYear && e.periodMonth === deprecMonth
      );
      if (alreadyDone) { skipped++; continue; }
      try {
        const res = await fetch(`/api/fixed-assets/${asset.id}/depreciate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ year: deprecYear, month: deprecMonth }),
        });
        if (res.ok) done++;
      } catch { /* continue */ }
    }
    setRunningAll(false);
    setSuccess(isAr ? `تم إهلاك ${done} أصل${skipped > 0 ? `، تخطي ${skipped} (مُهلَك مسبقاً)` : ""}` : `Depreciated ${done} assets${skipped > 0 ? `, skipped ${skipped} (already done)` : ""}`);
    await load();
  }

  const statusBadge = (status: string) => {
    if (status === "ACTIVE") return <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">{isAr ? "نشط" : "Active"}</span>;
    if (status === "DISPOSED") return <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">{isAr ? "مُستبعد" : "Disposed"}</span>;
    return <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">{isAr ? "مُهلَك بالكامل" : "Fully Depreciated"}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isAr ? "الأصول الثابتة" : "Fixed Assets"}</h1>
          <p className="text-gray-500 text-sm mt-1">{isAr ? "سجل الأصول والإهلاك الشهري" : "Asset register and monthly depreciation"}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary text-sm">
          + {isAr ? "أصل جديد" : "New Asset"}
        </button>
      </div>

      {(error || success) && (
        <div className={`rounded-lg p-3 text-sm flex justify-between ${error ? "bg-red-50 border border-red-200 text-red-700" : "bg-green-50 border border-green-200 text-green-700"}`}>
          <span>{error ?? success}</span>
          <button onClick={() => { setError(null); setSuccess(null); }}>✕</button>
        </div>
      )}

      {/* Depreciation runner */}
      <div className="card p-4 flex flex-wrap items-end gap-4">
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-2">{isAr ? "تشغيل الإهلاك الشهري" : "Run Monthly Depreciation"}</p>
          <div className="flex gap-2 items-center">
            <select className="input text-sm" value={deprecMonth} onChange={(e) => setDeprecMonth(Number(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>{isAr ? MONTH_NAMES_AR[m - 1] : MONTH_NAMES_EN[m - 1]}</option>
              ))}
            </select>
            <input type="number" className="input text-sm w-24" value={deprecYear} onChange={(e) => setDeprecYear(Number(e.target.value))} />
          </div>
        </div>
        <button
          onClick={handleDepreciateAll}
          disabled={runningAll || assets.filter((a) => a.status === "ACTIVE").length === 0}
          className="btn-primary text-sm"
        >
          {runningAll ? (isAr ? "جارٍ الإهلاك..." : "Running...") : (isAr ? "🔄 إهلاك جميع الأصول" : "🔄 Depreciate All Assets")}
        </button>
      </div>

      {showForm && (
        <div className="card p-5 space-y-4">
          <h3 className="font-semibold text-gray-800">{isAr ? "إضافة أصل ثابت جديد" : "Add Fixed Asset"}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{isAr ? "اسم الأصل *" : "Asset name *"}</label>
              <input type="text" className="input w-full text-sm" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder={isAr ? "مثال: سيارة شركة" : "e.g. Company vehicle"} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{isAr ? "الفئة" : "Category"}</label>
              <input type="text" className="input w-full text-sm" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder={isAr ? "مركبات / معدات / مباني..." : "Vehicles / Equipment / Buildings..."} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{isAr ? "تاريخ الشراء *" : "Purchase date *"}</label>
              <input type="date" className="input w-full text-sm" value={form.purchaseDate} onChange={(e) => setForm((f) => ({ ...f, purchaseDate: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{isAr ? "تكلفة الشراء *" : "Purchase cost *"}</label>
              <input type="number" min={0} step="0.01" className="input w-full text-sm" value={form.purchaseCost} onChange={(e) => setForm((f) => ({ ...f, purchaseCost: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{isAr ? "القيمة التخريدية" : "Residual value"}</label>
              <input type="number" min={0} step="0.01" className="input w-full text-sm" value={form.residualValue} onChange={(e) => setForm((f) => ({ ...f, residualValue: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{isAr ? "العمر الإنتاجي (بالأشهر) *" : "Useful life (months) *"}</label>
              <input type="number" min={1} className="input w-full text-sm" value={form.usefulLifeMonths} onChange={(e) => setForm((f) => ({ ...f, usefulLifeMonths: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{isAr ? "طريقة الإهلاك" : "Depreciation method"}</label>
              <select className="input w-full text-sm" value={form.depreciationMethod} onChange={(e) => setForm((f) => ({ ...f, depreciationMethod: e.target.value }))}>
                <option value="STRAIGHT_LINE">{isAr ? "القسط الثابت" : "Straight Line"}</option>
                <option value="DECLINING_BALANCE">{isAr ? "القسط المتناقص" : "Declining Balance"}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{isAr ? "حساب الأصل *" : "Asset account *"}</label>
              <select className="input w-full text-sm" value={form.assetAccountId} onChange={(e) => setForm((f) => ({ ...f, assetAccountId: e.target.value }))}>
                <option value="">{isAr ? "اختر..." : "Select..."}</option>
                {accounts.filter((a) => a.type === "ASSET").map((a) => (
                  <option key={a.id} value={a.id}>{a.code} — {isAr ? (a.nameAr ?? a.name) : a.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{isAr ? "حساب مجمع الإهلاك *" : "Accumulated depreciation account *"}</label>
              <select className="input w-full text-sm" value={form.accumDeprecAccountId} onChange={(e) => setForm((f) => ({ ...f, accumDeprecAccountId: e.target.value }))}>
                <option value="">{isAr ? "اختر..." : "Select..."}</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.code} — {isAr ? (a.nameAr ?? a.name) : a.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{isAr ? "حساب مصروف الإهلاك *" : "Depreciation expense account *"}</label>
              <select className="input w-full text-sm" value={form.deprecExpenseAccountId} onChange={(e) => setForm((f) => ({ ...f, deprecExpenseAccountId: e.target.value }))}>
                <option value="">{isAr ? "اختر..." : "Select..."}</option>
                {accounts.filter((a) => a.type === "EXPENSE").map((a) => (
                  <option key={a.id} value={a.id}>{a.code} — {isAr ? (a.nameAr ?? a.name) : a.name}</option>
                ))}
              </select>
            </div>
          </div>
          {formError && <p className="text-xs text-red-600">{formError}</p>}
          <div className="flex gap-3">
            <button onClick={() => setShowForm(false)} className="btn-secondary text-sm">{isAr ? "إلغاء" : "Cancel"}</button>
            <button onClick={handleCreate} disabled={submitting} className="btn-primary text-sm">
              {submitting ? "..." : (isAr ? "إضافة الأصل" : "Add Asset")}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400"><div className="animate-spin text-3xl">⚙️</div></div>
      ) : assets.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <div className="text-5xl mb-3">🏗️</div>
          <p className="font-medium">{isAr ? "لا توجد أصول ثابتة" : "No fixed assets"}</p>
          <p className="text-sm mt-1">{isAr ? "أضف سياراتك ومعداتك ومبانيك..." : "Add your vehicles, equipment, buildings..."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assets.map((asset) => {
            const isExpanded = expandedId === asset.id;
            const monthlyDepreciation = (Number(asset.purchaseCost) - Number(asset.residualValue)) / asset.usefulLifeMonths;
            const pctDepreciated = Math.min(100, (asset.totalDepreciation / (Number(asset.purchaseCost) - Number(asset.residualValue))) * 100);
            const alreadyDone = asset.depreciationEntries.some(
              (e) => e.periodYear === deprecYear && e.periodMonth === deprecMonth
            );

            return (
              <div key={asset.id} className="card">
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-800">{asset.name}</p>
                        {statusBadge(asset.status)}
                        {asset.category && (
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{asset.category}</span>
                        )}
                      </div>
                      <div className="flex gap-4 mt-2 text-xs text-gray-500 flex-wrap">
                        <span>{isAr ? "التكلفة:" : "Cost:"} <span className="font-mono text-gray-700">{fmt(Number(asset.purchaseCost))}</span></span>
                        <span>{isAr ? "مجمع الإهلاك:" : "Accum. depr:"} <span className="font-mono text-red-600">{fmt(asset.totalDepreciation)}</span></span>
                        <span>{isAr ? "القيمة الدفترية:" : "Book value:"} <span className="font-mono text-blue-700 font-semibold">{fmt(asset.bookValue)}</span></span>
                        <span>{isAr ? "الإهلاك الشهري:" : "Monthly:"} <span className="font-mono">{fmt(monthlyDepreciation)}</span></span>
                      </div>
                      <div className="mt-2 w-full max-w-xs bg-gray-200 rounded-full h-1.5">
                        <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${pctDepreciated}%` }} />
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{pctDepreciated.toFixed(0)}% {isAr ? "مُهلَك" : "depreciated"}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {asset.status === "ACTIVE" && (
                        <button
                          onClick={() => handleDepreciate(asset.id)}
                          disabled={runningId === asset.id || alreadyDone}
                          className={`text-xs py-1.5 px-3 rounded-lg font-medium transition-colors ${
                            alreadyDone
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "btn-primary"
                          }`}
                          title={alreadyDone ? (isAr ? "تم الإهلاك لهذه الفترة" : "Already depreciated") : ""}
                        >
                          {runningId === asset.id ? "..." : alreadyDone ? (isAr ? "✓ مُهلَك" : "✓ Done") : (isAr ? "إهلاك" : "Depreciate")}
                        </button>
                      )}
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : asset.id)}
                        className="text-xs text-gray-400 hover:text-gray-600 py-1.5 px-2"
                      >
                        {isExpanded ? "▲" : "▼"}
                      </button>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 p-4">
                    <h4 className="text-xs font-semibold text-gray-500 mb-3 uppercase">
                      {isAr ? "جدول الإهلاك" : "Depreciation Schedule"}
                    </h4>
                    {asset.depreciationEntries.length === 0 ? (
                      <p className="text-xs text-gray-400">{isAr ? "لا توجد إهلاكات مسجلة" : "No depreciation entries yet"}</p>
                    ) : (
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-gray-100">
                            <th className="text-right pb-1 font-medium text-gray-500">{isAr ? "الفترة" : "Period"}</th>
                            <th className="text-right pb-1 font-medium text-gray-500">{isAr ? "المبلغ" : "Amount"}</th>
                            <th className="text-right pb-1 font-medium text-gray-500">{isAr ? "القيد" : "Entry"}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {asset.depreciationEntries.map((e) => (
                            <tr key={e.id} className="border-b border-gray-50">
                              <td className="py-1 text-gray-600">
                                {isAr ? MONTH_NAMES_AR[e.periodMonth - 1] : MONTH_NAMES_EN[e.periodMonth - 1]} {e.periodYear}
                              </td>
                              <td className="py-1 font-mono text-gray-700">{fmt(Number(e.amount))}</td>
                              <td className="py-1 text-gray-400">{e.journalEntryId ? `#${e.journalEntryId.slice(0, 8)}` : "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
