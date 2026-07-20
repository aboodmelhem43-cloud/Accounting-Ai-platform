import { prisma } from "./prisma";
import type { SuggestedJournalEntry, IncomeStatement, AccountBalance, BalanceSheet, CashFlowStatement } from "@/types";
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
  status?: "DRAFT" | "PENDING_REVIEW" | "POSTED";
  lines: { accountId: string; debit: number; credit: number; description?: string; foreignCurrency?: string; foreignAmount?: number; exchangeRate?: number }[];
  invoiceId?: string;
}) {
  const { businessId, userId, date, description, sourceType, status = "POSTED", lines, invoiceId } = params;

  if (!validateJournalBalance(lines)) {
    throw new Error("القيد غير متوازن: مجموع المدين لا يساوي مجموع الدائن");
  }

  if (lines.length < 2) {
    throw new Error("القيد يحتاج على الأقل سطرين (مدين ودائن)");
  }

  // التحقق من أن الفترة المحاسبية ليست مقفلة
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const closedPeriod = await prisma.accountingPeriod.findUnique({
    where: { businessId_year_month: { businessId, year, month } },
    select: { status: true },
  });
  if (closedPeriod?.status === "CLOSED") {
    throw new Error(`الفترة المحاسبية ${year}/${String(month).padStart(2, "0")} مقفلة — لا يمكن إضافة قيود عليها`);
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
        status,
        lines: {
          create: lines.map((l) => ({
            accountId: l.accountId,
            debit: l.debit,
            credit: l.credit,
            description: l.description,
            foreignCurrency: l.foreignCurrency,
            foreignAmount: l.foreignAmount,
            exchangeRate: l.exchangeRate,
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

// الميزانية العمومية — محسوبة من الـ ledger
export async function computeBalanceSheet(
  businessId: string,
  asOf: Date
): Promise<BalanceSheet> {
  const business = await prisma.business.findUniqueOrThrow({
    where: { id: businessId },
  });

  const accounts = await prisma.account.findMany({
    where: { businessId },
    include: {
      journalLines: {
        where: {
          journalEntry: { businessId, date: { lte: asOf } },
        },
      },
    },
  });

  const assets: AccountBalance[] = [];
  const liabilities: AccountBalance[] = [];
  const equity: AccountBalance[] = [];
  let totalRevenue = 0;
  let totalExpenses = 0;

  for (const acc of accounts) {
    const totalDebit = acc.journalLines.reduce((s, l) => s + Number(l.debit), 0);
    const totalCredit = acc.journalLines.reduce((s, l) => s + Number(l.credit), 0);

    const entry: AccountBalance = {
      accountId: acc.id,
      accountCode: acc.code,
      accountName: acc.name,
      accountNameAr: acc.nameAr,
      balance: 0,
      type: acc.type,
    };

    switch (acc.type) {
      case "ASSET":
        entry.balance = totalDebit - totalCredit;
        if (entry.balance !== 0) assets.push(entry);
        break;
      case "LIABILITY":
        entry.balance = totalCredit - totalDebit;
        if (entry.balance !== 0) liabilities.push(entry);
        break;
      case "EQUITY":
        entry.balance = totalCredit - totalDebit;
        if (entry.balance !== 0) equity.push(entry);
        break;
      case "REVENUE":
        totalRevenue += totalCredit - totalDebit;
        break;
      case "EXPENSE":
        totalExpenses += totalDebit - totalCredit;
        break;
    }
  }

  const netProfit = totalRevenue - totalExpenses;
  const totalAssets = assets.reduce((s, a) => s + a.balance, 0);
  const totalLiabilities = liabilities.reduce((s, a) => s + a.balance, 0);
  const totalEquity = equity.reduce((s, a) => s + a.balance, 0) + netProfit;

  return {
    asOf: asOf.toISOString(),
    assets,
    liabilities,
    equity,
    totalAssets,
    totalLiabilities,
    totalEquity,
    netProfit,
    currency: business.baseCurrency,
  };
}

// قائمة التدفقات النقدية — طريقة مباشرة مبسطة
export async function computeCashFlow(
  businessId: string,
  from: Date,
  to: Date
): Promise<CashFlowStatement> {
  const business = await prisma.business.findUniqueOrThrow({
    where: { id: businessId },
  });

  // حساب النقدية (كود 1100)
  const cashAccount = await prisma.account.findFirst({
    where: { businessId, code: "1100" },
  });

  if (!cashAccount) {
    return {
      period: { from: from.toISOString(), to: to.toISOString() },
      operatingActivities: [],
      investingActivities: [],
      financingActivities: [],
      netOperating: 0,
      netInvesting: 0,
      netFinancing: 0,
      netChange: 0,
      currency: business.baseCurrency,
    };
  }

  // جلب حركات النقدية مع الحسابات المقابلة
  const cashLines = await prisma.journalLine.findMany({
    where: {
      accountId: cashAccount.id,
      journalEntry: { businessId, date: { gte: from, lte: to } },
    },
    include: {
      journalEntry: {
        include: {
          lines: {
            where: { accountId: { not: cashAccount.id } },
            include: { account: true },
          },
        },
      },
    },
  });

  const operatingActivities: { description: string; amount: number }[] = [];
  const investingActivities: { description: string; amount: number }[] = [];
  const financingActivities: { description: string; amount: number }[] = [];

  for (const line of cashLines) {
    const amount = Number(line.debit) - Number(line.credit); // موجب = تدفق داخل، سالب = تدفق خارج
    if (amount === 0) continue;

    const counterpartAccount = line.journalEntry.lines[0]?.account;
    const description = line.journalEntry.description;

    if (!counterpartAccount) {
      operatingActivities.push({ description, amount });
      continue;
    }

    const code = counterpartAccount.code;
    const firstDigit = code[0];

    if (firstDigit === "4" || firstDigit === "5") {
      // إيرادات أو مصروفات → تشغيلي
      operatingActivities.push({ description, amount });
    } else if (firstDigit === "1") {
      // أصول (غير النقدية) → استثماري
      investingActivities.push({ description, amount });
    } else if (firstDigit === "2" || firstDigit === "3") {
      // خصوم أو حقوق ملكية → تمويلي
      financingActivities.push({ description, amount });
    } else {
      operatingActivities.push({ description, amount });
    }
  }

  const netOperating = operatingActivities.reduce((s, a) => s + a.amount, 0);
  const netInvesting = investingActivities.reduce((s, a) => s + a.amount, 0);
  const netFinancing = financingActivities.reduce((s, a) => s + a.amount, 0);

  return {
    period: { from: from.toISOString(), to: to.toISOString() },
    operatingActivities,
    investingActivities,
    financingActivities,
    netOperating,
    netInvesting,
    netFinancing,
    netChange: netOperating + netInvesting + netFinancing,
    currency: business.baseCurrency,
  };
}
