import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyWebhookSignature,
  normalizePayload,
  getSignatureHeader,
  type Platform,
} from "@/lib/integrations";
import { mapSaleToJournalEntry } from "@/lib/ai/map-sale";

const SUPPORTED_PLATFORMS: Platform[] = ["shopify", "salla", "zid", "foodics", "generic"];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform: rawPlatform } = await params;
  const platform = rawPlatform as Platform;

  if (!SUPPORTED_PLATFORMS.includes(platform)) {
    return NextResponse.json({ error: "Unsupported platform" }, { status: 400 });
  }

  // Integration ID must be passed as a query param so we can look up secrets
  const integrationId = req.nextUrl.searchParams.get("integrationId");
  if (!integrationId) {
    return NextResponse.json({ error: "integrationId query param required" }, { status: 400 });
  }

  const integration = await prisma.salesIntegration.findUnique({
    where: { id: integrationId },
    include: {
      revenueAccount: { select: { id: true } },
      vatAccount:     { select: { id: true } },
      cashAccount:    { select: { id: true } },
    },
  });

  if (!integration || integration.platform !== platform) {
    return NextResponse.json({ error: "Integration not found" }, { status: 404 });
  }

  if (integration.status === "PAUSED") {
    return NextResponse.json({ ok: true, skipped: "integration paused" });
  }

  // Read raw body for signature verification
  const rawBody = await req.text();
  const config = integration.config as Record<string, string>;
  const secret = config.webhookSecret ?? "";

  if (secret) {
    const signatureHeader = getSignatureHeader(platform);
    const signature = req.headers.get(signatureHeader) ?? "";
    const { valid, reason } = verifyWebhookSignature(platform, rawBody, signature, secret);
    if (!valid) {
      return NextResponse.json({ error: reason ?? "Signature mismatch" }, { status: 401 });
    }
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Normalize the platform-specific payload
  const sale = normalizePayload(platform, payload);

  // Skip events that aren't completed/paid sales (Shopify/Salla send many event types)
  const financialStatus = (payload.financial_status as string | undefined)?.toLowerCase();
  if (financialStatus && !["paid", "partially_paid"].includes(financialStatus)) {
    return NextResponse.json({ ok: true, skipped: "not a paid order" });
  }

  // Idempotency — skip if already processed
  const existing = await prisma.salesEvent.findUnique({
    where: { integrationId_externalId: { integrationId, externalId: sale.externalId } },
  });
  if (existing) {
    return NextResponse.json({ ok: true, skipped: "duplicate", eventId: existing.id });
  }

  // Fetch chart of accounts for AI mapping
  const accounts = await prisma.account.findMany({
    where: { businessId: integration.businessId },
    select: { id: true, code: true, name: true, nameAr: true, type: true },
  });

  // AI suggests the journal entry (but does NOT post it — user confirms first)
  let suggestedEntry = null;
  try {
    suggestedEntry = await mapSaleToJournalEntry(
      sale,
      accounts.map((a) => ({ ...a, type: a.type.toString() })),
      integration.business?.baseCurrency ?? sale.currency,
      {
        revenueAccountId: integration.revenueAccountId,
        vatAccountId: integration.vatAccountId,
        cashAccountId: integration.cashAccountId,
      }
    );
  } catch {
    // Log but don't fail — user can still approve with manual mapping
    console.error("AI mapping failed for sale", sale.orderNumber);
  }

  const event = await prisma.salesEvent.create({
    data: {
      integrationId,
      businessId: integration.businessId,
      platform,
      externalId: sale.externalId,
      orderNumber: sale.orderNumber,
      occurredAt: sale.occurredAt,
      subtotal: sale.subtotal,
      vatAmount: sale.vatAmount,
      total: sale.total,
      currency: sale.currency,
      paymentMethod: sale.paymentMethod,
      customerName: sale.customerName ?? null,
      lineItems: sale.lineItems,
      rawData: sale.rawData,
      suggestedEntry: suggestedEntry ?? undefined,
    },
  });

  return NextResponse.json({ ok: true, eventId: event.id });
}
