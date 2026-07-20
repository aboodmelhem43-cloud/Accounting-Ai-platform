"use client";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useLang } from "@/components/LanguageProvider";
import { SUPPORTED_COUNTRIES } from "@/compliance";

type Tab = "business" | "invoice" | "profile" | "security";

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const { t, lang } = useLang();
  const isAr = lang === "ar";
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<Tab>("business");

  // Business form
  const [bName, setBName] = useState(session?.user?.businessName ?? "");
  const [bCountry, setBCountry] = useState(session?.user?.country ?? "EG");
  const [bTaxNumber, setBTaxNumber] = useState("");
  const [bAddress, setBAddress] = useState("");
  const [bPhone, setBPhone] = useState("");
  const [bLogo, setBLogo] = useState<string>("");
  const [bSaving, setBSaving] = useState(false);
  const [bMsg, setBMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const selectedCountry = SUPPORTED_COUNTRIES.find((c) => c.code === bCountry);

  // Invoice settings form
  const [iPrefix, setIPrefix] = useState("INV");
  const [iSeed, setISeed] = useState(0);
  const [iPaymentTerms, setIPaymentTerms] = useState("");
  const [iSaving, setISaving] = useState(false);
  const [iMsg, setIMsg] = useState<{ ok: boolean; text: string } | null>(null);

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

  useEffect(() => {
    if (!session) return;
    fetch("/api/settings/business-info")
      .then((r) => r.json())
      .then((d) => {
        setBName(d.name ?? "");
        setBCountry(d.country ?? session.user.country ?? "EG");
        setBTaxNumber(d.taxNumber ?? "");
        setBAddress(d.address ?? "");
        setBPhone(d.phone ?? "");
        setBLogo(d.logo ?? "");
        setIPrefix(d.invoiceNumberPrefix ?? "INV");
        setISeed(d.invoiceNumberSeed ?? 0);
        setIPaymentTerms(d.defaultPaymentTerms ?? "");
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.businessId]);

  function handleLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 400 * 1024) {
      setBMsg({ ok: false, text: isAr ? "حجم الشعار يجب أن يكون أقل من 400 كيلوبايت" : "Logo must be under 400 KB" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setBLogo(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function saveBusiness() {
    setBSaving(true);
    setBMsg(null);
    try {
      const res = await fetch("/api/settings/business", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: bName,
          country: bCountry,
          baseCurrency: selectedCountry?.currency ?? "",
          taxNumber: bTaxNumber || null,
          address: bAddress || null,
          phone: bPhone || null,
          logo: bLogo || null,
        }),
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

  async function saveInvoiceSettings() {
    setISaving(true);
    setIMsg(null);
    try {
      const res = await fetch("/api/settings/business", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: bName || session?.user?.businessName || "Business",
          invoiceNumberPrefix: iPrefix,
          invoiceNumberSeed: iSeed,
          defaultPaymentTerms: iPaymentTerms || null,
        }),
      });
      if (res.ok) {
        setIMsg({ ok: true, text: isAr ? "تم حفظ إعدادات الفاتورة" : "Invoice settings saved" });
      } else {
        const d = await res.json();
        setIMsg({ ok: false, text: d.error ?? "Error" });
      }
    } catch {
      setIMsg({ ok: false, text: isAr ? "خطأ في الاتصال" : "Connection error" });
    } finally {
      setISaving(false);
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
        setPwCurrent(""); setPwNew(""); setPwConfirm("");
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

  const TABS: { id: Tab; label: string }[] = [
    { id: "business", label: t("settings.tab.business") },
    { id: "invoice", label: isAr ? "إعدادات الفاتورة" : "Invoice" },
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
          {/* Logo upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {isAr ? "شعار المنشأة" : "Business Logo"}
            </label>
            <div className="flex items-center gap-4">
              {bLogo ? (
                <img src={bLogo} alt="logo" className="h-16 w-auto max-w-[160px] object-contain rounded border border-gray-200 bg-gray-50 p-1" />
              ) : (
                <div className="h-16 w-28 rounded border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-gray-400 text-xs">
                  {isAr ? "لا يوجد شعار" : "No logo"}
                </div>
              )}
              <div className="space-y-1">
                <button onClick={() => logoInputRef.current?.click()} className="btn-secondary text-sm py-1.5 px-3">
                  {isAr ? "رفع شعار" : "Upload Logo"}
                </button>
                {bLogo && (
                  <button onClick={() => setBLogo("")} className="block text-xs text-red-500 hover:text-red-700">
                    {isAr ? "حذف الشعار" : "Remove"}
                  </button>
                )}
                <p className="text-xs text-gray-400">{isAr ? "PNG/JPG · حد أقصى 400 كيلوبايت" : "PNG/JPG · max 400 KB"}</p>
              </div>
            </div>
            <input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={handleLogoFile} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("settings.business.name")}</label>
            <input className="input" value={bName} onChange={(e) => setBName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("settings.business.country")}</label>
              <select className="input" value={bCountry} onChange={(e) => setBCountry(e.target.value)}>
                {SUPPORTED_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{isAr ? c.nameAr : c.nameEn}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("settings.business.currency")}</label>
              <input className="input bg-gray-50 cursor-not-allowed" value={selectedCountry?.currency ?? session?.user?.currency ?? ""} readOnly />
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
          {bMsg && <p className={`text-sm ${bMsg.ok ? "text-green-600" : "text-red-600"}`}>{bMsg.text}</p>}
          <button onClick={saveBusiness} disabled={bSaving || !bName.trim()} className="btn-primary">
            {bSaving ? (isAr ? "جاري الحفظ..." : "Saving...") : t("settings.business.save")}
          </button>
        </div>
      )}

      {/* Invoice Settings Tab */}
      {tab === "invoice" && (
        <div className="card space-y-4">
          <div>
            <h2 className="text-base font-semibold text-gray-800 mb-1">
              {isAr ? "تسلسل أرقام الفواتير" : "Invoice Numbering"}
            </h2>
            <p className="text-xs text-gray-400 mb-4">
              {isAr
                ? "الفواتير الجديدة ستُرقَّم تلقائياً بهذا التنسيق: {بادئة}-0001"
                : "New invoices will be auto-numbered as: {prefix}-0001"}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isAr ? "البادئة (Prefix)" : "Prefix"}
                </label>
                <input
                  className="input font-mono uppercase"
                  value={iPrefix}
                  onChange={(e) => setIPrefix(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ""))}
                  maxLength={10}
                  placeholder="INV"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isAr ? "رقم البداية التالي" : "Next Number (seed)"}
                </label>
                <input
                  className="input font-mono"
                  type="number"
                  min={0}
                  value={iSeed}
                  onChange={(e) => setISeed(Math.max(0, parseInt(e.target.value) || 0))}
                />
                <p className="text-xs text-gray-400 mt-1">
                  {isAr ? `الفاتورة التالية: ${iPrefix}-${String(iSeed + 1).padStart(4, "0")}` : `Next invoice: ${iPrefix}-${String(iSeed + 1).padStart(4, "0")}`}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <h2 className="text-base font-semibold text-gray-800 mb-1">
              {isAr ? "شروط الدفع الافتراضية" : "Default Payment Terms"}
            </h2>
            <p className="text-xs text-gray-400 mb-3">
              {isAr ? "ستُضاف تلقائياً في حقل الملاحظات عند إنشاء فاتورة جديدة" : "Auto-filled in the notes field when creating a new invoice"}
            </p>
            <input
              className="input"
              value={iPaymentTerms}
              onChange={(e) => setIPaymentTerms(e.target.value)}
              placeholder={isAr ? "مثال: الدفع خلال 30 يوماً" : "e.g. Payment due within 30 days"}
              maxLength={100}
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {["Net 30", "Net 15", "Net 60", "Due on receipt"].map((t) => (
                <button key={t} onClick={() => setIPaymentTerms(t)} className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                  {t}
                </button>
              ))}
            </div>
          </div>

          {iMsg && <p className={`text-sm ${iMsg.ok ? "text-green-600" : "text-red-600"}`}>{iMsg.text}</p>}
          <button onClick={saveInvoiceSettings} disabled={iSaving || !iPrefix.trim()} className="btn-primary">
            {iSaving ? (isAr ? "جاري الحفظ..." : "Saving...") : (isAr ? "حفظ إعدادات الفاتورة" : "Save Invoice Settings")}
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
          {pMsg && <p className={`text-sm ${pMsg.ok ? "text-green-600" : "text-red-600"}`}>{pMsg.text}</p>}
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
            <input type="password" className="input" value={pwCurrent} onChange={(e) => setPwCurrent(e.target.value)} autoComplete="current-password" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("settings.password.new")}</label>
            <input type="password" className="input" value={pwNew} onChange={(e) => setPwNew(e.target.value)} autoComplete="new-password" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("settings.password.confirm")}</label>
            <input type="password" className="input" value={pwConfirm} onChange={(e) => setPwConfirm(e.target.value)} autoComplete="new-password" />
          </div>
          {pwMsg && <p className={`text-sm ${pwMsg.ok ? "text-green-600" : "text-red-600"}`}>{pwMsg.text}</p>}
          <button onClick={changePassword} disabled={pwSaving || !pwCurrent || !pwNew || !pwConfirm} className="btn-primary">
            {pwSaving ? (isAr ? "جاري التغيير..." : "Changing...") : t("settings.password.save")}
          </button>
        </div>
      )}
    </div>
  );
}
