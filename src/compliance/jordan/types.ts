// JoFotara (Jordan Income and Sales Tax Department) e-invoicing types
// Based on ISTD JoFotara API specification

export type JoFotaraDocumentType = "INVOICE" | "CREDIT_NOTE" | "DEBIT_NOTE";
export type JoFotaraInvoiceStatus = "0" | "1"; // 0 = normal, 1 = cancelled
export type JoFotaraTaxCategory = "S" | "Z" | "E" | "O"; // Standard | Zero | Exempt | Out-of-scope

export interface JoFotaraSeller {
  TIN: string;           // Tax Identification Number (9 digits)
  name: string;
}

export interface JoFotaraBuyer {
  type: "0" | "1";       // 0 = individual, 1 = business
  TIN?: string;          // Required for B2B
  name: string;
}

export interface JoFotaraLineItem {
  lineNumber: number;
  itemDescription: string;
  quantity: number;
  unitPrice: number;          // Before discount, before tax
  discountAmount: number;
  netAmount: number;          // quantity × unitPrice - discountAmount
  taxCategory: JoFotaraTaxCategory;
  taxRate: number;            // e.g. 0.16 for 16%
  taxAmount: number;          // netAmount × taxRate
  grossAmount: number;        // netAmount + taxAmount
}

export interface JoFotaraInvoice {
  invoiceId: string;          // Internal ID
  invoiceNumber: string;      // Displayed invoice number
  invoiceStatus: JoFotaraInvoiceStatus;
  invoiceDate: string;        // YYYY-MM-DD
  invoiceTime: string;        // HH:mm:ss
  invoiceDueDate?: string;    // YYYY-MM-DD
  paymentMethod: string;      // "01" = cash, "02" = credit
  invoiceCurrency: string;    // ISO 4217, "JOD"
  invoiceCounterValue: number;
  previousInvoiceHash: string;  // SHA-256 of previous invoice in chain; "0" for first
  seller: JoFotaraSeller;
  buyer: JoFotaraBuyer;
  invoiceLinesCount: number;
  lineItems: JoFotaraLineItem[];
  totalNetAmount: number;
  totalTaxAmount: number;
  totalGrossAmount: number;
  totalDiscountAmount: number;
  qrCode?: string;           // Base64 TLV QR code (added before submission)
}

export interface JoFotaraSubmissionPayload {
  invoice: JoFotaraInvoice;
}

export interface JoFotaraSubmissionResult {
  uuid: string;              // Assigned by JoFotara
  invoiceHash: string;       // SHA-256 of this invoice (used as previousInvoiceHash for next)
  status: string;            // "SUBMITTED" | "VALID" | "INVALID"
  errors?: Array<{ code: string; message: string }>;
  submittedAt?: string;
}

export interface JoFotaraStatusResult {
  uuid: string;
  status: string;
  invoiceNumber: string;
  submittedAt?: string;
}

export interface JoFotaraClientConfig {
  clientId: string;
  secretKey: string;
  env: "production" | "sandbox";
}

export interface JordanComplianceConfig extends JoFotaraClientConfig {
  // No extra fields needed beyond client credentials
}
