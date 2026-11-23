import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createJournalEntry, LedgerError } from "@/lib/ledger";
import { logAudit } from "@/lib/audit";

const reverseSchema = z.object({
  date: z.string().min(1).refine((s) => !isNaN(new Date(s).getTime()), { message: "تاريخ غير صالح" }).optional(),
  description: z.string().max(500).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { id } = await params;

  const original = await prisma.journalEntry.findUnique({
    where: { id, businessId: session.user.businessId },
    include: { lines: true },
  });

  if (!original) return NextResponse.json({ error: "القيد غير موجود" }, { status: 404 });
  if (original.status !== "POSTED") {
    return NextResponse.json({ error: "يمكن عكس القيود المُرحَّلة فقط" }, { status: 400 });
  }
  if (original.isLocked) {
    return NextResponse.json({ error: "القيد مقفل ولا يمكن عكسه" }, { status: 409 });
  }

  let body: unknown;
  try { body = await req.json().catch(() => ({})); } catch { body = {}; }
  const parsed = reverseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const reverseDate = parsed.data.date ? new Date(parsed.data.date) : new Date();
  const reverseDescription = parsed.data.description ?? `عكس: ${original.description}`;

  // القيد العكسي: نعكس المدين والدائن في كل سطر
  const reversedLines = original.lines.map((l) => ({
    accountId: l.accountId,
    debit: Number(l.credit),
    credit: Number(l.debit),
    description: l.description ?? undefined,
  }));

  let reversalEntry: { id: string };
  try {
    reversalEntry = await prisma.$transaction(async (tx) => {
      const je = await createJournalEntry({
        businessId: session.user.businessId,
        userId: session.user.id,
        date: reverseDate,
        description: reverseDescription,
        sourceType: "MANUAL",
        status: "POSTED",
        lines: reversedLines,
      }, tx);

      // Lock the original entry so it cannot be reversed a second time
      await tx.journalEntry.update({
        where: { id },
        data: { isLocked: true },
      });

      return je;
    });
  } catch (err) {
    if (err instanceof LedgerError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }

  await logAudit({
    businessId: session.user.businessId,
    userId: session.user.id,
    userName: session.user.name ?? undefined,
    userEmail: session.user.email,
    action: "CREATE",
    entity: "JournalEntry",
    entityId: reversalEntry.id,
    description: `قيد عكسي لـ: ${original.description} (أصل: ${id})`,
  });

  return NextResponse.json({ reversalEntryId: reversalEntry.id }, { status: 201 });
}
