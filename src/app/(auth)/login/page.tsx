"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="card">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">تسجيل الدخول</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">البريد الإلكتروني</label>
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
          <label className="label">كلمة المرور</label>
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
          {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
        </button>
      </form>
      <p className="text-center text-sm text-gray-500 mt-4">
        ليس لديك حساب؟{" "}
        <Link href="/register" className="text-blue-600 font-medium hover:underline">
          إنشاء حساب جديد
        </Link>
      </p>
    </div>
  );
}
