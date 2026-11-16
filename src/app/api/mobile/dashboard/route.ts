import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyMobileToken } from "@/lib/mobile-auth";

export async function GET(req: NextRequest) {
  const token = await verifyMobileToken(req);
  if (!token) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const businessId = token.businessId;

  const now        = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { baseCurrency: true },
  });

  const currency = business?.baseCurrency ?? "SAR";

  // تحميل أنواع الحسابات مرة واحدة — O(حسابات) وليس O(سطور قيود)
  const accounts = await prisma.account.findMany({
    where: { businessId },
    select: { id: true, type: true },
  });
  const accountTypeMap = new Map(accounts.map((a) => [a.id, a.type]));

  // تجميع على مستوى DB — بدون فحص غير محدود لجميع القيود
  const [allTimeSums, currentMonthSums, pendingInvoices, pendingJournalEntries] = await Promise.all([
    prisma.journalLine.groupBy({
      by: ["accountId"],
      _sum: { debit: true, credit: true },
      where: { journalEntry: { businessId, status: "POSTED" } },
    }),
    prisma.journalLine.groupBy({
      by: ["accountId"],
      _sum: { debit: true, credit: true },
      where: {
        journalEntry: {
          businessId,
          status: "POSTED",
          date: { gte: monthStart, lte: monthEnd },
        },
      },
    }),
    prisma.invoice.count({ where: { businessId, status: "PENDING_REVIEW" } }),
    prisma.journalEntry.count({ where: { businessId, status: "PENDING_REVIEW" } }),
  ]);

  let cashBalance   = 0;
  let totalRevenue  = 0;
  let totalExpenses = 0;

  for (const row of allTimeSums) {
    const debit  = Number(row._sum.debit  ?? 0);
    const credit = Number(row._sum.credit ?? 0);
    const t = accountTypeMap.get(row.accountId);
    if (t === "ASSET" || t === "EXPENSE") {
      cashBalance += debit - credit;
    } else if (t) {
      cashBalance -= debit - credit;
    }
  }

  for (const row of currentMonthSums) {
    const debit  = Number(row._sum.debit  ?? 0);
    const credit = Number(row._sum.credit ?? 0);
    const t = accountTypeMap.get(row.accountId);
    if (t === "REVENUE") {
      totalRevenue  += credit - debit;
    } else if (t === "EXPENSE") {
      totalExpenses += debit - credit;
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
