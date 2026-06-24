import type { ComplianceModule } from "../types";

const saudi: ComplianceModule = {
  countryCode: "SA",
  countryNameAr: "المملكة العربية السعودية",
  countryNameEn: "Saudi Arabia",
  currency: "SAR",
  currencySymbol: "ر.س",
  currencySymbolEn: "SR",
  currencyNameAr: "ريال سعودي",

  hasVat: true,
  vatRate: 0.15,
  vatName: "ضريبة القيمة المضافة",
  vatShortName: "VAT",

  eInvoiceSystem: "ZATCA",
  eInvoiceRequired: true,
  eInvoiceNote:
    "الفاتورة الإلكترونية إلزامية عبر منصة فاتورة (ZATCA). أنشئ فاتورتك هنا مع رمز QR الضريبي، ثم ارفعها إلى بوابة ZATCA Fatoora.",

  taxIdPattern: /^\d{15}$/,
  taxIdLabel: "الرقم الضريبي (15 رقمًا)",
  numberLocale: "ar-SA",
};

export default saudi;
