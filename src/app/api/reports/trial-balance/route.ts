import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const asOfParam = searchParams.get("asOf");

  const asOf = asOfParam ? new Date(asOfParam) : new Date();
  asOf.setHours(23, 59, 59, 999);

  if (isNaN(asOf.getTime())) {
    return NextResponse.json({ error: "تاريخ غير صحيح" }, { status: 400 });
  }

  const businessId = session.user.businessId;

  const accounts = await prisma.account.findMany({
    where: { businessId },
    include: {
      journalLines: {
        where: {
          journalEntry: {
            businessId,
            status: "POSTED",
            date: { lte: asOf },
          },
        },
      },
    },
    orderBy: { code: "asc" },
  });

  const rows = accounts
    .map((acc) => {
      const totalDebits = acc.journalLines.reduce((s, l) => s + Number(l.debit), 0);
      const totalCredits = acc.journalLines.reduce((s, l) => s + Number(l.credit), 0);
      const balance =
        acc.type === "ASSET" || acc.type === "EXPENSE"
          ? totalDebits - totalCredits
          : totalCredits - totalDebits;

      return {
        accountCode: acc.code,
        accountName: acc.name,
        accountNameAr: acc.nameAr,
        accountType: acc.type,
        totalDebits,
        totalCredits,
        balance,
      };
    })
    .filter((r) => r.totalDebits !== 0 || r.totalCredits !== 0);

  const totalDebits = rows.reduce((s, r) => s + r.totalDebits, 0);
  const totalCredits = rows.reduce((s, r) => s + r.totalCredits, 0);

  return NextResponse.json({ asOf: asOf.toISOString(), rows, totalDebits, totalCredits });
}
