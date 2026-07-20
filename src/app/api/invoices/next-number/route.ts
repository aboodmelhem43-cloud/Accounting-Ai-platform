import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — peek at next number without consuming it
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const biz = await prisma.business.findUnique({
    where: { id: session.user.businessId },
    select: { invoiceNumberPrefix: true, invoiceNumberSeed: true },
  });

  const prefix = biz?.invoiceNumberPrefix ?? "INV";
  const nextSeed = (biz?.invoiceNumberSeed ?? 0) + 1;
  const number = `${prefix}-${String(nextSeed).padStart(4, "0")}`;
  return NextResponse.json({ number, prefix, nextSeed });
}

// POST — atomically increment seed and return the reserved number
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const biz = await prisma.business.update({
    where: { id: session.user.businessId },
    data: { invoiceNumberSeed: { increment: 1 } },
    select: { invoiceNumberPrefix: true, invoiceNumberSeed: true },
  });

  const number = `${biz.invoiceNumberPrefix}-${String(biz.invoiceNumberSeed).padStart(4, "0")}`;
  return NextResponse.json({ number });
}
