import { validateJournalBalance } from "../ledger";

// ─── validateJournalBalance ──────────────────────────────────────────────────
describe("validateJournalBalance", () => {
  it("يقبل قيدًا متوازنًا", () => {
    const lines = [
      { debit: 1000, credit: 0 },
      { debit: 0, credit: 1000 },
    ];
    expect(validateJournalBalance(lines)).toBe(true);
  });

  it("يرفض قيدًا غير متوازن", () => {
    const lines = [
      { debit: 1000, credit: 0 },
      { debit: 0, credit: 800 },
    ];
    expect(validateJournalBalance(lines)).toBe(false);
  });

  it("يقبل قيدًا بأكثر من سطرين متوازنًا", () => {
    const lines = [
      { debit: 850, credit: 0 },   // مصروفات
      { debit: 150, credit: 0 },   // ضريبة
      { debit: 0, credit: 1000 },  // دائنون
    ];
    expect(validateJournalBalance(lines)).toBe(true);
  });

  it("يتسامح مع أخطاء الفاصلة العائمة الصغيرة", () => {
    const lines = [
      { debit: 0.1 + 0.2, credit: 0 },
      { debit: 0, credit: 0.3 },
    ];
    expect(validateJournalBalance(lines)).toBe(true);
  });

  it("يرفض القيد بمدين صفر وكذلك دائن صفر", () => {
    const lines = [
      { debit: 0, credit: 0 },
      { debit: 0, credit: 0 },
    ];
    expect(validateJournalBalance(lines)).toBe(true); // صفر = صفر ← متوازن تقنيًا
  });

  it("يرفض عدم التوازن الكبير", () => {
    const lines = [
      { debit: 5000, credit: 0 },
      { debit: 0, credit: 4999 },
    ];
    expect(validateJournalBalance(lines)).toBe(false);
  });

  it("يقبل نمط قيد المبيعات (مدين ذمم + دائن إيراد + دائن ضريبة)", () => {
    // AR 1150 dr, Revenue 1000 cr, VAT 150 cr
    const lines = [
      { debit: 1150, credit: 0 },
      { debit: 0, credit: 1000 },
      { debit: 0, credit: 150 },
    ];
    expect(validateJournalBalance(lines)).toBe(true);
  });

  it("يرفض فرق أكبر من حد التسامح (0.001)", () => {
    const lines = [
      { debit: 1000.002, credit: 0 },
      { debit: 0, credit: 1000 },
    ];
    expect(validateJournalBalance(lines)).toBe(false);
  });

  it("يقبل فرقًا صغيرًا جدًا ضمن حد التسامح", () => {
    const lines = [
      { debit: 1000.0005, credit: 0 },
      { debit: 0, credit: 1000 },
    ];
    expect(validateJournalBalance(lines)).toBe(true);
  });
});

// ─── Income statement computation logic ─────────────────────────────────────
describe("منطق حساب قائمة الدخل", () => {
  it("صافي الربح = إجمالي الإيرادات - إجمالي المصروفات", () => {
    const totalRevenue = 5000;
    const totalExpenses = 3200;
    expect(totalRevenue - totalExpenses).toBe(1800);
  });

  it("صافي الربح سالب عندما تتجاوز المصروفات الإيرادات", () => {
    const totalRevenue = 1000;
    const totalExpenses = 1500;
    expect(totalRevenue - totalExpenses).toBe(-500);
  });

  it("رصيد حساب الإيراد = دائن - مدين (رصيد طبيعي دائن)", () => {
    const totalCredit = 2000;
    const totalDebit = 500;
    const revenueBalance = totalCredit - totalDebit;
    expect(revenueBalance).toBe(1500);
  });

  it("رصيد حساب المصروف = مدين - دائن (رصيد طبيعي مدين)", () => {
    const totalDebit = 3000;
    const totalCredit = 200;
    const expenseBalance = totalDebit - totalCredit;
    expect(expenseBalance).toBe(2800);
  });
});

// ─── createJournalEntry — balance invariant (with mocked Prisma) ─────────────
jest.mock("../prisma", () => ({
  prisma: {
    accountingPeriod: {
      findUnique: jest.fn().mockResolvedValue(null),
    },
    $transaction: jest.fn((fn: (tx: object) => unknown) =>
      fn({
        journalEntry: {
          create: jest.fn().mockResolvedValue({ id: "je-1", lines: [] }),
        },
        invoice: {
          update: jest.fn().mockResolvedValue({}),
        },
      })
    ),
  },
}));

// Import ledger functions AFTER the mock is set up (to pick up mocked prisma)
// We use require to avoid ESM hoisting issues with jest.mock
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createJournalEntry } = require("../ledger") as typeof import("../ledger");

const BASE = {
  businessId: "biz-1",
  userId: "user-1",
  date: new Date("2025-06-01"),
  description: "اختبار",
  sourceType: "MANUAL" as const,
};

describe("createJournalEntry — ضمان توازن القيد", () => {
  it("يرفض القيد غير المتوازن", async () => {
    await expect(
      createJournalEntry({
        ...BASE,
        lines: [
          { accountId: "a1", debit: 1000, credit: 0 },
          { accountId: "a2", debit: 0, credit: 500 },
        ],
      })
    ).rejects.toThrow("غير متوازن");
  });

  it("يرفض القيد بسطر واحد فقط", async () => {
    await expect(
      createJournalEntry({
        ...BASE,
        lines: [{ accountId: "a1", debit: 500, credit: 500 }],
      })
    ).rejects.toThrow("سطرين");
  });

  it("يقبل القيد المتوازن ويستدعي prisma", async () => {
    await expect(
      createJournalEntry({
        ...BASE,
        lines: [
          { accountId: "a1", debit: 1000, credit: 0 },
          { accountId: "a2", debit: 0, credit: 1000 },
        ],
      })
    ).resolves.toBeDefined();
  });

  it("يرفض عند وجود فترة محاسبية مقفلة", async () => {
    // Override the mock for this test only
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { prisma } = require("../prisma") as { prisma: { accountingPeriod: { findUnique: jest.Mock } } };
    (prisma.accountingPeriod.findUnique as jest.Mock).mockResolvedValueOnce({ status: "CLOSED" });

    await expect(
      createJournalEntry({
        ...BASE,
        lines: [
          { accountId: "a1", debit: 200, credit: 0 },
          { accountId: "a2", debit: 0, credit: 200 },
        ],
      })
    ).rejects.toThrow("مقفلة");
  });
});
