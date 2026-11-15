import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkInvoiceLimit } from "@/lib/plans";
import { createJournalEntry } from "@/lib/ledger";
import { logAudit } from "@/lib/audit";

class PlanLimitError extends Error {
  constructor(public readonly limit: number) { super("plan_limit"); }
}

const MAX_AMOUNT = 1_000_000_000;

const lineItemSchema = z.object({
  description: z.string().min(1).max(500),
  quantity: z.number().min(0.001).max(MAX_AMOUNT),
  unitPrice: z.number().min(0).max(MAX_AMOUNT),
});

const schema = z.object({
  invoiceNumber: z.string().min(1).max(50),
  invoiceDate: z.string().min(1).refine((s) => !isNaN(new Date(s).getTime()), { message: "تاريخ الفاتورة غير صالح" }),
  dueDate: z.string().optional().refine((s) => !s || !isNaN(new Date(s).getTime()), { message: "تاريخ الاستحقاق غير صالح" }),
  sellerName: z.string().max(200),
  sellerTaxNumber: z.string().max(50).optional(),
  sellerAddress: z.string().max(500).optional(),
  customerName: z.string().max(200),
  customerTaxNumber: z.string().max(50).optional(),
  customerAddress: z.string().max(500).optional(),
  customerPhone: z.string().max(30).optional(),
  customerEmail: z.string().email().max(200).optional().or(z.literal("")).optional(),
  contactId: z.string().optional(),
  lineItems: z.array(lineItemSchema).min(1).max(200),
  subtotal: z.number().min(0).max(MAX_AMOUNT),
  taxRate: z.number().min(0).max(100),
  taxAmount: z.number().min(0).max(MAX_AMOUNT),
  grandTotal: z.number().min(0).max(MAX_AMOUNT),
  currency: z.string().max(10),
  currencySymbol: z.string().max(10),
  notes: z.string().max(2000).optional(),
  country: z.string().max(2).optional(),
  eInvoiceSystem: z.string().max(50).nullable().optional(),
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

  // تحقق من توازن الإجماليات — grandTotal يجب أن يساوي subtotal + taxAmount
  const computedTotal = Math.round((data.subtotal + data.taxAmount) * 100) / 100;
  if (Math.abs(computedTotal - data.grandTotal) > 0.01) {
    return NextResponse.json({ error: "إجمالي الفاتورة لا يتطابق مع مجموع المبلغ قبل الضريبة والضريبة" }, { status: 400 });
  }

  const { businessId } = session.user;

  // جلب الحسابات المطلوبة للقيد
  const accounts = await prisma.account.findMany({
    where: { businessId, code: { in: ["1200", "4100", "2200"] } },
  });
  const byCode = Object.fromEntries(accounts.map((a) => [a.code, a]));

  // Validate contactId if provided
  if (data.contactId) {
    const contact = await prisma.contact.findFirst({
      where: { id: data.contactId, businessId },
    });
    if (!contact) {
      return NextResponse.json({ error: "جهة الاتصال غير صالحة" }, { status: 400 });
    }
  }

  // التحقق من عدم تكرار رقم الفاتورة لنفس المنشأة
  const existingInvoice = await prisma.invoice.findFirst({
    where: { businessId, invoiceNumber: data.invoiceNumber },
    select: { id: true },
  });
  if (existingInvoice) {
    return NextResponse.json({ error: `رقم الفاتورة "${data.invoiceNumber}" مستخدم بالفعل` }, { status: 409 });
  }

  // قيد محاسبي تلقائي للفاتورة المُنشأة يدوياً
  const journalLines: { accountId: string; debit: number; credit: number; description: string }[] = [];

  const arAcc = byCode["1200"]; // Accounts Receivable
  const revAcc = byCode["4100"]; // Sales Revenue
  const taxAcc = byCode["2200"]; // VAT Payable

  if (arAcc) {
    journalLines.push({ accountId: arAcc.id, debit: data.grandTotal, credit: 0, description: `مدينون — ${data.customerName}` });
  }
  if (revAcc) {
    journalLines.push({ accountId: revAcc.id, debit: 0, credit: data.subtotal, description: `إيرادات مبيعات — ${data.invoiceNumber}` });
  }
  if (taxAcc && data.taxAmount > 0) {
    journalLines.push({ accountId: taxAcc.id, debit: 0, credit: data.taxAmount, description: "ضريبة مخرجات (VAT)" });
  }

  // إنشاء الفاتورة والقيد المحاسبي في معاملة واحدة لضمان الاتساق
  let invoice: Awaited<ReturnType<typeof prisma.invoice.create>>;
  try {
    invoice = await prisma.$transaction(async (tx) => {
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
        invoiceType: "SALES",
        status: "CONFIRMED",
        invoiceNumber: data.invoiceNumber,
        contactId: data.contactId ?? null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        extractedData: {
          invoiceNumber: data.invoiceNumber,
          invoiceDate: data.invoiceDate,
          dueDate: data.dueDate ?? null,
          sellerName: data.sellerName,
          sellerTaxNumber: data.sellerTaxNumber ?? null,
          sellerAddress: data.sellerAddress ?? null,
          customerName: data.customerName,
          customerTaxNumber: data.customerTaxNumber ?? null,
          customerAddress: data.customerAddress ?? null,
          customerPhone: data.customerPhone ?? null,
          customerEmail: data.customerEmail ?? null,
          lineItems: data.lineItems,
          subtotal: data.subtotal,
          taxRate: data.taxRate,
          taxAmount: data.taxAmount,
          totalAmount: data.grandTotal,
          grandTotal: data.grandTotal,
          currency: data.currency,
          currencySymbol: data.currencySymbol,
          notes: data.notes ?? null,
          country: data.country ?? null,
          eInvoiceSystem: data.eInvoiceSystem ?? null,
        },
      },
    });

    // نُنشئ القيد فقط إذا وُجدت الحسابات — الفاتورة والقيد في نفس المعاملة
    if (journalLines.length >= 2) {
      await createJournalEntry({
        businessId,
        userId: session.user.id ?? session.user.email,
        date: new Date(data.invoiceDate),
        description: `فاتورة مبيعات — ${data.customerName} رقم ${data.invoiceNumber}`,
        sourceType: "MANUAL",
        lines: journalLines,
        invoiceId: inv.id,
      }, tx);
    }

    return inv;
    });
  } catch (err) {
    if (err instanceof PlanLimitError) {
      return NextResponse.json({
        error: "plan_limit",
        message: err.limit === 0
          ? "انتهت فترة التجربة المجانية. يرجى الترقية للاستمرار."
          : `وصلت للحد الأقصى (${err.limit} فاتورة/شهر). يرجى الترقية.`,
      }, { status: 403 });
    }
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }

  // Advance the invoice number seed so the next auto-number is fresh
  try {
    const biz = await prisma.business.findUnique({
      where: { id: businessId },
      select: { invoiceNumberPrefix: true, invoiceNumberSeed: true },
    });
    const prefix = biz?.invoiceNumberPrefix ?? "INV";
    const expectedPattern = new RegExp(`^${prefix}-\\d+$`);
    if (expectedPattern.test(data.invoiceNumber)) {
      const num = parseInt(data.invoiceNumber.replace(`${prefix}-`, ""), 10);
      if (!isNaN(num) && num > (biz?.invoiceNumberSeed ?? 0)) {
        await prisma.business.update({
          where: { id: businessId },
          data: { invoiceNumberSeed: num },
        });
      }
    }
  } catch {
    // non-critical — seed sync failure doesn't affect the saved invoice
  }

  await logAudit({
    businessId,
    userId: session.user.id,
    userName: session.user.name ?? undefined,
    userEmail: session.user.email,
    action: "CREATE",
    entity: "Invoice",
    entityId: invoice.id,
    description: `فاتورة مبيعات — ${data.customerName} رقم ${data.invoiceNumber} — ${data.grandTotal} ${data.currency}`,
  });

  return NextResponse.json({ invoiceId: invoice.id }, { status: 201 });
}
