import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";

const schema = z.object({
  email: z.string().email(),
  lang: z.enum(["ar", "en"]).optional(),
});

function createResetToken(email: string): string {
  const expiry = Date.now() + 3_600_000; // 1 hour
  const secret = process.env.NEXTAUTH_SECRET ?? "fallback-secret";
  const payload = `${Buffer.from(email).toString("base64url")}.${expiry}`;
  const sig = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: true }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: true }); // don't leak validation errors

  const { email, lang = "ar" } = parsed.data;

  // Always return 200 to avoid leaking whether an email exists
  const user = await prisma.user.findUnique({ where: { email } }).catch(() => null);
  if (!user) return NextResponse.json({ ok: true });

  const token = createResetToken(email);
  const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const resetUrl = `${appUrl}/reset-password?token=${token}`;

  try {
    await sendPasswordResetEmail(email, resetUrl, lang);
  } catch (err) {
    console.error("[forgot-password] email error:", err);
  }

  return NextResponse.json({ ok: true });
}
