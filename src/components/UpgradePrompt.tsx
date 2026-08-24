"use client";
import Link from "next/link";
import { useLang } from "./LanguageProvider";

interface Props {
  feature?: string;
  featureAr?: string;
  requiredPlan?: "STARTER" | "PRO" | "BUSINESS";
  compact?: boolean;
}

const PLAN_NAMES: Record<string, { en: string; ar: string }> = {
  STARTER: { en: "Starter", ar: "المبتدئ" },
  PRO: { en: "Pro", ar: "المحترف" },
  BUSINESS: { en: "Business", ar: "الأعمال" },
};

export default function UpgradePrompt({ feature, featureAr, requiredPlan = "PRO", compact = false }: Props) {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const planName = PLAN_NAMES[requiredPlan];

  if (compact) {
    return (
      <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm">
        <span>🔒</span>
        <span className="text-blue-700">
          {isAr
            ? `هذه الميزة متاحة في خطة ${planName.ar} فأعلى`
            : `This feature requires the ${planName.en} plan or higher`}
        </span>
        <Link href="/pricing" className="ms-auto text-xs font-semibold text-blue-600 hover:underline whitespace-nowrap">
          {isAr ? "ترقية" : "Upgrade →"}
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/60 p-8 text-center">
      <div className="text-4xl mb-3">🔒</div>
      <h3 className="text-lg font-bold text-gray-800 mb-1">
        {isAr
          ? (featureAr ?? `ميزة ${planName.ar}`)
          : (feature ?? `${planName.en} Feature`)}
      </h3>
      <p className="text-sm text-gray-500 mb-5 max-w-xs mx-auto">
        {isAr
          ? `هذه الميزة متاحة في خطة ${planName.ar} فأعلى. قم بالترقية للوصول إليها.`
          : `This feature is available on the ${planName.en} plan and above. Upgrade to unlock it.`}
      </p>
      <Link href="/pricing" className="btn-primary inline-flex">
        {isAr ? `✨ الترقية إلى ${planName.ar}` : `✨ Upgrade to ${planName.en}`}
      </Link>
    </div>
  );
}
