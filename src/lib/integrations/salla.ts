import crypto from "crypto";
import type { NormalizedSale, VerifyResult } from "./types";

export function verifySallaSignature(
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
  return { valid, reason: valid ? undefined : "Invalid Salla signature" };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeSallaOrder(payload: Record<string, any>): NormalizedSale {
  const data = payload.data ?? payload;

  const amounts = data.amounts ?? {};
  const subtotal = Number(amounts.subtotal?.amount ?? amounts.sub_total ?? data.sub_total ?? 0);
  const vatAmount = Number(amounts.tax?.amount ?? amounts.vat ?? data.tax ?? 0);
  const total = Number(amounts.total?.amount ?? data.total ?? subtotal + vatAmount);
  const currency = amounts.subtotal?.currency ?? data.currency ?? "SAR";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lineItems = (data.items ?? data.products ?? []).map((item: any) => ({
    description: item.name ?? item.title ?? "Item",
    quantity: Number(item.quantity ?? 1),
    unitPrice: Number(item.price?.amount ?? item.price ?? 0),
    total: Number(item.total?.amount ?? item.total ?? 0),
  }));

  const customer = data.customer ?? {};
  const customerName =
    customer.name ??
    [customer.first_name, customer.last_name].filter(Boolean).join(" ") ||
    undefined;

  const pm = (data.payment_method ?? "").toLowerCase();
  const paymentMethod = pm.includes("cash") ? "cash" : pm.includes("cod") ? "cod" : "card";

  return {
    externalId: String(data.id ?? data.reference_id),
    orderNumber: String(data.reference_id ?? data.id),
    occurredAt: new Date(data.date ?? data.created_at ?? Date.now()),
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
