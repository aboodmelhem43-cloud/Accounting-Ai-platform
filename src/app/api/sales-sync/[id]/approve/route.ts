import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createJournalEntry, validateJournalBalance } from "@/lib/ledger";
import { z } from "zod";

const lineSchema = z.object({
  accountId: z.string(),
  debit: z.number().min(0),
  credit: z.number().min(0),
  description: z.string().optional(),
});

const approveSchema = z.object({
  // Optionally override the AI-suggested lines
  lines: z.array(lineSchema).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { id } = await params;

  const event = await prisma.salesEvent.findFirst({
    where: { id, businessId: session.user.businessId },
  });
  if (!event) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  if (event.status !== "PENDING") {
    return NextResponse.json({ error: "تم معالجة هذا الحدث مسبقًا" }, { status: 409 });
  }

  let body: { lines?: unknown } = {};
  try {
    const raw = await req.text();
    if (raw) body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = approveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Use overridden lines from request body, or fall back to AI suggestion
  type SuggestedLine = { accountId: string; debit: number; credit: number; description?: string };
  let lines: SuggestedLine[] = parsed.data.lines ?? [];

  if (lines.length === 0 && event.suggestedEntry) {
    const suggested = event.suggestedEntry as { lines?: SuggestedLine[] };
    lines = suggested.lines ?? [];
  }

  if (lines.length < 2) {
    return NextResponse.json(
      { error: "القيد يحتاج على الأقل سطرين — يرجى تعيين الحسابات يدويًا" },
      { status: 422 }
    );
  }

  if (!validateJournalBalance(lines)) {
    return NextResponse.json(
      { error: "القيد غير متوازن: مجموع المدين لا يساوي مجموع الدائن" },
      { status: 422 }
    );
  }

  // Verify all referenced accounts belong to this business
  const accountIds = [...new Set(lines.map((l) => l.accountId))];
  const accounts = await prisma.account.findMany({
    where: { id: { in: accountIds }, businessId: session.user.businessId },
    select: { id: true },
  });
  if (accounts.length !== accountIds.length) {
    return NextResponse.json({ error: "حساب غير صالح في سطور القيد" }, { status: 400 });
  }

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

  // Mark event approved and link the journal entry
  await prisma.salesEvent.update({
    where: { id },
    data: { status: "APPROVED", journalEntryId: journalEntry.id },
  });

  return NextResponse.json({ ok: true, journalEntryId: journalEntry.id });
}
