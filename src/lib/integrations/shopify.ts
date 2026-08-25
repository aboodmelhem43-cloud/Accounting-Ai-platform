import crypto from "crypto";
import type { NormalizedSale, VerifyResult } from "./types";

export function verifyShopifySignature(
  rawBody: string,
  headerSignature: string,
  secret: string
): VerifyResult {
  const hmac = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("base64");
  const valid = crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(headerSignature));
  return { valid, reason: valid ? undefined : "Invalid HMAC signature" };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeShopifyOrder(payload: Record<string, any>): NormalizedSale {
  const lineItems = (payload.line_items ?? []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (item: any) => ({
      description: item.title ?? item.name ?? "Item",
      quantity: Number(item.quantity ?? 1),
      unitPrice: Number(item.price ?? 0),
      total: Number(item.price ?? 0) * Number(item.quantity ?? 1),
    })
  );

  const customer = payload.customer ?? {};
  const customerName = [customer.first_name, customer.last_name].filter(Boolean).join(" ") || undefined;

  const paymentGateway = (payload.payment_gateway ?? "").toLowerCase();
  const paymentMethod = paymentGateway.includes("cash")
    ? "cash"
    : paymentGateway.includes("cod")
    ? "cod"
    : "card";

  return {
    externalId: String(payload.id),
    orderNumber: String(payload.order_number ?? payload.name ?? payload.id),
    occurredAt: new Date(payload.processed_at ?? payload.created_at ?? Date.now()),
    subtotal: Number(payload.subtotal_price ?? 0),
    vatAmount: Number(payload.total_tax ?? 0),
    total: Number(payload.total_price ?? 0),
    currency: payload.currency ?? "USD",
    paymentMethod,
    customerName,
    lineItems,
    rawData: payload,
  };
}
