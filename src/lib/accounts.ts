import { AccountType } from "@prisma/client";

// دليل الحسابات الافتراضي لمنشأة جديدة (يُطبَّق عند التسجيل)
export const DEFAULT_CHART_OF_ACCOUNTS = [
  // أصول
  { code: "1100", name: "Cash", nameAr: "النقدية والبنوك", type: AccountType.ASSET },
  { code: "1200", name: "Accounts Receivable", nameAr: "المدينون والعملاء", type: AccountType.ASSET },
  { code: "1300", name: "Inventory", nameAr: "المخزون", type: AccountType.ASSET },
  { code: "1400", name: "Prepaid Expenses", nameAr: "مصروفات مدفوعة مقدمًا", type: AccountType.ASSET },
  // خصوم
  { code: "2100", name: "Accounts Payable", nameAr: "الدائنون والموردون", type: AccountType.LIABILITY },
  { code: "2200", name: "Tax Payable", nameAr: "ضريبة القيمة المضافة المستحقة", type: AccountType.LIABILITY },
  { code: "2300", name: "Accrued Expenses", nameAr: "مصروفات مستحقة", type: AccountType.LIABILITY },
  // حقوق الملكية
  { code: "3100", name: "Owner Equity", nameAr: "حقوق الملكية", type: AccountType.EQUITY },
  { code: "3200", name: "Retained Earnings", nameAr: "الأرباح المحتجزة", type: AccountType.EQUITY },
  // إيرادات
  { code: "4100", name: "Sales Revenue", nameAr: "إيرادات المبيعات", type: AccountType.REVENUE },
  { code: "4200", name: "Service Revenue", nameAr: "إيرادات الخدمات", type: AccountType.REVENUE },
  { code: "4900", name: "Other Revenue", nameAr: "إيرادات أخرى", type: AccountType.REVENUE },
  // مصروفات
  { code: "5100", name: "Cost of Goods Sold", nameAr: "تكلفة البضاعة المباعة", type: AccountType.EXPENSE },
  { code: "5200", name: "Operating Expenses", nameAr: "المصروفات التشغيلية", type: AccountType.EXPENSE },
  { code: "5300", name: "Purchase Expenses", nameAr: "مصروفات المشتريات", type: AccountType.EXPENSE },
  { code: "5400", name: "Salaries", nameAr: "الرواتب والأجور", type: AccountType.EXPENSE },
  { code: "5500", name: "Rent", nameAr: "الإيجار", type: AccountType.EXPENSE },
  { code: "5600", name: "Utilities", nameAr: "المرافق (كهرباء، ماء، اتصالات)", type: AccountType.EXPENSE },
  { code: "5900", name: "Other Expenses", nameAr: "مصروفات أخرى", type: AccountType.EXPENSE },
] as const;

// تعديل اسم حساب الضريبة بحسب الدولة
export function getTaxAccountName(vatShortName: string, vatName: string) {
  return vatShortName ? `${vatName} (${vatShortName})` : vatName;
}
