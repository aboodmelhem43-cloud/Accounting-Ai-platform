import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ExtractedInvoiceData } from "@/types";

interface AgingRow {
  contactName: string;
  current: number;
  days30: number;
  days60: number;
  days90: number;
  total: number;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  if (type !== "AR" && type !== "AP") {
    return NextResponse.json({ error: "type يجب أن يكون AR أو AP" }, { status: 400 });
  }

  const businessId = session.user.businessId;

  const invoices = await prisma.invoice.findMany({
    where: {
      businessId,
      invoiceType: type === "AR" ? "SALES" : "PURCHASE",
      status: "CONFIRMED",
    },
    select: {
      id: true,
      createdAt: true,
      extractedData: true,
    },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const map = new Map<string, AgingRow>();

  for (const inv of invoices) {
    const data = inv.extractedData as Partial<ExtractedInvoiceData> | null;
    const contactName =
      (type === "AR" ? data?.customerName : data?.vendorName) ?? "Unknown";
    const invoiceDateRaw = data?.invoiceDate;
    const invoiceDate = invoiceDateRaw ? new Date(invoiceDateRaw) : inv.createdAt;
    const amount = data?.totalAmount ?? 0;

    const daysDiff = Math.max(
      0,
      Math.floor((today.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24))
    );

    if (!map.has(contactName)) {
      map.set(contactName, { contactName, current: 0, days30: 0, days60: 0, days90: 0, total: 0 });
    }

    const row = map.get(contactName)!;
    row.total += amount;

    if (daysDiff <= 30) row.current += amount;
    else if (daysDiff <= 60) row.days30 += amount;
    else if (daysDiff <= 90) row.days60 += amount;
    else row.days90 += amount;
  }

  const rows = Array.from(map.values()).sort((a, b) => b.total - a.total);

  return NextResponse.json({ type, rows });
}
