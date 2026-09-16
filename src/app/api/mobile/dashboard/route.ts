import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyMobileToken } from "@/lib/mobile-auth";

export async function GET(req: NextRequest) {
  const token = await verifyMobileToken(req);
  if (!token) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const businessId = token.businessId;

  const now      = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { baseCurrency: true },
  });

  const currency = business?.baseCurrency ?? "SAR";

  const [postedEntries, pendingInvoices, pendingJournalEntries] = await Promise.all([
    prisma.journalEntry.findMany({
      where: { businessId, status: "POSTED", entryDate: { gte: monthStart, lte: monthEnd } },
      include: { lines: { include: { account: { select: { type: true } } } } },
    }),
    prisma.invoice.count({ where: { businessId, status: "PENDING_REVIEW" } }),
    prisma.journalEntry.count({ where: { businessId, status: "PENDING_REVIEW" } }),
  ]);

  let totalRevenue  = 0;
  let totalExpenses = 0;
  let cashBalance   = 0;

  const allPosted = await prisma.journalEntry.findMany({
    where: { businessId, status: "POSTED" },
    include: { lines: { include: { account: { select: { type: true } } } } },
  });

  for (const entry of allPosted) {
    for (const line of entry.lines) {
      const accountType = line.account.type;
      if (accountType === "ASSET" || accountType === "EXPENSE") {
        cashBalance += (line.debit ?? 0) - (line.credit ?? 0);
      } else {
        cashBalance -= (line.debit ?? 0) - (line.credit ?? 0);
      }
    }
  }

  for (const entry of postedEntries) {
    for (const line of entry.lines) {
      const accountType = line.account.type;
      if (accountType === "REVENUE") {
        totalRevenue += (line.credit ?? 0) - (line.debit ?? 0);
      } else if (accountType === "EXPENSE") {
        totalExpenses += (line.debit ?? 0) - (line.credit ?? 0);
      }
    }
  }

  const netIncome = totalRevenue - totalExpenses;

  return NextResponse.json({
    currency,
    totalRevenue,
    totalExpenses,
    netIncome,
    cashBalance,
    pendingInvoices,
    pendingJournalEntries,
  });
}
