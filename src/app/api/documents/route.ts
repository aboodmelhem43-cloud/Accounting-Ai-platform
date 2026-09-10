import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);

  const [documents, total] = await Promise.all([
    prisma.storedDocument.findMany({
      where: { businessId: session.user.businessId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.storedDocument.count({ where: { businessId: session.user.businessId } }),
  ]);

  return NextResponse.json({
    documents,
    total,
    page,
    pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  });
}
