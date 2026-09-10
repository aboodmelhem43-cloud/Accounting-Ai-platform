import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const profile = await prisma.instagramProfile.findUnique({
    where: { businessId: session.user.businessId },
    select: {
      id:             true,
      instagramId:    true,
      username:       true,
      profilePicUrl:  true,
      followersCount: true,
      tokenExpiresAt: true,
      createdAt:      true,
    },
  });

  return NextResponse.json({ profile });
}
