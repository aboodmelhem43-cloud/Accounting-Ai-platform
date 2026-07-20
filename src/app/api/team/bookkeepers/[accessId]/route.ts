import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE — owner revokes a bookkeeper's access to their business
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ accessId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Only the account owner can revoke access" }, { status: 403 });
  }

  const { accessId } = await params;
  const { businessId } = session.user;

  const access = await prisma.bookkeeperAccess.findFirst({
    where: { id: accessId, businessId },
  });

  if (!access) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.bookkeeperAccess.update({
    where: { id: accessId },
    data: { status: "REVOKED" },
  });

  return NextResponse.json({ ok: true });
}
