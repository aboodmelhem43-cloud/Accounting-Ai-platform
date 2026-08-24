"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useLang } from "./LanguageProvider";

interface Usage {
  plan: string;
  trialExpired: boolean;
  daysLeft: number | null;
  invoices: { used: number; limit: number; unlimited: boolean };
  ai: { used: number; limit: number; unlimited: boolean };
}

function UsageBar({ used, limit, label }: { used: number; limit: number; label: string }) {
  const pct = Math.min(100, Math.round((used / limit) * 100));
  const near = pct >= 80;
  const full = pct >= 100;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-500">
        <span>{label}</span>
        <span className={full ? "text-red-600 font-semibold" : near ? "text-amber-600 font-medium" : ""}>
          {used}/{limit}
        </span>
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${full ? "bg-red-500" : near ? "bg-amber-400" : "bg-blue-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function UsageBanner() {
  const { data: session } = useSession();
  const { lang } = useLang();
  const isAr = lang === "ar";
  const [usage, setUsage] = useState<Usage | null>(null);

  useEffect(() => {
    fetch("/api/usage")
      .then((r) => r.json())
      .then(setUsage)
      .catch(() => {});
  }, [session?.user?.businessId]);

  if (!usage) return null;

  const { plan, invoices, ai } = usage;

  // Only show for FREE_TRIAL or STARTER plans with limited usage
  if (plan === "PRO" || plan === "BUSINESS") return null;
  if (invoices.unlimited && ai.unlimited) return null;

  const invPct = invoices.unlimited ? 0 : Math.round((invoices.used / invoices.limit) * 100);
  const aiPct = ai.unlimited ? 0 : Math.round((ai.used / ai.limit) * 100);

  // Only show when usage is 60%+ on either meter
  if (invPct < 60 && aiPct < 60) return null;

  const nearLimit = invPct >= 80 || aiPct >= 80;
  const atLimit = invPct >= 100 || aiPct >= 100;

  return (
    <div className={`card border ${atLimit ? "border-red-200 bg-red-50/60" : nearLimit ? "border-amber-200 bg-amber-50/60" : "border-gray-200"}`}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-base">{atLimit ? "🚨" : "📊"}</span>
            <span className="text-sm font-semibold text-gray-800">
              {isAr
                ? atLimit ? "وصلت إلى حد خطتك الحالية" : "اقتربت من حد خطتك"
                : atLimit ? "You've reached your plan limit" : "Approaching your plan limit"}
            </span>
          </div>
          <div className="space-y-2 max-w-sm">
            {!invoices.unlimited && (
              <UsageBar
                used={invoices.used}
                limit={invoices.limit}
                label={isAr ? "الفواتير هذا الشهر" : "Invoices this month"}
              />
            )}
            {!ai.unlimited && (
              <UsageBar
                used={ai.used}
                limit={ai.limit}
                label={isAr ? "استفسارات الذكاء الاصطناعي" : "AI queries this month"}
              />
            )}
          </div>
        </div>
        <Link href="/pricing" className={`btn-primary flex-shrink-0 text-sm py-2 px-4 ${atLimit ? "" : "btn-primary"}`}>
          {isAr ? "✨ ترقية الخطة" : "✨ Upgrade Plan"}
        </Link>
      </div>
    </div>
  );
}
