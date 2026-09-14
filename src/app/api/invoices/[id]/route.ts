import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  status: z.literal("REJECTED").optional(),
  invoiceType: z.enum(["PURCHASE", "SALES"]).optional(),
  extractedData: z.object({
    invoiceNumber: z.string().optional().nullable(),
    invoiceDate: z.string().optional().nullable(),
    dueDate: z.string().optional().nullable(),
    vendorName: z.string().optional().nullable(),
    customerName: z.string().optional().nullable(),
    sellerName: z.string().optional().nullable(),
    subtotal: z.number().optional().nullable(),
    taxAmount: z.number().optional().nullable(),
    taxRate: z.number().optional().nullable(),
    totalAmount: z.number().optional().nullable(),
    grandTotal: z.number().optional().nullable(),
    currency: z.string().optional().nullable(),
    currencySymbol: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    lineItems: z.array(z.object({
      description: z.string(),
      quantity: z.number().optional(),
      unitPrice: z.number().optional(),
      total: z.number().optional(),
    })).optional().nullable(),
  }).optional(),
});

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
  const rawBody = await req.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }
  const body = parsed.data;

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
