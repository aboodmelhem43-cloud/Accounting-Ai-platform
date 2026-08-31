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

    // Always do bcrypt work so response timing is constant regardless of account existence
    if (!user) {
      if (password && password.trim() && !isSuperAdmin(email)) {
        // Dummy compare to match timing of the real path
        await bcrypt.compare(password, "$2b$12$dummyhashplaceholderfortimingXX");
      }
      // Return sent:true — do not reveal whether the account exists
      return NextResponse.json({ sent: true });
    }

    // If password is provided, verify it; skip for super-admins (OTP-only)
    if (password && password.trim() && !isSuperAdmin(email)) {
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return NextResponse.json({ error: "invalid_password" }, { status: 401 });
      }
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
