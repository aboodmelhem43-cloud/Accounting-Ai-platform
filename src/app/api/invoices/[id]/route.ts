import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_AMOUNT = 1_000_000_000;

const patchSchema = z.object({
  status: z.literal("REJECTED").optional(),
  invoiceType: z.enum(["PURCHASE", "SALES"]).optional(),
  extractedData: z.object({
    invoiceNumber: z.string().max(100).optional().nullable(),
    invoiceDate: z.string().max(50).optional().nullable(),
    dueDate: z.string().max(50).optional().nullable(),
    vendorName: z.string().max(200).optional().nullable(),
    customerName: z.string().max(200).optional().nullable(),
    sellerName: z.string().max(200).optional().nullable(),
    subtotal: z.number().min(0).max(MAX_AMOUNT).optional().nullable(),
    taxAmount: z.number().min(0).max(MAX_AMOUNT).optional().nullable(),
    taxRate: z.number().min(0).max(100).optional().nullable(),
    totalAmount: z.number().min(0).max(MAX_AMOUNT).optional().nullable(),
    grandTotal: z.number().min(0).max(MAX_AMOUNT).optional().nullable(),
    currency: z.string().max(10).optional().nullable(),
    currencySymbol: z.string().max(10).optional().nullable(),
    notes: z.string().max(2000).optional().nullable(),
    lineItems: z.array(z.object({
      description: z.string().max(500),
      quantity: z.number().min(0).max(MAX_AMOUNT).optional(),
      unitPrice: z.number().min(0).max(MAX_AMOUNT).optional(),
      total: z.number().min(0).max(MAX_AMOUNT).optional(),
    })).max(100).optional().nullable(),
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
