import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

const PLAN_PRICES: Record<string, number> = {
  FREE_TRIAL: 0,
  STARTER: 22,
  PRO: 50,
  BUSINESS: 65,
};

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !isSuperAdmin(session.user.email)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Monthly signups for the last 6 months
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [
    totalBusinesses,
    newLast7d,
    newLast30d,
    byPlan,
    totalInvoices,
    totalEntries,
    recentBusinesses,
  ] = await Promise.all([
    prisma.business.count(),
    prisma.business.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.business.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.business.groupBy({ by: ["plan"], _count: { id: true } }),
    prisma.invoice.count(),
    prisma.journalEntry.count(),
    // Get all businesses from the last 6 months for monthly grouping
    prisma.business.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true },
    }),
  ]);

  // Build monthly signups array (last 6 months)
  const monthlySignups: { month: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - i);
    const year = d.getFullYear();
    const month = d.getMonth();
    const label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    const count = recentBusinesses.filter((b) => {
      const bd = new Date(b.createdAt);
      return bd.getFullYear() === year && bd.getMonth() === month;
    }).length;
    monthlySignups.push({ month: label, count });
  }

  // Plan breakdown + active trial count
  const planBreakdown = byPlan.map((p) => ({
    plan: p.plan,
    count: p._count.id,
    price: PLAN_PRICES[p.plan] ?? 0,
  }));

  // Estimated MRR (exclude FREE_TRIAL and Platform Admin)
  const mrr = planBreakdown.reduce((sum, p) => {
    if (p.plan === "FREE_TRIAL") return sum;
    return sum + p.count * p.price;
  }, 0);

  // Active trials (trialEndsAt in the future OR createdAt within last 35 days)
  const trialCutoff = new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000);
  const trialActive = await prisma.business.count({
    where: {
      plan: "FREE_TRIAL",
      OR: [
        { trialEndsAt: { gte: now } },
        { trialEndsAt: null, createdAt: { gte: trialCutoff } },
      ],
    },
  });

  return NextResponse.json({
    totalBusinesses,
    newLast7d,
    newLast30d,
    totalInvoices,
    totalEntries,
    mrr,
    trialActive,
    planBreakdown,
    monthlySignups,
  });
}
