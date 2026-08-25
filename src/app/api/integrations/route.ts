import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  platform: z.enum(["shopify", "salla", "zid", "foodics", "generic"]),
  name: z.string().min(1).max(100),
  webhookSecret: z.string().optional(),
  revenueAccountId: z.string().optional(),
  vatAccountId: z.string().optional(),
  cashAccountId: z.string().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const integrations = await prisma.salesIntegration.findMany({
    where: { businessId: session.user.businessId },
    include: {
      revenueAccount: { select: { id: true, name: true, code: true } },
      vatAccount:     { select: { id: true, name: true, code: true } },
      cashAccount:    { select: { id: true, name: true, code: true } },
      _count:         { select: { salesEvents: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Strip secrets from config before sending to client
  const safe = integrations.map(({ config, ...rest }) => {
    const cfg = config as Record<string, unknown>;
    return { ...rest, hasSecret: !!cfg.webhookSecret };
  });

  return NextResponse.json({ integrations: safe });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { platform, name, webhookSecret, revenueAccountId, vatAccountId, cashAccountId } =
    parsed.data;

  // Validate account IDs belong to this business
  const accountIds = [revenueAccountId, vatAccountId, cashAccountId].filter(Boolean) as string[];
  if (accountIds.length > 0) {
    const found = await prisma.account.findMany({
      where: { id: { in: accountIds }, businessId: session.user.businessId },
      select: { id: true },
    });
    if (found.length !== accountIds.length) {
      return NextResponse.json({ error: "حساب غير صالح" }, { status: 400 });
    }
  }

  const integration = await prisma.salesIntegration.create({
    data: {
      businessId: session.user.businessId,
      platform,
      name,
      config: { webhookSecret: webhookSecret ?? "" },
      revenueAccountId: revenueAccountId ?? null,
      vatAccountId:     vatAccountId ?? null,
      cashAccountId:    cashAccountId ?? null,
    },
  });

  return NextResponse.json({ integration: { ...integration, hasSecret: !!webhookSecret } });
}
