import crypto from "crypto";
import type { NormalizedSale, VerifyResult } from "./types";

export function verifyGenericSignature(
  rawBody: string,
  headerSignature: string,
  secret: string
): VerifyResult {
  if (!secret) return { valid: true }; // generic integrations can opt out of signing
  const hmac = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");
  const valid = crypto.timingSafeEqual(
    Buffer.from(hmac.toLowerCase()),
    Buffer.from(headerSignature.replace(/^sha256=/, "").toLowerCase())
  );
  return { valid, reason: valid ? undefined : "Invalid signature" };
}

/**
 * Accepts a standardized payload:
 * {
 *   id: string,
 *   orderNumber: string,
 *   occurredAt: string (ISO),
 *   subtotal: number,
 *   vatAmount: number,
 *   total: number,
 *   currency: string,
 *   paymentMethod: string,
 *   customerName?: string,
 *   lineItems: [{ description, quantity, unitPrice, total }]
 * }
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeGenericPayload(payload: Record<string, any>): NormalizedSale {
  return {
    externalId: String(payload.id ?? payload.externalId ?? Date.now()),
    orderNumber: String(payload.orderNumber ?? payload.order_number ?? payload.id),
    occurredAt: new Date(payload.occurredAt ?? payload.date ?? Date.now()),
    subtotal: Number(payload.subtotal ?? payload.sub_total ?? 0),
    vatAmount: Number(payload.vatAmount ?? payload.vat ?? payload.tax ?? 0),
    total: Number(payload.total ?? payload.grand_total ?? 0),
    currency: payload.currency ?? "SAR",
    paymentMethod: payload.paymentMethod ?? payload.payment_method ?? "card",
    customerName: payload.customerName ?? payload.customer_name ?? undefined,
    lineItems: (payload.lineItems ?? payload.line_items ?? payload.items ?? []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (item: any) => ({
        description: item.description ?? item.name ?? item.title ?? "Item",
        quantity: Number(item.quantity ?? 1),
        unitPrice: Number(item.unitPrice ?? item.unit_price ?? item.price ?? 0),
        total: Number(item.total ?? 0),
      })
    ),
    rawData: payload,
  };
}
