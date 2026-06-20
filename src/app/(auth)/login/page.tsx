"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLang } from "@/components/LanguageProvider";

type Step = "credentials" | "otp";

export default function LoginPage() {
  const router = useRouter();
  const { t, toggleLang, lang } = useLang();
  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, lang }),
      });

      if (!res.ok) {
        setError(t("common.error"));
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

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      otp,
      redirect: false,
    });

    if (result?.error) {
      setError(t("otp.invalid"));
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  async function handleResend() {
    setError("");
    setOtpSent(false);
    setLoading(true);
    try {
      await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, lang }),
      });
      setOtpSent(true);
    } finally {
      setLoading(false);
    }
  }

  if (step === "otp") {
    return (
      <div className="card">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">📧</div>
          <h1 className="text-2xl font-bold text-gray-800">{t("otp.title_login")}</h1>
          <p className="text-sm text-gray-500 mt-2">
            {t("otp.subtitle")}{" "}
            <span className="font-medium text-gray-700">{email}</span>
          </p>
        </div>

        <form onSubmit={handleVerifyOtp} className="space-y-4">
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
            {loading ? t("otp.verifying_login") : t("otp.verify_login")}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between text-sm">
          <button
            onClick={() => { setStep("credentials"); setOtp(""); setError(""); }}
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
        <h1 className="text-2xl font-bold text-gray-800">{t("login.title")}</h1>
        <button onClick={toggleLang} className="text-xs text-gray-400 hover:text-blue-600 border border-gray-200 rounded px-2 py-1">
          🌐 {t("nav.lang_toggle")}
        </button>
      </div>
      <form onSubmit={handleSendOtp} className="space-y-4">
        <div>
          <label className="label">{t("login.email")}</label>
          <input
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@domain.com"
            required
            autoComplete="email"
          />
        </div>
        <div>
          <label className="label">{t("login.password")}</label>
          <input
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
        {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? t("login.sending") : t("login.send_otp")}
        </button>
      </form>
      <p className="text-center text-sm text-gray-500 mt-4">
        {t("login.no_account")}{" "}
        <Link href="/register" className="text-blue-600 font-medium hover:underline">
          {t("login.register_link")}
        </Link>
      </p>
    </div>
  );
}
