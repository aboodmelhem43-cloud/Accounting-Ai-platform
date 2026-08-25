import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createJournalEntry, validateJournalBalance } from "@/lib/ledger";
import { z } from "zod";

const batchSchema = z.object({
  action: z.enum(["approve", "reject"]),
  eventIds: z.array(z.string()).min(1).max(50),
  reason: z.string().max(500).optional(), // for reject
});

type SuggestedLine = { accountId: string; debit: number; credit: number; description?: string };

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const body = await req.json();
  const parsed = batchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { action, eventIds, reason } = parsed.data;

  const events = await prisma.salesEvent.findMany({
    where: {
      id: { in: eventIds },
      businessId: session.user.businessId,
      status: "PENDING",
    },
  });

  const results: { id: string; ok: boolean; error?: string; journalEntryId?: string }[] = [];

  for (const event of events) {
    if (action === "reject") {
      await prisma.salesEvent.update({
        where: { id: event.id },
        data: { status: "REJECTED", rejectionReason: reason ?? null },
      });
      results.push({ id: event.id, ok: true });
      continue;
    }

    // Approve — build journal entry from AI suggestion
    const suggested = event.suggestedEntry as { lines?: SuggestedLine[] } | null;
    const lines: SuggestedLine[] = suggested?.lines ?? [];

    if (lines.length < 2) {
      results.push({ id: event.id, ok: false, error: "لا يوجد اقتراح قيد — راجع يدويًا" });
      continue;
    }

    if (!validateJournalBalance(lines)) {
      results.push({ id: event.id, ok: false, error: "القيد المقترح غير متوازن" });
      continue;
    }

    // Verify accounts belong to this business
    const accountIds = [...new Set(lines.map((l) => l.accountId))];
    const accounts = await prisma.account.findMany({
      where: { id: { in: accountIds }, businessId: session.user.businessId },
      select: { id: true },
    });
    if (accounts.length !== accountIds.length) {
      results.push({ id: event.id, ok: false, error: "حساب غير صالح في القيد المقترح" });
      continue;
    }

    try {
      const journalEntry = await createJournalEntry({
        businessId: session.user.businessId,
        userId: session.user.id,
        date: event.occurredAt,
        description: `مبيعة من ${event.platform} — طلب #${event.orderNumber}`,
        sourceType: "AI_SALES",
        status: "POSTED",
        lines: lines.map((l) => ({
          accountId: l.accountId,
          debit: l.debit,
          credit: l.credit,
          description: l.description,
        })),
      });

      await prisma.salesEvent.update({
        where: { id: event.id },
        data: { status: "APPROVED", journalEntryId: journalEntry.id },
      });

      results.push({ id: event.id, ok: true, journalEntryId: journalEntry.id });
    } catch (err) {
      results.push({ id: event.id, ok: false, error: err instanceof Error ? err.message : "خطأ غير متوقع" });
    }
  }

  // Events that were requested but not found (already processed or wrong tenant)
  const processedIds = new Set(events.map((e) => e.id));
  for (const id of eventIds) {
    if (!processedIds.has(id)) {
      results.push({ id, ok: false, error: "غير موجود أو تمت معالجته مسبقًا" });
    }
  }

  const succeeded = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;

  return NextResponse.json({ results, succeeded, failed });
}
