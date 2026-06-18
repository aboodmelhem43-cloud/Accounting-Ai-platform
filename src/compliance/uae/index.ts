import type { ComplianceModule } from "../types";

// وحدة امتثال الإمارات العربية المتحدة
// الفاتورة الإلكترونية: EIS (Peppol) — إلزامية للشركات الكبيرة من يوليو 2026
// ضريبة القيمة المضافة: 5%
const uae: ComplianceModule = {
  countryCode: "AE",
  countryNameAr: "الإمارات العربية المتحدة",
  countryNameEn: "United Arab Emirates",
  currency: "AED",
  currencySymbol: "د.إ",
  currencyNameAr: "درهم إماراتي",

  hasVat: true,
  vatRate: 0.05,
  vatName: "ضريبة القيمة المضافة",
  vatShortName: "VAT",

  eInvoiceSystem: "EIS",
  eInvoiceRequired: false, // سيصبح إلزاميًا تدريجيًا من 2026/2027
  eInvoiceNote:
    "نظام الفوترة الإلكترونية (EIS) يبدأ إلزاميًا من يوليو 2026 للشركات الكبيرة (إيرادات > 50 مليون درهم)، ومن يوليو 2027 لجميع الشركات. دعم EIS قيد التطوير.",

  taxIdPattern: /^\d{15}$/,
  taxIdLabel: "رقم التسجيل الضريبي (TRN)",
  numberLocale: "ar-AE",
};

export default uae;
