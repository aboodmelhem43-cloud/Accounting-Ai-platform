import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createJournalEntry, suggestPurchaseJournalEntry, suggestSalesJournalEntry } from "@/lib/ledger";
import { checkInvoiceLimit } from "@/lib/plans";
import type { ExtractedInvoiceData } from "@/types";

const schema = z.object({
  ids: z.array(z.string()).min(1).max(100),
  action: z.enum(["reject", "confirm"]),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { ids, action } = parsed.data;
  const { businessId } = session.user;

  let invoiceCapacity = Infinity; // unlimited by default
  if (action === "confirm") {
    const limit = await checkInvoiceLimit(businessId);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: `لقد وصلت إلى حد الفواتير (${limit.used}/${limit.limit}) — يرجى الترقية` },
        { status: 403 }
      );
    }
    if (limit.limit > 0) {
      invoiceCapacity = limit.limit - limit.used;
    }
  }

  // Verify all invoices belong to this business and are PENDING_REVIEW
  const invoices = await prisma.invoice.findMany({
    where: { id: { in: ids }, businessId, status: "PENDING_REVIEW" },
  });

  const validIds = new Set(invoices.map((i) => i.id));
  const skippedNotFound = ids.filter((id) => !validIds.has(id));

  if (action === "reject") {
    await prisma.invoice.updateMany({
      where: { id: { in: [...validIds] }, businessId },
      data: { status: "REJECTED" },
    });
    return NextResponse.json({ updated: validIds.size, skipped: skippedNotFound.length });
  }

  // action === "confirm"
  let confirmed = 0;
  const skippedNoData: string[] = [];
  const errors: string[] = [];

  // جلب الحسابات مرة واحدة فقط
  const accounts = await prisma.account.findMany({ where: { businessId } });
  const byCode = Object.fromEntries(accounts.map((a) => [a.code, a]));

  for (const invoice of invoices) {
    const extracted = invoice.extractedData as ExtractedInvoiceData | null;
    if (!extracted?.totalAmount) {
      skippedNoData.push(invoice.id);
      continue;
    }

    try {
      const netAmount = extracted.subtotal ?? (extracted.totalAmount - (extracted.taxAmount ?? 0));
      const taxAmount = extracted.taxAmount ?? 0;
      const totalAmount = extracted.totalAmount;
      const date = extracted.invoiceDate ?? new Date().toISOString().split("T")[0];

      let suggestion;
      if (invoice.invoiceType === "PURCHASE") {
        suggestion = await suggestPurchaseJournalEntry({
          businessId,
          vendorName: extracted.vendorName ?? "مورد غير محدد",
          totalAmount,
          taxAmount,
          netAmount,
          date,
          invoiceNumber: extracted.invoiceNumber ?? undefined,
        });
      } else {
        suggestion = await suggestSalesJournalEntry({
          businessId,
          customerName: extracted.customerName ?? "عميل غير محدد",
          totalAmount,
          taxAmount,
          netAmount,
          date,
          invoiceNumber: extracted.invoiceNumber ?? undefined,
        });
      }

      const lines = suggestion.lines
        .map((l) => ({
          accountId: byCode[l.accountCode]?.id ?? null,
          debit: l.debit,
          credit: l.credit,
          description: l.description,
        }))
        .filter((l): l is typeof l & { accountId: string } => !!l.accountId);

      if (lines.length < 2) {
        skippedNoData.push(invoice.id);
        continue;
      }

      if (confirmed >= invoiceCapacity) {
        skippedNoData.push(invoice.id);
        continue;
      }

      await createJournalEntry({
        businessId,
        userId: session.user.id ?? session.user.email,
        date: new Date(date),
        description: suggestion.description,
        sourceType: "AI_INVOICE",
        lines,
        invoiceId: invoice.id,
      });

      confirmed++;
    } catch (e) {
      errors.push(invoice.id);
      console.error("[bulk/confirm] failed for invoice", invoice.id, e);
    }
  }

  return NextResponse.json({
    confirmed,
    skippedNoData: skippedNoData.length,
    skippedNotFound: skippedNotFound.length,
    errors: errors.length,
  });
}
