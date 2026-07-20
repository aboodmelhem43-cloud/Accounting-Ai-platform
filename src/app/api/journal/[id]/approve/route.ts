import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  if (session.user.role !== "OWNER") {
    return NextResponse.json({ error: "صلاحيات المالك مطلوبة للموافقة" }, { status: 403 });
  }

  const { id } = await params;
  const entry = await prisma.journalEntry.findFirst({
    where: { id, businessId: session.user.businessId },
  });

  if (!entry) return NextResponse.json({ error: "القيد غير موجود" }, { status: 404 });
  if (entry.status !== "PENDING_REVIEW") {
    return NextResponse.json({ error: "القيد ليس بانتظار المراجعة" }, { status: 400 });
  }

  const updated = await prisma.journalEntry.update({
    where: { id },
    data: {
      status: "POSTED",
      reviewedById: session.user.id,
      reviewedAt: new Date(),
      updatedById: session.user.id,
      rejectionReason: null,
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
    description: `موافقة وترحيل القيد: ${entry.description}`,
  });

  return NextResponse.json({ status: updated.status });
}
