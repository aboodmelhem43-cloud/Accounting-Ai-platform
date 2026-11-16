import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST — called after registration when a ref code is provided.
// Extends trial by 30 days for both the new business and the referrer.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let parsed: { businessId?: unknown; code?: unknown };
  try { parsed = await req.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  const businessId = typeof parsed.businessId === "string" ? parsed.businessId : "";
  const code = typeof parsed.code === "string" ? parsed.code.slice(0, 30) : "";

  if (!businessId || !code) {
    return NextResponse.json({ error: "businessId and code are required" }, { status: 400 });
  }

  if (session.user.businessId !== businessId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const normalizedCode = code.toUpperCase();

  // Find the referrer
  const referrer = await prisma.business.findUnique({
    where: { referralCode: normalizedCode },
    select: { id: true, trialEndsAt: true },
  });

  if (!referrer) {
    return NextResponse.json({ error: "Invalid referral code" }, { status: 404 });
  }

  if (referrer.id === businessId) {
    return NextResponse.json({ error: "Cannot use your own referral code" }, { status: 400 });
  }

  // Extend from current expiry or today, whichever is later
  function extendTrial(current: Date | null | undefined): Date {
    const base = current && current > new Date() ? current : new Date();
    const d = new Date(base);
    d.setDate(d.getDate() + 30);
    return d;
  }

  // Interactive transaction: re-read newBiz and check referredByCode inside the tx to prevent TOCTOU race.
  // Both concurrent requests will serialize on the row lock — only the first proceeds, the second sees referredByCode set.
  class AlreadyRedeemedError extends Error {}

  try {
    await prisma.$transaction(async (tx) => {
      const newBiz = await tx.business.findUnique({
        where: { id: businessId },
        select: { trialEndsAt: true, referredByCode: true },
      });

      if (newBiz?.referredByCode) {
        throw new AlreadyRedeemedError("Referral code already redeemed");
      }

      await tx.business.update({
        where: { id: businessId },
        data: {
          referredByCode: normalizedCode,
          trialEndsAt: extendTrial(newBiz?.trialEndsAt),
        },
      });

      await tx.business.update({
        where: { id: referrer.id },
        data: {
          trialEndsAt: extendTrial(referrer.trialEndsAt),
          referralCount: { increment: 1 },
        },
      });
    });
  } catch (err) {
    if (err instanceof AlreadyRedeemedError) {
      return NextResponse.json({ error: "Referral code already redeemed" }, { status: 409 });
    }
    throw err;
  }

  return NextResponse.json({ ok: true });
}
