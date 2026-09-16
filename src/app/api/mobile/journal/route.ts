import { NextRequest, NextResponse } from "next/server";
import { verifyMobileToken } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";
import { JournalEntryStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const token = await verifyMobileToken(req);
  if (!token) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page") ?? 1);
  const statusParam = searchParams.get("status");
  const limit = 20;

  const validStatuses = Object.values(JournalEntryStatus) as string[];
  const statusFilter =
    statusParam && validStatuses.includes(statusParam)
      ? (statusParam as JournalEntryStatus)
      : undefined;

  const where = {
    businessId: token.businessId,
    ...(statusFilter ? { status: statusFilter } : {}),
  };

  const [entries, total, business] = await Promise.all([
    prisma.journalEntry.findMany({
      where,
      orderBy: { date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        lines: { select: { debit: true } },
      },
    }),
    prisma.journalEntry.count({ where }),
    prisma.business.findUnique({ where: { id: token.businessId }, select: { baseCurrency: true } }),
  ]);

  const currency = business?.baseCurrency ?? "SAR";

  const mapped = entries.map((e) => ({
    id: e.id,
    description: e.description,
    reference: null,
    entryDate: e.date,
    status: e.status,
    sourceType: e.sourceType,
    totalDebits: e.lines.reduce((s, l) => s + Number(l.debit), 0),
    currency,
    createdAt: e.createdAt,
  }));

  return NextResponse.json({ entries: mapped, total, page, pages: Math.ceil(total / limit) });
}
