import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { businessId } = session.user;

  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - 5, 1); // last 6 months

  // Get all EXPENSE account lines in the period
  const lines = await prisma.journalEntryLine.findMany({
    where: {
      journalEntry: {
        businessId,
        date: { gte: from },
        status: "POSTED",
      },
      account: { type: "EXPENSE" },
      debit: { gt: 0 },
    },
    select: {
      debit: true,
      account: { select: { name: true } },
    },
  });

  // Aggregate by account name
  const map: Record<string, number> = {};
  for (const line of lines) {
    const name = line.account.name;
    map[name] = (map[name] ?? 0) + Number(line.debit);
  }

  // Sort descending, take top 6, group rest as "Other"
  const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, 6);
  const otherTotal = sorted.slice(6).reduce((s, [, v]) => s + v, 0);

  const result = top.map(([name, value]) => ({ name, value }));
  if (otherTotal > 0) result.push({ name: "Other / أخرى", value: otherTotal });

  return NextResponse.json(result);
}
