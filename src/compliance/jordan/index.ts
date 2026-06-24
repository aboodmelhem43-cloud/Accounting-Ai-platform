import type { ComplianceModule } from "../types";

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
    "نظام JoFotara إلزامي لكل عملية بيع بقيمة دينار أردني أو أكثر. أنشئ فاتورتك من هنا، ثم سجّلها في بوابة JoFotara الرسمية.",

  taxIdPattern: /^\d{9}$/,
  taxIdLabel: "الرقم الضريبي (9 أرقام)",
  numberLocale: "ar-JO",
};

export default jordan;
