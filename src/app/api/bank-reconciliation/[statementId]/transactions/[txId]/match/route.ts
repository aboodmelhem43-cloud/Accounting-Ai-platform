import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createJournalEntry } from "@/lib/ledger";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ statementId: string; txId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { statementId, txId } = await params;

  // التحقق من ملكية الكشف
  const statement = await prisma.bankStatement.findFirst({
    where: { id: statementId, businessId: session.user.businessId },
  });
  if (!statement) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  // جلب بيانات المعاملة البنكية
  const bankTx = await prisma.bankTransaction.findFirst({
    where: { id: txId, statementId },
  });
  if (!bankTx) return NextResponse.json({ error: "المعاملة غير موجودة" }, { status: 404 });

  // إيجاد حساب البنك في دليل الحسابات (بحث باسم يحتوي على "bank" أو أول حساب أصول)
  let bankLedgerAccount = await prisma.account.findFirst({
    where: {
      businessId: session.user.businessId,
      name: { contains: "bank", mode: "insensitive" },
    },
  });

  if (!bankLedgerAccount) {
    bankLedgerAccount = await prisma.account.findFirst({
      where: { businessId: session.user.businessId, type: "ASSET" },
    });
  }

  if (!bankLedgerAccount) {
    return NextResponse.json(
      { error: "لم يتم إيجاد حساب البنك في دليل الحسابات" },
      { status: 400 }
    );
  }

  const amount = Number(bankTx.amount);
  const isCredit = bankTx.transactionType === "CREDIT";

  // إيجاد الحساب المقابل (إيرادات أو مصروفات)
  const counterpartAccount = await prisma.account.findFirst({
    where: {
      businessId: session.user.businessId,
      type: isCredit ? "REVENUE" : "EXPENSE",
    },
  });

  if (!counterpartAccount) {
    return NextResponse.json(
      { error: isCredit ? "لم يتم إيجاد حساب إيرادات" : "لم يتم إيجاد حساب مصروفات" },
      { status: 400 }
    );
  }

  // تحديث حالة المعاملة
  const tx = await prisma.bankTransaction.update({
    where: { id: txId, statementId },
    data: { matched: true },
  });

  // إنشاء قيد اليومية المقابل
  // CREDIT (واردة): مدين البنك، دائن الإيرادات
  // DEBIT (صادرة): مدين المصروفات، دائن البنك
  const journalEntry = await createJournalEntry({
    businessId: session.user.businessId,
    userId: session.user.id,
    date: bankTx.date,
    description: bankTx.description,
    sourceType: "MANUAL",
    status: "POSTED",
    lines: isCredit
      ? [
          { accountId: bankLedgerAccount.id, debit: amount, credit: 0 },
          { accountId: counterpartAccount.id, debit: 0, credit: amount },
        ]
      : [
          { accountId: counterpartAccount.id, debit: amount, credit: 0 },
          { accountId: bankLedgerAccount.id, debit: 0, credit: amount },
        ],
  });

  return NextResponse.json({ transaction: tx, journalEntry });
}
