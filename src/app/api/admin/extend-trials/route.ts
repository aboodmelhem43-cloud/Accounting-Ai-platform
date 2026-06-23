import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret");
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    // Also allow super-admin session (belt-and-suspenders)
    const { getServerSession } = await import("next-auth");
    const { authOptions } = await import("@/lib/auth");
    const session = await getServerSession(authOptions);
    if (!session || !isSuperAdmin(session.user.email)) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }
  }

  // Extend all FREE_TRIAL businesses to 35 days from their createdAt
  const businesses = await prisma.business.findMany({
    where: { plan: "FREE_TRIAL" },
    select: { id: true, createdAt: true, trialEndsAt: true },
  });

  let updated = 0;
  for (const b of businesses) {
    const target35 = new Date(b.createdAt.getTime() + 35 * 24 * 60 * 60 * 1000);
    const current = b.trialEndsAt;
    if (!current || current < target35) {
      await prisma.business.update({
        where: { id: b.id },
        data: { trialEndsAt: target35 },
      });
      updated++;
    }
  }

  return NextResponse.json({ updated });
}
