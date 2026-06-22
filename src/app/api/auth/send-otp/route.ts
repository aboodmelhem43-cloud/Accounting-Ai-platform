import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createOtp } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/email";

const schema = z.object({
  email: z.string().email(),
  password: z.string().optional(),
  lang: z.enum(["ar", "en"]).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, lang } = schema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // No account found — tell the client so the user knows to register
      return NextResponse.json({ error: "no_account" }, { status: 404 });
    }

    // If password is provided, verify it before sending OTP
    if (password && password.trim()) {
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return NextResponse.json({ error: "invalid_password" }, { status: 401 });
      }
    }

    const code = await createOtp(email, "login");
    console.log(`[OTP-LOGIN] ${email} → ${code}`); // visible in Vercel logs as backup
    await sendOtpEmail(email, code, "login", lang ?? "ar");

    return NextResponse.json({ sent: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "بيانات غير صحيحة" }, { status: 400 });
    }
    console.error("[send-otp/login]", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
