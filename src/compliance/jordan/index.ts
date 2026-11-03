import type { ComplianceModule } from "../types";
import type { JordanComplianceConfig, JoFotaraSubmissionResult, JoFotaraStatusResult } from "./types";
import { JoFotaraClient } from "./jofotara-client";
import { buildJoFotaraInvoice } from "./document-builder";
import { signInvoice, hashInvoice } from "./signer";

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

// ---------------------------------------------------------------------------
// Active compliance class — wraps the JoFotara client
// ---------------------------------------------------------------------------

interface SubmitParams {
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
    unitPriceJOD: number;
    discountAmount?: number;
    gstRate?: number;
  }>;
  previousInvoiceHash?: string;
  invoiceCounter?: number;
}

export class JordanCompliance {
  private client: JoFotaraClient;

  constructor(config: JordanComplianceConfig) {
    this.client = new JoFotaraClient(config);
  }

  async submitInvoice(params: SubmitParams): Promise<JoFotaraSubmissionResult & { invoiceHash: string }> {
    const doc = buildJoFotaraInvoice({
      invoice: params,
      business: params.business,
      contact: params.contact,
      lineItems: params.lineItems,
      previousInvoiceHash: params.previousInvoiceHash,
      invoiceCounter: params.invoiceCounter,
    });

    const signed = signInvoice(doc);
    const invoiceHash = hashInvoice(signed);

    const result = await this.client.submitInvoice({ invoice: signed });

    return { ...result, invoiceHash };
  }

  async getStatus(uuid: string): Promise<JoFotaraStatusResult> {
    return this.client.getInvoiceStatus(uuid);
  }

  async cancelInvoice(uuid: string): Promise<void> {
    return this.client.cancelInvoice(uuid);
  }
}

/** Factory — reads env vars and throws if required credentials are missing. */
export function createJordanCompliance(): JordanCompliance {
  const clientId = process.env.JOFOTARA_CLIENT_ID;
  const secretKey = process.env.JOFOTARA_SECRET_KEY;

  if (!clientId || !secretKey) {
    throw new Error(
      "JOFOTARA_CLIENT_ID and JOFOTARA_SECRET_KEY must be set in environment variables"
    );
  }

  const env = (process.env.JOFOTARA_ENV ?? "sandbox") as "production" | "sandbox";

  return new JordanCompliance({ clientId, secretKey, env });
}
