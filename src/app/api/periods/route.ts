import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const periods = await prisma.accountingPeriod.findMany({
    where: { businessId: session.user.businessId },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });

  // Count journal entries per month for context
  const entryCounts = await prisma.journalEntry.groupBy({
    by: ["date"],
    where: { businessId: session.user.businessId },
    _count: { id: true },
  });

  // Build a map of year+month → entry count
  const countMap: Record<string, number> = {};
  for (const row of entryCounts) {
    const d = new Date(row.date);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    countMap[key] = (countMap[key] ?? 0) + row._count.id;
  }

  return NextResponse.json({ periods, countMap });
}
