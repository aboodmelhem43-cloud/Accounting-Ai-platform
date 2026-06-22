import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(2).max(100),
  country: z.string().length(2).optional(),
  baseCurrency: z.string().min(2).max(10).optional(),
  taxNumber: z.string().max(50).optional().nullable(),
  address: z.string().max(200).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
});

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  try {
    const body = await req.json();
    const data = schema.parse(body);
    await prisma.business.update({
      where: { id: session.user.businessId },
      data: {
        name: data.name,
        ...(data.country && { country: data.country }),
        ...(data.baseCurrency && { baseCurrency: data.baseCurrency }),
        taxNumber: data.taxNumber ?? null,
        address: data.address ?? null,
        phone: data.phone ?? null,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
