import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { sendJvSubmittedEmail } from "@/lib/email";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { id } = await params;
  const entry = await prisma.journalEntry.findFirst({
    where: { id, businessId: session.user.businessId },
  });

  if (!entry) return NextResponse.json({ error: "القيد غير موجود" }, { status: 404 });
  if (entry.isLocked) return NextResponse.json({ error: "القيد مقفل" }, { status: 403 });
  if (entry.status !== "DRAFT" && entry.status !== "REJECTED") {
    return NextResponse.json({ error: "لا يمكن تقديم هذا القيد للمراجعة" }, { status: 400 });
  }

  const updated = await prisma.journalEntry.update({
    where: { id },
    data: {
      status: "PENDING_REVIEW",
      submittedById: session.user.id,
      submittedAt: new Date(),
      updatedById: session.user.id,
      rejectionReason: null,
    },
  });

  await logAudit({
    businessId: session.user.businessId,
    userId: session.user.id,
    userName: session.user.name ?? undefined,
    userEmail: session.user.email,
    action: "UPDATE",
    entity: "JournalEntry",
    entityId: id,
    description: `تقديم القيد للمراجعة: ${entry.description}`,
  });

  // إرسال إشعار بالبريد الإلكتروني للمالك
  const owner = await prisma.user.findFirst({
    where: { businessId: session.user.businessId, role: "OWNER" },
    select: { email: true },
  });
  const business = await prisma.business.findUnique({
    where: { id: session.user.businessId },
    select: { name: true },
  });
  if (owner?.email) {
    sendJvSubmittedEmail({
      ownerEmail: owner.email,
      accountantName: session.user.name ?? session.user.email,
      entryDescription: entry.description,
      entryId: id,
      businessName: business?.name ?? "",
    }).catch((e) => console.error("[email] JV submit notification failed:", e));
  }

  return NextResponse.json({ status: updated.status });
}
