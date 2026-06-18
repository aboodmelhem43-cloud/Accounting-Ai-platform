import { prisma } from "./prisma";
import type { SuggestedJournalEntry, IncomeStatement, AccountBalance } from "@/types";
import type { Prisma } from "@prisma/client";

// التحقق من توازن القيد — مجموع المدين يجب أن يساوي مجموع الدائن
export function validateJournalBalance(
  lines: { debit: number; credit: number }[]
): boolean {
  const totalDebit = lines.reduce((sum, l) => sum + l.debit, 0);
  const totalCredit = lines.reduce((sum, l) => sum + l.credit, 0);
  // نستخدم تقريبًا لتفادي أخطاء الفاصلة العائمة
  return Math.abs(totalDebit - totalCredit) < 0.001;
}

// حفظ قيد يومية متوازن — يرفض القيد غير المتوازن
export async function createJournalEntry(params: {
  businessId: string;
  userId: string;
  date: Date;
  description: string;
  sourceType: "MANUAL" | "AI_INVOICE";
  lines: { accountId: string; debit: number; credit: number; description?: string }[];
  invoiceId?: string;
}) {
  const { businessId, userId, date, description, sourceType, lines, invoiceId } = params;

  if (!validateJournalBalance(lines)) {
    throw new Error("القيد غير متوازن: مجموع المدين لا يساوي مجموع الدائن");
  }

  if (lines.length < 2) {
    throw new Error("القيد يحتاج على الأقل سطرين (مدين ودائن)");
  }

  // إنشاء القيد مع سطوره في transaction واحدة
  const entry = await prisma.$transaction(async (tx) => {
    const journalEntry = await tx.journalEntry.create({
      data: {
        businessId,
        createdById: userId,
        date,
        description,
        sourceType,
        lines: {
          create: lines.map((l) => ({
            accountId: l.accountId,
            debit: l.debit,
            credit: l.credit,
            description: l.description,
          })),
        },
      },
      include: { lines: { include: { account: true } } },
    });

    // ربط الفاتورة بالقيد لو موجودة
    if (invoiceId) {
      await tx.invoice.update({
        where: { id: invoiceId },
        data: { journalEntryId: journalEntry.id, status: "CONFIRMED" },
      });
    }

    return journalEntry;
  });

  return entry;
}

// حساب رصيد حساب معين في فترة زمنية
export async function getAccountBalance(
  accountId: string,
  businessId: string,
  from?: Date,
  to?: Date
): Promise<number> {
  const where: Prisma.JournalLineWhereInput = {
    accountId,
    journalEntry: {
      businessId,
      ...(from || to
        ? {
            date: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
    },
  };

  const result = await prisma.journalLine.aggregate({
    where,
    _sum: { debit: true, credit: true },
  });

  const totalDebit = Number(result._sum.debit ?? 0);
  const totalCredit = Number(result._sum.credit ?? 0);

  return totalDebit - totalCredit;
}

// قائمة الدخل — محسوبة من الـ ledger مباشرة
export async function computeIncomeStatement(
  businessId: string,
  from: Date,
  to: Date
): Promise<IncomeStatement> {
  const business = await prisma.business.findUniqueOrThrow({
    where: { id: businessId },
  });

  const accounts = await prisma.account.findMany({
    where: { businessId, type: { in: ["REVENUE", "EXPENSE"] } },
    include: {
      journalLines: {
        where: {
          journalEntry: { businessId, date: { gte: from, lte: to } },
        },
      },
    },
  });

  const revenueAccounts: AccountBalance[] = [];
  const expenseAccounts: AccountBalance[] = [];

  for (const acc of accounts) {
    const totalDebit = acc.journalLines.reduce((s, l) => s + Number(l.debit), 0);
    const totalCredit = acc.journalLines.reduce((s, l) => s + Number(l.credit), 0);
    // إيرادات: رصيد = دائن - مدين | مصروفات: رصيد = مدين - دائن
    const balance =
      acc.type === "REVENUE" ? totalCredit - totalDebit : totalDebit - totalCredit;

    const entry: AccountBalance = {
      accountId: acc.id,
      accountCode: acc.code,
      accountName: acc.name,
      accountNameAr: acc.nameAr,
      balance,
      type: acc.type,
    };

    if (acc.type === "REVENUE") revenueAccounts.push(entry);
    else expenseAccounts.push(entry);
  }

  const totalRevenue = revenueAccounts.reduce((s, a) => s + a.balance, 0);
  const totalExpenses = expenseAccounts.reduce((s, a) => s + a.balance, 0);

  return {
    period: { from: from.toISOString(), to: to.toISOString() },
    revenue: revenueAccounts,
    expenses: expenseAccounts,
    totalRevenue,
    totalExpenses,
    netProfit: totalRevenue - totalExpenses,
    currency: business.baseCurrency,
  };
}

// اقتراح قيد محاسبي لفاتورة مشتريات
export async function suggestPurchaseJournalEntry(params: {
  businessId: string;
  vendorName: string;
  totalAmount: number;
  taxAmount: number;
  netAmount: number;
  date: string;
  invoiceNumber?: string;
}): Promise<SuggestedJournalEntry> {
  const { businessId, vendorName, totalAmount, taxAmount, netAmount, date, invoiceNumber } = params;

  const accounts = await prisma.account.findMany({
    where: { businessId, code: { in: ["2100", "5300", "2200", "5200"] } },
  });

  const byCode = Object.fromEntries(accounts.map((a) => [a.code, a]));

  const lines = [];

  // مصروفات الشراء (مدين)
  const expenseAcc = byCode["5300"] ?? byCode["5200"];
  if (expenseAcc) {
    lines.push({ accountCode: expenseAcc.code, accountName: expenseAcc.nameAr ?? expenseAcc.name, debit: netAmount, credit: 0 });
  }

  // ضريبة القيمة المضافة على المدخلات (مدين) — لو الدولة لها VAT
  if (taxAmount > 0) {
    const taxAcc = byCode["2200"];
    if (taxAcc) {
      lines.push({ accountCode: taxAcc.code, accountName: "ضريبة مدخلات (VAT)", debit: taxAmount, credit: 0 });
    }
  }

  // دائنون (دائن)
  const apAcc = byCode["2100"];
  if (apAcc) {
    lines.push({ accountCode: apAcc.code, accountName: apAcc.nameAr ?? apAcc.name, debit: 0, credit: totalAmount });
  }

  const desc = `فاتورة مشتريات — ${vendorName}${invoiceNumber ? ` رقم ${invoiceNumber}` : ""}`;

  return { description: desc, date, lines };
}

// اقتراح قيد محاسبي لفاتورة مبيعات
export async function suggestSalesJournalEntry(params: {
  businessId: string;
  customerName: string;
  totalAmount: number;
  taxAmount: number;
  netAmount: number;
  date: string;
  invoiceNumber?: string;
}): Promise<SuggestedJournalEntry> {
  const { businessId, customerName, totalAmount, taxAmount, netAmount, date, invoiceNumber } = params;

  const accounts = await prisma.account.findMany({
    where: { businessId, code: { in: ["1200", "4100", "2200"] } },
  });

  const byCode = Object.fromEntries(accounts.map((a) => [a.code, a]));

  const lines = [];

  // مدينون (مدين)
  const arAcc = byCode["1200"];
  if (arAcc) {
    lines.push({ accountCode: arAcc.code, accountName: arAcc.nameAr ?? arAcc.name, debit: totalAmount, credit: 0 });
  }

  // إيرادات المبيعات (دائن)
  const revAcc = byCode["4100"];
  if (revAcc) {
    lines.push({ accountCode: revAcc.code, accountName: revAcc.nameAr ?? revAcc.name, debit: 0, credit: netAmount });
  }

  // ضريبة القيمة المضافة على المخرجات (دائن)
  if (taxAmount > 0) {
    const taxAcc = byCode["2200"];
    if (taxAcc) {
      lines.push({ accountCode: taxAcc.code, accountName: "ضريبة مخرجات (VAT)", debit: 0, credit: taxAmount });
    }
  }

  const desc = `فاتورة مبيعات — ${customerName}${invoiceNumber ? ` رقم ${invoiceNumber}` : ""}`;

  return { description: desc, date, lines };
}
