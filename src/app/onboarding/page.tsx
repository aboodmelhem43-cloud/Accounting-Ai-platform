"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/LanguageProvider";
import Link from "next/link";

const ACCOUNTS_PREVIEW = [
  { code: "1100", nameAr: "النقدية والبنوك", nameEn: "Cash & Banks", type: "ASSET" },
  { code: "1200", nameAr: "المدينون والعملاء", nameEn: "Accounts Receivable", type: "ASSET" },
  { code: "1300", nameAr: "المخزون", nameEn: "Inventory", type: "ASSET" },
  { code: "2100", nameAr: "الدائنون والموردون", nameEn: "Accounts Payable", type: "LIABILITY" },
  { code: "2200", nameAr: "ضريبة القيمة المضافة المستحقة", nameEn: "VAT Payable", type: "LIABILITY" },
  { code: "3100", nameAr: "حقوق الملكية", nameEn: "Owner Equity", type: "EQUITY" },
  { code: "4100", nameAr: "إيرادات المبيعات", nameEn: "Sales Revenue", type: "REVENUE" },
  { code: "4200", nameAr: "إيرادات الخدمات", nameEn: "Service Revenue", type: "REVENUE" },
  { code: "5100", nameAr: "تكلفة البضاعة المباعة", nameEn: "Cost of Goods Sold", type: "EXPENSE" },
  { code: "5200", nameAr: "المصروفات التشغيلية", nameEn: "Operating Expenses", type: "EXPENSE" },
  { code: "5400", nameAr: "الرواتب والأجور", nameEn: "Salaries", type: "EXPENSE" },
  { code: "5500", nameAr: "الإيجار", nameEn: "Rent", type: "EXPENSE" },
];

const TYPE_COLORS: Record<string, string> = {
  ASSET: "bg-blue-50 text-blue-700",
  LIABILITY: "bg-orange-50 text-orange-700",
  EQUITY: "bg-purple-50 text-purple-700",
  REVENUE: "bg-green-50 text-green-700",
  EXPENSE: "bg-red-50 text-red-700",
};

const TYPE_LABELS: Record<string, { ar: string; en: string }> = {
  ASSET: { ar: "أصول", en: "Asset" },
  LIABILITY: { ar: "خصوم", en: "Liability" },
  EQUITY: { ar: "ملكية", en: "Equity" },
  REVENUE: { ar: "إيرادات", en: "Revenue" },
  EXPENSE: { ar: "مصروفات", en: "Expense" },
};

export default function OnboardingPage() {
  const { lang } = useLang();
  const { data: session, update } = useSession();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Step 1 fields
  const [name, setName] = useState(session?.user?.businessName ?? "");
  const [taxNumber, setTaxNumber] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");

  const isAr = lang === "ar";

  async function saveStep1() {
    if (!name.trim()) {
      setError(isAr ? "اسم المنشأة مطلوب" : "Business name is required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: 1, name: name.trim(), taxNumber, address, phone }),
      });
      if (!res.ok) throw new Error();
      setStep(2);
    } catch {
      setError(isAr ? "حدث خطأ، حاول مرة أخرى" : "Something went wrong, try again");
    } finally {
      setSaving(false);
    }
  }

  async function completeOnboarding() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: 3 }),
      });
      if (!res.ok) throw new Error();
      // تحديث جلسة NextAuth لتعكس اكتمال الـ onboarding
      await update();
      setStep(3);
    } catch {
      setError(isAr ? "حدث خطأ، حاول مرة أخرى" : "Something went wrong, try again");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pb-12">
      {/* شريط التقدم */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                step > s
                  ? "bg-green-500 text-white"
                  : step === s
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-400"
              }`}
            >
              {step > s ? "✓" : s}
            </div>
            {s < 3 && (
              <div className={`w-16 h-1 rounded ${step > s ? "bg-green-400" : "bg-gray-200"}`} />
            )}
          </div>
        ))}
      </div>

      {/* الخطوة 1: معلومات المنشأة */}
      {step === 1 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isAr ? "مرحبًا! لنبدأ بإعداد منشأتك 🏢" : "Welcome! Let's set up your business 🏢"}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {isAr ? "أدخل بيانات منشأتك الأساسية" : "Enter your basic business details"}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="label">{isAr ? "اسم المنشأة *" : "Business Name *"}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                placeholder={isAr ? "مثال: شركة النور للتجارة" : "e.g. Acme Trading Co."}
              />
            </div>
            <div>
              <label className="label">{isAr ? "الرقم الضريبي (اختياري)" : "Tax Number (optional)"}</label>
              <input
                type="text"
                value={taxNumber}
                onChange={(e) => setTaxNumber(e.target.value)}
                className="input"
                placeholder={isAr ? "رقم تسجيل ضريبة القيمة المضافة" : "VAT registration number"}
              />
            </div>
            <div>
              <label className="label">{isAr ? "العنوان (اختياري)" : "Address (optional)"}</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="input"
                placeholder={isAr ? "مثال: الرياض، حي العليا" : "e.g. Riyadh, Al Olaya"}
              />
            </div>
            <div>
              <label className="label">{isAr ? "رقم الهاتف (اختياري)" : "Phone (optional)"}</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input"
                placeholder="+966 5x xxx xxxx"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
          )}

          <button onClick={saveStep1} disabled={saving} className="btn-primary w-full">
            {saving ? (isAr ? "جاري الحفظ..." : "Saving...") : (isAr ? "التالي ←" : "Next →")}
          </button>
        </div>
      )}

      {/* الخطوة 2: دليل الحسابات */}
      {step === 2 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isAr ? "دليل حسابات جاهز لك 📒" : "Your chart of accounts is ready 📒"}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {isAr
                ? "أنشأنا لك دليل حسابات افتراضي يشمل الأصول والخصوم والإيرادات والمصروفات."
                : "We created a default chart of accounts covering assets, liabilities, revenue, and expenses."}
            </p>
          </div>

          <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto border border-gray-100 rounded-xl">
            {ACCOUNTS_PREVIEW.map((acc) => (
              <div key={acc.code} className="flex items-center justify-between px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-gray-400 w-10">{acc.code}</span>
                  <span className="text-sm text-gray-800">
                    {isAr ? acc.nameAr : acc.nameEn}
                  </span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[acc.type]}`}>
                  {isAr ? TYPE_LABELS[acc.type].ar : TYPE_LABELS[acc.type].en}
                </span>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-400">
            {isAr
              ? "يمكنك إضافة حسابات مخصصة لاحقًا من قسم دليل الحسابات."
              : "You can add custom accounts later from the Chart of Accounts section."}
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="btn-secondary">
              {isAr ? "→ رجوع" : "← Back"}
            </button>
            <button onClick={completeOnboarding} disabled={saving} className="btn-primary flex-1">
              {saving ? (isAr ? "جاري الإعداد..." : "Setting up...") : (isAr ? "تأكيد والمتابعة ←" : "Confirm & Continue →")}
            </button>
          </div>
        </div>
      )}

      {/* الخطوة 3: جاهز! */}
      {step === 3 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center space-y-6">
          <div className="text-6xl">🎉</div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isAr ? "منشأتك جاهزة!" : "Your business is ready!"}
            </h1>
            <p className="text-gray-500 text-sm mt-2">
              {isAr
                ? "يمكنك الآن البدء بتسجيل الفواتير وإدارة حساباتك."
                : "You can now start recording invoices and managing your accounts."}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            <Link
              href="/invoices/create"
              className="border-2 border-blue-200 bg-blue-50 rounded-xl p-4 hover:border-blue-400 hover:bg-blue-100 transition-colors text-center"
            >
              <div className="text-3xl mb-2">📝</div>
              <p className="font-semibold text-sm text-blue-800">{isAr ? "إنشاء فاتورة" : "Create Invoice"}</p>
              <p className="text-xs text-blue-500 mt-0.5">{isAr ? "أنشئ فاتورتك الأولى الآن" : "Create your first invoice now"}</p>
            </Link>
            <Link
              href="/invoices/upload"
              className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors text-center"
            >
              <div className="text-3xl mb-2">⬆️</div>
              <p className="font-medium text-sm text-gray-800">{isAr ? "رفع فاتورة" : "Upload Invoice"}</p>
              <p className="text-xs text-gray-400 mt-0.5">{isAr ? "قراءة الفاتورة بالذكاء الاصطناعي" : "AI reads the invoice"}</p>
            </Link>
            <Link
              href="/journal/new"
              className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors text-center"
            >
              <div className="text-3xl mb-2">✏️</div>
              <p className="font-medium text-sm text-gray-800">{isAr ? "قيد يدوي" : "Manual Entry"}</p>
              <p className="text-xs text-gray-400 mt-0.5">{isAr ? "أدخل قيدًا محاسبيًا" : "Record a journal entry"}</p>
            </Link>
            <Link
              href="/dashboard"
              className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors text-center"
            >
              <div className="text-3xl mb-2">📊</div>
              <p className="font-medium text-sm text-gray-800">{isAr ? "لوحة التحكم" : "Dashboard"}</p>
              <p className="text-xs text-gray-400 mt-0.5">{isAr ? "اعرض ملخص أعمالك" : "View your overview"}</p>
            </Link>
          </div>

          <Link href="/dashboard" className="btn-primary inline-flex">
            {isAr ? "انتقل إلى لوحة التحكم →" : "Go to Dashboard →"}
          </Link>
        </div>
      )}
    </div>
  );
}
