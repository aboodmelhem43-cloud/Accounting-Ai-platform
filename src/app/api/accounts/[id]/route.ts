import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { id } = await params;

  const account = await prisma.account.findUnique({ where: { id } });
  if (!account) return NextResponse.json({ error: "الحساب غير موجود" }, { status: 404 });
  if (account.businessId !== session.user.businessId) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
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
