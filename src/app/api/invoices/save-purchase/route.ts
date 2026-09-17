import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { InvoiceStatus } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createJournalEntry } from "@/lib/ledger";
import { checkInvoiceLimit } from "@/lib/plans";

const MAX_AMOUNT = 1_000_000_000;

const lineItemSchema = z.object({
  description: z.string(),
  quantity: z.number().min(0).max(MAX_AMOUNT),
  unitPrice: z.number().min(0).max(MAX_AMOUNT),
});

const schema = z.object({
  invoiceNumber: z.string().min(1),
  invoiceDate: z.string().min(1),
  dueDate: z.string().optional().nullable(),
  supplierName: z.string().min(1),
  supplierTaxNumber: z.string().optional().nullable(),
  supplierAddress: z.string().optional().nullable(),
  lineItems: z.array(lineItemSchema),
  subtotal: z.number().min(0).max(MAX_AMOUNT),
  taxRate: z.number().min(0).max(100),
  taxAmount: z.number().min(0).max(MAX_AMOUNT),
  grandTotal: z.number().min(0).max(MAX_AMOUNT),
  currency: z.string(),
  notes: z.string().optional().nullable(),
  expenseAccountId: z.string().optional().nullable(),
  status: z.enum(["DRAFT", "CONFIRMED"]).default("CONFIRMED"),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const data = parsed.data;
  const { businessId } = session.user;

  const limit = await checkInvoiceLimit(businessId);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `لقد وصلت إلى حد الفواتير (${limit.used}/${limit.limit}) — يرجى الترقية` },
      { status: 403 }
    );
  }

  const invoice = await prisma.invoice.create({
    data: {
      businessId,
      fileUrl: "",
      fileType: "created",
      invoiceType: "PURCHASE",
      status: data.status as InvoiceStatus,
      invoiceNumber: data.invoiceNumber,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      extractedData: {
        invoiceNumber: data.invoiceNumber,
        invoiceDate: data.invoiceDate,
        dueDate: data.dueDate ?? null,
        sellerName: data.supplierName,
        sellerTaxNumber: data.supplierTaxNumber ?? null,
        sellerAddress: data.supplierAddress ?? null,
        customerName: session.user.businessName ?? "My Business",
        lineItems: data.lineItems,
        subtotal: data.subtotal,
        taxRate: data.taxRate,
        taxAmount: data.taxAmount,
        totalAmount: data.grandTotal,
        grandTotal: data.grandTotal,
        currency: data.currency,
        currencySymbol: data.currency,
        notes: data.notes ?? null,
      },
    },
  });

  // Journal entry for confirmed purchase invoices
  if (data.status === "CONFIRMED") {
    try {
      const accounts = await prisma.account.findMany({
        where: { businessId, code: { in: ["2100", "2300", "5200", "5300"] } },
      });
      const byCode = Object.fromEntries(accounts.map((a) => [a.code, a]));

      const apAcc = byCode["2100"]; // Accounts Payable
      const vatInputAcc = byCode["2300"]; // VAT Input / Recoverable

      const journalLines: { accountId: string; debit: number; credit: number; description: string }[] = [];

      // Debit: selected expense account, or fallback to Purchase Expenses / Operating Expenses
      let expenseAccount = null;
      if (data.expenseAccountId) {
        expenseAccount = await prisma.account.findFirst({
          where: { id: data.expenseAccountId, businessId },
        });
      }
      if (!expenseAccount) {
        expenseAccount = byCode["5300"] ?? byCode["5200"] ?? null;
      }

      if (expenseAccount) {
        journalLines.push({
          accountId: expenseAccount.id,
          debit: data.subtotal,
          credit: 0,
          description: `${isArabic(data.supplierName) ? "مشتريات" : "Purchase"} — ${data.supplierName}`,
        });
      }

      // Debit: VAT input if applicable
      if (vatInputAcc && data.taxAmount > 0) {
        journalLines.push({
          accountId: vatInputAcc.id,
          debit: data.taxAmount,
          credit: 0,
          description: `ضريبة مدخلات — ${data.taxRate}%`,
        });
      }

      // Credit: Accounts Payable
      if (apAcc) {
        journalLines.push({
          accountId: apAcc.id,
          debit: 0,
          credit: data.grandTotal,
          description: `ذمم دائنة — ${data.supplierName} — ${data.invoiceNumber}`,
        });
      }

      if (journalLines.length >= 2) {
        await createJournalEntry({
          businessId,
          userId: session.user.id ?? session.user.email,
          date: new Date(data.invoiceDate),
          description: `فاتورة شراء — ${data.supplierName} رقم ${data.invoiceNumber}`,
          sourceType: "MANUAL",
          lines: journalLines,
          invoiceId: invoice.id,
        });
      }
    } catch (err) {
      console.error("[save-purchase] journal entry creation failed:", err);
    }
  }

  return NextResponse.json({ invoiceId: invoice.id }, { status: 201 });
}

function isArabic(text: string) {
  return /[؀-ۿ]/.test(text);
}
