import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const schema = z.object({
  token: z.string().min(10),
  password: z.string().min(8),
});

function verifyResetToken(token: string): { email: string; valid: boolean } {
  const parts = token.split(".");
  if (parts.length !== 3) return { email: "", valid: false };
  const [encodedEmail, expiryStr, sig] = parts;
  const payload = `${encodedEmail}.${expiryStr}`;
  const secret = process.env.NEXTAUTH_SECRET ?? "fallback-secret";
  const expectedSig = createHmac("sha256", secret).update(payload).digest("base64url");
  if (sig !== expectedSig) return { email: "", valid: false };
  const expiry = parseInt(expiryStr, 10);
  if (isNaN(expiry) || Date.now() > expiry) return { email: "", valid: false };
  try {
    const email = Buffer.from(encodedEmail, "base64url").toString("utf-8");
    return { email, valid: true };
  } catch {
    return { email: "", valid: false };
  }
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
  const { email, valid } = verifyResetToken(token);

  if (!valid || !email) {
    return NextResponse.json({ error: "الرابط غير صالح أو منتهي الصلاحية" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: "الحساب غير موجود" }, { status: 404 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.update({
    where: { email },
    data: { passwordHash },
  });

  return NextResponse.json({ ok: true });
}
