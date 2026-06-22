import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createBankAccountSchema = z.object({
  name: z.string().min(1),
  bankName: z.string().min(1),
  accountNumber: z.string().optional().nullable(),
  iban: z.string().optional().nullable(),
  currency: z.string().default("EGP"),
  openingBalance: z.number().default(0),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const accounts = await prisma.bankAccount.findMany({
    where: { businessId: session.user.businessId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(accounts);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const parsed = createBankAccountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة", details: parsed.error.flatten() }, { status: 400 });
  }

  const account = await prisma.bankAccount.create({
    data: {
      businessId: session.user.businessId,
      ...parsed.data,
    },
  });

  return NextResponse.json(account, { status: 201 });
}
