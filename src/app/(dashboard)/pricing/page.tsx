"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useLang } from "@/components/LanguageProvider";
import { PLANS, trialDaysLeft, isTrialExpired } from "@/lib/plans";
import type { PlanId } from "@/lib/plans";

const FEATURES: Record<PlanId, { ar: string[]; en: string[] }> = {
  FREE_TRIAL: {
    ar: ["20 فاتورة", "10 أسئلة AI", "لوحة التحكم", "قائمة الدخل", "35 يوم مجاناً"],
    en: ["20 invoices", "10 AI queries", "Dashboard", "Income report", "35 days free"],
  },
  STARTER: {
    ar: ["50 فاتورة/شهر", "20 سؤال AI/شهر", "رفع فواتير بالذكاء الاصطناعي", "إنشاء فواتير مبيعات", "دفتر اليومية", "دعم عملاء"],
    en: ["50 invoices/month", "20 AI queries/month", "AI invoice scanning", "Sales invoice creation", "Journal ledger", "Customer support"],
  },
  PRO: {
    ar: ["500 فاتورة/شهر", "AI غير محدود", "كل مميزات Starter", "3 مستخدمين", "تقارير متقدمة", "دعم عملاء"],
    en: ["500 invoices/month", "Unlimited AI", "All Starter features", "3 users", "Advanced reports", "Customer support"],
  },
  BUSINESS: {
    ar: ["فواتير غير محدودة", "AI غير محدود", "كل مميزات Pro", "10 مستخدمين", "API access", "دعم VIP"],
    en: ["Unlimited invoices", "Unlimited AI", "All Pro features", "10 users", "API access", "VIP support"],
  },
};

const PLAN_ORDER: PlanId[] = ["FREE_TRIAL", "STARTER", "PRO", "BUSINESS"];

export default function PricingPage() {
  const { data: session } = useSession();
  const { lang } = useLang();
  const isAr = lang === "ar";
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentPlan = session?.user.plan as PlanId | undefined;
  const trialEndsAt = session?.user.trialEndsAt;
  const daysLeft = trialDaysLeft(trialEndsAt ? new Date(trialEndsAt) : null);
  const expired = isTrialExpired(trialEndsAt ? new Date(trialEndsAt) : null);

  async function handleUpgrade(plan: PlanId) {
    setError(null);
    setLoading(plan);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? (isAr ? "حدث خطأ" : "An error occurred"));
        return;
      }
      // Redirect to Lemon Squeezy checkout page
      window.location.href = data.url;
    } catch {
      setError(isAr ? "تعذر الاتصال بالخادم" : "Could not connect to server");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{isAr ? "خطط الاشتراك" : "Pricing Plans"}</h1>
        <p className="text-gray-500 text-sm mt-1">
          {isAr ? "اختر الخطة المناسبة لأعمالك" : "Choose the plan that fits your business"}
        </p>
        {currentPlan === "FREE_TRIAL" && !expired && (
          <div className="mt-2 inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-sm px-3 py-1.5 rounded-lg">
            ⏳ {isAr ? `تبقى ${daysLeft} أيام من تجربتك المجانية` : `${daysLeft} days left in your free trial`}
          </div>
        )}
        {error && (
          <div className="mt-2 bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
            {error}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {PLAN_ORDER.map((planId) => {
          const plan = PLANS[planId];
          const features = FEATURES[planId];
          const isCurrent = currentPlan === planId;
          const isPro = planId === "PRO";
          const isFreeTrial = planId === "FREE_TRIAL";
          const isLoadingThis = loading === planId;

          return (
            <div
              key={planId}
              className={`relative rounded-2xl border-2 p-6 flex flex-col ${
                isPro
                  ? "border-blue-600 shadow-lg shadow-blue-100"
                  : isCurrent
                  ? "border-green-400"
                  : "border-gray-200"
              }`}
            >
              {isPro && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  {isAr ? "الأكثر شعبية" : "Most Popular"}
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  {isAr ? "خطتك الحالية" : "Current Plan"}
                </div>
              )}

              <div className="mb-4">
                <h2 className="text-lg font-bold text-gray-900">
                  {isAr ? plan.nameAr : plan.nameEn}
                </h2>
                <div className="mt-2">
                  {plan.price === 0 ? (
                    <span className="text-3xl font-bold text-gray-900">{isAr ? "مجاني" : "Free"}</span>
                  ) : (
                    <div>
                      <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                      <span className="text-gray-400 text-sm">/{isAr ? "شهر" : "mo"}</span>
                    </div>
                  )}
                  {isFreeTrial && (
                    <p className="text-xs text-amber-600 mt-1">
                      {isAr ? "35 يوم ثم يجب الترقية" : "35 days then upgrade required"}
                    </p>
                  )}
                </div>
              </div>

              <ul className="space-y-2.5 flex-1 mb-6">
                {(isAr ? features.ar : features.en).map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <div className="w-full text-center py-2.5 rounded-xl bg-green-50 text-green-700 font-medium text-sm border border-green-200">
                  {isAr ? "خطتك الحالية" : "Your Current Plan"}
                </div>
              ) : isFreeTrial ? null : (
                <button
                  disabled={isLoadingThis || !!loading}
                  className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                    isPro
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-900 text-white hover:bg-gray-800"
                  }`}
                  onClick={() => handleUpgrade(planId)}
                >
                  {isLoadingThis
                    ? (isAr ? "جارٍ التحويل..." : "Redirecting...")
                    : (isAr ? "ترقية" : "Upgrade")}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        {isAr
          ? "💳 الدفع آمن عبر Lemon Squeezy — يدعم بطاقات الكويت والسعودية والإمارات وجميع دول العالم."
          : "💳 Secure payment via Lemon Squeezy — supports cards from Kuwait, Saudi Arabia, UAE and worldwide."}
      </div>
    </div>
  );
}
