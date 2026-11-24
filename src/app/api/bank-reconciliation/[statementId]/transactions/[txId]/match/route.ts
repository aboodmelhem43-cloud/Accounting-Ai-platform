import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createJournalEntry } from "@/lib/ledger";

const matchSchema = z.object({
  bankAccountId: z.string().min(1), // حساب البنك في دليل الحسابات
  counterpartAccountId: z.string().min(1), // الحساب المقابل (إيرادات/مصروفات/...)
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ statementId: string; txId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { statementId, txId } = await params;

  const statement = await prisma.bankStatement.findFirst({
    where: { id: statementId, businessId: session.user.businessId },
  });
  if (!statement) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  // Verify bank transaction exists (outside tx for fast 404)
  const bankTxExists = await prisma.bankTransaction.findFirst({
    where: { id: txId, statementId },
    select: { id: true },
  });
  if (!bankTxExists) return NextResponse.json({ error: "المعاملة غير موجودة" }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const parsed = matchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "يجب تحديد حساب البنك والحساب المقابل" }, { status: 400 });
  }

  const { bankAccountId, counterpartAccountId } = parsed.data;

  // Validate both accounts belong to this business
  const accounts = await prisma.account.findMany({
    where: { id: { in: [bankAccountId, counterpartAccountId] }, businessId: session.user.businessId },
    select: { id: true },
  });
  if (accounts.length !== 2) {
    return NextResponse.json({ error: "حساب غير صالح" }, { status: 400 });
  }

  let result: { transaction: { id: string; matched: boolean; journalEntryId: string | null }; journalEntry: Awaited<ReturnType<typeof createJournalEntry>> };
  try {
    result = await prisma.$transaction(async (prismaTx) => {
      // Re-read inside transaction and use atomic updateMany to guard TOCTOU:
      // if another concurrent request already set matched=true, updateMany returns count=0
      const claim = await prismaTx.bankTransaction.updateMany({
        where: { id: txId, statementId, matched: false },
        data: { matched: true },
      });
      if (claim.count === 0) throw Object.assign(new Error("already_matched"), { code: "ALREADY_MATCHED" });

      const bankTx = await prismaTx.bankTransaction.findUnique({ where: { id: txId } });
      if (!bankTx) throw new Error("not_found");

      const amount = Math.abs(Number(bankTx.amount));
      const isCredit = bankTx.transactionType === "CREDIT";

      // CREDIT (واردة): مدين البنك، دائن الحساب المقابل
      // DEBIT (صادرة): مدين الحساب المقابل، دائن البنك
      const lines = isCredit
        ? [
            { accountId: bankAccountId, debit: amount, credit: 0 },
            { accountId: counterpartAccountId, debit: 0, credit: amount },
          ]
        : [
            { accountId: counterpartAccountId, debit: amount, credit: 0 },
            { accountId: bankAccountId, debit: 0, credit: amount },
          ];

      const entry = await createJournalEntry(
        {
          businessId: session.user.businessId,
          userId: session.user.id,
          date: bankTx.date,
          description: bankTx.description,
          sourceType: "MANUAL",
          status: "POSTED",
          lines,
        },
        prismaTx
      );

      const matched = await prismaTx.bankTransaction.update({
        where: { id: txId },
        data: { journalEntryId: entry.id },
      });

      return { transaction: matched, journalEntry: entry };
    });
  } catch (err) {
    if (err instanceof Error && (err as Error & { code?: string }).code === "ALREADY_MATCHED") {
      return NextResponse.json({ error: "تم ترحيل هذه المعاملة مسبقًا" }, { status: 409 });
    }
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }

  return NextResponse.json(result);
}
