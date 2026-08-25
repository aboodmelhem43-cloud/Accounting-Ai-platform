"use client";
import { useState, useEffect } from "react";
import { useLang } from "@/components/LanguageProvider";

interface AccountOption {
  id: string;
  name: string;
  code: string;
}

interface Integration {
  id: string;
  platform: string;
  name: string;
  status: string;
  hasSecret: boolean;
  revenueAccount: AccountOption | null;
  vatAccount: AccountOption | null;
  cashAccount: AccountOption | null;
  _count: { salesEvents: number };
  createdAt: string;
}

const PLATFORMS = [
  { value: "shopify", label: "Shopify", icon: "🛒" },
  { value: "salla", label: "سلة / Salla", icon: "🛍️" },
  { value: "zid", label: "زد / Zid", icon: "🏪" },
  { value: "foodics", label: "Foodics", icon: "🍔" },
  { value: "generic", label: "Generic Webhook", icon: "🔗" },
];

export default function IntegrationsPage() {
  const { lang } = useLang();
  const ar = lang === "ar";

  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const [form, setForm] = useState({
    platform: "shopify",
    name: "",
    webhookSecret: "",
    revenueAccountId: "",
    vatAccountId: "",
    cashAccountId: "",
  });

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  async function fetchData() {
    setLoading(true);
    try {
      const [intRes, accRes] = await Promise.all([
        fetch("/api/integrations"),
        fetch("/api/accounts"),
      ]);
      const intData = await intRes.json();
      const accData = await accRes.json();
      setIntegrations(intData.integrations ?? []);
      setAccounts(accData.accounts ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, []);

  function openNew() {
    setForm({ platform: "shopify", name: "", webhookSecret: "", revenueAccountId: "", vatAccountId: "", cashAccountId: "" });
    setEditId(null);
    setShowForm(true);
  }

  function openEdit(int: Integration) {
    setForm({
      platform: int.platform,
      name: int.name,
      webhookSecret: "",
      revenueAccountId: int.revenueAccount?.id ?? "",
      vatAccountId: int.vatAccount?.id ?? "",
      cashAccountId: int.cashAccount?.id ?? "",
    });
    setEditId(int.id);
    setShowForm(true);
  }

  async function saveForm() {
    setSaving(true);
    try {
      const payload = {
        ...(editId ? {} : { platform: form.platform }),
        name: form.name,
        ...(form.webhookSecret ? { webhookSecret: form.webhookSecret } : {}),
        revenueAccountId: form.revenueAccountId || null,
        vatAccountId: form.vatAccountId || null,
        cashAccountId: form.cashAccountId || null,
      };

      const res = await fetch(
        editId ? `/api/integrations/${editId}` : "/api/integrations",
        {
          method: editId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (res.ok) {
        showToast(editId ? (ar ? "تم التحديث" : "Updated") : (ar ? "تم إنشاء التكامل" : "Integration created"), true);
        setShowForm(false);
        fetchData();
      } else {
        const data = await res.json();
        showToast(data.error ?? (ar ? "حدث خطأ" : "An error occurred"), false);
      }
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(int: Integration) {
    const newStatus = int.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    const res = await fetch(`/api/integrations/${int.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) fetchData();
  }

  async function deleteIntegration(id: string) {
    if (!confirm(ar ? "هل أنت متأكد من حذف هذا التكامل؟" : "Are you sure you want to delete this integration?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/integrations/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast(ar ? "تم الحذف" : "Deleted", true);
        fetchData();
      }
    } finally {
      setDeletingId(null);
    }
  }

  function webhookUrl(int: Integration) {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    return `${base}/api/integrations/webhook/${int.platform}?integrationId=${int.id}`;
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url).then(() => showToast(ar ? "تم نسخ الرابط" : "Link copied", true));
  }

  const platformInfo = (p: string) => PLATFORMS.find((pl) => pl.value === p);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6" dir={ar ? "rtl" : "ltr"}>
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${toast.ok ? "bg-green-600" : "bg-red-600"}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {ar ? "تكاملات المبيعات" : "Sales Integrations"}
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            {ar
              ? "اربط متجرك أو نظام نقاط البيع لاستيراد المبيعات تلقائيًا"
              : "Connect your store or POS system to automatically import sales"}
          </p>
        </div>
        <button
          onClick={openNew}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700"
        >
          {ar ? "+ إضافة تكامل" : "+ Add Integration"}
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4" dir={ar ? "rtl" : "ltr"}>
            <h2 className="text-lg font-bold text-gray-900">
              {editId ? (ar ? "تعديل التكامل" : "Edit Integration") : (ar ? "تكامل جديد" : "New Integration")}
            </h2>

            {!editId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {ar ? "المنصة" : "Platform"}
                </label>
                <select
                  value={form.platform}
                  onChange={(e) => setForm({ ...form, platform: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                >
                  {PLATFORMS.map((p) => (
                    <option key={p.value} value={p.value}>{p.icon} {p.label}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {ar ? "الاسم" : "Name"}
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={ar ? "مثال: متجر سلة الرئيسي" : "e.g. Main Shopify Store"}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Webhook Secret{" "}
                <span className="text-gray-400 text-xs">
                  {ar ? "(اختياري — لتأمين الربط)" : "(optional — to secure the connection)"}
                </span>
              </label>
              <input
                type="password"
                value={form.webhookSecret}
                onChange={(e) => setForm({ ...form, webhookSecret: e.target.value })}
                placeholder={
                  editId
                    ? (ar ? "اتركه فارغًا للإبقاء على الحالي" : "Leave blank to keep current")
                    : (ar ? "أدخل السر إن وجد" : "Enter secret if applicable")
                }
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono"
              />
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {ar ? "حساب الإيرادات" : "Revenue Account"}
                </label>
                <select
                  value={form.revenueAccountId}
                  onChange={(e) => setForm({ ...form, revenueAccountId: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                >
                  <option value="">{ar ? "تلقائي (AI يختار)" : "Auto (AI chooses)"}</option>
                  {accounts.filter((a) => a.code.startsWith("4")).map((a) => (
                    <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {ar ? "حساب ضريبة القيمة المضافة" : "VAT Account"}
                </label>
                <select
                  value={form.vatAccountId}
                  onChange={(e) => setForm({ ...form, vatAccountId: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                >
                  <option value="">{ar ? "تلقائي (AI يختار)" : "Auto (AI chooses)"}</option>
                  {accounts.filter((a) => a.code.startsWith("2")).map((a) => (
                    <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {ar ? "حساب النقدية/البنك" : "Cash / Bank Account"}
                </label>
                <select
                  value={form.cashAccountId}
                  onChange={(e) => setForm({ ...form, cashAccountId: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                >
                  <option value="">{ar ? "تلقائي (AI يختار)" : "Auto (AI chooses)"}</option>
                  {accounts.filter((a) => a.code.startsWith("1")).map((a) => (
                    <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={saveForm}
                disabled={saving || !form.name}
                className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? (ar ? "جارٍ الحفظ..." : "Saving...") : (ar ? "حفظ" : "Save")}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50"
              >
                {ar ? "إلغاء" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">
          {ar ? "جاري التحميل..." : "Loading..."}
        </div>
      ) : integrations.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">🔌</div>
          <p>{ar ? "لا يوجد تكاملات بعد — أضف أول تكامل للبدء" : "No integrations yet — add your first one to get started"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {integrations.map((int) => {
            const pl = platformInfo(int.platform);
            const url = webhookUrl(int);
            return (
              <div key={int.id} className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="text-2xl mt-0.5">{pl?.icon ?? "🔗"}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">{int.name}</span>
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{pl?.label ?? int.platform}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${int.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {int.status === "ACTIVE" ? (ar ? "نشط" : "Active") : (ar ? "موقوف" : "Paused")}
                      </span>
                      {int.hasSecret && <span className="text-xs text-blue-600">🔐 {ar ? "محمي" : "Secured"}</span>}
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 font-mono text-xs text-gray-600 truncate">
                        {url}
                      </div>
                      <button
                        onClick={() => copyUrl(url)}
                        className="flex-shrink-0 px-2 py-1.5 text-xs text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
                      >
                        {ar ? "نسخ" : "Copy"}
                      </button>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-500">
                      <span>{int._count.salesEvents} {ar ? "حدث مبيعات" : "sales events"}</span>
                      {int.revenueAccount && <span>{ar ? "إيرادات:" : "Revenue:"} {int.revenueAccount.code} {int.revenueAccount.name}</span>}
                      {int.vatAccount && <span>{ar ? "ضريبة:" : "VAT:"} {int.vatAccount.code}</span>}
                      {int.cashAccount && <span>{ar ? "صندوق:" : "Cash:"} {int.cashAccount.code}</span>}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => openEdit(int)}
                      className="px-3 py-1 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      {ar ? "تعديل" : "Edit"}
                    </button>
                    <button
                      onClick={() => toggleStatus(int)}
                      className={`px-3 py-1 text-xs rounded-lg border ${int.status === "ACTIVE" ? "text-amber-600 border-amber-200 hover:bg-amber-50" : "text-green-600 border-green-200 hover:bg-green-50"}`}
                    >
                      {int.status === "ACTIVE" ? (ar ? "إيقاف" : "Pause") : (ar ? "تفعيل" : "Activate")}
                    </button>
                    <button
                      onClick={() => deleteIntegration(int.id)}
                      disabled={deletingId === int.id}
                      className="px-3 py-1 text-xs text-red-500 border border-red-100 rounded-lg hover:bg-red-50 disabled:opacity-50"
                    >
                      {ar ? "حذف" : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
        <strong>{ar ? "كيفية الربط:" : "How to connect:"}</strong>{" "}
        {ar
          ? <>انسخ رابط الـ Webhook الخاص بالتكامل وأضفه في إعدادات المنصة (Shopify / سلة / زد / Foodics). عند ورود طلب مباع جديد، سيرسله النظام تلقائيًا وتظهر في قائمة &quot;مزامنة المبيعات&quot; لمراجعتها.</>
          : <>Copy the webhook URL for your integration and paste it into the platform settings (Shopify / Salla / Zid / Foodics). When a new order arrives, it will appear in &quot;Sales Sync&quot; for your review.</>
        }
      </div>
    </div>
  );
}
