import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createJournalEntry, suggestPurchaseJournalEntry, suggestSalesJournalEntry } from "@/lib/ledger";
import type { ExtractedInvoiceData } from "@/types";

const lineSchema = z.object({
  accountId: z.string(),
  debit: z.number().min(0),
  credit: z.number().min(0),
  description: z.string().optional(),
});

const confirmSchema = z.object({
  // المستخدم يمكنه تعديل القيد المقترح أو الموافقة عليه كما هو
  journalLines: z.array(lineSchema).min(2),
  description: z.string().min(1),
  date: z.string(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { id } = await params;

  const invoice = await prisma.invoice.findFirst({
    where: { id, businessId: session.user.businessId, status: "PENDING_REVIEW" },
  });

  if (!invoice) {
    return NextResponse.json({ error: "الفاتورة غير موجودة أو تم تأكيدها مسبقًا" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const data = confirmSchema.parse(body);

    // Validate that all accountIds belong to this business
    const accountIds = [...new Set(data.journalLines.map((l) => l.accountId))];
    const validAccounts = await prisma.account.findMany({
      where: { id: { in: accountIds }, businessId: session.user.businessId },
      select: { id: true },
    });
    if (validAccounts.length !== accountIds.length) {
      return NextResponse.json({ error: "حساب غير صالح" }, { status: 400 });
    }

    const journalEntry = await createJournalEntry({
      businessId: session.user.businessId,
      userId: session.user.id ?? session.user.email,
      date: new Date(data.date),
      description: data.description,
      sourceType: "AI_INVOICE",
      lines: data.journalLines,
      invoiceId: invoice.id,
    });

    return NextResponse.json({ journalEntryId: journalEntry.id, message: "تم تأكيد الفاتورة وترحيل القيد بنجاح" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "فشل في تأكيد الفاتورة" }, { status: 500 });
  }
}

// جلب القيد المقترح لفاتورة معينة (قبل التأكيد)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { id } = await params;

  const invoice = await prisma.invoice.findFirst({
    where: { id, businessId: session.user.businessId },
  });

  if (!invoice) return NextResponse.json({ error: "الفاتورة غير موجودة" }, { status: 404 });

  const extracted = invoice.extractedData as ExtractedInvoiceData | null;
  if (!extracted || !extracted.totalAmount) {
    return NextResponse.json({ error: "لا توجد بيانات مستخرجة كافية لاقتراح قيد" }, { status: 400 });
  }

  const netAmount = extracted.subtotal ?? (extracted.totalAmount - (extracted.taxAmount ?? 0));
  const taxAmount = extracted.taxAmount ?? 0;
  const totalAmount = extracted.totalAmount;
  const date = extracted.invoiceDate ?? new Date().toISOString().split("T")[0];

  let suggestion;
  if (invoice.invoiceType === "PURCHASE") {
    suggestion = await suggestPurchaseJournalEntry({
      businessId: session.user.businessId,
      vendorName: extracted.vendorName ?? "مورد غير محدد",
      totalAmount,
      taxAmount,
      netAmount,
      date,
      invoiceNumber: extracted.invoiceNumber ?? undefined,
    });
  } else {
    suggestion = await suggestSalesJournalEntry({
      businessId: session.user.businessId,
      customerName: extracted.customerName ?? "عميل غير محدد",
      totalAmount,
      taxAmount,
      netAmount,
      date,
      invoiceNumber: extracted.invoiceNumber ?? undefined,
    });
  }

  // إضافة accountId بجانب accountCode
  const accounts = await prisma.account.findMany({ where: { businessId: session.user.businessId } });
  const byCode = Object.fromEntries(accounts.map((a) => [a.code, a]));

  const linesWithIds = suggestion.lines.map((l) => ({
    ...l,
    accountId: byCode[l.accountCode]?.id ?? null,
  }));

  return NextResponse.json({ ...suggestion, lines: linesWithIds });
}
