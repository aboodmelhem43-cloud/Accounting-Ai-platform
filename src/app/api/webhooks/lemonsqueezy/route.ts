import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature, variantToPlan } from "@/lib/lemonsqueezy";
import type { PlanId } from "@/lib/plans";

// Lemon Squeezy sends webhook events for subscription lifecycle changes.
// We store the raw body as text to verify the HMAC signature before parsing.
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    console.error("[webhook/ls] invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventName = payload.meta && (payload.meta as Record<string, unknown>).event_name as string;
  const data = payload.data as Record<string, unknown> | undefined;
  const meta = payload.meta as Record<string, unknown> | undefined;

  if (!data || !eventName) {
    return NextResponse.json({ ok: true });
  }

  const attrs = data.attributes as Record<string, unknown>;
  const subscriptionId = String(data.id);
  const customerId = String(attrs.customer_id);
  const variantId = String(attrs.variant_id);
  const status = attrs.status as string;
  const renewsAt = attrs.renews_at as string | null;

  // Extract the businessId we passed in checkout_data.custom
  const customData = meta?.custom_data as Record<string, string> | undefined;
  const businessId = customData?.business_id;

  if (!businessId) {
    console.error("[webhook/ls] missing business_id in custom_data", { eventName });
    return NextResponse.json({ ok: true });
  }

  console.log(`[webhook/ls] ${eventName} — business ${businessId}, variant ${variantId}, status ${status}`);

  try {
    if (eventName === "subscription_created" || eventName === "subscription_updated") {
      const plan = variantToPlan(variantId);
      if (!plan) {
        console.error(`[webhook/ls] unknown variant ${variantId}`);
        return NextResponse.json({ ok: true });
      }

      const activePlans: PlanId[] = ["STARTER", "PRO", "BUSINESS"];
      const isActive = status === "active" || status === "on_trial";

      await prisma.business.update({
        where: { id: businessId },
        data: {
          plan: isActive && activePlans.includes(plan) ? plan : "FREE_TRIAL",
          lsSubscriptionId: subscriptionId,
          lsCustomerId: customerId,
          lsVariantId: variantId,
          lsCurrentPeriodEnd: renewsAt ? new Date(renewsAt) : null,
        },
      });
    }

    if (eventName === "subscription_cancelled" || eventName === "subscription_expired") {
      // Downgrade to FREE_TRIAL when subscription ends
      await prisma.business.updateMany({
        where: { lsSubscriptionId: subscriptionId },
        data: {
          plan: "FREE_TRIAL",
          lsSubscriptionId: null,
          lsCustomerId: null,
          lsVariantId: null,
          lsCurrentPeriodEnd: null,
        },
      });
    }

    if (eventName === "subscription_payment_success") {
      // Renew — update period end date
      await prisma.business.updateMany({
        where: { lsSubscriptionId: subscriptionId },
        data: {
          lsCurrentPeriodEnd: renewsAt ? new Date(renewsAt) : null,
        },
      });
    }
  } catch (err) {
    console.error("[webhook/ls] db error:", err);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
