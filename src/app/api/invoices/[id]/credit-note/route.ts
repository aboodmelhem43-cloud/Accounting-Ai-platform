import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createJournalEntry } from "@/lib/ledger";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  amount: z.number().positive(),
  date: z.string().min(1),
  reason: z.string().min(1),
});

type ExtractedData = {
  invoiceNumber?: string;
  grandTotal?: number;
  totalAmount?: number;
  taxAmount?: number;
  currencySymbol?: string;
  lineItems?: { description: string; quantity: number; unitPrice: number }[];
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { id } = await params;

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });

  const { amount, date, reason } = parsed.data;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { journalEntry: { include: { lines: { include: { account: true } } } } },
  });

  if (!invoice) return NextResponse.json({ error: "الفاتورة غير موجودة" }, { status: 404 });
  if (invoice.businessId !== session.user.businessId) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  if (invoice.status !== "CONFIRMED") return NextResponse.json({ error: "يمكن إصدار الإشعار للفواتير المؤكدة فقط" }, { status: 400 });
  if (invoice.documentType !== "INVOICE") return NextResponse.json({ error: "لا يمكن إصدار إشعار لإشعار آخر" }, { status: 400 });

  const d = invoice.extractedData as ExtractedData | null;
  const originalTotal = d?.grandTotal ?? d?.totalAmount ?? 0;

  if (amount > originalTotal) {
    return NextResponse.json({ error: `المبلغ (${amount}) أكبر من إجمالي الفاتورة الأصلية (${originalTotal})` }, { status: 400 });
  }

  // Build reverse journal entry
  const originalLines = invoice.journalEntry?.lines ?? [];

  // For credit note: reverse the original proportionally
  const ratio = amount / (originalTotal || 1);
  const reverseLines = originalLines.map((line) => ({
    accountId: line.accountId,
    debit: Number(line.credit) * ratio,
    credit: Number(line.debit) * ratio,
    description: `إشعار دائن — ${line.description ?? ""}`,
  })).filter((l) => l.debit > 0 || l.credit > 0);

  if (reverseLines.length === 0) {
    return NextResponse.json({ error: "لم يتم العثور على قيود للعكس" }, { status: 400 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const creditNoteEntry = await createJournalEntry({
      businessId: session.user.businessId,
      userId: session.user.id,
      date: new Date(date),
      description: `إشعار دائن — ${d?.invoiceNumber ?? id} — ${reason}`,
      sourceType: "MANUAL",
      status: "POSTED",
      lines: reverseLines,
    });

    const creditNote = await tx.invoice.create({
      data: {
        businessId: session.user.businessId,
        fileUrl: invoice.fileUrl,
        fileType: invoice.fileType,
        extractedData: {
          ...(d ?? {}),
          grandTotal: amount,
          totalAmount: amount,
          invoiceNumber: `CN-${d?.invoiceNumber ?? id}`,
          notes: reason,
        },
        status: "CONFIRMED",
        invoiceType: invoice.invoiceType,
        documentType: "CREDIT_NOTE",
        relatedInvoiceId: id,
        contactId: invoice.contactId,
        journalEntryId: creditNoteEntry.id,
      },
    });

    return creditNote;
  });

  await logAudit({
    businessId: session.user.businessId,
    userId: session.user.id,
    userName: session.user.name ?? undefined,
    userEmail: session.user.email,
    action: "CREATE",
    entity: "Invoice",
    entityId: result.id,
    description: `إشعار دائن للفاتورة ${d?.invoiceNumber ?? id} بمبلغ ${amount}`,
  });

  return NextResponse.json({ creditNoteId: result.id }, { status: 201 });
}
