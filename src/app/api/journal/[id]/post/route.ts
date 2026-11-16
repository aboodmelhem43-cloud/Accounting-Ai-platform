import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  if (session.user.role !== "OWNER") {
    return NextResponse.json({ error: "فقط المالك يمكنه الترحيل المباشر — استخدم 'تقديم للمراجعة'" }, { status: 403 });
  }

  const { id } = await params;
  const entry = await prisma.journalEntry.findFirst({
    where: { id, businessId: session.user.businessId },
  });

  if (!entry) return NextResponse.json({ error: "القيد غير موجود" }, { status: 404 });
  if (entry.isLocked) return NextResponse.json({ error: "القيد مقفل" }, { status: 403 });
  if (entry.status === "POSTED") return NextResponse.json({ error: "القيد مُرحَّل بالفعل" }, { status: 400 });

  // التحقق من أن الفترة المحاسبية للقيد ليست مقفلة
  const entryYear = entry.date.getFullYear();
  const entryMonth = entry.date.getMonth() + 1;
  const lockedPeriod = await prisma.accountingPeriod.findUnique({
    where: { businessId_year_month: { businessId: session.user.businessId, year: entryYear, month: entryMonth } },
    select: { status: true },
  });
  if (lockedPeriod?.status === "CLOSED") {
    return NextResponse.json({ error: "الفترة المحاسبية مقفلة — لا يمكن ترحيل قيود عليها" }, { status: 409 });
  }

  const updated = await prisma.journalEntry.update({
    where: { id },
    data: {
      status: "POSTED",
      reviewedById: session.user.id,
      reviewedAt: new Date(),
      updatedById: session.user.id,
    },
  });

  await logAudit({
    businessId: session.user.businessId,
    userId: session.user.id,
    userName: session.user.name ?? undefined,
    userEmail: session.user.email,
    action: "POST",
    entity: "JournalEntry",
    entityId: id,
    description: `ترحيل مباشر للقيد: ${entry.description}`,
  });

  return NextResponse.json({ status: updated.status });
}
