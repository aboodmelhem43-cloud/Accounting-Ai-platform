import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";

// GET — returns this business's referral code, link, and count
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { businessId } = session.user;

  let business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { referralCode: true, referralCount: true },
  });

  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Auto-generate a referral code if one doesn't exist yet
  if (!business.referralCode) {
    const code = nanoid(8).toUpperCase();
    business = await prisma.business.update({
      where: { id: businessId },
      data: { referralCode: code },
      select: { referralCode: true, referralCount: true },
    });
  }

  const appUrl = process.env.NEXTAUTH_URL ?? "https://mohasabai.com";
  return NextResponse.json({
    code: business.referralCode,
    link: `${appUrl}/register?ref=${business.referralCode}`,
    count: business.referralCount,
  });
}
