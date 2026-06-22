import { createHmac, timingSafeEqual } from "crypto";
import type { PlanId } from "./plans";

const LS_API_KEY = process.env.LEMONSQUEEZY_API_KEY;
const LS_STORE_ID = process.env.LEMONSQUEEZY_STORE_ID;

export const PLAN_VARIANT_IDS: Record<string, PlanId> = {};

export function variantToPlan(variantId: string): PlanId | null {
  const map: Record<string, PlanId> = {
    [process.env.LEMONSQUEEZY_VARIANT_STARTER ?? ""]: "STARTER",
    [process.env.LEMONSQUEEZY_VARIANT_PRO ?? ""]: "PRO",
    [process.env.LEMONSQUEEZY_VARIANT_BUSINESS ?? ""]: "BUSINESS",
  };
  return map[variantId] ?? null;
}

export function planToVariantId(plan: PlanId): string | null {
  const map: Record<string, string | undefined> = {
    STARTER: process.env.LEMONSQUEEZY_VARIANT_STARTER,
    PRO: process.env.LEMONSQUEEZY_VARIANT_PRO,
    BUSINESS: process.env.LEMONSQUEEZY_VARIANT_BUSINESS,
  };
  return map[plan] ?? null;
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
  if (!LS_API_KEY || !LS_STORE_ID) {
    throw new Error("Lemon Squeezy credentials not configured");
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://mohasabai.com";

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
          store: { data: { type: "stores", id: LS_STORE_ID } },
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
