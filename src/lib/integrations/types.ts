export type Platform = "shopify" | "salla" | "zid" | "foodics" | "generic";

export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface NormalizedSale {
  externalId: string;
  orderNumber: string;
  occurredAt: Date;
  subtotal: number;
  vatAmount: number;
  total: number;
  currency: string;
  paymentMethod: string; // "cash" | "card" | "online" | "cod" | "bank_transfer"
  customerName?: string;
  lineItems: LineItem[];
  rawData: Record<string, unknown>;
}

export interface VerifyResult {
  valid: boolean;
  reason?: string;
}
