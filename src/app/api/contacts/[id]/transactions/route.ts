import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ExtractedInvoiceData } from "@/types";

// جلب الفواتير والرصيد لجهة اتصال معينة
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { id } = await params;

  const contact = await prisma.contact.findFirst({
    where: { id, businessId: session.user.businessId },
    include: {
      invoices: {
        where: { status: "CONFIRMED" },
        include: { payments: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!contact) return NextResponse.json({ error: "جهة الاتصال غير موجودة" }, { status: 404 });

  let totalBilled = 0;
  let totalPaid = 0;

  const invoices = contact.invoices.map((inv) => {
    const extracted = inv.extractedData as ExtractedInvoiceData | null;
    const invoiceTotal = extracted?.totalAmount ?? 0;
    const paidAmount = inv.payments.reduce((s, p) => s + Number(p.amount), 0);

    totalBilled += invoiceTotal;
    totalPaid += paidAmount;

    return {
      id: inv.id,
      invoiceNumber: extracted?.invoiceNumber ?? null,
      invoiceDate: extracted?.invoiceDate ?? null,
      dueDate: inv.dueDate?.toISOString().split("T")[0] ?? null,
      total: invoiceTotal,
      paid: paidAmount,
      outstanding: invoiceTotal - paidAmount,
      paymentStatus: inv.paymentStatus,
      invoiceType: inv.invoiceType,
      createdAt: inv.createdAt,
    };
  });

  return NextResponse.json({
    contact,
    invoices,
    summary: {
      totalBilled,
      totalPaid,
      outstanding: totalBilled - totalPaid,
      currency: session.user.currency,
    },
  });
}
