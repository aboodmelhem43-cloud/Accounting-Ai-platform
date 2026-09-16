import { NextRequest, NextResponse } from "next/server";
import { verifyMobileToken } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";
import { createJournalEntry, suggestPurchaseJournalEntry, suggestSalesJournalEntry } from "@/lib/ledger";
import type { ExtractedInvoiceData } from "@/types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = await verifyMobileToken(req);
  if (!token) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { id } = await params;

  const invoice = await prisma.invoice.findFirst({
    where: { id, businessId: token.businessId, status: "PENDING_REVIEW" },
  });

  if (!invoice) {
    return NextResponse.json({ error: "الفاتورة غير موجودة أو تم تأكيدها مسبقًا" }, { status: 404 });
  }

  try {
    const extracted = invoice.extractedData as ExtractedInvoiceData | null;
    if (!extracted || !extracted.totalAmount) {
      return NextResponse.json({ error: "لا توجد بيانات مستخرجة كافية لإنشاء القيد" }, { status: 400 });
    }

    const netAmount = extracted.subtotal ?? (extracted.totalAmount - (extracted.taxAmount ?? 0));
    const taxAmount = extracted.taxAmount ?? 0;
    const totalAmount = extracted.totalAmount;
    const date = extracted.invoiceDate ?? new Date().toISOString().split("T")[0];

    let suggestion;
    if (invoice.invoiceType === "PURCHASE") {
      suggestion = await suggestPurchaseJournalEntry({
        businessId: token.businessId,
        vendorName: extracted.vendorName ?? "مورد غير محدد",
        totalAmount,
        taxAmount,
        netAmount,
        date,
        invoiceNumber: extracted.invoiceNumber ?? undefined,
      });
    } else {
      suggestion = await suggestSalesJournalEntry({
        businessId: token.businessId,
        customerName: (extracted as any).customerName ?? "عميل غير محدد",
        totalAmount,
        taxAmount,
        netAmount,
        date,
        invoiceNumber: extracted.invoiceNumber ?? undefined,
      });
    }

    // تحويل أكواد الحسابات إلى IDs
    const accounts = await prisma.account.findMany({ where: { businessId: token.businessId } });
    const byCode = Object.fromEntries(accounts.map((a) => [a.code, a]));

    const journalLines = suggestion.lines
      .map((l) => ({
        accountId: byCode[l.accountCode]?.id ?? null,
        debit: l.debit,
        credit: l.credit,
        description: l.description,
      }))
      .filter((l) => l.accountId !== null) as {
        accountId: string;
        debit: number;
        credit: number;
        description?: string;
      }[];

    if (journalLines.length < 2) {
      return NextResponse.json({ error: "تعذّر تحديد حسابات القيد — تحقق من دليل الحسابات" }, { status: 400 });
    }

    const journalEntry = await createJournalEntry({
      businessId: token.businessId,
      userId: token.sub,
      date: new Date(date),
      description: suggestion.description,
      sourceType: "AI_INVOICE",
      lines: journalLines,
      invoiceId: invoice.id,
    });

    return NextResponse.json({
      journalEntryId: journalEntry.id,
      message: "تم تأكيد الفاتورة وترحيل القيد بنجاح",
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "فشل في تأكيد الفاتورة";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
