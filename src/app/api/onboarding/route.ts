import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const step1Schema = z.object({
  step: z.literal(1),
  name: z.string().min(2),
  taxNumber: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
});

const step3Schema = z.object({
  step: z.literal(3),
});

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const body = await req.json();

  if (body.step === 1) {
    const parsed = step1Schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
    const { name, taxNumber, address, phone } = parsed.data;
    await prisma.business.update({
      where: { id: session.user.businessId },
      data: {
        name,
        taxNumber: taxNumber || null,
        address: address || null,
        phone: phone || null,
      },
    });
    return NextResponse.json({ ok: true });
  }

  if (body.step === 3) {
    await prisma.business.update({
      where: { id: session.user.businessId },
      data: { onboardingCompleted: true },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "خطوة غير صالحة" }, { status: 400 });
}
