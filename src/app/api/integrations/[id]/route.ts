import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  status: z.enum(["ACTIVE", "PAUSED"]).optional(),
  webhookSecret: z.string().optional(),
  revenueAccountId: z.string().nullable().optional(),
  vatAccountId: z.string().nullable().optional(),
  cashAccountId: z.string().nullable().optional(),
});

async function getOwned(id: string, businessId: string) {
  return prisma.salesIntegration.findFirst({ where: { id, businessId } });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { id } = await params;
  const existing = await getOwned(id, session.user.businessId);
  if (!existing) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { name, status, webhookSecret, revenueAccountId, vatAccountId, cashAccountId } = parsed.data;

  const currentConfig = existing.config as Record<string, unknown>;
  const newConfig: Record<string, unknown> = webhookSecret !== undefined
    ? { ...currentConfig, webhookSecret }
    : { ...currentConfig };

  const updated = await prisma.salesIntegration.update({
    where: { id },
    data: {
      ...(name ? { name } : {}),
      ...(status ? { status } : {}),
      config: newConfig as Prisma.InputJsonValue,
      ...(revenueAccountId !== undefined ? { revenueAccountId } : {}),
      ...(vatAccountId !== undefined ? { vatAccountId } : {}),
      ...(cashAccountId !== undefined ? { cashAccountId } : {}),
    },
  });

  return NextResponse.json({ integration: { ...updated, hasSecret: !!(newConfig.webhookSecret) } });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { id } = await params;
  const existing = await getOwned(id, session.user.businessId);
  if (!existing) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  await prisma.salesIntegration.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
