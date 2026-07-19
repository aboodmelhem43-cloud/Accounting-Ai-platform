import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PLANS } from "@/lib/plans";
import { sendInviteEmail } from "@/lib/email";
import type { PlanId } from "@/lib/plans";

// GET — list team members, pending invites, and external bookkeepers
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { businessId } = session.user;
  const plan = session.user.plan as PlanId;

  const [users, invites, bookkeeperAccesses, bookkeeperInvites] = await Promise.all([
    prisma.user.findMany({
      where: { businessId },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.invite.findMany({
      where: { businessId, type: "TEAM", usedAt: null, expiresAt: { gt: new Date() } },
      select: { id: true, email: true, role: true, expiresAt: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.bookkeeperAccess.findMany({
      where: { businessId, status: "ACTIVE" },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { grantedAt: "asc" },
    }),
    prisma.invite.findMany({
      where: { businessId, type: "BOOKKEEPER", usedAt: null, expiresAt: { gt: new Date() } },
      select: { id: true, email: true, expiresAt: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({
    users,
    invites,
    bookkeepers: bookkeeperAccesses.map((a) => ({
      accessId: a.id,
      userId: a.user.id,
      name: a.user.name,
      email: a.user.email,
      grantedAt: a.grantedAt,
    })),
    bookkeeperInvites,
    maxUsers: PLANS[plan]?.maxUsers ?? 1,
    planName: plan,
  });
}

// POST — invite a team member (type=TEAM) or external bookkeeper (type=BOOKKEEPER)
const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["ACCOUNTANT"]).default("ACCOUNTANT"),
  type: z.enum(["TEAM", "BOOKKEEPER"]).default("TEAM"),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Only the account owner can invite users" }, { status: 403 });
  }

  const { businessId, businessName } = session.user;
  const plan = session.user.plan as PlanId;

  const body = await req.json();
  const { email, role, type } = inviteSchema.parse(body);
  const normalizedEmail = email.toLowerCase();

  if (type === "TEAM") {
    const maxUsers = PLANS[plan]?.maxUsers ?? 1;
    if (maxUsers <= 1) {
      return NextResponse.json(
        { error: "Your plan does not support additional users. Upgrade to Pro or Business." },
        { status: 403 }
      );
    }

    const [userCount, pendingInvites] = await Promise.all([
      prisma.user.count({ where: { businessId } }),
      prisma.invite.count({
        where: { businessId, type: "TEAM", usedAt: null, expiresAt: { gt: new Date() } },
      }),
    ]);

    if (userCount + pendingInvites >= maxUsers) {
      return NextResponse.json(
        { error: `You've reached the ${maxUsers}-user limit for your plan.` },
        { status: 403 }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      if (existingUser.businessId === businessId) {
        return NextResponse.json({ error: "This person is already in your team." }, { status: 409 });
      }
      return NextResponse.json({ error: "This email is already registered on another account." }, { status: 409 });
    }
  } else {
    // BOOKKEEPER type — no seat limit; can be an existing user
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      // Already has access?
      const existingAccess = await prisma.bookkeeperAccess.findUnique({
        where: { userId_businessId: { userId: existingUser.id, businessId } },
      });
      if (existingAccess && existingAccess.status === "ACTIVE") {
        return NextResponse.json({ error: "This bookkeeper already has access." }, { status: 409 });
      }
    }
  }

  // Check not already invited (regardless of type)
  const existingInvite = await prisma.invite.findFirst({
    where: { businessId, email: normalizedEmail, type, usedAt: null, expiresAt: { gt: new Date() } },
  });
  if (existingInvite) {
    return NextResponse.json({ error: "This email already has a pending invitation." }, { status: 409 });
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const invite = await prisma.invite.create({
    data: { businessId, email: normalizedEmail, role, type, expiresAt },
  });

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://mohasabai.com").replace(/\/$/, "");
  const inviteUrl = `${appUrl}/invite/${invite.token}`;

  try {
    await sendInviteEmail(normalizedEmail, inviteUrl, businessName ?? "Your team");
  } catch (err) {
    console.error("[invite email]", err);
  }

  return NextResponse.json({ invite }, { status: 201 });
}
