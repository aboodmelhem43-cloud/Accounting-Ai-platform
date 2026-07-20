import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const patchSchema = z.object({
  isActive: z.boolean().optional(),
  nextRunDate: z.string().optional(),
  endDate: z.string().optional().nullable(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { id } = await params;
  const template = await prisma.recurringTemplate.findUnique({ where: { id }, select: { businessId: true } });
  if (!template) return NextResponse.json({ error: "القالب غير موجود" }, { status: 404 });
  if (template.businessId !== session.user.businessId) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 }); }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });

  const updated = await prisma.recurringTemplate.update({
    where: { id },
    data: {
      ...(parsed.data.isActive !== undefined ? { isActive: parsed.data.isActive } : {}),
      ...(parsed.data.nextRunDate ? { nextRunDate: new Date(parsed.data.nextRunDate) } : {}),
      ...(parsed.data.endDate !== undefined ? { endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null } : {}),
      ...(parsed.data.name ? { name: parsed.data.name } : {}),
      ...(parsed.data.description !== undefined ? { description: parsed.data.description } : {}),
    },
  });

  return NextResponse.json({ template: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { id } = await params;
  const template = await prisma.recurringTemplate.findUnique({ where: { id }, select: { businessId: true } });
  if (!template) return NextResponse.json({ error: "القالب غير موجود" }, { status: 404 });
  if (template.businessId !== session.user.businessId) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

  await prisma.recurringTemplate.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
