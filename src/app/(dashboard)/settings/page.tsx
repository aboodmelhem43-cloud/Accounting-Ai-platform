"use client";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useLang } from "@/components/LanguageProvider";
import { SUPPORTED_COUNTRIES } from "@/compliance";

type Tab = "business" | "invoice" | "profile" | "security" | "referral" | "notifications";

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

  // Notification prefs state
  type PrefKey = "jvSubmitted" | "jvApproved" | "jvRejected" | "trialWarning" | "trialExpired";
  const [notifPrefs, setNotifPrefs] = useState<Record<PrefKey, boolean>>({
    jvSubmitted: true,
    jvApproved: true,
    jvRejected: true,
    trialWarning: true,
    trialExpired: true,
  });
  const [notifRole, setNotifRole] = useState<"OWNER" | "ACCOUNTANT">("OWNER");
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifMsg, setNotifMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Referral state
  const [referralCode, setReferralCode] = useState("");
  const [referralLink, setReferralLink] = useState("");
  const [referralCount, setReferralCount] = useState(0);
  const [referralLoading, setReferralLoading] = useState(false);
  const [copied, setCopied] = useState(false);

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

  useEffect(() => {
    if (tab !== "notifications") return;
    setNotifLoading(true);
    fetch("/api/notifications/preferences")
      .then((r) => r.json())
      .then((d) => {
        if (d.prefs) setNotifPrefs(d.prefs as Record<PrefKey, boolean>);
        if (d.role) setNotifRole(d.role);
      })
      .catch(() => {})
      .finally(() => setNotifLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function saveNotifPrefs() {
    setNotifSaving(true);
    setNotifMsg(null);
    try {
      const res = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notifPrefs),
      });
      if (res.ok) {
        setNotifMsg({ ok: true, text: isAr ? "تم حفظ تفضيلات الإشعارات" : "Notification preferences saved" });
      } else {
        setNotifMsg({ ok: false, text: isAr ? "خطأ في الحفظ" : "Error saving" });
      }
    } catch {
      setNotifMsg({ ok: false, text: isAr ? "خطأ في الاتصال" : "Connection error" });
    } finally {
      setNotifSaving(false);
    }
  }

  useEffect(() => {
    if (tab !== "referral") return;
    setReferralLoading(true);
    fetch("/api/referral")
      .then((r) => r.json())
      .then((d) => {
        setReferralCode(d.code ?? "");
        setReferralLink(d.link ?? "");
        setReferralCount(d.count ?? 0);
      })
      .catch(() => {})
      .finally(() => setReferralLoading(false));
  }, [tab]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select the text
    }
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: "business", label: t("settings.tab.business") },
    { id: "invoice", label: isAr ? "إعدادات الفاتورة" : "Invoice" },
    { id: "profile", label: t("settings.tab.profile") },
    { id: "security", label: t("settings.tab.security") },
    { id: "referral", label: isAr ? "الإحالة" : "Referral" },
    { id: "notifications", label: isAr ? "الإشعارات" : "Notifications" },
  ];

  return (
    <div className="max-w-2xl space-y-6" dir={isAr ? "rtl" : "ltr"}>
      <h1 className="text-2xl font-bold text-gray-900">{t("settings.title")}</h1>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto scrollbar-hide">
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

      {/* Referral Tab */}
      {tab === "referral" && (
        <div className="card space-y-6">
          <div>
            <h2 className="font-semibold text-gray-800 text-lg">
              🎁 {isAr ? "أدعُ أصدقاءك — كلاكما يربح!" : "Invite Friends — You Both Win!"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {isAr
                ? "لكل شخص يسجّل باستخدام رابطك، تحصل أنت و هو على 30 يومًا إضافية مجانية."
                : "For every person who signs up using your link, you both get 30 extra free days."}
            </p>
          </div>

          {referralLoading ? (
            <div className="h-20 animate-pulse bg-gray-100 rounded-xl" />
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
                  {isAr ? "كودك الخاص" : "Your Referral Code"}
                </label>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-2xl font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-xl px-6 py-3 tracking-widest">
                    {referralCode}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
                  {isAr ? "رابط الإحالة" : "Referral Link"}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={referralLink}
                    className="input text-sm font-mono text-gray-600 flex-1"
                    onFocus={(e) => e.target.select()}
                  />
                  <button
                    onClick={copyLink}
                    className="btn-secondary text-sm px-4 py-2 flex-shrink-0"
                  >
                    {copied
                      ? (isAr ? "✅ تم النسخ" : "✅ Copied!")
                      : (isAr ? "📋 نسخ" : "📋 Copy")}
                  </button>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="text-3xl font-bold text-green-700">{referralCount}</div>
                <div className="text-sm text-green-600 mt-0.5">
                  {isAr
                    ? referralCount === 1 ? "إحالة ناجحة واحدة" : referralCount === 2 ? "إحالتان ناجحتان" : `${referralCount} إحالات ناجحة`
                    : referralCount === 1 ? "successful referral" : "successful referrals"}
                </div>
                <div className="text-xs text-green-500 mt-2">
                  {isAr
                    ? `حصلت على ${referralCount * 30} يومًا مجانيًا بفضل الإحالات`
                    : `You've earned ${referralCount * 30} free days through referrals`}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  {isAr ? "كيف يعمل؟" : "How it works"}
                </h3>
                <ol className="space-y-2">
                  {[
                    isAr ? "أرسل رابطك لصديق أو زميل" : "Share your link with a friend or colleague",
                    isAr ? "يسجّل باستخدام رابطك" : "They sign up using your link",
                    isAr ? "يحصل كلاكما فورًا على 30 يومًا إضافية مجانية" : "You both instantly get 30 extra free days",
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                      <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            </>
          )}
        </div>
      )}
      {/* Notifications Tab */}
      {tab === "notifications" && (
        <div className="card space-y-6">
          <div>
            <h2 className="font-semibold text-gray-800 text-lg">
              🔔 {isAr ? "تفضيلات البريد الإلكتروني" : "Email Notification Preferences"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {isAr
                ? "اختر الإشعارات التي تريد تلقّيها عبر البريد الإلكتروني"
                : "Choose which notifications you want to receive by email"}
            </p>
          </div>

          {notifLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {([
                {
                  key: "jvSubmitted" as const,
                  icon: "📋",
                  label: isAr ? "تقديم قيد للمراجعة" : "Journal entry submitted for review",
                  desc: isAr
                    ? "عندما يقدّم محاسب قيداً يحتاج موافقتك"
                    : "When an accountant submits a journal entry for your approval",
                  roles: ["OWNER"],
                },
                {
                  key: "jvApproved" as const,
                  icon: "✅",
                  label: isAr ? "الموافقة على قيدي" : "My journal entry approved",
                  desc: isAr
                    ? "عندما يوافق المالك على قيد قدّمته"
                    : "When the owner approves a journal entry you submitted",
                  roles: ["ACCOUNTANT"],
                },
                {
                  key: "jvRejected" as const,
                  icon: "❌",
                  label: isAr ? "رفض قيدي" : "My journal entry rejected",
                  desc: isAr
                    ? "عندما يرفض المالك قيداً قدّمته"
                    : "When the owner rejects a journal entry you submitted",
                  roles: ["ACCOUNTANT"],
                },
                {
                  key: "trialWarning" as const,
                  icon: "⏳",
                  label: isAr ? "تحذير انتهاء التجربة المجانية" : "Trial expiry warning",
                  desc: isAr
                    ? "تنبيه قبل انتهاء فترة التجربة المجانية"
                    : "Reminder a few days before your free trial ends",
                  roles: ["OWNER"],
                },
                {
                  key: "trialExpired" as const,
                  icon: "🔔",
                  label: isAr ? "انتهاء التجربة المجانية" : "Trial expired",
                  desc: isAr
                    ? "إشعار عند انتهاء فترة التجربة"
                    : "Notification when your free trial has ended",
                  roles: ["OWNER"],
                },
              ] as { key: PrefKey; icon: string; label: string; desc: string; roles: string[] }[]).map(
                ({ key, icon, label, desc, roles }) => {
                  const relevant = roles.includes(notifRole);
                  return (
                    <label
                      key={key}
                      className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                        notifPrefs[key]
                          ? "border-blue-200 bg-blue-50/40"
                          : "border-gray-200 bg-white"
                      } ${!relevant ? "opacity-50" : ""}`}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        <div className={`relative w-11 h-6 rounded-full transition-colors ${
                          notifPrefs[key] ? "bg-blue-600" : "bg-gray-300"
                        }`}>
                          <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                            notifPrefs[key] ? "translate-x-5" : "translate-x-0.5"
                          }`} />
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={notifPrefs[key]}
                            disabled={!relevant}
                            onChange={(e) =>
                              setNotifPrefs((prev) => ({ ...prev, [key]: e.target.checked }))
                            }
                          />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span>{icon}</span>
                          <span className="font-medium text-gray-800 text-sm">{label}</span>
                          {!relevant && (
                            <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                              {roles.includes("OWNER")
                                ? (isAr ? "للمالك فقط" : "Owner only")
                                : (isAr ? "للمحاسب فقط" : "Accountant only")}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                      </div>
                    </label>
                  );
                }
              )}
            </div>
          )}

          {notifMsg && (
            <p className={`text-sm ${notifMsg.ok ? "text-green-600" : "text-red-600"}`}>
              {notifMsg.text}
            </p>
          )}

          <button
            onClick={saveNotifPrefs}
            disabled={notifSaving || notifLoading}
            className="btn-primary"
          >
            {notifSaving
              ? (isAr ? "جاري الحفظ..." : "Saving...")
              : (isAr ? "حفظ التفضيلات" : "Save Preferences")}
          </button>
        </div>
      )}
    </div>
  );
}
