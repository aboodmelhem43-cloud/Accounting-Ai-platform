import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

const LIMIT = 20;

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !isSuperAdmin(session.user.email)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const country = searchParams.get("country") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const skip = (page - 1) * LIMIT;

  const where = {
    ...(search ? {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { users: { some: { email: { contains: search, mode: "insensitive" as const } } } },
      ],
    } : {}),
    ...(country ? { country } : {}),
  };

  const [businesses, total, countryStats] = await Promise.all([
    prisma.business.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: LIMIT,
      select: {
        id: true,
        name: true,
        country: true,
        baseCurrency: true,
        plan: true,
        trialEndsAt: true,
        createdAt: true,
        onboardingCompleted: true,
        users: { select: { email: true, role: true }, take: 1 },
        _count: { select: { journalEntries: true, invoices: true } },
      },
    }),
    prisma.business.count({ where }),
    prisma.business.groupBy({
      by: ["country"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    }),
  ]);

  return NextResponse.json({
    businesses,
    total,
    page,
    pages: Math.ceil(total / LIMIT),
    countryStats,
  });
}
