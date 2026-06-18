import type { ComplianceModule } from "./types";
import egypt from "./egypt";
import saudi from "./saudi";
import uae from "./uae";
import jordan from "./jordan";
import kuwait from "./kuwait";
import bahrain from "./bahrain";
import qatar from "./qatar";
import oman from "./oman";

// سجل كل وحدات الامتثال المتاحة
const COMPLIANCE_MODULES: Record<string, ComplianceModule> = {
  EG: egypt,
  SA: saudi,
  AE: uae,
  JO: jordan,
  KW: kuwait,
  BH: bahrain,
  QA: qatar,
  OM: oman,
};

// جلب وحدة الامتثال لدولة معينة
export function getComplianceModule(countryCode: string): ComplianceModule {
  const module = COMPLIANCE_MODULES[countryCode.toUpperCase()];
  if (!module) {
    // fallback — يُعاد egypt كافتراضي لو الدولة غير مدعومة
    return egypt;
  }
  return module;
}

// قائمة الدول المدعومة للعرض في قائمة التسجيل
export const SUPPORTED_COUNTRIES = Object.values(COMPLIANCE_MODULES).map((m) => ({
  code: m.countryCode,
  nameAr: m.countryNameAr,
  nameEn: m.countryNameEn,
  currency: m.currency,
  currencySymbol: m.currencySymbol,
}));

export type { ComplianceModule };
export { calculateTax, calculateTotal } from "./types";
