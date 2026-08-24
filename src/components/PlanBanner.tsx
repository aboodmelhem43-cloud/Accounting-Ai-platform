"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useLang } from "./LanguageProvider";
import { isTrialExpired, trialDaysLeft } from "@/lib/plans";
import type { PlanId } from "@/lib/plans";

interface Usage {
  plan: string;
  trialExpired: boolean;
  daysLeft: number | null;
  invoices: { used: number; limit: number; unlimited: boolean };
  ai: { used: number; limit: number; unlimited: boolean };
}

export default function PlanBanner() {
  const { data: session } = useSession();
  const { lang } = useLang();
  const isAr = lang === "ar";
  const [usage, setUsage] = useState<Usage | null>(null);

  const plan = (session?.user?.plan ?? "") as PlanId;
  const trialEndsAt = session?.user?.trialEndsAt;

  const expired = plan === "FREE_TRIAL" && isTrialExpired(trialEndsAt ? new Date(trialEndsAt) : null);
  const daysLeft = plan === "FREE_TRIAL" ? trialDaysLeft(trialEndsAt ? new Date(trialEndsAt) : null) : null;

  useEffect(() => {
    if (!session) return;
    if (plan === "PRO" || plan === "BUSINESS") return;
    fetch("/api/usage")
      .then((r) => r.json())
      .then(setUsage)
      .catch(() => {});
  }, [session?.user?.businessId, plan]);

  if (!session) return null;

  // Trial expired — highest priority
  if (expired) {
    return (
      <div className="bg-red-600 text-white px-4 py-2.5 flex items-center justify-between text-sm gap-2">
        <span className="font-medium">
          {isAr ? "⚠️ انتهت فترة التجربة المجانية. قم بالترقية للاستمرار." : "⚠️ Your free trial has ended. Upgrade to continue."}
        </span>
        <Link href="/pricing" className="flex-shrink-0 bg-white text-red-600 font-semibold px-3 py-1 rounded-lg text-xs hover:bg-red-50 transition-colors">
          {isAr ? "ترقية الآن" : "Upgrade Now"}
        </Link>
      </div>
    );
  }

  // Trial ending soon (≤ 7 days)
  if (plan === "FREE_TRIAL" && daysLeft !== null && daysLeft <= 7) {
    const color = daysLeft <= 2 ? "bg-red-500" : "bg-amber-500";
    return (
      <div className={`${color} text-white px-4 py-2.5 flex items-center justify-between text-sm gap-2`}>
        <span>
          {isAr
            ? `⏳ تبقى ${daysLeft} ${daysLeft === 1 ? "يوم" : "أيام"} من تجربتك المجانية`
            : `⏳ ${daysLeft} day${daysLeft === 1 ? "" : "s"} left in your free trial`}
        </span>
        <Link href="/pricing" className="flex-shrink-0 bg-white text-amber-600 font-semibold px-3 py-1 rounded-lg text-xs hover:bg-amber-50 transition-colors">
          {isAr ? "شاهد الخطط" : "View Plans"}
        </Link>
      </div>
    );
  }

  // Usage limit warning — show when ≥ 80% of invoices or AI used
  if (usage && !usage.invoices.unlimited && !usage.ai.unlimited) {
    const invPct = Math.round((usage.invoices.used / usage.invoices.limit) * 100);
    const aiPct = Math.round((usage.ai.used / usage.ai.limit) * 100);
    const maxPct = Math.max(invPct, aiPct);

    if (maxPct >= 80) {
      const atLimit = maxPct >= 100;
      const color = atLimit ? "bg-red-600" : "bg-amber-500";
      const limitLabel = invPct >= aiPct
        ? (isAr ? `الفواتير: ${usage.invoices.used}/${usage.invoices.limit}` : `Invoices: ${usage.invoices.used}/${usage.invoices.limit}`)
        : (isAr ? `الذكاء الاصطناعي: ${usage.ai.used}/${usage.ai.limit}` : `AI: ${usage.ai.used}/${usage.ai.limit}`);

      return (
        <div className={`${color} text-white px-4 py-2.5 flex items-center justify-between text-sm gap-2`}>
          <span>
            {atLimit
              ? (isAr ? `🚨 وصلت إلى حدك الشهري — ${limitLabel}` : `🚨 Monthly limit reached — ${limitLabel}`)
              : (isAr ? `📊 اقتربت من حدك الشهري — ${limitLabel}` : `📊 Approaching monthly limit — ${limitLabel}`)}
          </span>
          <Link href="/pricing" className="flex-shrink-0 bg-white text-blue-600 font-semibold px-3 py-1 rounded-lg text-xs hover:bg-blue-50 transition-colors">
            {isAr ? "ترقية" : "Upgrade"}
          </Link>
        </div>
      );
    }
  }

  return null;
}
