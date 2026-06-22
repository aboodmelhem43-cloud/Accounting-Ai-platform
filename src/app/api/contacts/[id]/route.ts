import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateContactSchema = z.object({
  type: z.enum(["CUSTOMER", "VENDOR"]).optional(),
  name: z.string().min(1).optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  taxNumber: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.contact.findFirst({
    where: { id, businessId: session.user.businessId },
  });
  if (!existing) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const parsed = updateContactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة", details: parsed.error.flatten() }, { status: 400 });
  }

  const contact = await prisma.contact.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json(contact);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.contact.findFirst({
    where: { id, businessId: session.user.businessId },
  });
  if (!existing) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  await prisma.contact.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
