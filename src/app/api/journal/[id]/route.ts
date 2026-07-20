import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { id } = await params;

  const entry = await prisma.journalEntry.findUnique({
    where: { id },
    include: {
      lines: {
        include: {
          account: { select: { code: true, name: true, nameAr: true } },
        },
      },
      creator: { select: { name: true, email: true } },
      invoice: { select: { id: true, invoiceType: true } },
    },
  });

  if (!entry) return NextResponse.json({ error: "القيد غير موجود" }, { status: 404 });
  if (entry.businessId !== session.user.businessId) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  return NextResponse.json({ entry });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { id } = await params;

  const entry = await prisma.journalEntry.findUnique({
    where: { id },
    select: { id: true, businessId: true, status: true, isLocked: true, date: true },
  });

  if (!entry) return NextResponse.json({ error: "القيد غير موجود" }, { status: 404 });
  if (entry.businessId !== session.user.businessId) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  if (entry.isLocked) {
    return NextResponse.json({ error: "القيد مقفل ولا يمكن حذفه" }, { status: 409 });
  }

  const year = entry.date.getFullYear();
  const month = entry.date.getMonth() + 1;
  const closedPeriod = await prisma.accountingPeriod.findUnique({
    where: { businessId_year_month: { businessId: session.user.businessId, year, month } },
    select: { status: true },
  });
  if (closedPeriod?.status === "CLOSED") {
    return NextResponse.json({ error: "الفترة المحاسبية مقفلة — لا يمكن حذف قيودها" }, { status: 409 });
  }

  await prisma.journalEntry.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
