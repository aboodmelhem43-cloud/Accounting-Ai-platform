"use client";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useLang } from "./LanguageProvider";
import { PLANS, isTrialExpired, trialDaysLeft } from "@/lib/plans";
import type { PlanId } from "@/lib/plans";

export default function PlanBanner() {
  const { data: session } = useSession();
  const { lang } = useLang();
  const isAr = lang === "ar";

  if (!session) return null;

  const plan = session.user.plan as PlanId;
  const trialEndsAt = session.user.trialEndsAt;

  if (plan !== "FREE_TRIAL") return null;

  const expired = isTrialExpired(trialEndsAt ? new Date(trialEndsAt) : null);
  const daysLeft = trialDaysLeft(trialEndsAt ? new Date(trialEndsAt) : null);

  if (!expired && daysLeft > 3) return null;

  if (expired) {
    return (
      <div className="bg-red-600 text-white px-4 py-2.5 flex items-center justify-between text-sm">
        <span className="font-medium">
          {isAr ? "⚠️ انتهت فترة التجربة المجانية. قم بالترقية للاستمرار." : "⚠️ Your free trial has ended. Upgrade to continue."}
        </span>
        <Link href="/pricing" className="bg-white text-red-600 font-semibold px-3 py-1 rounded-lg text-xs hover:bg-red-50 transition-colors">
          {isAr ? "ترقية الآن" : "Upgrade Now"}
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-amber-500 text-white px-4 py-2.5 flex items-center justify-between text-sm">
      <span>
        {isAr
          ? `⏳ تبقى ${daysLeft} ${daysLeft === 1 ? "يوم" : "أيام"} من تجربتك المجانية`
          : `⏳ ${daysLeft} day${daysLeft === 1 ? "" : "s"} left in your free trial`}
      </span>
      <Link href="/pricing" className="bg-white text-amber-600 font-semibold px-3 py-1 rounded-lg text-xs hover:bg-amber-50 transition-colors">
        {isAr ? "شاهد الخطط" : "View Plans"}
      </Link>
    </div>
  );
}
