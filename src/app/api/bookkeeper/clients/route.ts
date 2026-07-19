import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — list businesses this user has bookkeeper access to
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  const accesses = await prisma.bookkeeperAccess.findMany({
    where: { userId, status: "ACTIVE" },
    include: {
      business: {
        select: {
          id: true, name: true, country: true, baseCurrency: true, plan: true,
        },
      },
    },
    orderBy: { grantedAt: "asc" },
  });

  return NextResponse.json({
    clients: accesses.map((a) => ({
      accessId: a.id,
      businessId: a.business.id,
      businessName: a.business.name,
      country: a.business.country,
      currency: a.business.baseCurrency,
      plan: a.business.plan,
      grantedAt: a.grantedAt,
    })),
  });
}
