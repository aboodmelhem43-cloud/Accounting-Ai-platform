import type { NormalizedSale, Platform, VerifyResult } from "./types";
import { verifyShopifySignature, normalizeShopifyOrder } from "./shopify";
import { verifySallaSignature, normalizeSallaOrder } from "./salla";
import { verifyZidSignature, normalizeZidOrder } from "./zid";
import { verifyFoodicsSignature, normalizeFoodicsOrder } from "./foodics";
import { verifyGenericSignature, normalizeGenericPayload } from "./generic";

export type { NormalizedSale, Platform, VerifyResult };

export const PLATFORM_LABELS: Record<Platform, string> = {
  shopify: "Shopify",
  salla: "سلة (Salla)",
  zid: "زد (Zid)",
  foodics: "Foodics",
  generic: "Generic Webhook",
};

export const PLATFORM_ICONS: Record<Platform, string> = {
  shopify: "🛍️",
  salla: "🛒",
  zid: "⚡",
  foodics: "🍽️",
  generic: "🔗",
};

export function verifyWebhookSignature(
  platform: Platform,
  rawBody: string,
  headerSignature: string,
  secret: string
): VerifyResult {
  switch (platform) {
    case "shopify": return verifyShopifySignature(rawBody, headerSignature, secret);
    case "salla":   return verifySallaSignature(rawBody, headerSignature, secret);
    case "zid":     return verifyZidSignature(rawBody, headerSignature, secret);
    case "foodics": return verifyFoodicsSignature(rawBody, headerSignature, secret);
    case "generic": return verifyGenericSignature(rawBody, headerSignature, secret);
  }
}

export function normalizePayload(
  platform: Platform,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: Record<string, any>
): NormalizedSale {
  switch (platform) {
    case "shopify": return normalizeShopifyOrder(payload);
    case "salla":   return normalizeSallaOrder(payload);
    case "zid":     return normalizeZidOrder(payload);
    case "foodics": return normalizeFoodicsOrder(payload);
    case "generic": return normalizeGenericPayload(payload);
  }
}

export function getSignatureHeader(platform: Platform): string {
  switch (platform) {
    case "shopify": return "x-shopify-hmac-sha256";
    case "salla":   return "x-salla-signature";
    case "zid":     return "x-zid-signature";
    case "foodics": return "x-foodics-signature";
    case "generic": return "x-webhook-signature";
  }
}
