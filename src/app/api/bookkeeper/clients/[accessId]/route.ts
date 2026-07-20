import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE — revoke bookkeeper access (from a business owner) OR self-remove
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ accessId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { accessId } = await params;
  const userId = session.user.id;
  const businessId = session.user.businessId;

  const access = await prisma.bookkeeperAccess.findUnique({
    where: { id: accessId },
  });

  if (!access) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Allow: the bookkeeper themselves, OR the business owner
  const isOwnAccess = access.userId === userId;
  const isBusinessOwner = access.businessId === businessId && session.user.role === "OWNER";

  if (!isOwnAccess && !isBusinessOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.bookkeeperAccess.update({
    where: { id: accessId },
    data: { status: "REVOKED" },
  });

  return NextResponse.json({ ok: true });
}
