import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function isSuperAdmin(email: string): boolean {
  const admins = (process.env.SUPER_ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase());
  return admins.includes(email.toLowerCase());
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  if (!isSuperAdmin(session.user.email)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = 30;
  const skip = (page - 1) * limit;

  const where = search
    ? { OR: [{ name: { contains: search, mode: "insensitive" as const } }, { users: { some: { email: { contains: search, mode: "insensitive" as const } } } }] }
    : {};

  const [businesses, total] = await Promise.all([
    prisma.business.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
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
  ]);

  return NextResponse.json({ businesses, total, page, pages: Math.ceil(total / limit) });
}
