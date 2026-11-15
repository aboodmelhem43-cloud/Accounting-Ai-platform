import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const ALLOWED_STATUSES = ["PENDING", "APPROVED", "REJECTED", "ALL"] as const;
  type AllowedStatus = typeof ALLOWED_STATUSES[number];

  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status") ?? "PENDING";
  if (!ALLOWED_STATUSES.includes(statusParam as AllowedStatus)) {
    return NextResponse.json({ error: "حالة غير صالحة" }, { status: 400 });
  }
  const status = statusParam as AllowedStatus;
  const pageParam = Number(searchParams.get("page") ?? 1);
  const page = Number.isFinite(pageParam) && pageParam >= 1 ? Math.min(Math.floor(pageParam), 10000) : 1;
  const limit = 20;

  const where = {
    businessId: session.user.businessId,
    status: status === "ALL" ? undefined : status,
  };

  const [events, total] = await Promise.all([
    prisma.salesEvent.findMany({
      where,
      orderBy: { occurredAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        integration: { select: { id: true, name: true, platform: true } },
        journalEntry: { select: { id: true, status: true } },
      },
    }),
    prisma.salesEvent.count({ where }),
  ]);

  return NextResponse.json({ events, total, page, pages: Math.ceil(total / limit) });
}
