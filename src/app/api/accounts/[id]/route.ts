import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  nameAr: z.string().optional(),
  description: z.string().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { id } = await params;

  const account = await prisma.account.findUnique({
    where: { id, businessId: session.user.businessId },
  });
  if (!account) return NextResponse.json({ error: "الحساب غير موجود" }, { status: 404 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const updated = await prisma.account.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { id } = await params;

  const account = await prisma.account.findUnique({ where: { id, businessId: session.user.businessId } });
  if (!account) return NextResponse.json({ error: "الحساب غير موجود" }, { status: 404 });
  if (account.isSystem) {
    return NextResponse.json({ error: "لا يمكن حذف حسابات النظام الافتراضية" }, { status: 403 });
  }

  // منع الحذف إذا كان الحساب مستخدماً في قيود
  const usedInJournal = await prisma.journalLine.findFirst({ where: { accountId: id } });
  if (usedInJournal) {
    return NextResponse.json(
      { error: "لا يمكن حذف هذا الحساب لأنه مستخدم في قيود محاسبية" },
      { status: 409 }
    );
  }

  await prisma.account.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
