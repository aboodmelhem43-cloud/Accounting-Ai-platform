import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const messages = await prisma.chatMessage.findMany({
    where: { businessId: session.user.businessId },
    orderBy: { createdAt: "asc" },
    take: 100,
    select: { id: true, role: true, content: true, createdAt: true },
  });

  return NextResponse.json({ messages });
}

export async function DELETE(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  await prisma.chatMessage.deleteMany({
    where: { businessId: session.user.businessId },
  });

  return NextResponse.json({ ok: true });
}
