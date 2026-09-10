import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.instagramHashtagSet.findFirst({
    where: { id, businessId: session.user.businessId },
  });
  if (!existing) return NextResponse.json({ error: "not_found" }, { status: 404 });

  await prisma.instagramHashtagSet.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
