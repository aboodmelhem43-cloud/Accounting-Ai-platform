import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createOtp } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/email";
import { isIpRateLimited, getClientIp } from "@/lib/rate-limit";

const schema = z.object({
  email:    z.string().email(),
  password: z.string().optional(),
  mode:     z.enum(["login", "register"]).default("login"),
});

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    if (await isIpRateLimited(ip, "mobile-send-otp")) {
      return NextResponse.json({ error: "too_many_requests" }, { status: 429 });
    }

    const body = await req.json();
    const { email, password, mode } = schema.parse(body);

    if (mode === "register") {
      const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
      if (existing) {
        return NextResponse.json({ error: "البريد الإلكتروني مسجل مسبقًا" }, { status: 409 });
      }
    } else {
      const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
      if (!user) {
        return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
      }
      if (password) {
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
          return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
        }
      }
    }

    const code = await createOtp(email, mode === "register" ? "register" : "login");
    await sendOtpEmail(email, code, mode === "register" ? "register" : "login", "ar");

    return NextResponse.json({ sent: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("[mobile/auth/send-otp]", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
