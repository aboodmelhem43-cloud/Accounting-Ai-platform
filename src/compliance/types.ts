// واجهة وحدة الامتثال — كل دولة تنفّذ هذه الواجهة
export interface ComplianceModule {
  // معلومات الدولة
  countryCode: string;       // ISO 3166-1 alpha-2
  countryNameAr: string;     // الاسم بالعربي
  countryNameEn: string;
  currency: string;          // ISO 4217
  currencySymbol: string;    // رمز العملة بالعربي
  currencySymbolEn: string;  // رمز العملة بالإنجليزي
  currencyNameAr: string;

  // الضريبة
  hasVat: boolean;
  vatRate: number;           // 0.15 = 15%
  vatName: string;           // "ضريبة القيمة المضافة" أو "ضريبة المبيعات العامة"
  vatShortName: string;      // "VAT" أو "GST"

  // منظومة الفاتورة الإلكترونية (للمرحلة الثانية)
  eInvoiceSystem: string | null;  // "ZATCA" | "ETA" | "EIS" | "JoFotara" | null
  eInvoiceRequired: boolean;
  eInvoiceNote: string;      // ملاحظة للمستخدم عن وضع الفاتورة الإلكترونية

  // رقم الضريبة — validation pattern
  taxIdPattern: RegExp | null;
  taxIdLabel: string;        // "الرقم الضريبي" أو "رقم التسجيل الضريبي"

  // تنسيق الأرقام
  numberLocale: string;      // "ar-SA", "ar-EG", etc.
}

// حساب مبلغ الضريبة
export function calculateTax(amount: number, module: ComplianceModule): number {
  if (!module.hasVat) return 0;
  return Math.round(amount * module.vatRate * 100) / 100;
}

// حساب الإجمالي شاملًا الضريبة
export function calculateTotal(netAmount: number, module: ComplianceModule): number {
  return netAmount + calculateTax(netAmount, module);
}
