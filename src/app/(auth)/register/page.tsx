"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SUPPORTED_COUNTRIES } from "@/compliance";
import { useLang } from "@/components/LanguageProvider";

type Step = "form" | "otp";

export default function RegisterPage() {
  const router = useRouter();
  const { t, toggleLang, lang } = useLang();
  const [step, setStep] = useState<Step>("form");
  const [form, setForm] = useState({
    businessName: "",
    email: "",
    password: "",
    userName: "",
    country: "SA",
  });
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/register/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, lang }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("common.error"));
        return;
      }

      setStep("otp");
      setOtpSent(true);
    } catch {
      setError(t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyAndCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, otp }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("common.error"));
        return;
      }

      router.push("/login?registered=1");
    } catch {
      setError(t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError("");
    setOtpSent(false);
    setLoading(true);
    try {
      await fetch("/api/register/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, lang }),
      });
      setOtpSent(true);
    } finally {
      setLoading(false);
    }
  }

  const selectedCountry = SUPPORTED_COUNTRIES.find((c) => c.code === form.country);

  if (step === "otp") {
    return (
      <div className="card">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">📧</div>
          <h1 className="text-2xl font-bold text-gray-800">{t("otp.title_register")}</h1>
          <p className="text-sm text-gray-500 mt-2">
            {t("otp.subtitle")}{" "}
            <span className="font-medium text-gray-700">{form.email}</span>
          </p>
        </div>

        <form onSubmit={handleVerifyAndCreate} className="space-y-4">
          <div>
            <label className="label">{t("otp.label")}</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              className="input text-center text-2xl font-bold tracking-[0.5em]"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder={t("otp.placeholder")}
              required
              autoFocus
              autoComplete="one-time-code"
            />
            <p className="text-xs text-gray-400 mt-1 text-center">{t("otp.expiry")}</p>
          </div>

          {otpSent && !error && (
            <p className="text-green-600 text-sm bg-green-50 p-3 rounded-lg text-center">
              {t("otp.sent_success")}
            </p>
          )}
          {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}

          <button type="submit" className="btn-primary w-full" disabled={loading || otp.length !== 6}>
            {loading ? t("otp.verifying_register") : t("otp.verify_register")}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between text-sm">
          <button
            onClick={() => { setStep("form"); setOtp(""); setError(""); }}
            className="text-gray-500 hover:text-gray-700"
          >
            ← {t("otp.back")}
          </button>
          <button onClick={handleResend} disabled={loading} className="text-blue-600 hover:underline disabled:opacity-50">
            {t("otp.resend")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t("register.title")}</h1>
        <button onClick={toggleLang} className="text-xs text-gray-400 hover:text-blue-600 border border-gray-200 rounded px-2 py-1">
          🌐 {t("nav.lang_toggle")}
        </button>
      </div>
      <form onSubmit={handleSendOtp} className="space-y-4">
        <div>
          <label className="label">{t("register.country")}</label>
          <select name="country" className="input" value={form.country} onChange={handleChange} required>
            {SUPPORTED_COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.nameAr} — {c.currency}
              </option>
            ))}
          </select>
          {selectedCountry && (
            <p className="text-xs text-gray-400 mt-1">
              {t("register.currency")}: {selectedCountry.currencySymbol} ({selectedCountry.currency})
            </p>
          )}
        </div>

        <div>
          <label className="label">{t("register.business_name")}</label>
          <input
            type="text"
            name="businessName"
            className="input"
            value={form.businessName}
            onChange={handleChange}
            placeholder={t("register.business_placeholder")}
            required
          />
        </div>

        <div>
          <label className="label">{t("register.user_name")}</label>
          <input
            type="text"
            name="userName"
            className="input"
            value={form.userName}
            onChange={handleChange}
            placeholder={t("register.user_placeholder")}
          />
        </div>

        <div>
          <label className="label">{t("register.email")}</label>
          <input
            type="email"
            name="email"
            className="input"
            value={form.email}
            onChange={handleChange}
            placeholder="example@domain.com"
            required
            autoComplete="email"
          />
        </div>

        <div>
          <label className="label">{t("register.password")}</label>
          <input
            type="password"
            name="password"
            className="input"
            value={form.password}
            onChange={handleChange}
            required
            minLength={8}
            autoComplete="new-password"
          />
          <p className="text-xs text-gray-400 mt-1">{t("register.password_hint")}</p>
        </div>

        {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? t("register.sending") : t("register.send_otp")}
        </button>
      </form>
      <p className="text-center text-sm text-gray-500 mt-4">
        {t("register.has_account")}{" "}
        <Link href="/login" className="text-blue-600 font-medium hover:underline">
          {t("register.login_link")}
        </Link>
      </p>
    </div>
  );
}
