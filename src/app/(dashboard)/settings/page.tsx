"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useLang } from "@/components/LanguageProvider";
import { SUPPORTED_COUNTRIES } from "@/compliance";

type Tab = "business" | "profile" | "security";

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const { t, lang } = useLang();
  const isAr = lang === "ar";

  const [tab, setTab] = useState<Tab>("business");

  // Business form
  const [bName, setBName] = useState(session?.user?.businessName ?? "");
  const [bTaxNumber, setBTaxNumber] = useState("");
  const [bAddress, setBAddress] = useState("");
  const [bPhone, setBPhone] = useState("");
  const [bSaving, setBSaving] = useState(false);
  const [bMsg, setBMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Profile form
  const [pName, setPName] = useState(session?.user?.name ?? "");
  const [pSaving, setPSaving] = useState(false);
  const [pMsg, setPMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Password form
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Load business data on first render from API
  const [loaded, setLoaded] = useState(false);
  if (!loaded && session) {
    setLoaded(true);
    fetch("/api/settings/business-info")
      .then((r) => r.json())
      .then((d) => {
        setBName(d.name ?? "");
        setBTaxNumber(d.taxNumber ?? "");
        setBAddress(d.address ?? "");
        setBPhone(d.phone ?? "");
      })
      .catch(() => {});
  }

  async function saveBusiness() {
    setBSaving(true);
    setBMsg(null);
    try {
      const res = await fetch("/api/settings/business", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: bName, taxNumber: bTaxNumber || null, address: bAddress || null, phone: bPhone || null }),
      });
      if (res.ok) {
        setBMsg({ ok: true, text: t("settings.business.saved") });
        await updateSession();
      } else {
        const d = await res.json();
        setBMsg({ ok: false, text: d.error ?? "Error" });
      }
    } catch {
      setBMsg({ ok: false, text: isAr ? "خطأ في الاتصال" : "Connection error" });
    } finally {
      setBSaving(false);
    }
  }

  async function saveProfile() {
    setPSaving(true);
    setPMsg(null);
    try {
      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: pName }),
      });
      if (res.ok) {
        setPMsg({ ok: true, text: t("settings.profile.saved") });
      } else {
        const d = await res.json();
        setPMsg({ ok: false, text: d.error ?? "Error" });
      }
    } catch {
      setPMsg({ ok: false, text: isAr ? "خطأ في الاتصال" : "Connection error" });
    } finally {
      setPSaving(false);
    }
  }

  async function changePassword() {
    setPwMsg(null);
    if (pwNew !== pwConfirm) {
      setPwMsg({ ok: false, text: t("settings.password.error.mismatch") });
      return;
    }
    if (pwNew.length < 8) {
      setPwMsg({ ok: false, text: t("settings.password.error.too_short") });
      return;
    }
    setPwSaving(true);
    try {
      const res = await fetch("/api/settings/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: pwCurrent, newPassword: pwNew }),
      });
      if (res.ok) {
        setPwMsg({ ok: true, text: t("settings.password.saved") });
        setPwCurrent("");
        setPwNew("");
        setPwConfirm("");
      } else {
        const d = await res.json();
        const txt = d.error === "wrong_current" ? t("settings.password.error.wrong_current") : (d.error ?? "Error");
        setPwMsg({ ok: false, text: txt });
      }
    } catch {
      setPwMsg({ ok: false, text: isAr ? "خطأ في الاتصال" : "Connection error" });
    } finally {
      setPwSaving(false);
    }
  }

  const countryName = SUPPORTED_COUNTRIES.find((c) => c.code === session?.user?.country);

  const TABS: { id: Tab; label: string }[] = [
    { id: "business", label: t("settings.tab.business") },
    { id: "profile", label: t("settings.tab.profile") },
    { id: "security", label: t("settings.tab.security") },
  ];

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t("settings.title")}</h1>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map((tb) => (
          <button
            key={tb.id}
            onClick={() => setTab(tb.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === tb.id ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {/* Business Tab */}
      {tab === "business" && (
        <div className="card space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("settings.business.name")}</label>
            <input className="input" value={bName} onChange={(e) => setBName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("settings.business.country")}</label>
              <input
                className="input bg-gray-50 cursor-not-allowed"
                value={countryName ? (isAr ? countryName.nameAr : countryName.nameEn) : (session?.user?.country ?? "")}
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("settings.business.currency")}</label>
              <input className="input bg-gray-50 cursor-not-allowed" value={session?.user?.currency ?? ""} readOnly />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("settings.business.tax_number")}</label>
            <input className="input" value={bTaxNumber} onChange={(e) => setBTaxNumber(e.target.value)} placeholder="—" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("settings.business.address")}</label>
            <input className="input" value={bAddress} onChange={(e) => setBAddress(e.target.value)} placeholder="—" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("settings.business.phone")}</label>
            <input className="input" value={bPhone} onChange={(e) => setBPhone(e.target.value)} placeholder="—" />
          </div>
          {bMsg && (
            <p className={`text-sm ${bMsg.ok ? "text-green-600" : "text-red-600"}`}>{bMsg.text}</p>
          )}
          <button onClick={saveBusiness} disabled={bSaving || !bName.trim()} className="btn-primary">
            {bSaving ? (isAr ? "جاري الحفظ..." : "Saving...") : t("settings.business.save")}
          </button>
        </div>
      )}

      {/* Profile Tab */}
      {tab === "profile" && (
        <div className="card space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("settings.profile.name")}</label>
            <input className="input" value={pName} onChange={(e) => setPName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("settings.profile.email")}</label>
            <input className="input bg-gray-50 cursor-not-allowed" value={session?.user?.email ?? ""} readOnly />
            <p className="text-xs text-gray-400 mt-1">{t("settings.profile.email_hint")}</p>
          </div>
          {pMsg && (
            <p className={`text-sm ${pMsg.ok ? "text-green-600" : "text-red-600"}`}>{pMsg.text}</p>
          )}
          <button onClick={saveProfile} disabled={pSaving || !pName.trim()} className="btn-primary">
            {pSaving ? (isAr ? "جاري الحفظ..." : "Saving...") : t("settings.profile.save")}
          </button>
        </div>
      )}

      {/* Security Tab */}
      {tab === "security" && (
        <div className="card space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("settings.password.current")}</label>
            <input
              type="password"
              className="input"
              value={pwCurrent}
              onChange={(e) => setPwCurrent(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("settings.password.new")}</label>
            <input
              type="password"
              className="input"
              value={pwNew}
              onChange={(e) => setPwNew(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("settings.password.confirm")}</label>
            <input
              type="password"
              className="input"
              value={pwConfirm}
              onChange={(e) => setPwConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          {pwMsg && (
            <p className={`text-sm ${pwMsg.ok ? "text-green-600" : "text-red-600"}`}>{pwMsg.text}</p>
          )}
          <button onClick={changePassword} disabled={pwSaving || !pwCurrent || !pwNew || !pwConfirm} className="btn-primary">
            {pwSaving ? (isAr ? "جاري التغيير..." : "Changing...") : t("settings.password.save")}
          </button>
        </div>
      )}
    </div>
  );
}
