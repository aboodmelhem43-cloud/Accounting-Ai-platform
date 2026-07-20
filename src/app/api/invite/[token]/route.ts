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

  // For bookkeeper invites, check if the invitee already has an account
  const existingUser = await prisma.user.findUnique({
    where: { email: invite.email },
    select: { id: true, name: true },
  });

  return NextResponse.json({
    email: invite.email,
    businessName: invite.business.name,
    role: invite.role,
    type: invite.type,
    hasAccount: !!existingUser,
    existingName: existingUser?.name ?? null,
  });
}

// POST — accept invite
const acceptSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
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

  if (invite.type === "BOOKKEEPER") {
    // Bookkeeper invite: existing user just accepts access; new user also creates account
    const existingUser = await prisma.user.findUnique({ where: { email: invite.email } });

    if (existingUser) {
      // Grant access to this business
      await prisma.$transaction([
        prisma.bookkeeperAccess.upsert({
          where: { userId_businessId: { userId: existingUser.id, businessId: invite.businessId } },
          create: { userId: existingUser.id, businessId: invite.businessId, status: "ACTIVE" },
          update: { status: "ACTIVE" },
        }),
        prisma.invite.update({
          where: { id: invite.id },
          data: { usedAt: new Date() },
        }),
      ]);
      return NextResponse.json({ ok: true, email: invite.email }, { status: 200 });
    }

    // New user — need name + password to create account
    const { name, password } = acceptSchema.parse(body);
    if (!name || !password) {
      return NextResponse.json(
        { error: "Name and password are required for new accounts." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Create a profile business for the bookkeeper
    await prisma.$transaction(async (tx) => {
      const profileBiz = await tx.business.create({
        data: {
          name: `${name} (Bookkeeper)`,
          country: invite.business.country,
          baseCurrency: "EGP",
          onboardingCompleted: true,
        },
      });
      const newUser = await tx.user.create({
        data: {
          businessId: profileBiz.id,
          email: invite.email,
          passwordHash,
          name,
          role: "OWNER",
        },
      });
      await tx.bookkeeperAccess.create({
        data: { userId: newUser.id, businessId: invite.businessId, status: "ACTIVE" },
      });
      await tx.invite.update({
        where: { id: invite.id },
        data: { usedAt: new Date() },
      });
    });

    return NextResponse.json({ ok: true, email: invite.email }, { status: 201 });
  }

  // TEAM invite — original flow
  const { name, password } = acceptSchema.parse(body);
  if (!name || !password) {
    return NextResponse.json(
      { error: "Name and password are required." },
      { status: 400 }
    );
  }

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
