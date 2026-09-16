import { NextRequest, NextResponse } from "next/server";
import { verifyMobileToken } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = await verifyMobileToken(req);
  if (!token) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const reason: string | undefined = body.reason;

  const invoice = await prisma.invoice.findFirst({
    where: { id, businessId: token.businessId, status: "PENDING_REVIEW" },
  });

  if (!invoice) {
    return NextResponse.json({ error: "الفاتورة غير موجودة أو لا يمكن رفضها" }, { status: 404 });
  }

  const updated = await prisma.invoice.update({
    where: { id },
    data: { status: "REJECTED", ...(reason ? { rejectionReason: reason } : {}) },
  });

  return NextResponse.json({ status: updated.status });
}
