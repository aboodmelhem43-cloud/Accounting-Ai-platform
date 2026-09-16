import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyOtp } from "@/lib/otp";

const schema = z.object({
  email: z.string().email(),
  otp:   z.string().length(6),
});

function getMobileSecret() {
  const s = process.env.NEXTAUTH_SECRET ?? process.env.MOBILE_JWT_SECRET;
  if (!s) throw new Error("NEXTAUTH_SECRET not set");
  return new TextEncoder().encode(s);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, otp } = schema.parse(body);

    const valid = await verifyOtp(email, otp, "login");
    if (!valid) {
      return NextResponse.json({ error: "رمز التحقق غير صحيح أو منتهي الصلاحية" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { business: { select: { id: true, name: true, baseCurrency: true, country: true } } },
    });

    if (!user || !user.business) {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    }

    const token = await new SignJWT({
      sub:        user.id,
      businessId: user.business.id,
      role:       user.role,
      email:      user.email,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(getMobileSecret());

    return NextResponse.json({
      token,
      session: {
        userId:       user.id,
        email:        user.email,
        name:         user.name,
        businessId:   user.business.id,
        businessName: user.business.name,
        currency:     user.business.baseCurrency,
        country:      user.business.country,
        role:         user.role,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("[mobile/auth/verify]", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
