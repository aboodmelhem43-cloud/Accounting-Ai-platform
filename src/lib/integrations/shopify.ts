import crypto from "crypto";
import type { NormalizedSale, VerifyResult, LineItem } from "./types";

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

export function normalizeShopifyOrder(payload: Record<string, unknown>): NormalizedSale {
  const lineItems = (payload.line_items as Record<string, unknown>[] ?? []).map(
    (item: Record<string, unknown>): LineItem => ({
      description: String(item.title ?? item.name ?? "Item"),
      quantity: Number(item.quantity ?? 1),
      unitPrice: Number(item.price ?? 0),
      total: Number(item.price ?? 0) * Number(item.quantity ?? 1),
    })
  );

  const customer = (payload.customer ?? {}) as Record<string, unknown>;
  const customerName = [customer.first_name, customer.last_name].filter(Boolean).map(String).join(" ") || undefined;

  const paymentGateway = String(payload.payment_gateway ?? "").toLowerCase();
  const paymentMethod = paymentGateway.includes("cash")
    ? "cash"
    : paymentGateway.includes("cod")
    ? "cod"
    : "card";

  return {
    externalId: String(payload.id),
    orderNumber: String(payload.order_number ?? payload.name ?? payload.id),
    occurredAt: new Date(payload.processed_at as string ?? payload.created_at as string ?? Date.now()),
    subtotal: Number(payload.subtotal_price ?? 0),
    vatAmount: Number(payload.total_tax ?? 0),
    total: Number(payload.total_price ?? 0),
    currency: String(payload.currency ?? "USD"),
    paymentMethod,
    customerName,
    lineItems,
    rawData: payload,
  };
}
