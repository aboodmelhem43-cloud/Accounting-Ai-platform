"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SUPPORTED_COUNTRIES } from "@/compliance";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    businessName: "",
    email: "",
    password: "",
    userName: "",
    country: "SA",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "حدث خطأ في التسجيل");
        return;
      }

      router.push("/login?registered=1");
    } catch {
      setError("حدث خطأ في الاتصال، يرجى المحاولة مرة أخرى");
    } finally {
      setLoading(false);
    }
  }

  const selectedCountry = SUPPORTED_COUNTRIES.find((c) => c.code === form.country);

  return (
    <div className="card">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">إنشاء حساب جديد</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">الدولة</label>
          <select name="country" className="input" value={form.country} onChange={handleChange} required>
            {SUPPORTED_COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.nameAr} — {c.currency}
              </option>
            ))}
          </select>
          {selectedCountry && (
            <p className="text-xs text-gray-400 mt-1">
              العملة: {selectedCountry.currencySymbol} ({selectedCountry.currency})
            </p>
          )}
        </div>

        <div>
          <label className="label">اسم المنشأة / الشركة</label>
          <input
            type="text"
            name="businessName"
            className="input"
            value={form.businessName}
            onChange={handleChange}
            placeholder="مثال: مؤسسة النجاح للتجارة"
            required
          />
        </div>

        <div>
          <label className="label">اسمك (اختياري)</label>
          <input
            type="text"
            name="userName"
            className="input"
            value={form.userName}
            onChange={handleChange}
            placeholder="الاسم الذي يظهر في النظام"
          />
        </div>

        <div>
          <label className="label">البريد الإلكتروني</label>
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
          <label className="label">كلمة المرور</label>
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
          <p className="text-xs text-gray-400 mt-1">لا تقل عن 8 أحرف</p>
        </div>

        {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "جاري إنشاء الحساب..." : "إنشاء الحساب"}
        </button>
      </form>
      <p className="text-center text-sm text-gray-500 mt-4">
        لديك حساب بالفعل؟{" "}
        <Link href="/login" className="text-blue-600 font-medium hover:underline">
          تسجيل الدخول
        </Link>
      </p>
    </div>
  );
}
