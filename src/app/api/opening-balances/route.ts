import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createJournalEntry } from "@/lib/ledger";
import { logAudit } from "@/lib/audit";

const lineSchema = z.object({
  accountId: z.string().min(1),
  debit: z.number().min(0),
  credit: z.number().min(0),
});

const schema = z.object({
  date: z.string().min(1),
  lines: z.array(lineSchema).min(1),
});

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  // Find the existing opening balance entry (sourceType=MANUAL, description starts with "أرصدة افتتاحية")
  const existing = await prisma.journalEntry.findFirst({
    where: {
      businessId: session.user.businessId,
      description: { startsWith: "أرصدة افتتاحية" },
    },
    include: {
      lines: { include: { account: { select: { id: true, code: true, name: true, nameAr: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ existing });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "بيانات غير صالحة", details: parsed.error.flatten() }, { status: 400 });

  const { date, lines } = parsed.data;

  // Filter out zero lines
  const nonZeroLines = lines.filter((l) => l.debit > 0 || l.credit > 0);
  if (nonZeroLines.length < 2) return NextResponse.json({ error: "يجب إدخال رصيد لحسابين على الأقل" }, { status: 400 });

  // Validate balance
  const totalDebit = nonZeroLines.reduce((s, l) => s + l.debit, 0);
  const totalCredit = nonZeroLines.reduce((s, l) => s + l.credit, 0);
  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    return NextResponse.json({ error: `القيد غير متوازن: مدين ${totalDebit.toFixed(2)} ≠ دائن ${totalCredit.toFixed(2)}` }, { status: 400 });
  }

  // Validate account ownership
  const accountIds = [...new Set(nonZeroLines.map((l) => l.accountId))];
  const validAccounts = await prisma.account.findMany({
    where: { id: { in: accountIds }, businessId: session.user.businessId },
    select: { id: true },
  });
  if (validAccounts.length !== accountIds.length) {
    return NextResponse.json({ error: "حساب غير صالح" }, { status: 400 });
  }

  // Delete any existing opening balance entries
  await prisma.journalEntry.deleteMany({
    where: {
      businessId: session.user.businessId,
      description: { startsWith: "أرصدة افتتاحية" },
    },
  });

  try {
    const entry = await createJournalEntry({
      businessId: session.user.businessId,
      userId: session.user.id,
      date: new Date(date),
      description: `أرصدة افتتاحية — ${date}`,
      sourceType: "MANUAL",
      status: "POSTED",
      lines: nonZeroLines,
    });

    await logAudit({
      businessId: session.user.businessId,
      userId: session.user.id,
      userName: session.user.name ?? undefined,
      userEmail: session.user.email,
      action: "CREATE",
      entity: "JournalEntry",
      entityId: entry.id,
      description: `استيراد أرصدة افتتاحية بتاريخ ${date}`,
    });

    return NextResponse.json({ entryId: entry.id }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "خطأ في الخادم";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
