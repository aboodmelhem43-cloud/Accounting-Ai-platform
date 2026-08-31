import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";

const schema = z.object({
  email: z.string().email(),
  lang: z.enum(["ar", "en"]).optional(),
});

// Simple in-memory rate limiter: max 3 requests per email per 15 minutes
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function isRateLimited(email: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(email);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(email, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return false;
  }
  if (entry.count >= 3) return true;
  entry.count++;
  return false;
}

function createResetToken(email: string, passwordHash: string): string {
  const expiry = Date.now() + 3_600_000; // 1 hour
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is not configured");
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

  if (isRateLimited(email)) {
    return NextResponse.json({ ok: true }); // return 200 so we don't leak rate-limit status
  }

  // Always return 200 to avoid leaking whether an email exists
  const user = await prisma.user.findUnique({ where: { email } }).catch(() => null);
  if (!user) return NextResponse.json({ ok: true });

  const token = createResetToken(email, user.passwordHash);
  const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const resetUrl = `${appUrl}/reset-password?token=${token}`;

  try {
    await sendPasswordResetEmail(email, resetUrl, lang);
  } catch (err) {
    console.error("[forgot-password] email error:", err);
  }

  return NextResponse.json({ ok: true });
}
