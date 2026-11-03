import type { ComplianceModule } from "../types";
import { ETAClient } from "./eta-client";
import { buildETADocument } from "./document-builder";
import { signDocument } from "./signer";
import type {
  EgyptComplianceConfig,
  ETADocumentStatus,
  ETASubmissionResult,
} from "./types";

// Re-export types and utilities
export type { EgyptComplianceConfig, ETASubmissionResult, ETADocumentStatus };
export { ETAClient } from "./eta-client";
export { buildETADocument } from "./document-builder";
export { serializeDocument, hashDocument, signDocument } from "./signer";
export * from "./types";

// ── ComplianceModule descriptor (country metadata) ──────────────────────────

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

// ── EgyptCompliance — high-level class ──────────────────────────────────────

interface InvoiceData {
  id: string;
  invoiceNumber: string | null;
  documentType: string;
  createdAt: Date;
  extractedData: unknown;
  business: {
    name: string;
    taxNumber: string | null;
    address: string | null;
    country: string;
  };
  contact: {
    name: string;
    taxNumber: string | null;
    address: string | null;
    type: string;
  } | null;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPriceEGP: number;
    discountAmount?: number;
    vatRate?: number;
  }>;
}

export class EgyptCompliance {
  private client: ETAClient;

  constructor(private config: EgyptComplianceConfig) {
    this.client = new ETAClient({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      env: config.env,
    });
  }

  /** Build, sign, and submit an invoice to ETA. */
  async submitInvoice(data: InvoiceData): Promise<ETASubmissionResult> {
    const doc = buildETADocument({
      invoice: data,
      business: data.business,
      contact: data.contact,
      lineItems: data.lineItems,
      activityCode: this.config.activityCode,
    });

    const signed = signDocument(doc);
    return this.client.submitDocuments([signed]);
  }

  /** Check the ETA status of a submitted document. */
  async getStatus(etaUuid: string): Promise<ETADocumentStatus> {
    const result = await this.client.getDocumentStatus(etaUuid);
    return result.status;
  }

  /** Cancel a submitted document on ETA. */
  async cancelInvoice(etaUuid: string, reason: string): Promise<void> {
    return this.client.cancelDocument(etaUuid, reason);
  }
}

/** Build an EgyptCompliance instance from environment variables. */
export function createEgyptCompliance(env: "production" | "sandbox" = "sandbox"): EgyptCompliance {
  const clientId = process.env.ETA_CLIENT_ID;
  const clientSecret = process.env.ETA_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "ETA credentials missing. Set ETA_CLIENT_ID and ETA_CLIENT_SECRET in your environment."
    );
  }

  return new EgyptCompliance({
    clientId,
    clientSecret,
    env,
    activityCode: process.env.ETA_ACTIVITY_CODE ?? "4741",
  });
}
