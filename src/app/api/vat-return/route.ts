import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json({ error: "from و to مطلوبان" }, { status: 400 });
  }

  const fromDate = new Date(from);
  const toDate = new Date(to);
  toDate.setHours(23, 59, 59, 999);

  // Find the VAT account (code 2200)
  const vatAccount = await prisma.account.findFirst({
    where: { businessId: session.user.businessId, code: "2200" },
  });

  if (!vatAccount) {
    return NextResponse.json({
      outputVat: 0, inputVat: 0, netVat: 0, lines: [],
      warning: "لم يتم العثور على حساب ضريبة القيمة المضافة (2200)",
    });
  }

  // Get all VAT journal lines in the period
  const vatLines = await prisma.journalLine.findMany({
    where: {
      accountId: vatAccount.id,
      journalEntry: {
        businessId: session.user.businessId,
        status: "POSTED",
        date: { gte: fromDate, lte: toDate },
      },
    },
    include: {
      journalEntry: {
        select: { id: true, date: true, description: true, sourceType: true },
      },
    },
    orderBy: { journalEntry: { date: "asc" } },
  });

  // Credits = output VAT (we owe to tax authority)
  // Debits = input VAT (we can reclaim)
  let outputVat = 0;
  let inputVat = 0;

  const lines = vatLines.map((line) => {
    const credit = Number(line.credit);
    const debit = Number(line.debit);
    outputVat += credit;
    inputVat += debit;
    return {
      date: line.journalEntry.date,
      description: line.journalEntry.description,
      sourceType: line.journalEntry.sourceType,
      journalEntryId: line.journalEntry.id,
      outputVat: credit > 0 ? credit : 0,
      inputVat: debit > 0 ? debit : 0,
    };
  });

  return NextResponse.json({
    from,
    to,
    outputVat,
    inputVat,
    netVat: outputVat - inputVat,
    lines,
    vatAccountCode: vatAccount.code,
  });
}
