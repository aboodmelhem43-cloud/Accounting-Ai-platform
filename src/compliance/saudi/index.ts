import type { ComplianceModule } from "../types";

// وحدة امتثال المملكة العربية السعودية
// الفاتورة الإلكترونية: ZATCA — إلزامية منذ 2021
// ضريبة القيمة المضافة: 15%
const saudi: ComplianceModule = {
  countryCode: "SA",
  countryNameAr: "المملكة العربية السعودية",
  countryNameEn: "Saudi Arabia",
  currency: "SAR",
  currencySymbol: "ر.س",
  currencyNameAr: "ريال سعودي",

  hasVat: true,
  vatRate: 0.15,
  vatName: "ضريبة القيمة المضافة",
  vatShortName: "VAT",

  eInvoiceSystem: "ZATCA",
  eInvoiceRequired: true,
  eInvoiceNote:
    "الفاتورة الإلكترونية إلزامية عبر منصة فاتورة (ZATCA). دعم الربط المباشر قيد التطوير ويُضاف في الإصدار القادم.",

  taxIdPattern: /^\d{15}$/,
  taxIdLabel: "الرقم الضريبي (15 رقمًا)",
  numberLocale: "ar-SA",
};

export default saudi;
