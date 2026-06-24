import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkInvoiceLimit } from "@/lib/plans";

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

  const invoice = await prisma.invoice.create({
    data: {
      businessId: session.user.businessId,
      fileUrl: "",           // no file for created invoices
      fileType: "created",   // distinguishes from uploaded invoices
      invoiceType: "SALES",
      status: "CONFIRMED",   // no review needed — user created it manually
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

  return NextResponse.json({ invoiceId: invoice.id }, { status: 201 });
}
