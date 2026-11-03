// ETA (Egyptian Tax Authority) e-invoicing types
// Based on ETA API specification v1.0

export type ETADocumentType = "I" | "C" | "D"; // Invoice | Credit Note | Debit Note
export type ETATaxType = "T1" | "T2" | "T3" | "T4" | "T5" | "T6" | "T7" | "T8" | "T9" | "T10" | "T11" | "T12" | "T13" | "T14" | "T15" | "T16";
export type ETADocumentStatus = "Valid" | "Invalid" | "Cancelled" | "Submitted";

export interface ETAAddress {
  branchID?: string;
  country: string;        // ISO 3166-1 alpha-3, e.g. "EGY"
  governate?: string;
  regionCity?: string;
  street?: string;
  buildingNumber?: string;
  postalCode?: string;
  floor?: string;
  room?: string;
  landmark?: string;
  additionalInformation?: string;
}

export interface ETAIssuer {
  address: ETAAddress;
  type: "B" | "P" | "F" | "G"; // Business | Person | Foreigner | Government
  id: string;             // Tax registration number (9 digits for Egypt)
  name: string;
}

export interface ETAReceiver {
  address: ETAAddress;
  type: "B" | "P" | "F" | "G";
  id?: string;            // Optional for B2C
  name: string;
}

export interface ETATaxableItem {
  taxType: ETATaxType;
  amount: number;         // Tax amount (2 decimal places)
  subType?: string;       // Tax subtype code
  rate?: number;          // Tax rate as percentage (e.g. 14 for 14%)
}

export interface ETAUnitValue {
  currencySold: string;   // ISO 4217, e.g. "EGP"
  amountEGP: number;      // Amount in EGP (2 decimal places)
  amountSold?: number;    // Amount in original currency if different
  currencyExchangeRate?: number;
}

export interface ETAInvoiceLine {
  description: string;
  itemType: "EGS" | "GS1" | "FREE_TEXT";
  itemCode: string;
  unitType: string;       // Unit of measure code, e.g. "EA" (Each)
  quantity: number;
  internalCode?: string;
  salesTotal: number;     // quantity × unitValue.amountEGP (before discount/tax)
  total: number;          // net + tax
  valueDifference?: number;
  totalTaxableFees?: number;
  netTotal: number;       // salesTotal - discount
  itemsDiscount?: number;
  discount?: {
    rate?: number;
    amount: number;
  };
  unitValue: ETAUnitValue;
  taxableItems: ETATaxableItem[];
}

export interface ETATaxTotal {
  taxType: ETATaxType;
  amount: number;
}

export interface ETADocument {
  issuer: ETAIssuer;
  receiver: ETAReceiver;
  documentType: ETADocumentType;
  documentTypeVersion: string;  // e.g. "1.0"
  dateTimeIssued: string;       // ISO 8601
  taxpayerActivityCode: string; // ETA activity code
  internalID: string;           // Your internal invoice number/ID
  invoiceLines: ETAInvoiceLine[];
  taxTotals: ETATaxTotal[];
  totalSalesAmount: number;
  totalDiscountAmount: number;
  netAmount: number;
  taxAmount: number;
  totalAmount: number;
  extraDiscountAmount?: number;
  totalItemsDiscountAmount?: number;
  // Added after signing
  signatures?: ETASignature[];
  uuid?: string;  // Assigned by ETA after submission
}

export interface ETASignature {
  signatureType: "I"; // "I" = issuer signature
  value: string;      // Base64-encoded signature or hash
}

export interface ETAAcceptedDocument {
  uuid: string;
  longId: string;
  internalId: string;
  hashKey: string;
  submittedDocumentCount: number;
}

export interface ETARejectedDocument {
  internalId: string;
  error: {
    code: string;
    message: string;
    target?: string;
    details?: Array<{ code: string; message: string; target?: string }>;
    innererror?: { code: string; message: string };
  };
}

export interface ETASubmissionResult {
  submissionId: string;
  acceptedDocuments: ETAAcceptedDocument[];
  rejectedDocuments: ETARejectedDocument[];
  submittedOn?: string;
}

export interface ETATokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export interface ETAClientConfig {
  clientId: string;
  clientSecret: string;
  env: "production" | "sandbox";
}

export interface EgyptComplianceConfig extends ETAClientConfig {
  /** ETA taxpayer activity code for the business (required by ETA) */
  activityCode?: string;
}
