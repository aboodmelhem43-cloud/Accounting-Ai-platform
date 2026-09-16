import { NextRequest, NextResponse } from "next/server";
import { verifyMobileToken } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";

// مطابقة حالة الفاتورة مع ما يتوقعه التطبيق (CONFIRMED → POSTED)
function mapStatus(status: string): string {
  return status === "CONFIRMED" ? "POSTED" : status;
}

export async function GET(req: NextRequest) {
  const token = await verifyMobileToken(req);
  if (!token) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page") ?? 1);
  const statusParam = searchParams.get("status");
  const limit = 20;

  // تحويل POSTED → CONFIRMED للبحث في قاعدة البيانات
  const dbStatus = statusParam === "POSTED" ? "CONFIRMED" : statusParam;
  const validStatuses = ["PENDING_REVIEW", "CONFIRMED", "REJECTED"];
  const statusFilter = dbStatus && validStatuses.includes(dbStatus) ? dbStatus : undefined;

  const where = {
    businessId: token.businessId,
    ...(statusFilter ? { status: statusFilter as any } : {}),
  };

  const [invoices, total, business] = await Promise.all([
    prisma.invoice.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.invoice.count({ where }),
    prisma.business.findUnique({ where: { id: token.businessId }, select: { baseCurrency: true } }),
  ]);

  const currency = business?.baseCurrency ?? "SAR";

  const mapped = invoices.map((inv) => {
    const ext = (inv.extractedData as Record<string, any> | null) ?? {};
    return {
      id: inv.id,
      invoiceNumber: inv.invoiceNumber ?? ext.invoiceNumber ?? null,
      vendorName: ext.vendorName ?? ext.sellerName ?? ext.customerName ?? null,
      total: ext.totalAmount ?? ext.grandTotal ?? null,
      currency: ext.currency ?? currency,
      status: mapStatus(inv.status),
      invoiceType: inv.invoiceType,
      invoiceDate: ext.invoiceDate ?? null,
      createdAt: inv.createdAt,
      extractedData: inv.extractedData,
    };
  });

  return NextResponse.json({ invoices: mapped, total, page, pages: Math.ceil(total / limit) });
}
