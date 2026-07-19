import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createJournalEntry } from "@/lib/ledger";

const schema = z.object({
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { id } = await params;

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });

  const { year, month } = parsed.data;

  const asset = await prisma.fixedAsset.findUnique({
    where: { id },
    include: { depreciationEntries: true },
  });

  if (!asset) return NextResponse.json({ error: "الأصل غير موجود" }, { status: 404 });
  if (asset.businessId !== session.user.businessId) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  if (asset.status !== "ACTIVE") return NextResponse.json({ error: "الأصل غير نشط" }, { status: 400 });

  // Check if already depreciated for this period
  const existing = asset.depreciationEntries.find(
    (e) => e.periodYear === year && e.periodMonth === month
  );
  if (existing) return NextResponse.json({ error: "تم إهلاك هذا الأصل بالفعل لهذه الفترة" }, { status: 409 });

  const cost = Number(asset.purchaseCost);
  const residual = Number(asset.residualValue);
  const totalDepreciation = asset.depreciationEntries.reduce((s, e) => s + Number(e.amount), 0);
  const bookValue = cost - totalDepreciation;

  if (bookValue <= residual) {
    await prisma.fixedAsset.update({ where: { id }, data: { status: "FULLY_DEPRECIATED" } });
    return NextResponse.json({ error: "الأصل مهلك بالكامل" }, { status: 400 });
  }

  let amount: number;
  if (asset.depreciationMethod === "STRAIGHT_LINE") {
    amount = (cost - residual) / asset.usefulLifeMonths;
  } else {
    // Declining balance: annual rate = 2/usefulLife, monthly = rate/12
    const annualRate = 2 / (asset.usefulLifeMonths / 12);
    amount = (bookValue * annualRate) / 12;
  }

  // Don't depreciate below residual value
  amount = Math.min(amount, bookValue - residual);
  amount = Math.round(amount * 100) / 100;

  if (amount <= 0) {
    return NextResponse.json({ error: "مبلغ الإهلاك صفر أو أقل" }, { status: 400 });
  }

  const depreciationDate = new Date(year, month - 1, 28);

  try {
    const journalEntry = await createJournalEntry({
      businessId: session.user.businessId,
      userId: session.user.id,
      date: depreciationDate,
      description: `إهلاك — ${asset.name} — ${year}/${String(month).padStart(2, "0")}`,
      sourceType: "MANUAL",
      status: "POSTED",
      lines: [
        { accountId: asset.deprecExpenseAccountId, debit: amount, credit: 0, description: `إهلاك ${asset.name}` },
        { accountId: asset.accumDeprecAccountId, debit: 0, credit: amount, description: `مجمع إهلاك ${asset.name}` },
      ],
    });

    const depEntry = await prisma.assetDepreciationEntry.create({
      data: {
        assetId: id,
        periodYear: year,
        periodMonth: month,
        amount,
        journalEntryId: journalEntry.id,
      },
    });

    // Check if fully depreciated
    const newTotal = totalDepreciation + amount;
    if (newTotal >= cost - residual) {
      await prisma.fixedAsset.update({ where: { id }, data: { status: "FULLY_DEPRECIATED" } });
    }

    return NextResponse.json({ depEntry, journalEntryId: journalEntry.id, amount });
  } catch (err) {
    const message = err instanceof Error ? err.message : "خطأ في الخادم";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
