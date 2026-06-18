import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page") ?? 1);
  const limit = 20;

  const [entries, total] = await Promise.all([
    prisma.journalEntry.findMany({
      where: { businessId: session.user.businessId },
      orderBy: { date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        lines: { include: { account: true } },
        creator: { select: { name: true, email: true } },
      },
    }),
    prisma.journalEntry.count({ where: { businessId: session.user.businessId } }),
  ]);

  return NextResponse.json({ entries, total, page, pages: Math.ceil(total / limit) });
}
