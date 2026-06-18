import type { ComplianceModule } from "../types";

// وحدة امتثال مصر
// ضريبة القيمة المضافة: 14%
// الفاتورة الإلكترونية: ETA — إلزامية منذ 15/12/2022 (B2B)
const egypt: ComplianceModule = {
  countryCode: "EG",
  countryNameAr: "جمهورية مصر العربية",
  countryNameEn: "Egypt",
  currency: "EGP",
  currencySymbol: "ج.م",
  currencyNameAr: "جنيه مصري",

  hasVat: true,
  vatRate: 0.14,
  vatName: "ضريبة القيمة المضافة",
  vatShortName: "VAT",

  eInvoiceSystem: "ETA",
  eInvoiceRequired: true,
  eInvoiceNote:
    "الفاتورة الإلكترونية B2B إلزامية عبر منظومة ETA منذ ديسمبر 2022. توجد تسهيلات للأنشطة التي لا تتجاوز إيراداتها 20 مليون جنيه. دعم الربط بـ ETA قيد التطوير.",

  taxIdPattern: /^\d{9}$/,
  taxIdLabel: "الرقم الضريبي (9 أرقام)",
  numberLocale: "ar-EG",
};

export default egypt;
