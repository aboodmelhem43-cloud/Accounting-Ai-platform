import type { ComplianceModule } from "../types";

// وحدة امتثال الكويت
// لا ضريبة قيمة مضافة حتى الآن
// لا يوجد نظام فاتورة إلكترونية إلزامي مركزي
const kuwait: ComplianceModule = {
  countryCode: "KW",
  countryNameAr: "الكويت",
  countryNameEn: "Kuwait",
  currency: "KWD",
  currencySymbol: "د.ك",
  currencySymbolEn: "KD",
  currencyNameAr: "دينار كويتي",

  hasVat: false,
  vatRate: 0,
  vatName: "لا توجد ضريبة",
  vatShortName: "",

  eInvoiceSystem: null,
  eInvoiceRequired: false,
  eInvoiceNote: "الكويت لا تطبق ضريبة القيمة المضافة ولا يوجد نظام فاتورة إلكترونية إلزامي حتى الآن.",

  taxIdPattern: null,
  taxIdLabel: "الرقم الضريبي",
  numberLocale: "ar-KW",
};

export default kuwait;
