import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createOtp } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/email";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
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
      // نعطي نفس الرد لعدم كشف وجود الحساب
      return NextResponse.json({ sent: true });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
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
