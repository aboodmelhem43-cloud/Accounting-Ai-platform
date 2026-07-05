import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { id } = await params;

  const invoice = await prisma.invoice.findFirst({
    where: { id, businessId: session.user.businessId },
    include: { journalEntry: { include: { lines: { include: { account: true } } } } },
  });

  if (!invoice) return NextResponse.json({ error: "الفاتورة غير موجودة" }, { status: 404 });

  return NextResponse.json(invoice);
}

// تحديث البيانات المستخرجة قبل التأكيد، أو رفض الفاتورة
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  // رفض الفاتورة — لا يُسمح إلا للفواتير قيد المراجعة
  if (body.status === "REJECTED") {
    const invoice = await prisma.invoice.findFirst({
      where: { id, businessId: session.user.businessId, status: "PENDING_REVIEW" },
    });

    if (!invoice) {
      return NextResponse.json({ error: "الفاتورة غير موجودة أو لا يمكن رفضها" }, { status: 404 });
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: { status: "REJECTED" },
    });

    return NextResponse.json(updated);
  }

  // تحديث البيانات المستخرجة فقط
  const invoice = await prisma.invoice.findFirst({
    where: { id, businessId: session.user.businessId, status: "PENDING_REVIEW" },
  });

  if (!invoice) return NextResponse.json({ error: "الفاتورة غير موجودة أو تم تأكيدها مسبقًا" }, { status: 404 });

  const updated = await prisma.invoice.update({
    where: { id },
    data: { extractedData: body.extractedData, invoiceType: body.invoiceType },
  });

  return NextResponse.json(updated);
}
