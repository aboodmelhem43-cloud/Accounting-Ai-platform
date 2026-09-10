import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createOtp } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/email";

const schema = z.object({
  newEmail: z.string().email(),
  lang: z.enum(["ar", "en"]).optional(),
});

// POST — sends an OTP to the new email address to verify ownership.
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

  const { newEmail, lang = "ar" } = parsed.data;
  const normalizedEmail = newEmail.toLowerCase();

  if (normalizedEmail === session.user.email.toLowerCase()) {
    return NextResponse.json({ error: "same_email" }, { status: 400 });
  }

  // Check if the new email is already taken
  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ error: "email_taken" }, { status: 409 });
  }

  const code = await createOtp(normalizedEmail, "change-email");
  await sendOtpEmail(normalizedEmail, code, "login", lang);

  return NextResponse.json({ sent: true });
}
