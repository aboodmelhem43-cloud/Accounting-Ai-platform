import { NextRequest, NextResponse } from "next/server";
import { verifyMobileToken } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = await verifyMobileToken(req);
  if (!token) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const asOfParam = searchParams.get("asOf");
  const asOf = asOfParam ? new Date(asOfParam) : new Date();
  asOf.setHours(23, 59, 59, 999);

  if (isNaN(asOf.getTime())) {
    return NextResponse.json({ error: "تاريخ غير صحيح" }, { status: 400 });
  }

  const businessId = token.businessId;

  // جلب الحسابات وتجميع السطور على مستوى DB — بدون تحميل كل السطور
  const [accounts, sums] = await Promise.all([
    prisma.account.findMany({
      where: { businessId },
      select: { id: true, code: true, name: true, nameAr: true, type: true },
      orderBy: { code: "asc" },
    }),
    prisma.journalLine.groupBy({
      by: ["accountId"],
      _sum: { debit: true, credit: true },
      where: {
        journalEntry: { businessId, status: "POSTED", date: { lte: asOf } },
      },
    }),
  ]);

  const sumMap = new Map(
    sums.map((s) => [s.accountId, { debit: Number(s._sum.debit ?? 0), credit: Number(s._sum.credit ?? 0) }])
  );

  const rows = accounts
    .map((acc) => {
      const s = sumMap.get(acc.id) ?? { debit: 0, credit: 0 };
      const balance =
        acc.type === "ASSET" || acc.type === "EXPENSE"
          ? s.debit - s.credit
          : s.credit - s.debit;
      return {
        accountCode: acc.code,
        accountName: acc.name,
        accountNameAr: acc.nameAr,
        accountType: acc.type,
        totalDebits: s.debit,
        totalCredits: s.credit,
        balance,
      };
    })
    .filter((r) => r.totalDebits !== 0 || r.totalCredits !== 0);

  const totalDebits  = rows.reduce((s, r) => s + r.totalDebits, 0);
  const totalCredits = rows.reduce((s, r) => s + r.totalCredits, 0);

  return NextResponse.json({ asOf: asOf.toISOString(), rows, totalDebits, totalCredits });
}
