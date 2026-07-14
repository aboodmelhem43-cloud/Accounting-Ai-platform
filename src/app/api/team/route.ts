import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PLANS } from "@/lib/plans";
import { sendInviteEmail } from "@/lib/email";
import type { PlanId } from "@/lib/plans";

// GET — list team members and pending invites
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { businessId } = session.user;
  const plan = session.user.plan as PlanId;

  const [users, invites] = await Promise.all([
    prisma.user.findMany({
      where: { businessId },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.invite.findMany({
      where: { businessId, usedAt: null, expiresAt: { gt: new Date() } },
      select: { id: true, email: true, role: true, expiresAt: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({
    users,
    invites,
    maxUsers: PLANS[plan]?.maxUsers ?? 1,
    planName: plan,
  });
}

// POST — invite a new team member
const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["ACCOUNTANT"]).default("ACCOUNTANT"),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Only the account owner can invite users" }, { status: 403 });
  }

  const { businessId, businessName } = session.user;
  const plan = session.user.plan as PlanId;
  const maxUsers = PLANS[plan]?.maxUsers ?? 1;

  if (maxUsers <= 1) {
    return NextResponse.json(
      { error: "Your plan does not support additional users. Upgrade to Pro or Business." },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { email, role } = inviteSchema.parse(body);
  const normalizedEmail = email.toLowerCase();

  // Count existing users + pending invites
  const [userCount, pendingInvites] = await Promise.all([
    prisma.user.count({ where: { businessId } }),
    prisma.invite.count({
      where: { businessId, usedAt: null, expiresAt: { gt: new Date() } },
    }),
  ]);

  if (userCount + pendingInvites >= maxUsers) {
    return NextResponse.json(
      { error: `You've reached the ${maxUsers}-user limit for your plan.` },
      { status: 403 }
    );
  }

  // Check not already a user
  const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existingUser) {
    if (existingUser.businessId === businessId) {
      return NextResponse.json({ error: "This person is already in your team." }, { status: 409 });
    }
    return NextResponse.json({ error: "This email is already registered on another account." }, { status: 409 });
  }

  // Check not already invited
  const existingInvite = await prisma.invite.findFirst({
    where: { businessId, email: normalizedEmail, usedAt: null, expiresAt: { gt: new Date() } },
  });
  if (existingInvite) {
    return NextResponse.json({ error: "This email already has a pending invitation." }, { status: 409 });
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const invite = await prisma.invite.create({
    data: { businessId, email: normalizedEmail, role, expiresAt },
  });

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://mohasabai.com").replace(/\/$/, "");
  const inviteUrl = `${appUrl}/invite/${invite.token}`;

  try {
    await sendInviteEmail(normalizedEmail, inviteUrl, businessName ?? "Your team");
  } catch (err) {
    console.error("[invite email]", err);
    // Don't fail the invite if email fails — the admin can resend
  }

  return NextResponse.json({ invite }, { status: 201 });
}
