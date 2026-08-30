import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createJournalEntry } from "@/lib/ledger";

const step1Schema = z.object({
  step: z.literal(1),
  name: z.string().min(2),
  taxNumber: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
});

const step3Schema = z.object({
  step: z.literal(3),
  cashBalance: z.number().min(0).optional(),
  arBalance: z.number().min(0).optional(),
  apBalance: z.number().min(0).optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const body = await req.json();

  if (body.step === 1) {
    const parsed = step1Schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
    const { name, taxNumber, address, phone } = parsed.data;
    await prisma.business.update({
      where: { id: session.user.businessId },
      data: {
        name,
        taxNumber: taxNumber || null,
        address: address || null,
        phone: phone || null,
      },
    });
    return NextResponse.json({ ok: true });
  }

  if (body.step === 3) {
    const parsed = step3Schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });

    const { cashBalance = 0, arBalance = 0, apBalance = 0 } = parsed.data;
    const totalAssets = cashBalance + arBalance;
    const equityBalance = totalAssets - apBalance;

    await prisma.business.update({
      where: { id: session.user.businessId },
      data: { onboardingCompleted: true },
    });

    // Create opening balance journal entry when at least one balance is non-zero
    if (totalAssets > 0 || apBalance > 0) {
      const businessId = session.user.businessId;
      const accounts = await prisma.account.findMany({
        where: { businessId, code: { in: ["1100", "1200", "2100", "3100"] } },
        select: { id: true, code: true },
      });
      const byCode: Record<string, string> = {};
      for (const a of accounts) byCode[a.code] = a.id;

      const lines: { accountId: string; debit: number; credit: number; description: string }[] = [];
      if (cashBalance > 0 && byCode["1100"]) {
        lines.push({ accountId: byCode["1100"], debit: cashBalance, credit: 0, description: "Opening balance – Cash & Banks" });
      }
      if (arBalance > 0 && byCode["1200"]) {
        lines.push({ accountId: byCode["1200"], debit: arBalance, credit: 0, description: "Opening balance – Accounts Receivable" });
      }
      if (apBalance > 0 && byCode["2100"]) {
        lines.push({ accountId: byCode["2100"], debit: 0, credit: apBalance, description: "Opening balance – Accounts Payable" });
      }
      if (byCode["3100"]) {
        if (equityBalance > 0) {
          lines.push({ accountId: byCode["3100"], debit: 0, credit: equityBalance, description: "Opening balance – Owner's Equity" });
        } else if (equityBalance < 0) {
          // Negative equity (liabilities exceed assets) — debit equity
          lines.push({ accountId: byCode["3100"], debit: Math.abs(equityBalance), credit: 0, description: "Opening balance – Owner's Equity (deficit)" });
        }
      }

      if (lines.length >= 2) {
        await createJournalEntry({
          businessId,
          userId: session.user.id,
          date: new Date(),
          description: "أرصدة افتتاحية / Opening Balances",
          sourceType: "MANUAL",
          status: "POSTED",
          lines,
        });
      }
    }

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "خطوة غير صالحة" }, { status: 400 });
}
