import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createJordanCompliance } from "@/compliance/jordan";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const { role, businessId } = session.user;
  if (role !== "OWNER" && role !== "ACCOUNTANT") {
    return NextResponse.json({ error: "غير مصرح — مطلوب صلاحية مالك أو محاسب" }, { status: 403 });
  }

  let invoiceId: string;
  try {
    const body = (await req.json()) as { invoiceId?: string };
    if (!body.invoiceId) throw new Error("invoiceId مطلوب");
    invoiceId = body.invoiceId;
  } catch {
    return NextResponse.json({ error: "invoiceId مطلوب في جسم الطلب" }, { status: 400 });
  }

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, businessId },
    include: {
      business: { select: { name: true, taxNumber: true, address: true, country: true } },
      contact: { select: { name: true, taxNumber: true, address: true, type: true } },
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: "الفاتورة غير موجودة" }, { status: 404 });
  }

  if (invoice.status !== "CONFIRMED") {
    return NextResponse.json(
      { error: "يجب تأكيد الفاتورة قبل إرسالها لنظام JoFotara" },
      { status: 422 }
    );
  }

  if (invoice.invoiceType !== "SALES") {
    return NextResponse.json(
      { error: "نظام JoFotara ينطبق على فواتير المبيعات فقط" },
      { status: 422 }
    );
  }

  // Extract line items from AI-extracted data
  const extracted = invoice.extractedData as Record<string, unknown> | null;
  const rawLines = (extracted?.items as Array<Record<string, unknown>> | undefined) ?? [];

  const lineItems = rawLines.length > 0
    ? rawLines.map((item) => ({
        description: String(item.description ?? item.name ?? "بند"),
        quantity: Number(item.quantity ?? 1),
        unitPriceJOD: Number(item.unitPrice ?? item.amount ?? 0),
        discountAmount: Number(item.discount ?? 0),
        gstRate: 0.16,
      }))
    : [
        {
          description: "خدمات / بضاعة",
          quantity: 1,
          unitPriceJOD: Number(extracted?.netAmount ?? extracted?.total ?? 0) / 1.16,
          gstRate: 0.16,
        },
      ];

  // Fetch the previous submitted invoice hash for chaining
  const previousInvoice = await prisma.invoice.findFirst({
    where: {
      businessId,
      joFotaraStatus: { not: null },
      joFotaraUuid: { not: null },
      id: { not: invoiceId },
    },
    orderBy: { joFotaraSubmittedAt: "desc" },
    select: { joFotaraHash: true },
  });

  const previousInvoiceHash = (previousInvoice?.joFotaraHash as string | null) ?? "0";

  // Count previously submitted invoices for this business to get counter value
  const submittedCount = await prisma.invoice.count({
    where: { businessId, joFotaraUuid: { not: null } },
  });

  let compliance;
  try {
    compliance = createJordanCompliance();
  } catch {
    return NextResponse.json(
      { error: "بيانات اعتماد JoFotara غير مضبوطة — يرجى التواصل مع الدعم" },
      { status: 503 }
    );
  }

  try {
    const result = await compliance.submitInvoice({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      documentType: invoice.documentType,
      createdAt: invoice.createdAt,
      extractedData: invoice.extractedData,
      business: invoice.business,
      contact: invoice.contact
        ? {
            name: invoice.contact.name,
            taxNumber: invoice.contact.taxNumber,
            address: invoice.contact.address,
            type: invoice.contact.type,
          }
        : null,
      lineItems,
      previousInvoiceHash,
      invoiceCounter: submittedCount + 1,
    });

    if (result.uuid) {
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          joFotaraUuid: result.uuid,
          joFotaraStatus: result.status ?? "Submitted",
          joFotaraSubmittedAt: new Date(),
          joFotaraHash: result.invoiceHash,
        },
      });

      return NextResponse.json({
        success: true,
        uuid: result.uuid,
        status: result.status ?? "Submitted",
        invoiceHash: result.invoiceHash,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "رفض نظام JoFotara الفاتورة",
        details: result.errors,
      },
      { status: 422 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "خطأ غير متوقع";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
