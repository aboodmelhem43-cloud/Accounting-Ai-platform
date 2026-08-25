import crypto from "crypto";
import type { NormalizedSale, VerifyResult } from "./types";

export function verifyZidSignature(
  rawBody: string,
  headerSignature: string,
  secret: string
): VerifyResult {
  const hmac = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");
  const valid = crypto.timingSafeEqual(
    Buffer.from(hmac.toLowerCase()),
    Buffer.from(headerSignature.replace(/^sha256=/, "").toLowerCase())
  );
  return { valid, reason: valid ? undefined : "Invalid Zid signature" };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeZidOrder(payload: Record<string, any>): NormalizedSale {
  const order = payload.order ?? payload.data ?? payload;

  const subtotal = Number(order.sub_total ?? order.subtotal ?? 0);
  const vatAmount = Number(order.tax ?? order.vat ?? order.taxes_total ?? 0);
  const total = Number(order.total ?? order.grand_total ?? subtotal + vatAmount);
  const currency = order.currency ?? "SAR";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lineItems = (order.products ?? order.items ?? []).map((item: any) => ({
    description: item.name ?? item.title ?? "Item",
    quantity: Number(item.quantity ?? 1),
    unitPrice: Number(item.price ?? 0),
    total: Number(item.total ?? Number(item.price ?? 0) * Number(item.quantity ?? 1)),
  }));

  const customer = order.customer ?? order.shipping_address ?? {};
  const customerName =
    (customer.name ?? [customer.first_name, customer.last_name].filter(Boolean).join(" ")) || undefined;

  const pm = (order.payment_method ?? "").toLowerCase();
  const paymentMethod = pm.includes("cash") ? "cash" : pm.includes("cod") ? "cod" : "card";

  return {
    externalId: String(order.id ?? order.order_id),
    orderNumber: String(order.reference_number ?? order.order_number ?? order.id),
    occurredAt: new Date(order.created_at ?? order.date ?? Date.now()),
    subtotal,
    vatAmount,
    total,
    currency,
    paymentMethod,
    customerName,
    lineItems,
    rawData: payload,
  };
}
