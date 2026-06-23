import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/admin";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session || !isSuperAdmin(session.user.email)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  const variantStarter = process.env.LEMONSQUEEZY_VARIANT_STARTER;
  const variantPro = process.env.LEMONSQUEEZY_VARIANT_PRO;
  const variantBusiness = process.env.LEMONSQUEEZY_VARIANT_BUSINESS;
  const webhookSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

  const keyPreview = apiKey ? apiKey.slice(0, 12) + "..." : "NOT SET";

  if (!apiKey) {
    return NextResponse.json({ ok: false, step: "env", keyPreview, error: "LEMONSQUEEZY_API_KEY is not set" });
  }

  // Test API connection + get store
  let storeId: string | null = null;
  try {
    const res = await fetch("https://api.lemonsqueezy.com/v1/stores", {
      headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/vnd.api+json" },
    });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ ok: false, step: "api_auth", keyPreview, error: `API returned ${res.status}: ${text.slice(0, 200)}` });
    }
    const json = await res.json();
    storeId = json.data?.[0]?.id ? String(json.data[0].id) : null;
    if (!storeId) {
      return NextResponse.json({ ok: false, step: "store", keyPreview, error: "No store found for this API key" });
    }
  } catch (err) {
    return NextResponse.json({ ok: false, step: "api_auth", keyPreview, error: err instanceof Error ? err.message : String(err) });
  }

  return NextResponse.json({
    ok: true,
    keyPreview,
    storeId,
    variants: {
      STARTER: variantStarter ?? "NOT SET",
      PRO: variantPro ?? "NOT SET",
      BUSINESS: variantBusiness ?? "NOT SET",
    },
    webhookSecret: webhookSecret ? webhookSecret.slice(0, 6) + "..." : "NOT SET",
  });
}
