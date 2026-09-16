import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyMobileToken } from "@/lib/mobile-auth";

export async function GET(req: NextRequest) {
  const token = await verifyMobileToken(req);
  if (!token) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const businessId = token.businessId;

  const now       = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { baseCurrency: true },
  });

  const currency = business?.baseCurrency ?? "SAR";

  const [currentMonthEntries, allPostedEntries, pendingInvoices, pendingJournalEntries] = await Promise.all([
    prisma.journalEntry.findMany({
      where: { businessId, status: "POSTED", date: { gte: monthStart, lte: monthEnd } },
      include: { lines: { include: { account: { select: { type: true } } } } },
    }),
    prisma.journalEntry.findMany({
      where: { businessId, status: "POSTED" },
      include: { lines: { include: { account: { select: { type: true } } } } },
    }),
    prisma.invoice.count({ where: { businessId, status: "PENDING_REVIEW" } }),
    prisma.journalEntry.count({ where: { businessId, status: "PENDING_REVIEW" } }),
  ]);

  let totalRevenue  = 0;
  let totalExpenses = 0;
  let cashBalance   = 0;

  for (const entry of allPostedEntries) {
    for (const line of entry.lines) {
      const debit  = Number(line.debit);
      const credit = Number(line.credit);
      const t = line.account.type;
      if (t === "ASSET" || t === "EXPENSE") {
        cashBalance += debit - credit;
      } else {
        cashBalance -= debit - credit;
      }
    }
  }

  for (const entry of currentMonthEntries) {
    for (const line of entry.lines) {
      const debit  = Number(line.debit);
      const credit = Number(line.credit);
      const t = line.account.type;
      if (t === "REVENUE") {
        totalRevenue += credit - debit;
      } else if (t === "EXPENSE") {
        totalExpenses += debit - credit;
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
