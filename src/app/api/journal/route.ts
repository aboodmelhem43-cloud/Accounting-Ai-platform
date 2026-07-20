import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createJournalEntry } from "@/lib/ledger";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page") ?? 1);
  const limit = 20;

  const [entries, total] = await Promise.all([
    prisma.journalEntry.findMany({
      where: { businessId: session.user.businessId },
      orderBy: { date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        lines: { include: { account: true } },
        creator:   { select: { name: true, email: true } },
        updater:   { select: { name: true, email: true } },
        submitter: { select: { name: true, email: true } },
        reviewer:  { select: { name: true, email: true } },
      },
    }),
    prisma.journalEntry.count({ where: { businessId: session.user.businessId } }),
  ]);

  return NextResponse.json({ entries, total, page, pages: Math.ceil(total / limit) });
}

const journalLineSchema = z.object({
  accountId: z.string().min(1),
  debit: z.number().min(0),
  credit: z.number().min(0),
  description: z.string().optional(),
});

const createJournalSchema = z.object({
  date: z.string().min(1),
  description: z.string().min(1),
  status: z.enum(["DRAFT", "PENDING_REVIEW", "POSTED"]).default("POSTED"),
  lines: z.array(journalLineSchema).min(2),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const parsed = createJournalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة", details: parsed.error.flatten() }, { status: 400 });
  }

  const { date, description, status, lines } = parsed.data;

  try {
    // Validate that all accountIds belong to this business
    const accountIds = [...new Set(lines.map((l) => l.accountId))];
    const validAccounts = await prisma.account.findMany({
      where: { id: { in: accountIds }, businessId: session.user.businessId },
      select: { id: true },
    });
    if (validAccounts.length !== accountIds.length) {
      return NextResponse.json({ error: "حساب غير صالح" }, { status: 400 });
    }

    // ACCOUNTANT cannot post directly — force to DRAFT if they somehow pass POSTED
    const resolvedStatus = session.user.role === "OWNER" ? status : (status === "POSTED" ? "DRAFT" : status);

    const entry = await createJournalEntry({
      businessId: session.user.businessId,
      userId: session.user.id,
      date: new Date(date),
      description,
      sourceType: "MANUAL",
      status: resolvedStatus,
      lines,
    });
    return NextResponse.json({ id: entry.id }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "خطأ في الخادم";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
