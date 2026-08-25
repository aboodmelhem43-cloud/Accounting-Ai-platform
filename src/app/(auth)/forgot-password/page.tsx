"use client";
import { useState } from "react";
import Link from "next/link";
import { useLang } from "@/components/LanguageProvider";

export default function ForgotPasswordPage() {
  const { lang } = useLang();
  const isAr = lang === "ar";

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, lang }),
      });
      setSent(true);
    } catch {
      setError(isAr ? "حدث خطأ، حاول مرة أخرى" : "Something went wrong, please try again");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="card text-center space-y-4">
        <div className="text-5xl">📧</div>
        <h1 className="text-xl font-bold text-gray-800">
          {isAr ? "تحقق من بريدك الإلكتروني" : "Check your email"}
        </h1>
        <p className="text-gray-500 text-sm">
          {isAr
            ? `إذا كان البريد الإلكتروني ${email} مسجلاً لدينا، ستصلك رسالة بها رابط إعادة تعيين كلمة المرور خلال دقائق.`
            : `If ${email} is registered with us, you'll receive a password reset link within a few minutes.`}
        </p>
        <p className="text-xs text-gray-400">
          {isAr ? "الرابط صالح لمدة ساعة واحدة." : "The link is valid for 1 hour."}
        </p>
        <Link href="/login" className="btn-secondary inline-flex">
          {isAr ? "← العودة لتسجيل الدخول" : "← Back to login"}
        </Link>
      </div>
    );
  }

  return (
    <div className="card space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          {isAr ? "نسيت كلمة المرور؟" : "Forgot your password?"}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {isAr
            ? "أدخل بريدك الإلكتروني وسنرسل لك رابطًا لإعادة تعيين كلمة المرور."
            : "Enter your email and we'll send you a link to reset your password."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">{isAr ? "البريد الإلكتروني" : "Email address"}</label>
          <input
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@domain.com"
            required
            autoComplete="email"
            autoFocus
          />
        </div>

        {error && (
          <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</p>
        )}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading
            ? (isAr ? "جاري الإرسال..." : "Sending...")
            : (isAr ? "إرسال رابط إعادة التعيين" : "Send reset link")}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500">
        <Link href="/login" className="text-blue-600 hover:underline">
          {isAr ? "← العودة لتسجيل الدخول" : "← Back to login"}
        </Link>
      </p>
    </div>
  );
}
