import { prisma } from "./prisma";

export type PlanId = "FREE_TRIAL" | "STARTER" | "PRO" | "BUSINESS";

export const PLANS: Record<PlanId, {
  nameEn: string;
  nameAr: string;
  price: number;
  invoicesPerMonth: number;  // -1 = unlimited
  aiQueriesPerMonth: number; // -1 = unlimited
  trialDays?: number;
}> = {
  FREE_TRIAL: {
    nameEn: "Free Trial",
    nameAr: "تجربة مجانية",
    price: 0,
    invoicesPerMonth: 20,
    aiQueriesPerMonth: 10,
    trialDays: 35,
  },
  STARTER: {
    nameEn: "Starter",
    nameAr: "المبتدئ",
    price: 69,
    invoicesPerMonth: 50,
    aiQueriesPerMonth: 20,
  },
  PRO: {
    nameEn: "Pro",
    nameAr: "المحترف",
    price: 149,
    invoicesPerMonth: 500,
    aiQueriesPerMonth: -1,
  },
  BUSINESS: {
    nameEn: "Business",
    nameAr: "الأعمال",
    price: 199,
    invoicesPerMonth: -1,
    aiQueriesPerMonth: -1,
  },
};

export function trialEndsAtDate(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 35);
  return d;
}

export function isTrialExpired(trialEndsAt: Date | null | undefined): boolean {
  if (!trialEndsAt) return false;
  return new Date() > new Date(trialEndsAt);
}

export function trialDaysLeft(trialEndsAt: Date | null | undefined): number {
  if (!trialEndsAt) return 0;
  const diff = new Date(trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// Returns the effective trial end date: whichever is later between stored trialEndsAt
// and createdAt + 35 days. This ensures accounts created under the old 10-day limit
// automatically get the full 35-day trial without a DB migration.
function effectiveTrialEnd(trialEndsAt: Date | null, createdAt: Date): Date {
  const fromCreated = new Date(createdAt);
  fromCreated.setDate(fromCreated.getDate() + 35);
  if (!trialEndsAt) return fromCreated;
  return new Date(trialEndsAt) > fromCreated ? new Date(trialEndsAt) : fromCreated;
}

export async function checkInvoiceLimit(businessId: string): Promise<{
  allowed: boolean;
  used: number;
  limit: number;
  plan: PlanId;
}> {
  const business = await prisma.business.findUniqueOrThrow({
    where: { id: businessId },
    select: { plan: true, trialEndsAt: true, createdAt: true },
  });

  const plan = business.plan as PlanId;

  if (plan === "FREE_TRIAL" && isTrialExpired(effectiveTrialEnd(business.trialEndsAt, business.createdAt))) {
    return { allowed: false, used: 0, limit: 0, plan };
  }

  const limit = PLANS[plan].invoicesPerMonth;
  if (limit === -1) return { allowed: true, used: 0, limit: -1, plan };

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const used = await prisma.invoice.count({
    where: { businessId, createdAt: { gte: startOfMonth } },
  });

  return { allowed: used < limit, used, limit, plan };
}

export async function checkAiLimit(businessId: string): Promise<{
  allowed: boolean;
  used: number;
  limit: number;
  plan: PlanId;
}> {
  const business = await prisma.business.findUniqueOrThrow({
    where: { id: businessId },
    select: { plan: true, trialEndsAt: true, createdAt: true },
  });

  const plan = business.plan as PlanId;

  if (plan === "FREE_TRIAL" && isTrialExpired(effectiveTrialEnd(business.trialEndsAt, business.createdAt))) {
    return { allowed: false, used: 0, limit: 0, plan };
  }

  const limit = PLANS[plan].aiQueriesPerMonth;
  if (limit === -1) return { allowed: true, used: 0, limit: -1, plan };

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  let used = 0;
  try {
    used = await prisma.journalEntry.count({
      where: {
        businessId,
        sourceType: "AI_INVOICE",
        createdAt: { gte: startOfMonth },
      },
    });
  } catch {
    // If the column doesn't exist yet (pending migration), allow the request
    used = 0;
  }

  return { allowed: used < limit, used, limit, plan };
}
