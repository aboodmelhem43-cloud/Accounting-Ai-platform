import type { ComplianceModule } from "../types";

// وحدة امتثال قطر
// لا ضريبة قيمة مضافة حتى الآن (في مرحلة التخطيط)
const qatar: ComplianceModule = {
  countryCode: "QA",
  countryNameAr: "قطر",
  countryNameEn: "Qatar",
  currency: "QAR",
  currencySymbol: "ر.ق",
  currencySymbolEn: "QR",
  currencyNameAr: "ريال قطري",

  hasVat: false,
  vatRate: 0,
  vatName: "لا توجد ضريبة",
  vatShortName: "",

  eInvoiceSystem: null,
  eInvoiceRequired: false,
  eInvoiceNote: "قطر لا تطبق ضريبة القيمة المضافة ولا يوجد نظام فاتورة إلكترونية إلزامي حتى الآن.",

  taxIdPattern: null,
  taxIdLabel: "الرقم الضريبي",
  numberLocale: "ar-QA",
};

export default qatar;
