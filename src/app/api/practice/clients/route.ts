import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — list all client businesses managed by this practice
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Only the practice owner can manage clients" }, { status: 403 });
  }

  const practiceId = session.user.primaryBusinessId ?? session.user.businessId;

  const clients = await prisma.business.findMany({
    where: { managedByBusinessId: practiceId },
    select: {
      id: true, name: true, country: true, baseCurrency: true, plan: true,
      onboardingCompleted: true, taxNumber: true, createdAt: true,
      lsCurrentPeriodEnd: true,
      _count: { select: { users: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ clients });
}

// POST — create a new client business under this practice
const createClientSchema = z.object({
  name: z.string().min(2, "Business name must be at least 2 characters"),
  country: z.string().length(2).default("EG"),
  baseCurrency: z.string().min(3).max(3).default("EGP"),
  taxNumber: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Only the practice owner can add clients" }, { status: 403 });
  }

  const practiceId = session.user.primaryBusinessId ?? session.user.businessId;
  const body = await req.json();
  const { name, country, baseCurrency, taxNumber } = createClientSchema.parse(body);

  const client = await prisma.business.create({
    data: {
      name,
      country,
      baseCurrency,
      taxNumber,
      managedByBusinessId: practiceId,
      onboardingCompleted: true, // practice manages onboarding externally
      plan: "FREE_TRIAL",
    },
    select: {
      id: true, name: true, country: true, baseCurrency: true, plan: true, createdAt: true,
    },
  });

  return NextResponse.json({ client }, { status: 201 });
}
