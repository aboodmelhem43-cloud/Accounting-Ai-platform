import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ inviteId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Only the owner can cancel invitations" }, { status: 403 });
  }

  const { inviteId } = await params;

  const invite = await prisma.invite.findFirst({
    where: { id: inviteId, businessId: session.user.businessId },
  });

  if (!invite) return NextResponse.json({ error: "Invitation not found" }, { status: 404 });

  await prisma.invite.delete({ where: { id: inviteId } });
  return NextResponse.json({ ok: true });
}
