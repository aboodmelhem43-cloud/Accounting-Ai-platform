import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { DEFAULT_CHART_OF_ACCOUNTS } from "@/lib/accounts";
import { SUPPORTED_COUNTRIES } from "@/compliance";
import { verifyOtp } from "@/lib/otp";
import { trialEndsAtDate } from "@/lib/plans";

const schema = z.object({
  businessName: z.string().min(2, "اسم المنشأة مطلوب"),
  email: z.string().email("بريد إلكتروني غير صحيح"),
  password: z.string().min(8, "كلمة المرور لا تقل عن 8 أحرف"),
  userName: z.string().optional(),
  country: z.string().length(2, "رمز الدولة غير صحيح"),
  otp: z.string().length(6, "رمز التحقق يجب أن يكون 6 أرقام"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    const supported = SUPPORTED_COUNTRIES.find((c) => c.code === data.country.toUpperCase());
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
          name: data.businessName,
          country: data.country.toUpperCase(),
          baseCurrency: supported.currency,
          plan: "FREE_TRIAL",
          trialEndsAt: trialEndsAtDate(),
        },
      });

      const user = await tx.user.create({
        data: {
          businessId: business.id,
          email: data.email.toLowerCase(),
          passwordHash,
          name: data.userName ?? data.businessName,
          role: "OWNER",
        },
      });

      await tx.account.createMany({
        data: DEFAULT_CHART_OF_ACCOUNTS.map((acc) => ({
          businessId: business.id,
          code: acc.code,
          name: acc.name,
          nameAr: acc.nameAr,
          type: acc.type,
          isSystem: true,
        })),
      });

      return { business, user };
    });

    return NextResponse.json({ message: "تم إنشاء الحساب بنجاح", businessId: result.business.id }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("[register]", error);
    return NextResponse.json({ error: "حدث خطأ، يرجى المحاولة مرة أخرى" }, { status: 500 });
  }
}
