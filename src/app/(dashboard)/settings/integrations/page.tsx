"use client";
import { useState, useEffect } from "react";

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
  { value: "salla", label: "سلة", icon: "🛍️" },
  { value: "zid", label: "زد", icon: "🏪" },
  { value: "foodics", label: "Foodics", icon: "🍔" },
  { value: "generic", label: "عام (Generic Webhook)", icon: "🔗" },
];

export default function IntegrationsPage() {
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
        showToast(editId ? "تم التحديث" : "تم إنشاء التكامل", true);
        setShowForm(false);
        fetchData();
      } else {
        const data = await res.json();
        showToast(data.error ?? "حدث خطأ", false);
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
    if (res.ok) {
      fetchData();
    }
  }

  async function deleteIntegration(id: string) {
    if (!confirm("هل أنت متأكد من حذف هذا التكامل؟")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/integrations/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("تم الحذف", true);
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
    navigator.clipboard.writeText(url).then(() => showToast("تم نسخ الرابط", true));
  }

  const platformInfo = (p: string) => PLATFORMS.find((pl) => pl.value === p);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6" dir="rtl">
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${toast.ok ? "bg-green-600" : "bg-red-600"}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">تكاملات المبيعات</h1>
          <p className="text-gray-500 mt-1 text-sm">اربط متجرك أو نظام نقاط البيع لاستيراد المبيعات تلقائيًا</p>
        </div>
        <button
          onClick={openNew}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700"
        >
          + إضافة تكامل
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">
              {editId ? "تعديل التكامل" : "تكامل جديد"}
            </h2>

            {!editId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المنصة</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">الاسم</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="مثال: متجر سلة الرئيسي"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Webhook Secret <span className="text-gray-400 text-xs">(اختياري — لتأمين الربط)</span>
              </label>
              <input
                type="password"
                value={form.webhookSecret}
                onChange={(e) => setForm({ ...form, webhookSecret: e.target.value })}
                placeholder={editId ? "اتركه فارغًا للإبقاء على الحالي" : "أدخل السر إن وجد"}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono"
              />
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">حساب الإيرادات</label>
                <select
                  value={form.revenueAccountId}
                  onChange={(e) => setForm({ ...form, revenueAccountId: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                >
                  <option value="">تلقائي (AI يختار)</option>
                  {accounts.filter((a) => a.code.startsWith("4")).map((a) => (
                    <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">حساب ضريبة القيمة المضافة</label>
                <select
                  value={form.vatAccountId}
                  onChange={(e) => setForm({ ...form, vatAccountId: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                >
                  <option value="">تلقائي (AI يختار)</option>
                  {accounts.filter((a) => a.code.startsWith("2")).map((a) => (
                    <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">حساب النقدية/البنك</label>
                <select
                  value={form.cashAccountId}
                  onChange={(e) => setForm({ ...form, cashAccountId: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                >
                  <option value="">تلقائي (AI يختار)</option>
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
                {saving ? "جارٍ الحفظ..." : "حفظ"}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">جاري التحميل...</div>
      ) : integrations.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">🔌</div>
          <p>لا يوجد تكاملات بعد — أضف أول تكامل للبدء</p>
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
                        {int.status === "ACTIVE" ? "نشط" : "موقوف"}
                      </span>
                      {int.hasSecret && <span className="text-xs text-blue-600">🔐 محمي</span>}
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 font-mono text-xs text-gray-600 truncate">
                        {url}
                      </div>
                      <button
                        onClick={() => copyUrl(url)}
                        className="flex-shrink-0 px-2 py-1.5 text-xs text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
                      >
                        نسخ
                      </button>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-500">
                      <span>{int._count.salesEvents} حدث مبيعات</span>
                      {int.revenueAccount && <span>إيرادات: {int.revenueAccount.code} {int.revenueAccount.name}</span>}
                      {int.vatAccount && <span>ضريبة: {int.vatAccount.code}</span>}
                      {int.cashAccount && <span>صندوق: {int.cashAccount.code}</span>}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => openEdit(int)}
                      className="px-3 py-1 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      تعديل
                    </button>
                    <button
                      onClick={() => toggleStatus(int)}
                      className={`px-3 py-1 text-xs rounded-lg border ${int.status === "ACTIVE" ? "text-amber-600 border-amber-200 hover:bg-amber-50" : "text-green-600 border-green-200 hover:bg-green-50"}`}
                    >
                      {int.status === "ACTIVE" ? "إيقاف" : "تفعيل"}
                    </button>
                    <button
                      onClick={() => deleteIntegration(int.id)}
                      disabled={deletingId === int.id}
                      className="px-3 py-1 text-xs text-red-500 border border-red-100 rounded-lg hover:bg-red-50 disabled:opacity-50"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
        <strong>كيفية الربط:</strong> انسخ رابط الـ Webhook الخاص بالتكامل وأضفه في إعدادات المنصة (Shopify / سلة / زد / Foodics).
        عند ورود طلب مباع جديد، سيرسله النظام تلقائيًا وتظهر في قائمة &quot;مزامنة المبيعات&quot; لمراجعتها.
      </div>
    </div>
  );
}
