import { createHmac, timingSafeEqual } from "crypto";
import type { PlanId } from "./plans";

const LS_API_KEY = process.env.LEMONSQUEEZY_API_KEY;

export const PLAN_VARIANT_IDS: Record<string, PlanId> = {};

export function variantToPlan(variantId: string): PlanId | null {
  const map: Record<string, PlanId> = {
    [process.env.LEMONSQUEEZY_VARIANT_STARTER ?? ""]: "STARTER",
    [process.env.LEMONSQUEEZY_VARIANT_PRO ?? ""]: "PRO",
    [process.env.LEMONSQUEEZY_VARIANT_BUSINESS ?? ""]: "BUSINESS",
    [process.env.LEMONSQUEEZY_VARIANT_STARTER_YEARLY ?? ""]: "STARTER",
    [process.env.LEMONSQUEEZY_VARIANT_PRO_YEARLY ?? ""]: "PRO",
    [process.env.LEMONSQUEEZY_VARIANT_BUSINESS_YEARLY ?? ""]: "BUSINESS",
  };
  return map[variantId] ?? null;
}

export function planToVariantId(plan: PlanId, billing: "monthly" | "yearly" = "monthly"): string | null {
  const map: Record<string, string | undefined> = {
    STARTER_monthly: process.env.LEMONSQUEEZY_VARIANT_STARTER,
    PRO_monthly: process.env.LEMONSQUEEZY_VARIANT_PRO,
    BUSINESS_monthly: process.env.LEMONSQUEEZY_VARIANT_BUSINESS,
    STARTER_yearly: process.env.LEMONSQUEEZY_VARIANT_STARTER_YEARLY,
    PRO_yearly: process.env.LEMONSQUEEZY_VARIANT_PRO_YEARLY,
    BUSINESS_yearly: process.env.LEMONSQUEEZY_VARIANT_BUSINESS_YEARLY,
  };
  return map[`${plan}_${billing}`] ?? null;
}

async function getStoreId(): Promise<string> {
  // Use env var if explicitly set, otherwise auto-fetch from API
  if (process.env.LEMONSQUEEZY_STORE_ID) {
    return process.env.LEMONSQUEEZY_STORE_ID;
  }
  const res = await fetch("https://api.lemonsqueezy.com/v1/stores", {
    headers: { Authorization: `Bearer ${LS_API_KEY}`, Accept: "application/vnd.api+json" },
  });
  if (!res.ok) throw new Error(`Failed to fetch LS stores: ${res.status}`);
  const json = await res.json();
  const id = json.data?.[0]?.id;
  if (!id) throw new Error("No Lemon Squeezy store found for this API key");
  return String(id);
}

export async function createCheckout({
  variantId,
  email,
  businessId,
  name,
}: {
  variantId: string;
  email: string;
  businessId: string;
  name: string;
}): Promise<string> {
  if (!LS_API_KEY) {
    throw new Error("Lemon Squeezy credentials not configured");
  }

  const storeId = await getStoreId();
  const rawUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://mohasabai.com").replace(/\/$/, "");
  const appUrl = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;

  const res = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LS_API_KEY}`,
      "Content-Type": "application/vnd.api+json",
      Accept: "application/vnd.api+json",
    },
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            email,
            name,
            custom: { business_id: businessId },
          },
          product_options: {
            redirect_url: `${appUrl}/dashboard?upgraded=1`,
          },
        },
        relationships: {
          store: { data: { type: "stores", id: storeId } },
          variant: { data: { type: "variants", id: variantId } },
        },
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Lemon Squeezy checkout error ${res.status}: ${text}`);
  }

  const json = await res.json();
  return json.data.attributes.url as string;
}

export function verifyWebhookSignature(
  rawBody: string,
  signature: string | null
): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  const hmac = createHmac("sha256", secret);
  hmac.update(rawBody);
  const digest = hmac.digest("hex");

  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  } catch {
    return false;
  }
}
