import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const accountId = searchParams.get("accountId");
  const fromStr = searchParams.get("from");
  const toStr = searchParams.get("to");

  if (!accountId) {
    return NextResponse.json({ error: "accountId مطلوب" }, { status: 400 });
  }

  // التحقق من ملكية الحساب
  const account = await prisma.account.findFirst({
    where: { id: accountId, businessId: session.user.businessId },
  });
  if (!account) return NextResponse.json({ error: "الحساب غير موجود" }, { status: 404 });

  const now = new Date();
  const from = fromStr ? new Date(fromStr) : new Date(now.getFullYear(), 0, 1);
  const to = toStr ? new Date(toStr) : now;

  const lines = await prisma.journalLine.findMany({
    where: {
      accountId,
      journalEntry: {
        businessId: session.user.businessId,
        date: { gte: from, lte: to },
      },
    },
    include: {
      journalEntry: {
        select: {
          id: true,
          date: true,
          description: true,
          sourceType: true,
        },
      },
    },
    orderBy: { journalEntry: { date: "asc" } },
  });

  return NextResponse.json({ account, lines, from: from.toISOString(), to: to.toISOString() });
}
