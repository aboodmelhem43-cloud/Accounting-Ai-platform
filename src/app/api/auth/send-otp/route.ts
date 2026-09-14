import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createOtp } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/email";
import { isSuperAdmin, ensureAdminAccount } from "@/lib/admin";

const schema = z.object({
  email: z.string().email(),
  password: z.string().optional(),
  lang: z.enum(["ar", "en"]).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, lang } = schema.parse(body);

    // Auto-provision admin account on first login — no registration needed
    if (isSuperAdmin(email)) {
      await ensureAdminAccount(email);
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // If password provided, validate it — use the same error regardless of whether account
    // exists to prevent email enumeration (timing is equalized via dummy bcrypt compare)
    if (password && password.trim() && !isSuperAdmin(email)) {
      if (!user) {
        await bcrypt.compare(password, "$2b$12$dummyhashplaceholderfortimingXX");
        return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
      }
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
      }
    } else if (!user) {
      // No password provided and no account — silently ignore (OTP-only flow)
      return NextResponse.json({ sent: true });
    }

    const code = await createOtp(email, "login");
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
