import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { DEFAULT_CHART_OF_ACCOUNTS } from "@/lib/accounts";
import { SUPPORTED_COUNTRIES } from "@/compliance";
import { verifyOtp } from "@/lib/otp";
import { trialEndsAtDate } from "@/lib/plans";

const schema = z.object({
  email:        z.string().email(),
  password:     z.string().min(8),
  name:         z.string().min(1),
  businessName: z.string().min(2),
  country:      z.string().length(2),
  otp:          z.string().length(6),
});

function getMobileSecret() {
  const s = process.env.NEXTAUTH_SECRET ?? process.env.MOBILE_JWT_SECRET;
  if (!s) throw new Error("NEXTAUTH_SECRET not set");
  return new TextEncoder().encode(s);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    const supported = SUPPORTED_COUNTRIES.find(c => c.code === data.country.toUpperCase());
    if (!supported) {
      return NextResponse.json({ error: "الدولة غير مدعومة" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: "البريد الإلكتروني مسجل مسبقًا" }, { status: 409 });
    }

    const otpValid = await verifyOtp(data.email, data.otp, "register");
    if (!otpValid) {
      return NextResponse.json({ error: "رمز التحقق غير صحيح أو منتهي الصلاحية" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const result = await prisma.$transaction(async (tx) => {
      const business = await tx.business.create({
        data: {
          name:         data.businessName,
          country:      data.country.toUpperCase(),
          baseCurrency: supported.currency,
          plan:         "FREE_TRIAL",
          trialEndsAt:  trialEndsAtDate(),
        },
      });

      const user = await tx.user.create({
        data: {
          businessId:   business.id,
          email:        data.email.toLowerCase(),
          passwordHash,
          name:         data.name,
          role:         "OWNER",
        },
      });

      await tx.account.createMany({
        data: DEFAULT_CHART_OF_ACCOUNTS.map(acc => ({
          businessId: business.id,
          code:       acc.code,
          name:       acc.name,
          nameAr:     acc.nameAr,
          type:       acc.type,
          isSystem:   true,
        })),
      });

      return { business, user };
    });

    const token = await new SignJWT({
      sub:        result.user.id,
      businessId: result.business.id,
      role:       result.user.role,
      email:      result.user.email,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(getMobileSecret());

    return NextResponse.json({
      token,
      session: {
        userId:       result.user.id,
        email:        result.user.email,
        name:         result.user.name,
        businessId:   result.business.id,
        businessName: result.business.name,
        currency:     result.business.baseCurrency,
        country:      result.business.country,
        role:         result.user.role,
      },
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("[mobile/auth/register]", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
