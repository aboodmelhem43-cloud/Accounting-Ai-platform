import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkInvoiceLimit } from "@/lib/plans";
import { createJournalEntry } from "@/lib/ledger";

const lineItemSchema = z.object({
  description: z.string(),
  quantity: z.number(),
  unitPrice: z.number(),
});

const schema = z.object({
  invoiceNumber: z.string().min(1),
  invoiceDate: z.string().min(1),
  dueDate: z.string().optional(),
  sellerName: z.string(),
  sellerTaxNumber: z.string().optional(),
  sellerAddress: z.string().optional(),
  customerName: z.string(),
  customerTaxNumber: z.string().optional(),
  customerAddress: z.string().optional(),
  customerPhone: z.string().optional(),
  customerEmail: z.string().optional(),
  contactId: z.string().optional(),
  lineItems: z.array(lineItemSchema),
  subtotal: z.number(),
  taxRate: z.number(),
  taxAmount: z.number(),
  grandTotal: z.number(),
  currency: z.string(),
  currencySymbol: z.string(),
  notes: z.string().optional(),
  country: z.string().optional(),
  eInvoiceSystem: z.string().nullable().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const limitCheck = await checkInvoiceLimit(session.user.businessId);
  if (!limitCheck.allowed) {
    return NextResponse.json({
      error: "plan_limit",
      message: limitCheck.limit === 0
        ? "انتهت فترة التجربة المجانية. يرجى الترقية للاستمرار."
        : `وصلت للحد الأقصى (${limitCheck.limit} فاتورة/شهر). يرجى الترقية.`,
    }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const data = parsed.data;
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

  const invoice = await prisma.invoice.create({
    data: {
      businessId,
      fileUrl: "",
      fileType: "created",
      invoiceType: "SALES",
      status: "CONFIRMED",
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

  // قيد محاسبي تلقائي للفاتورة المُنشأة يدوياً
  // مدين: المدينون/العملاء (1200) بالإجمالي
  // دائن: إيرادات المبيعات (4100) بالمبلغ قبل الضريبة
  // دائن: ضريبة القيمة المضافة المستحقة (2200) بقيمة الضريبة
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

  // نُنشئ القيد فقط إذا وُجدت الحسابات وكان القيد متوازناً
  if (journalLines.length >= 2) {
    try {
      await createJournalEntry({
        businessId,
        userId: session.user.id ?? session.user.email,
        date: new Date(data.invoiceDate),
        description: `فاتورة مبيعات — ${data.customerName} رقم ${data.invoiceNumber}`,
        sourceType: "MANUAL",
        lines: journalLines,
        invoiceId: invoice.id,
      });
    } catch {
      // القيد اختياري — لا نفشل الحفظ إذا فشل القيد
    }
  }

  return NextResponse.json({ invoiceId: invoice.id }, { status: 201 });
}
