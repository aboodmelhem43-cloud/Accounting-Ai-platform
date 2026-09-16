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
    return NextResponse.json({ error: "فقط المالك يمكنه الترحيل المباشر" }, { status: 403 });
  }

  const { id } = await params;
  const entry = await prisma.journalEntry.findFirst({
    where: { id, businessId: token.businessId },
  });

  if (!entry) return NextResponse.json({ error: "القيد غير موجود" }, { status: 404 });
  if (entry.isLocked) return NextResponse.json({ error: "القيد مقفل" }, { status: 403 });
  if (entry.status === "POSTED") return NextResponse.json({ error: "القيد مُرحَّل بالفعل" }, { status: 400 });

  const updated = await prisma.journalEntry.update({
    where: { id },
    data: {
      status: "POSTED",
      reviewedById: token.sub,
      reviewedAt: new Date(),
      updatedById: token.sub,
    },
  });

  await logAudit({
    businessId: token.businessId,
    userId: token.sub,
    action: "POST",
    entity: "JournalEntry",
    entityId: id,
    description: `ترحيل مباشر للقيد (mobile): ${entry.description}`,
  });

  return NextResponse.json({ status: updated.status });
}
