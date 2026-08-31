import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const schema = z.object({
  token: z.string().min(10),
  password: z.string().min(8),
});

// Decode the token envelope without verifying — extracts email for the DB lookup
function decodeTokenEmail(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  try {
    return Buffer.from(parts[0], "base64url").toString("utf-8");
  } catch {
    return null;
  }
}

// Full verification including signature and password-hash fingerprint (single-use guarantee)
function verifyResetToken(token: string, passwordHash: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 4) return false;
  const [encodedEmail, expiryStr, pwFingerprint, sig] = parts;

  const secret = process.env.PASSWORD_RESET_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("PASSWORD_RESET_SECRET is not configured");

  const payload = `${encodedEmail}.${expiryStr}.${pwFingerprint}`;
  const expectedSig = createHmac("sha256", secret).update(payload).digest("base64url");

  // Timing-safe comparison to prevent timing attacks
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return false;
  } catch {
    return false;
  }

  const expiry = parseInt(expiryStr, 10);
  if (isNaN(expiry) || Date.now() > expiry) return false;

  // Verify password fingerprint — if the password changed after the token was issued
  // (e.g. a prior reset was already used), this fingerprint won't match
  const expectedFingerprint = createHmac("sha256", secret).update(passwordHash).digest("hex").slice(0, 8);
  try {
    if (!timingSafeEqual(Buffer.from(pwFingerprint), Buffer.from(expectedFingerprint))) return false;
  } catch {
    return false;
  }

  return true;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }

  const { token, password } = parsed.data;

  const email = decodeTokenEmail(token);
  if (!email) {
    return NextResponse.json({ error: "الرابط غير صالح أو منتهي الصلاحية" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: "الرابط غير صالح أو منتهي الصلاحية" }, { status: 400 });
  }

  if (!verifyResetToken(token, user.passwordHash)) {
    return NextResponse.json({ error: "الرابط غير صالح أو منتهي الصلاحية" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.update({
    where: { email },
    data: { passwordHash },
  });

  return NextResponse.json({ ok: true });
}
