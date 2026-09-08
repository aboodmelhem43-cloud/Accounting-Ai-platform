import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyOtp } from "@/lib/otp";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  newEmail: z.string().email(),
  otp: z.string().length(6),
});

// POST — verify OTP and update the user's email address.
// Returns signOut:true so the client forces re-login with the new email.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { newEmail, otp } = parsed.data;
  const normalizedEmail = newEmail.toLowerCase();

  // Verify the OTP that was sent to the NEW email address
  const otpValid = await verifyOtp(normalizedEmail, otp, "change-email");
  if (!otpValid) {
    return NextResponse.json({ error: "invalid_otp" }, { status: 400 });
  }

  // Double-check the new email isn't taken (race condition guard)
  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });
  if (existing && existing.id !== session.user.id) {
    return NextResponse.json({ error: "email_taken" }, { status: 409 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { email: normalizedEmail },
  });

  await logAudit({
    businessId: session.user.businessId,
    userId: session.user.id,
    userEmail: session.user.email,
    action: "EMAIL_CHANGED",
    entity: "User",
    entityId: session.user.id,
    description: `Email changed to ${normalizedEmail}`,
  });

  // Force sign-out so the user logs in with their new email
  return NextResponse.json({ ok: true, signOut: true });
}
