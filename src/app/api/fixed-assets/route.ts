import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logAudit } from "@/lib/audit";

const createSchema = z.object({
  name: z.string().min(1),
  code: z.string().optional(),
  category: z.string().optional(),
  purchaseDate: z.string().min(1),
  purchaseCost: z.number().positive(),
  residualValue: z.number().min(0).default(0),
  usefulLifeMonths: z.number().int().positive(),
  depreciationMethod: z.enum(["STRAIGHT_LINE", "DECLINING_BALANCE"]).default("STRAIGHT_LINE"),
  assetAccountId: z.string().min(1),
  accumDeprecAccountId: z.string().min(1),
  deprecExpenseAccountId: z.string().min(1),
  notes: z.string().optional(),
});

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const assets = await prisma.fixedAsset.findMany({
    where: { businessId: session.user.businessId },
    orderBy: { createdAt: "desc" },
    include: { depreciationEntries: { orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }] } },
  });

  // Enrich with account names
  const accountIds = new Set(
    assets.flatMap((a) => [a.assetAccountId, a.accumDeprecAccountId, a.deprecExpenseAccountId])
  );
  const accounts = await prisma.account.findMany({
    where: { id: { in: [...accountIds] }, businessId: session.user.businessId },
    select: { id: true, code: true, name: true, nameAr: true },
  });
  const accountMap = Object.fromEntries(accounts.map((a) => [a.id, a]));

  const enriched = assets.map((asset) => {
    const totalDepreciation = asset.depreciationEntries.reduce((s, e) => s + Number(e.amount), 0);
    const bookValue = Number(asset.purchaseCost) - totalDepreciation;
    return {
      ...asset,
      totalDepreciation,
      bookValue,
      assetAccount: accountMap[asset.assetAccountId],
      accumDeprecAccount: accountMap[asset.accumDeprecAccountId],
      deprecExpenseAccount: accountMap[asset.deprecExpenseAccountId],
    };
  });

  return NextResponse.json({ assets: enriched });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 }); }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "بيانات غير صالحة", details: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;

  // Validate accounts
  const accountIds = [data.assetAccountId, data.accumDeprecAccountId, data.deprecExpenseAccountId];
  const validAccounts = await prisma.account.findMany({
    where: { id: { in: accountIds }, businessId: session.user.businessId },
    select: { id: true },
  });
  if (validAccounts.length !== accountIds.length) {
    return NextResponse.json({ error: "أحد الحسابات غير صالح" }, { status: 400 });
  }

  const asset = await prisma.fixedAsset.create({
    data: {
      businessId: session.user.businessId,
      name: data.name,
      code: data.code,
      category: data.category,
      purchaseDate: new Date(data.purchaseDate),
      purchaseCost: data.purchaseCost,
      residualValue: data.residualValue,
      usefulLifeMonths: data.usefulLifeMonths,
      depreciationMethod: data.depreciationMethod,
      assetAccountId: data.assetAccountId,
      accumDeprecAccountId: data.accumDeprecAccountId,
      deprecExpenseAccountId: data.deprecExpenseAccountId,
      notes: data.notes,
    },
  });

  await logAudit({
    businessId: session.user.businessId,
    userId: session.user.id,
    userName: session.user.name ?? undefined,
    userEmail: session.user.email,
    action: "CREATE",
    entity: "FixedAsset",
    entityId: asset.id,
    description: `إضافة أصل ثابت: ${asset.name}`,
  });

  return NextResponse.json({ asset }, { status: 201 });
}
