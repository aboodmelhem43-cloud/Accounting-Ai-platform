import type { ComplianceModule } from "../types";

// وحدة امتثال سلطنة عُمان
// ضريبة القيمة المضافة: 5% (مطبّقة منذ أبريل 2021)
const oman: ComplianceModule = {
  countryCode: "OM",
  countryNameAr: "سلطنة عُمان",
  countryNameEn: "Oman",
  currency: "OMR",
  currencySymbol: "ر.ع",
  currencyNameAr: "ريال عُماني",

  hasVat: true,
  vatRate: 0.05,
  vatName: "ضريبة القيمة المضافة",
  vatShortName: "VAT",

  eInvoiceSystem: null,
  eInvoiceRequired: false,
  eInvoiceNote: "لا يوجد نظام فاتورة إلكترونية إلزامي مركزي في عُمان حتى الآن.",

  taxIdPattern: /^\d{10}$/,
  taxIdLabel: "الرقم الضريبي",
  numberLocale: "ar-OM",
};

export default oman;
