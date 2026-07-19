import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logAudit } from "@/lib/audit";

const patchSchema = z.object({
  status: z.enum(["ACTIVE", "DISPOSED", "FULLY_DEPRECIATED"]).optional(),
  disposedAt: z.string().optional(),
  notes: z.string().optional(),
  name: z.string().min(1).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { id } = await params;
  const asset = await prisma.fixedAsset.findUnique({
    where: { id },
    include: {
      depreciationEntries: {
        orderBy: [{ periodYear: "asc" }, { periodMonth: "asc" }],
      },
    },
  });

  if (!asset) return NextResponse.json({ error: "الأصل غير موجود" }, { status: 404 });
  if (asset.businessId !== session.user.businessId) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

  return NextResponse.json({ asset });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { id } = await params;
  const asset = await prisma.fixedAsset.findUnique({ where: { id }, select: { businessId: true } });
  if (!asset) return NextResponse.json({ error: "الأصل غير موجود" }, { status: 404 });
  if (asset.businessId !== session.user.businessId) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 }); }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });

  const updated = await prisma.fixedAsset.update({
    where: { id },
    data: {
      ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
      ...(parsed.data.disposedAt ? { disposedAt: new Date(parsed.data.disposedAt) } : {}),
      ...(parsed.data.notes !== undefined ? { notes: parsed.data.notes } : {}),
      ...(parsed.data.name ? { name: parsed.data.name } : {}),
    },
  });

  await logAudit({
    businessId: session.user.businessId,
    userId: session.user.id,
    action: "UPDATE",
    entity: "FixedAsset",
    entityId: id,
    description: `تحديث الأصل الثابت: ${updated.name}`,
  });

  return NextResponse.json({ asset: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { id } = await params;
  const asset = await prisma.fixedAsset.findUnique({ where: { id }, select: { businessId: true, name: true } });
  if (!asset) return NextResponse.json({ error: "الأصل غير موجود" }, { status: 404 });
  if (asset.businessId !== session.user.businessId) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

  await prisma.fixedAsset.delete({ where: { id } });

  await logAudit({
    businessId: session.user.businessId,
    userId: session.user.id,
    action: "DELETE",
    entity: "FixedAsset",
    entityId: id,
    description: `حذف الأصل الثابت: ${asset.name}`,
  });

  return NextResponse.json({ ok: true });
}
