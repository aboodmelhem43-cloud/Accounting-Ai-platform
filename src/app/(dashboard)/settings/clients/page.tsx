"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useLang } from "@/components/LanguageProvider";
import { SUPPORTED_COUNTRIES } from "@/compliance";

interface ClientBiz {
  id: string;
  name: string;
  country: string;
  baseCurrency: string;
  plan: string;
  onboardingCompleted: boolean;
  taxNumber: string | null;
  createdAt: string;
  lsCurrentPeriodEnd: string | null;
  _count: { users: number };
}

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  FREE_TRIAL: { label: "Trial", color: "bg-gray-100 text-gray-600" },
  STARTER:    { label: "Starter", color: "bg-green-100 text-green-700" },
  PRO:        { label: "Pro", color: "bg-blue-100 text-blue-700" },
  BUSINESS:   { label: "Business", color: "bg-purple-100 text-purple-700" },
};

export default function PracticeClientsPage() {
  const { data: session, update } = useSession();
  const { lang } = useLang();
  const isAr = lang === "ar";

  const [clients, setClients] = useState<ClientBiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // New client form state
  const [newName, setNewName] = useState("");
  const [newCountry, setNewCountry] = useState(session?.user?.country ?? "EG");
  const [newTax, setNewTax] = useState("");

  const selectedCountry = SUPPORTED_COUNTRIES.find((c) => c.code === newCountry);

  const fetchClients = useCallback(async () => {
    const res = await fetch("/api/practice/clients");
    if (res.ok) {
      const d = await res.json();
      setClients(d.clients);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateMsg(null);
    setCreating(true);
    try {
      const res = await fetch("/api/practice/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          country: newCountry,
          baseCurrency: selectedCountry?.currency ?? "EGP",
          taxNumber: newTax || undefined,
        }),
      });
      const d = await res.json();
      if (res.ok) {
        setCreateMsg({ ok: true, text: isAr ? `تم إنشاء ${newName} بنجاح` : `${newName} created successfully` });
        setNewName(""); setNewTax(""); setShowForm(false);
        await fetchClients();
        // Refresh JWT so the new client appears in sidebar
        await update({});
      } else {
        setCreateMsg({ ok: false, text: d.error ?? (isAr ? "حدث خطأ" : "An error occurred") });
      }
    } catch {
      setCreateMsg({ ok: false, text: isAr ? "خطأ في الاتصال" : "Connection error" });
    } finally {
      setCreating(false);
    }
  }

  async function handleSwitch(clientId: string) {
    setSwitchingId(clientId);
    await update({ activeBusinessId: clientId });
    setSwitchingId(null);
  }

  async function handleRemove(clientId: string, clientName: string) {
    if (!confirm(isAr ? `هل تريد إزالة ${clientName} من قائمة عملائك؟` : `Remove ${clientName} from your client list?`)) return;
    setRemovingId(clientId);
    try {
      const res = await fetch(`/api/practice/clients/${clientId}`, { method: "DELETE" });
      if (res.ok) {
        await fetchClients();
        await update({});
      }
    } finally {
      setRemovingId(null);
    }
  }

  const isPracticeOwner = session?.user?.role === "OWNER";
  const activeClientId = session?.user?.businessId;
  const primaryId = session?.user?.primaryBusinessId ?? session?.user?.businessId;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isAr ? "عملاء المكتب" : "Practice Clients"}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {isAr
              ? `${clients.length} عميل تحت إدارة مكتبك — كل عميل له اشتراك مستقل`
              : `${clients.length} client${clients.length !== 1 ? "s" : ""} under your practice — each with its own subscription`}
          </p>
        </div>
        {isPracticeOwner && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {showForm ? (isAr ? "إلغاء" : "Cancel") : (isAr ? "+ إضافة عميل" : "+ Add Client")}
          </button>
        )}
      </div>

      {/* Create client form */}
      {showForm && (
        <div className="card border-purple-100">
          <h2 className="font-semibold text-gray-900 mb-4">
            {isAr ? "إضافة عميل جديد" : "Add New Client"}
          </h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isAr ? "اسم المنشأة" : "Business Name"} <span className="text-red-500">*</span>
              </label>
              <input
                className="input"
                placeholder={isAr ? "مثال: شركة النور للتجارة" : "e.g. Al-Nour Trading Co."}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isAr ? "الدولة" : "Country"}
                </label>
                <select
                  className="input"
                  value={newCountry}
                  onChange={(e) => setNewCountry(e.target.value)}
                >
                  {SUPPORTED_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.nameAr} / {c.nameEn}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isAr ? "العملة" : "Currency"}
                </label>
                <input
                  className="input bg-gray-50 cursor-not-allowed"
                  value={selectedCountry?.currency ?? "EGP"}
                  readOnly
                  dir="ltr"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isAr ? "الرقم الضريبي (اختياري)" : "Tax Number (optional)"}
              </label>
              <input
                className="input"
                placeholder={isAr ? "الرقم الضريبي" : "Tax registration number"}
                value={newTax}
                onChange={(e) => setNewTax(e.target.value)}
                dir="ltr"
              />
            </div>
            {createMsg && (
              <p className={`text-sm ${createMsg.ok ? "text-green-600" : "text-red-600"}`}>
                {createMsg.text}
              </p>
            )}
            <button
              type="submit"
              disabled={creating || !newName.trim()}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60 w-full"
            >
              {creating ? (isAr ? "جاري الإنشاء..." : "Creating...") : (isAr ? "إنشاء العميل" : "Create Client")}
            </button>
          </form>
        </div>
      )}

      {/* Clients list */}
      {clients.length === 0 ? (
        <div className="card text-center py-10">
          <div className="text-4xl mb-3">🏢</div>
          <p className="text-gray-500 text-sm">
            {isAr
              ? "لا يوجد عملاء حتى الآن. أضف أول عميل لمكتبك."
              : "No clients yet. Add your first client to get started."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {clients.map((client) => {
            const planInfo = PLAN_LABELS[client.plan] ?? { label: client.plan, color: "bg-gray-100 text-gray-600" };
            const isActive = activeClientId === client.id && activeClientId !== primaryId;
            return (
              <div
                key={client.id}
                className={`card transition-all ${isActive ? "ring-2 ring-purple-400" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-base flex-shrink-0">
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-900 truncate">{client.name}</span>
                        {isActive && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium">
                            {isAr ? "نشط" : "Active"}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="text-xs text-gray-400">{client.country} · {client.baseCurrency}</span>
                        {client.taxNumber && (
                          <span className="text-xs text-gray-400 font-mono">{client.taxNumber}</span>
                        )}
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${planInfo.color}`}>
                          {planInfo.label}
                        </span>
                        {client.lsCurrentPeriodEnd && (
                          <span className="text-xs text-gray-400">
                            {isAr ? "ينتهي" : "Renews"}{" "}
                            {new Date(client.lsCurrentPeriodEnd).toLocaleDateString(isAr ? "ar" : "en-GB")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleSwitch(client.id)}
                      disabled={switchingId === client.id || isActive}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                        isActive
                          ? "bg-purple-100 text-purple-700 cursor-default"
                          : "bg-purple-600 hover:bg-purple-700 text-white"
                      }`}
                    >
                      {switchingId === client.id
                        ? (isAr ? "..." : "...")
                        : isActive
                        ? (isAr ? "تعمل الآن" : "Viewing")
                        : (isAr ? "فتح" : "Open")}
                    </button>
                    {isPracticeOwner && (
                      <button
                        onClick={() => handleRemove(client.id, client.name)}
                        disabled={removingId === client.id}
                        className="text-xs text-red-400 hover:text-red-600 disabled:opacity-50 px-2 py-1.5"
                        title={isAr ? "إزالة من المكتب" : "Remove from practice"}
                      >
                        {removingId === client.id ? "..." : "×"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
        <p className="font-medium mb-1">
          {isAr ? "كيف يعمل نظام المكتب؟" : "How does the practice model work?"}
        </p>
        <ul className={`text-blue-700 text-xs space-y-1 mt-2 ${isAr ? "list-none" : "list-disc list-inside"}`}>
          <li>{isAr ? "• كل عميل لديه بيانات معزولة تماماً عن باقي العملاء" : "Each client has fully isolated data from other clients"}</li>
          <li>{isAr ? "• كل عميل له اشتراك مستقل يُدفع بشكل منفصل" : "Each client has their own independent subscription"}</li>
          <li>{isAr ? "• يمكنك التنقل بين العملاء بنقرة واحدة من القائمة الجانبية" : "Switch between clients with one click from the sidebar"}</li>
          <li>{isAr ? "• عملاؤك يمكنهم الوصول لحساباتهم بشكل مستقل إذا أردت" : "Clients can independently access their own account if needed"}</li>
        </ul>
      </div>
    </div>
  );
}
