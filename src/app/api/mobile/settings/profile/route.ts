import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyMobileToken } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(1).max(100).optional(),
  businessName: z.string().min(1).max(200).optional(),
});

export async function PATCH(req: NextRequest) {
  const token = await verifyMobileToken(req);
  if (!token) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  try {
    const body = await req.json();
    const data = schema.parse(body);

    if (!data.name && !data.businessName) {
      return NextResponse.json({ error: "لا توجد بيانات للتحديث" }, { status: 400 });
    }

    await Promise.all([
      data.name
        ? prisma.user.update({ where: { id: token.sub }, data: { name: data.name } })
        : Promise.resolve(),
      data.businessName
        ? prisma.business.update({ where: { id: token.businessId }, data: { name: data.businessName } })
        : Promise.resolve(),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
