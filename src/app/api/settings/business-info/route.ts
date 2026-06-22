import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const business = await prisma.business.findUnique({
    where: { id: session.user.businessId },
    select: { name: true, country: true, baseCurrency: true, taxNumber: true, address: true, phone: true },
  });

  return NextResponse.json(business ?? {});
}
