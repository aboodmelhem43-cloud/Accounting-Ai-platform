import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { id } = await params;

  const entry = await prisma.journalEntry.findFirst({
    where: { id, businessId: session.user.businessId },
  });

  if (!entry) return NextResponse.json({ error: "القيد غير موجود" }, { status: 404 });
  if (entry.status === "POSTED") return NextResponse.json({ error: "القيد مُرحَّل بالفعل" }, { status: 400 });

  const updated = await prisma.journalEntry.update({
    where: { id },
    data: { status: "POSTED" },
  });

  return NextResponse.json(updated);
}
