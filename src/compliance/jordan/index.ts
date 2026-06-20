import type { ComplianceModule } from "../types";

// وحدة امتثال الأردن
// ضريبة المبيعات العامة (GST): 16% على معظم السلع والخدمات
// الفاتورة الإلكترونية: JoFotara — إلزامية لكل عملية بيع بقيمة دينار فأكثر
const jordan: ComplianceModule = {
  countryCode: "JO",
  countryNameAr: "المملكة الأردنية الهاشمية",
  countryNameEn: "Jordan",
  currency: "JOD",
  currencySymbol: "د.أ",
  currencySymbolEn: "JD",
  currencyNameAr: "دينار أردني",

  hasVat: true,
  vatRate: 0.16,
  vatName: "ضريبة المبيعات العامة",
  vatShortName: "GST",

  eInvoiceSystem: "JoFotara",
  eInvoiceRequired: true,
  eInvoiceNote:
    "نظام JoFotara إلزامي لكل عملية بيع بقيمة دينار أردني أو أكثر (يشمل المهن الحرة والأفراد). دعم الربط بـ JoFotara قيد التطوير.",

  taxIdPattern: /^\d{9}$/,
  taxIdLabel: "الرقم الضريبي (9 أرقام)",
  numberLocale: "ar-JO",
};

export default jordan;
