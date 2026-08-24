import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PLANS, isTrialExpired, trialDaysLeft } from "@/lib/plans";
import type { PlanId } from "@/lib/plans";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { businessId } = session.user;

  const business = await prisma.business.findUniqueOrThrow({
    where: { id: businessId },
    select: { plan: true, trialEndsAt: true, createdAt: true },
  });

  const plan = business.plan as PlanId;
  const planInfo = PLANS[plan];

  const effectiveTrialEnd = (() => {
    const fromCreated = new Date(business.createdAt);
    fromCreated.setDate(fromCreated.getDate() + 35);
    if (!business.trialEndsAt) return fromCreated;
    return new Date(business.trialEndsAt) > fromCreated ? new Date(business.trialEndsAt) : fromCreated;
  })();

  const trialExpired = plan === "FREE_TRIAL" && isTrialExpired(effectiveTrialEnd);
  const daysLeft = plan === "FREE_TRIAL" ? trialDaysLeft(effectiveTrialEnd) : null;

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [invoicesUsed, aiUsed] = await Promise.all([
    planInfo.invoicesPerMonth === -1
      ? Promise.resolve(0)
      : prisma.invoice.count({ where: { businessId, createdAt: { gte: startOfMonth } } }),
    planInfo.aiQueriesPerMonth === -1
      ? Promise.resolve(0)
      : prisma.chatMessage
          .count({ where: { businessId, role: "user", createdAt: { gte: startOfMonth } } })
          .catch(() => 0),
  ]);

  return NextResponse.json({
    plan,
    trialExpired,
    daysLeft,
    invoices: {
      used: invoicesUsed,
      limit: planInfo.invoicesPerMonth,
      unlimited: planInfo.invoicesPerMonth === -1,
    },
    ai: {
      used: aiUsed,
      limit: planInfo.aiQueriesPerMonth,
      unlimited: planInfo.aiQueriesPerMonth === -1,
    },
  });
}
