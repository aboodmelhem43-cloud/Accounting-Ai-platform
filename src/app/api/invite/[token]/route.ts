import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

async function getValidInvite(token: string) {
  return prisma.invite.findFirst({
    where: { token, usedAt: null, expiresAt: { gt: new Date() } },
    include: { business: { select: { name: true, country: true } } },
  });
}

// GET — validate token and return invite info
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const invite = await getValidInvite(token);

  if (!invite) {
    return NextResponse.json({ error: "Invitation is invalid or has expired." }, { status: 404 });
  }

  return NextResponse.json({
    email: invite.email,
    businessName: invite.business.name,
    role: invite.role,
  });
}

// POST — accept invite: create user account
const acceptSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const invite = await getValidInvite(token);

  if (!invite) {
    return NextResponse.json({ error: "Invitation is invalid or has expired." }, { status: 404 });
  }

  const body = await req.json();
  const { name, password } = acceptSchema.parse(body);

  // Check email not already taken
  const existing = await prisma.user.findUnique({ where: { email: invite.email } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.$transaction([
    prisma.user.create({
      data: {
        businessId: invite.businessId,
        email: invite.email,
        passwordHash,
        name,
        role: invite.role,
      },
    }),
    prisma.invite.update({
      where: { id: invite.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return NextResponse.json({ ok: true, email: invite.email }, { status: 201 });
}
