import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const accounts = await prisma.account.findMany({
    where: { businessId: session.user.businessId },
    orderBy: [{ type: "asc" }, { code: "asc" }],
  });

  return NextResponse.json(accounts);
}
