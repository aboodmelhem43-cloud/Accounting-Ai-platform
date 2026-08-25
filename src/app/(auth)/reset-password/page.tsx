"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLang } from "@/components/LanguageProvider";

function ResetPasswordForm() {
  const { lang } = useLang();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAr = lang === "ar";

  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <div className="card text-center space-y-4">
        <div className="text-4xl">❌</div>
        <p className="text-gray-700 font-medium">
          {isAr ? "رابط إعادة التعيين غير صالح." : "Invalid reset link."}
        </p>
        <Link href="/forgot-password" className="btn-secondary inline-flex">
          {isAr ? "طلب رابط جديد" : "Request a new link"}
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError(isAr ? "كلمتا المرور غير متطابقتين" : "Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError(isAr ? "كلمة المرور يجب أن تكون 8 أحرف على الأقل" : "Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(
          data.error === "الرابط غير صالح أو منتهي الصلاحية"
            ? (isAr ? "الرابط غير صالح أو منتهي الصلاحية. يرجى طلب رابط جديد." : "Link is invalid or expired. Please request a new one.")
            : (isAr ? "حدث خطأ، حاول مرة أخرى" : "Something went wrong, please try again")
        );
      } else {
        setDone(true);
        setTimeout(() => router.push("/login"), 2500);
      }
    } catch {
      setError(isAr ? "حدث خطأ، حاول مرة أخرى" : "Something went wrong, please try again");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="card text-center space-y-4">
        <div className="text-5xl">✅</div>
        <h1 className="text-xl font-bold text-gray-800">
          {isAr ? "تم تغيير كلمة المرور!" : "Password changed!"}
        </h1>
        <p className="text-gray-500 text-sm">
          {isAr ? "سيتم تحويلك لصفحة تسجيل الدخول..." : "Redirecting you to login..."}
        </p>
      </div>
    );
  }

  return (
    <div className="card space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          {isAr ? "إعادة تعيين كلمة المرور" : "Reset your password"}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {isAr ? "أدخل كلمة المرور الجديدة" : "Enter your new password"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">{isAr ? "كلمة المرور الجديدة" : "New password"}</label>
          <input
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
            autoComplete="new-password"
            autoFocus
          />
          <p className="text-xs text-gray-400 mt-1">
            {isAr ? "8 أحرف على الأقل" : "At least 8 characters"}
          </p>
        </div>
        <div>
          <label className="label">{isAr ? "تأكيد كلمة المرور" : "Confirm password"}</label>
          <input
            type="password"
            className="input"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            autoComplete="new-password"
          />
        </div>

        {error && (
          <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</p>
        )}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading
            ? (isAr ? "جاري الحفظ..." : "Saving...")
            : (isAr ? "حفظ كلمة المرور الجديدة" : "Save new password")}
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

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
