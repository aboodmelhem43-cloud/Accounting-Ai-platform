import crypto from "crypto";
import type { NormalizedSale, VerifyResult, LineItem } from "./types";

export function verifyFoodicsSignature(
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
    Buffer.from(headerSignature.toLowerCase())
  );
  return { valid, reason: valid ? undefined : "Invalid Foodics signature" };
}

export function normalizeFoodicsOrder(payload: Record<string, unknown>): NormalizedSale {
  const order = (payload.data ?? payload) as Record<string, unknown>;

  const subtotal = Number(order.net_total ?? order.subtotal ?? 0);
  const vatAmount = Number(order.tax_total ?? order.vat_amount ?? 0);
  const total = Number(order.total ?? order.grand_total ?? subtotal + vatAmount);
  const currency = String(order.currency ?? "SAR");

  const rawItems = (order.order_products ?? order.products ?? order.items ?? []) as Record<string, unknown>[];
  const lineItems = rawItems.map((item: Record<string, unknown>): LineItem => {
    const product = item.product as Record<string, unknown> | undefined;
    return {
      description: String(product?.name ?? item.name ?? "Item"),
      quantity: Number(item.quantity ?? 1),
      unitPrice: Number(item.unit_price ?? item.price ?? 0),
      total: Number(item.total_price ?? item.total ?? 0),
    };
  });

  const pm = String(order.payment_method ?? order.tender_type ?? "").toLowerCase();
  const paymentMethod =
    pm === "cash" || pm.includes("cash") ? "cash" : pm.includes("card") ? "card" : "card";

  return {
    externalId: String(order.id ?? order.reference),
    orderNumber: String(order.reference ?? order.number ?? order.id),
    occurredAt: new Date(order.opened_at as string ?? order.created_at as string ?? Date.now()),
    subtotal,
    vatAmount,
    total,
    currency,
    paymentMethod,
    customerName: undefined, // POS orders typically don't have customer names
    lineItems,
    rawData: payload,
  };
}
