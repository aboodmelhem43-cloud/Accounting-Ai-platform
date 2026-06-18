import type { ComplianceModule } from "../types";

// وحدة امتثال البحرين
// ضريبة القيمة المضافة: 10% (رُفعت من 5% إلى 10% في يناير 2022)
const bahrain: ComplianceModule = {
  countryCode: "BH",
  countryNameAr: "البحرين",
  countryNameEn: "Bahrain",
  currency: "BHD",
  currencySymbol: "د.ب",
  currencyNameAr: "دينار بحريني",

  hasVat: true,
  vatRate: 0.10,
  vatName: "ضريبة القيمة المضافة",
  vatShortName: "VAT",

  eInvoiceSystem: null,
  eInvoiceRequired: false,
  eInvoiceNote: "لا يوجد نظام فاتورة إلكترونية إلزامي مركزي في البحرين حتى الآن.",

  taxIdPattern: /^\d{9}$/,
  taxIdLabel: "الرقم الضريبي (9 أرقام)",
  numberLocale: "ar-BH",
};

export default bahrain;
