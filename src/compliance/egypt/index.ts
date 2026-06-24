import type { ComplianceModule } from "../types";

const egypt: ComplianceModule = {
  countryCode: "EG",
  countryNameAr: "جمهورية مصر العربية",
  countryNameEn: "Egypt",
  currency: "EGP",
  currencySymbol: "ج.م",
  currencySymbolEn: "EGP",
  currencyNameAr: "جنيه مصري",

  hasVat: true,
  vatRate: 0.14,
  vatName: "ضريبة القيمة المضافة",
  vatShortName: "VAT",

  eInvoiceSystem: "ETA",
  eInvoiceRequired: true,
  eInvoiceNote:
    "الفاتورة الإلكترونية B2B إلزامية عبر منظومة ETA. أنشئ فاتورتك هنا، ثم سجّلها في بوابة الفاتورة الإلكترونية (eta.gov.eg).",

  taxIdPattern: /^\d{9}$/,
  taxIdLabel: "الرقم الضريبي (9 أرقام)",
  numberLocale: "ar-EG",
};

export default egypt;
