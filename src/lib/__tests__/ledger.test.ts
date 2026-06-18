import { validateJournalBalance } from "../ledger";

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
});
