import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";

const schema = z.object({
  email: z.string().email(),
  lang: z.enum(["ar", "en"]).optional(),
});

const RATE_WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 3;

// DB-backed rate limiter using OtpCode count to survive serverless cold-starts
async function isRateLimited(email: string): Promise<boolean> {
  const windowStart = new Date(Date.now() - RATE_WINDOW_MS);
  const count = await prisma.otpCode.count({
    where: { email: email.toLowerCase(), purpose: "reset-password", createdAt: { gte: windowStart } },
  });
  return count >= MAX_REQUESTS;
}

function createResetToken(email: string, passwordHash: string): string {
  const expiry = Date.now() + 3_600_000; // 1 hour
  if (!process.env.PASSWORD_RESET_SECRET) {
    console.warn("[security] PASSWORD_RESET_SECRET is not set — falling back to NEXTAUTH_SECRET. Set a dedicated secret to isolate password-reset tokens.");
  }
  const secret = process.env.PASSWORD_RESET_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("PASSWORD_RESET_SECRET is not configured");
  // Bind token to the current password hash so it is automatically invalidated
  // after a successful reset (or any other password change)
  const pwFingerprint = createHmac("sha256", secret).update(passwordHash).digest("hex").slice(0, 8);
  const payload = `${Buffer.from(email).toString("base64url")}.${expiry}.${pwFingerprint}`;
  const sig = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: true }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: true }); // don't leak validation errors

  const { email, lang = "ar" } = parsed.data;

  // DB-backed rate check and user lookup run in parallel to equalize timing
  const [rateLimited, user] = await Promise.all([
    isRateLimited(email),
    prisma.user.findUnique({ where: { email } }).catch(() => null),
  ]);

  if (rateLimited) {
    return NextResponse.json({ ok: true }); // return 200 so we don't leak rate-limit status
  }

  // Track this attempt in DB (even if user doesn't exist, to count toward rate limit)
  await prisma.otpCode.create({
    data: {
      email: email.toLowerCase(),
      code: "reset-attempt",
      purpose: "reset-password",
      expiresAt: new Date(Date.now() + 3_600_000),
    },
  }).catch(() => {}); // non-blocking; ignore if it fails

  if (!user) return NextResponse.json({ ok: true });

  const token = createResetToken(email, user.passwordHash);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const resetUrl = `${appUrl}/reset-password?token=${token}`;

  try {
    await sendPasswordResetEmail(email, resetUrl, lang);
  } catch (err) {
    console.error("[forgot-password] email error:", err);
  }

  return NextResponse.json({ ok: true });
}
