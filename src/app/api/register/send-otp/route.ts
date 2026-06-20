import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createOtp } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/email";

const schema = z.object({
  email: z.string().email(),
  lang: z.enum(["ar", "en"]).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, lang } = schema.parse(body);

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json({ error: "البريد الإلكتروني مسجل مسبقًا" }, { status: 409 });
    }

    const code = await createOtp(email, "register");
    await sendOtpEmail(email, code, "register", lang ?? "ar");

    return NextResponse.json({ sent: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "بيانات غير صحيحة" }, { status: 400 });
    }
    console.error("[send-otp/register]", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
