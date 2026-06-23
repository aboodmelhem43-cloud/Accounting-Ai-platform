import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

// One-shot endpoint to fix existing FREE_TRIAL accounts created under the old 10-day limit.
// Updates trialEndsAt to createdAt + 35 days for every FREE_TRIAL business where
// the corrected date is later than the current trialEndsAt.
// Protected by ADMIN_SECRET env variable, or a super-admin session.
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

  const businesses = await prisma.business.findMany({
    where: { plan: "FREE_TRIAL" },
    select: { id: true, name: true, createdAt: true, trialEndsAt: true },
  });

  const updated: string[] = [];
  for (const biz of businesses) {
    const correctedEnd = new Date(biz.createdAt);
    correctedEnd.setDate(correctedEnd.getDate() + 35);

    const current = biz.trialEndsAt ? new Date(biz.trialEndsAt) : new Date(0);
    if (correctedEnd > current) {
      await prisma.business.update({
        where: { id: biz.id },
        data: { trialEndsAt: correctedEnd },
      });
      updated.push(`${biz.name} → ${correctedEnd.toISOString().split("T")[0]}`);
    }
  }

  return NextResponse.json({
    updated: updated.length,
    businesses: updated,
  });
}
