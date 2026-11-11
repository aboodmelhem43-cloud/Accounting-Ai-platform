import type { ComplianceModule } from "@/compliance/types";

export interface InvoiceCompliance {
  vatRate: number;
  vatName: string;
  vatNameEn: string;
  vatShortName: string;
  currency: string;
  currencySymbol: string;
  eInvoiceSystem: string | null;
  eInvoiceNoteAr: string;
  eInvoiceNoteEn: string;
  invoiceTitleAr: string;
  invoiceTitleEn: string;
  taxIdLabel: string;
  taxIdLabelEn: string;
  showQr: boolean;
}

const EN_VAT_NAMES: Record<string, string> = {
  VAT: "Value Added Tax",
  GST: "General Sales Tax",
};

const EN_EINVOICE_NOTES: Record<string, string> = {
  ZATCA: "Per ZATCA e-invoice mandate, this invoice must be issued electronically with a QR code.",
  ETA: "Per Egypt Tax Authority (ETA) e-invoice system, this invoice must be submitted electronically.",
  JoFotara: "Per JoFotara system, this invoice is mandatory for all sales of 1 JOD or more.",
};

const INVOICE_TITLES: Record<string, { ar: string; en: string }> = {
  EG: { ar: "فاتورة ضريبية", en: "Tax Invoice" },
  SA: { ar: "فاتورة ضريبية", en: "Tax Invoice" },
  AE: { ar: "فاتورة ضريبية", en: "Tax Invoice" },
  JO: { ar: "فاتورة ضريبة مبيعات", en: "Sales Tax Invoice" },
  KW: { ar: "فاتورة", en: "Invoice" },
  BH: { ar: "فاتورة ضريبية", en: "Tax Invoice" },
  QA: { ar: "فاتورة", en: "Invoice" },
  OM: { ar: "فاتورة ضريبية", en: "Tax Invoice" },
};

const TAX_ID_LABELS_EN: Record<string, string> = {
  SA: "VAT Number (15 digits)",
};

export function toInvoiceCompliance(module: ComplianceModule): InvoiceCompliance {
  const titles = INVOICE_TITLES[module.countryCode] ?? { ar: "فاتورة", en: "Invoice" };
  return {
    vatRate: module.vatRate,
    vatName: module.vatName,
    vatNameEn: EN_VAT_NAMES[module.vatShortName] ?? module.vatShortName,
    vatShortName: module.vatShortName,
    currency: module.currency,
    currencySymbol: module.currencySymbol,
    eInvoiceSystem: module.eInvoiceSystem,
    eInvoiceNoteAr: module.eInvoiceNote,
    eInvoiceNoteEn: module.eInvoiceSystem
      ? (EN_EINVOICE_NOTES[module.eInvoiceSystem] ?? "")
      : "",
    invoiceTitleAr: titles.ar,
    invoiceTitleEn: titles.en,
    taxIdLabel: module.taxIdLabel,
    taxIdLabelEn: TAX_ID_LABELS_EN[module.countryCode] ?? "Tax Number",
    showQr: module.eInvoiceSystem === "ZATCA",
  };
}
