import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

const PLAN_PRICES: Record<string, number> = {
  FREE_TRIAL: 0,
  STARTER: 69,
  PRO: 149,
  BUSINESS: 199,
};

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !isSuperAdmin(session.user.email)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const oneYearAgo = new Date(now);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const eightWeeksAgo = new Date(now.getTime() - 8 * 7 * 24 * 60 * 60 * 1000);

  const threeYearsAgo = new Date(now);
  threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 2);
  threeYearsAgo.setMonth(0);
  threeYearsAgo.setDate(1);
  threeYearsAgo.setHours(0, 0, 0, 0);

  const trialCutoff = new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000);

  const [
    totalBusinesses,
    newLast7d,
    newLast30d,
    newLast365d,
    byPlan,
    totalInvoices,
    totalEntries,
    paidSubscribers,
    newPaidLast7d,
    newPaidLast30d,
    newPaidLast365d,
    invoicesLast7d,
    invoicesLast30d,
    invoicesLast365d,
    entriesLast7d,
    entriesLast30d,
    entriesLast365d,
    trialActive,
    recentBusinesses6mo,
    recentBusinesses8w,
    allBusinesses3y,
  ] = await Promise.all([
    prisma.business.count(),
    prisma.business.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.business.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.business.count({ where: { createdAt: { gte: oneYearAgo } } }),
    prisma.business.groupBy({ by: ["plan"], _count: { id: true } }),
    prisma.invoice.count(),
    prisma.journalEntry.count(),
    prisma.business.count({ where: { plan: { not: "FREE_TRIAL" } } }),
    prisma.business.count({ where: { plan: { not: "FREE_TRIAL" }, createdAt: { gte: sevenDaysAgo } } }),
    prisma.business.count({ where: { plan: { not: "FREE_TRIAL" }, createdAt: { gte: thirtyDaysAgo } } }),
    prisma.business.count({ where: { plan: { not: "FREE_TRIAL" }, createdAt: { gte: oneYearAgo } } }),
    prisma.invoice.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.invoice.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.invoice.count({ where: { createdAt: { gte: oneYearAgo } } }),
    prisma.journalEntry.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.journalEntry.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.journalEntry.count({ where: { createdAt: { gte: oneYearAgo } } }),
    prisma.business.count({
      where: {
        plan: "FREE_TRIAL",
        OR: [
          { trialEndsAt: { gte: now } },
          { trialEndsAt: null, createdAt: { gte: trialCutoff } },
        ],
      },
    }),
    prisma.business.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true, plan: true },
    }),
    prisma.business.findMany({
      where: { createdAt: { gte: eightWeeksAgo } },
      select: { createdAt: true, plan: true },
    }),
    prisma.business.findMany({
      where: { createdAt: { gte: threeYearsAgo } },
      select: { createdAt: true, plan: true },
    }),
  ]);

  // Plan breakdown
  const planBreakdown = byPlan.map((p) => ({
    plan: p.plan,
    count: p._count.id,
    price: PLAN_PRICES[p.plan] ?? 0,
  }));

  // MRR from active paid plans
  const mrr = planBreakdown.reduce((sum, p) => {
    if (p.plan === "FREE_TRIAL") return sum;
    return sum + p.count * p.price;
  }, 0);

  // Monthly signups — last 6 months
  const monthlySignups: { label: string; count: number; revenue: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - i);
    const year = d.getFullYear();
    const month = d.getMonth();
    const label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    const bs = recentBusinesses6mo.filter((b) => {
      const bd = new Date(b.createdAt);
      return bd.getFullYear() === year && bd.getMonth() === month;
    });
    monthlySignups.push({
      label,
      count: bs.length,
      revenue: bs.reduce((s, b) => s + (PLAN_PRICES[b.plan] ?? 0), 0),
    });
  }

  // Weekly signups — last 8 weeks
  const weeklySignups: { label: string; count: number; revenue: number }[] = [];
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    const label = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const bs = recentBusinesses8w.filter((b) => {
      const bd = new Date(b.createdAt);
      return bd >= weekStart && bd < weekEnd;
    });
    weeklySignups.push({
      label,
      count: bs.length,
      revenue: bs.reduce((s, b) => s + (PLAN_PRICES[b.plan] ?? 0), 0),
    });
  }

  // Yearly signups — last 3 years
  const yearlySignups: { label: string; count: number; revenue: number }[] = [];
  for (let i = 2; i >= 0; i--) {
    const year = now.getFullYear() - i;
    const label = String(year);
    const bs = allBusinesses3y.filter((b) => new Date(b.createdAt).getFullYear() === year);
    yearlySignups.push({
      label,
      count: bs.length,
      revenue: bs.reduce((s, b) => s + (PLAN_PRICES[b.plan] ?? 0), 0),
    });
  }

  return NextResponse.json({
    totalBusinesses,
    newLast7d,
    newLast30d,
    newLast365d,
    totalInvoices,
    totalEntries,
    mrr,
    trialActive,
    paidSubscribers,
    newPaidLast7d,
    newPaidLast30d,
    newPaidLast365d,
    revenueWeek: Math.round(mrr / 4.33),
    revenueMonth: mrr,
    revenueYear: mrr * 12,
    activityLast7d: invoicesLast7d + entriesLast7d,
    activityLast30d: invoicesLast30d + entriesLast30d,
    activityLast365d: invoicesLast365d + entriesLast365d,
    planBreakdown,
    weeklySignups,
    monthlySignups,
    yearlySignups,
  });
}
