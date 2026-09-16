import { NextRequest, NextResponse } from "next/server";
import { verifyMobileToken } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = await verifyMobileToken(req);
  if (!token) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { id } = await params;

  const [entry, business] = await Promise.all([
    prisma.journalEntry.findUnique({
      where: { id, businessId: token.businessId },
      include: {
        lines: {
          include: {
            account: { select: { code: true, name: true, nameAr: true } },
          },
        },
        creator:   { select: { name: true, email: true } },
        submitter: { select: { name: true, email: true } },
        reviewer:  { select: { name: true, email: true } },
        invoice:   { select: { id: true, invoiceType: true } },
      },
    }),
    prisma.business.findUnique({ where: { id: token.businessId }, select: { baseCurrency: true } }),
  ]);

  if (!entry) return NextResponse.json({ error: "القيد غير موجود" }, { status: 404 });

  const currency = business?.baseCurrency ?? "SAR";
  const totalDebits = entry.lines.reduce((s, l) => s + Number(l.debit), 0);

  return NextResponse.json({ entry: { ...entry, entryDate: entry.date, currency, totalDebits } });
}
