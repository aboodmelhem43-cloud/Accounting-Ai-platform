import { NextRequest, NextResponse } from "next/server";
import { verifyMobileToken } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";
import { suggestPurchaseJournalEntry, suggestSalesJournalEntry } from "@/lib/ledger";
import type { ExtractedInvoiceData } from "@/types";

function mapStatus(status: string): string {
  return status === "CONFIRMED" ? "POSTED" : status;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = await verifyMobileToken(req);
  if (!token) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { id } = await params;

  const invoice = await prisma.invoice.findFirst({
    where: { id, businessId: token.businessId },
    include: {
      journalEntry: {
        include: {
          lines: {
            include: {
              account: { select: { code: true, name: true, nameAr: true } },
            },
          },
        },
      },
    },
  });

  if (!invoice) return NextResponse.json({ error: "الفاتورة غير موجودة" }, { status: 404 });

  const ext = (invoice.extractedData as ExtractedInvoiceData | null) ?? {};
  const [currency, business] = await Promise.all([
    Promise.resolve((ext as any).currency ?? null),
    prisma.business.findUnique({ where: { id: token.businessId }, select: { baseCurrency: true } }),
  ]);
  const resolvedCurrency = (currency as string | null) ?? business?.baseCurrency ?? "SAR";

  // اقتراح قيد للفواتير قيد المراجعة
  let suggestedEntry: object | null = null;
  if (invoice.status === "PENDING_REVIEW" && (ext as any).totalAmount) {
    try {
      const extracted = ext as ExtractedInvoiceData;
      const netAmount = extracted.subtotal ?? (extracted.totalAmount! - (extracted.taxAmount ?? 0));
      const taxAmount = extracted.taxAmount ?? 0;
      const totalAmount = extracted.totalAmount!;
      const date = extracted.invoiceDate ?? new Date().toISOString().split("T")[0];

      if (invoice.invoiceType === "PURCHASE") {
        suggestedEntry = await suggestPurchaseJournalEntry({
          businessId: token.businessId,
          vendorName: extracted.vendorName ?? "مورد غير محدد",
          totalAmount,
          taxAmount,
          netAmount,
          date,
          invoiceNumber: extracted.invoiceNumber ?? undefined,
        });
      } else {
        suggestedEntry = await suggestSalesJournalEntry({
          businessId: token.businessId,
          customerName: (extracted as any).customerName ?? "عميل غير محدد",
          totalAmount,
          taxAmount,
          netAmount,
          date,
          invoiceNumber: extracted.invoiceNumber ?? undefined,
        });
      }
    } catch {
      // إذا فشل الاقتراح نعرض الفاتورة بدونه
    }
  }

  return NextResponse.json({
    ...invoice,
    status: mapStatus(invoice.status),
    vendorName: (ext as any).vendorName ?? (ext as any).sellerName ?? null,
    total: (ext as any).totalAmount ?? (ext as any).grandTotal ?? null,
    currency: resolvedCurrency,
    invoiceDate: (ext as any).invoiceDate ?? null,
    invoiceNumber: invoice.invoiceNumber ?? (ext as any).invoiceNumber ?? null,
    suggestedEntry,
  });
}
