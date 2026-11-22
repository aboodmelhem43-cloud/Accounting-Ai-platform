import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { InvoiceStatus } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createJournalEntry, LedgerError } from "@/lib/ledger";
import { checkInvoiceLimit } from "@/lib/plans";
import { logAudit } from "@/lib/audit";

class PlanLimitError extends Error {
  constructor(public readonly limit: number) { super("plan_limit"); }
}

const MAX_AMOUNT = 1_000_000_000;
const isValidDate = (s: string) => !isNaN(new Date(s).getTime());

const lineItemSchema = z.object({
  description: z.string().max(500),
  quantity: z.number().min(0).max(MAX_AMOUNT),
  unitPrice: z.number().min(0).max(MAX_AMOUNT),
});

const schema = z.object({
  invoiceNumber: z.string().min(1).max(100),
  invoiceDate: z.string().min(1).refine(isValidDate, { message: "تاريخ الفاتورة غير صالح" }),
  dueDate: z.string().refine((s) => !s || isValidDate(s), { message: "تاريخ الاستحقاق غير صالح" }).optional().nullable(),
  supplierName: z.string().min(1).max(200),
  supplierTaxNumber: z.string().max(50).optional().nullable(),
  supplierAddress: z.string().max(500).optional().nullable(),
  lineItems: z.array(lineItemSchema).min(1).max(100),
  subtotal: z.number().min(0).max(MAX_AMOUNT),
  taxRate: z.number().min(0).max(100),
  taxAmount: z.number().min(0).max(MAX_AMOUNT),
  grandTotal: z.number().min(0).max(MAX_AMOUNT),
  currency: z.string().min(1).max(10),
  notes: z.string().max(2000).optional().nullable(),
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

  // Integrity: subtotal + taxAmount ≈ grandTotal
  if (Math.abs(data.subtotal + data.taxAmount - data.grandTotal) > 0.02) {
    return NextResponse.json({ error: "المجموع الكلي لا يطابق المجموع الفرعي والضريبة" }, { status: 400 });
  }

  let invoiceId: string;
  try {
    invoiceId = await prisma.$transaction(async (tx) => {
      // فحص الحد داخل المعاملة لمنع حالة السباق (TOCTOU)
      const limitCheck = await checkInvoiceLimit(businessId, tx);
      if (!limitCheck.allowed) {
        throw new PlanLimitError(limitCheck.limit);
      }

      const inv = await tx.invoice.create({
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
        const accounts = await tx.account.findMany({
          where: { businessId, code: { in: ["2100", "2200", "5200", "5300"] } },
        });
        const byCode = Object.fromEntries(accounts.map((a) => [a.code, a]));

        const apAcc = byCode["2100"];
        const vatInputAcc = byCode["2200"];

        const journalLines: { accountId: string; debit: number; credit: number; description: string }[] = [];

        let expenseAccount = null;
        if (data.expenseAccountId) {
          expenseAccount = await tx.account.findFirst({
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

        if (vatInputAcc && data.taxAmount > 0) {
          journalLines.push({
            accountId: vatInputAcc.id,
            debit: data.taxAmount,
            credit: 0,
            description: `ضريبة مدخلات — ${data.taxRate}%`,
          });
        }

        if (apAcc) {
          journalLines.push({
            accountId: apAcc.id,
            debit: 0,
            credit: data.grandTotal,
            description: `ذمم دائنة — ${data.supplierName} — ${data.invoiceNumber}`,
          });
        }

        if (journalLines.length >= 2) {
          await createJournalEntry(
            {
              businessId,
              userId: session.user.id ?? session.user.email,
              date: new Date(data.invoiceDate),
              description: `فاتورة شراء — ${data.supplierName} رقم ${data.invoiceNumber}`,
              sourceType: "MANUAL",
              lines: journalLines,
              invoiceId: inv.id,
            },
            tx
          );
        }
      }

      return inv.id;
    });
  } catch (err) {
    if (err instanceof PlanLimitError) {
      return NextResponse.json(
        { error: `لقد وصلت إلى حد الفواتير (${err.limit}) — يرجى الترقية` },
        { status: 403 }
      );
    }
    if (err instanceof LedgerError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    const name = err instanceof Error ? err.constructor.name : "";
    const isDbError = name.includes("Prisma") || (err instanceof Error && (err.message.includes("prisma") || /^P\d{4}/.test(err.message)));
    const message = isDbError ? "خطأ في الخادم" : (err instanceof Error ? err.message : "خطأ في الخادم");
    return NextResponse.json({ error: message }, { status: 500 });
  }

  await logAudit({
    businessId,
    userId: session.user.id,
    userName: session.user.name ?? undefined,
    userEmail: session.user.email,
    action: "CREATE",
    entity: "Invoice",
    entityId: invoiceId,
    description: `فاتورة شراء — ${data.supplierName} رقم ${data.invoiceNumber} — ${data.grandTotal} ${data.currency}`,
  });

  return NextResponse.json({ invoiceId }, { status: 201 });
}

function isArabic(text: string) {
  return /[؀-ۿ]/.test(text);
}
