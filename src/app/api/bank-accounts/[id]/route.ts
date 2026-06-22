import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateBankAccountSchema = z.object({
  name: z.string().min(1).optional(),
  bankName: z.string().min(1).optional(),
  accountNumber: z.string().optional().nullable(),
  iban: z.string().optional().nullable(),
  currency: z.string().optional(),
  openingBalance: z.number().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.bankAccount.findFirst({
    where: { id, businessId: session.user.businessId },
  });
  if (!existing) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const parsed = updateBankAccountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة", details: parsed.error.flatten() }, { status: 400 });
  }

  const account = await prisma.bankAccount.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json(account);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.bankAccount.findFirst({
    where: { id, businessId: session.user.businessId },
  });
  if (!existing) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  await prisma.bankAccount.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
