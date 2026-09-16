import { NextRequest, NextResponse } from "next/server";
import { verifyMobileToken } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = await verifyMobileToken(req);
  if (!token) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  if (token.role !== "OWNER") {
    return NextResponse.json({ error: "صلاحيات المالك مطلوبة للرفض" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const reason: string | undefined = body.reason;
  if (!reason || !reason.trim()) {
    return NextResponse.json({ error: "سبب الرفض مطلوب" }, { status: 400 });
  }

  const { id } = await params;
  const entry = await prisma.journalEntry.findFirst({
    where: { id, businessId: token.businessId },
  });

  if (!entry) return NextResponse.json({ error: "القيد غير موجود" }, { status: 404 });
  if (entry.status !== "PENDING_REVIEW") {
    return NextResponse.json({ error: "القيد ليس بانتظار المراجعة" }, { status: 400 });
  }

  const updated = await prisma.journalEntry.update({
    where: { id },
    data: {
      status: "REJECTED",
      reviewedById: token.sub,
      reviewedAt: new Date(),
      updatedById: token.sub,
      rejectionReason: reason,
    },
  });

  await logAudit({
    businessId: token.businessId,
    userId: token.sub,
    action: "REJECT",
    entity: "JournalEntry",
    entityId: id,
    description: `رفض القيد (mobile): ${entry.description} — السبب: ${reason}`,
  });

  return NextResponse.json({ status: updated.status });
}
