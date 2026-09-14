import crypto from "crypto";
import type { NormalizedSale, VerifyResult, LineItem } from "./types";

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

export function normalizeSallaOrder(payload: Record<string, unknown>): NormalizedSale {
  const data = (payload.data ?? payload) as Record<string, unknown>;

  const amounts = (data.amounts ?? {}) as Record<string, unknown>;
  const amountsSubtotal = amounts.subtotal as Record<string, unknown> | undefined;
  const amountsTotal = amounts.total as Record<string, unknown> | undefined;
  const amountsTax = amounts.tax as Record<string, unknown> | undefined;
  const subtotal = Number(amountsSubtotal?.amount ?? amounts.sub_total ?? data.sub_total ?? 0);
  const vatAmount = Number(amountsTax?.amount ?? amounts.vat ?? data.tax ?? 0);
  const total = Number(amountsTotal?.amount ?? data.total ?? subtotal + vatAmount);
  const currency = (amountsSubtotal?.currency ?? data.currency ?? "SAR") as string;

  const rawSallaItems = (data.items as Record<string, unknown>[] | undefined ?? data.products as Record<string, unknown>[] | undefined ?? []);
  const lineItems = rawSallaItems.map((item: Record<string, unknown>): LineItem => {
    const itemPrice = item.price as Record<string, unknown> | undefined;
    const itemTotal = item.total as Record<string, unknown> | undefined;
    return {
      description: String(item.name ?? item.title ?? "Item"),
      quantity: Number(item.quantity ?? 1),
      unitPrice: Number(itemPrice?.amount ?? item.price ?? 0),
      total: Number(itemTotal?.amount ?? item.total ?? 0),
    };
  });

  const customer = (data.customer ?? {}) as Record<string, unknown>;
  const customerName =
    String(customer.name ?? [customer.first_name, customer.last_name].filter(Boolean).map(String).join(" ")) || undefined;

  const pm = String(data.payment_method ?? "").toLowerCase();
  const paymentMethod = pm.includes("cash") ? "cash" : pm.includes("cod") ? "cod" : "card";

  return {
    externalId: String(data.id ?? data.reference_id),
    orderNumber: String(data.reference_id ?? data.id),
    occurredAt: new Date(data.date as string ?? data.created_at as string ?? Date.now()),
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
