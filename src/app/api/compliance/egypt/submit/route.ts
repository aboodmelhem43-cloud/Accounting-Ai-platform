import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createEgyptCompliance } from "@/compliance/egypt";

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

  // Fetch invoice with related data — scoped to the current tenant
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
      { error: "يجب تأكيد الفاتورة قبل إرسالها لمنظومة ETA" },
      { status: 422 }
    );
  }

  if (invoice.invoiceType !== "SALES") {
    return NextResponse.json(
      { error: "منظومة ETA تنطبق على فواتير المبيعات فقط" },
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
        unitPriceEGP: Number(item.unitPrice ?? item.amount ?? 0),
        discountAmount: Number(item.discount ?? 0),
        vatRate: 0.14,
      }))
    : [
        // Fallback: single line from invoice total
        {
          description: "خدمات / بضاعة",
          quantity: 1,
          unitPriceEGP: Number(extracted?.netAmount ?? extracted?.total ?? 0) / 1.14,
          vatRate: 0.14,
        },
      ];

  let compliance;
  try {
    compliance = createEgyptCompliance(
      process.env.NODE_ENV === "production" ? "production" : "sandbox"
    );
  } catch (err) {
    return NextResponse.json(
      { error: "بيانات اعتماد ETA غير مضبوطة — يرجى التواصل مع الدعم" },
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
    });

    const accepted = result.acceptedDocuments[0];
    const rejected = result.rejectedDocuments[0];

    if (accepted) {
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          etaUuid: accepted.uuid,
          etaStatus: "Submitted",
          etaSubmittedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        etaUuid: accepted.uuid,
        longId: accepted.longId,
        status: "Submitted",
        submissionId: result.submissionId,
      });
    }

    // Document was rejected by ETA
    return NextResponse.json(
      {
        success: false,
        error: "رفضت منظومة ETA الفاتورة",
        details: rejected?.error,
      },
      { status: 422 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "خطأ غير متوقع";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
