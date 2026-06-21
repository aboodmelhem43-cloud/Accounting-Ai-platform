"use client";
import { useSession } from "next-auth/react";
import { useLang } from "@/components/LanguageProvider";
import { PLANS, trialDaysLeft, isTrialExpired } from "@/lib/plans";
import type { PlanId } from "@/lib/plans";

const FEATURES: Record<PlanId, { ar: string[]; en: string[] }> = {
  FREE_TRIAL: {
    ar: ["20 فاتورة", "10 أسئلة AI", "لوحة التحكم", "قائمة الدخل", "10 أيام مجاناً"],
    en: ["20 invoices", "10 AI queries", "Dashboard", "Income report", "10 days free"],
  },
  STARTER: {
    ar: ["50 فاتورة/شهر", "20 سؤال AI/شهر", "رفع فواتير بالذكاء الاصطناعي", "إنشاء فواتير مبيعات", "دفتر اليومية", "دعم عملاء"],
    en: ["50 invoices/month", "20 AI queries/month", "AI invoice scanning", "Sales invoice creation", "Journal ledger", "Customer support"],
  },
  PRO: {
    ar: ["500 فاتورة/شهر", "AI غير محدود", "كل مميزات Starter", "3 مستخدمين", "تقارير متقدمة", "دعم أولوية"],
    en: ["500 invoices/month", "Unlimited AI", "All Starter features", "3 users", "Advanced reports", "Priority support"],
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

  const currentPlan = session?.user.plan as PlanId | undefined;
  const trialEndsAt = session?.user.trialEndsAt;
  const daysLeft = trialDaysLeft(trialEndsAt ? new Date(trialEndsAt) : null);
  const expired = isTrialExpired(trialEndsAt ? new Date(trialEndsAt) : null);

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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {PLAN_ORDER.map((planId) => {
          const plan = PLANS[planId];
          const features = FEATURES[planId];
          const isCurrent = currentPlan === planId;
          const isPro = planId === "PRO";
          const isFreeTrial = planId === "FREE_TRIAL";

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
                      {isAr ? "10 أيام ثم يجب الترقية" : "10 days then upgrade required"}
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
                  className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                    isPro
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-900 text-white hover:bg-gray-800"
                  }`}
                  onClick={() => alert(isAr ? "سيتم إضافة الدفع قريباً!" : "Payment coming soon!")}
                >
                  {isAr ? "ترقية" : "Upgrade"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        {isAr
          ? "💳 الدفع الإلكتروني قيد التطوير — تواصل معنا على support@mohasabai.com للترقية اليدوية."
          : "💳 Online payment is coming soon — contact us at support@mohasabai.com for manual upgrades."}
      </div>
    </div>
  );
}
