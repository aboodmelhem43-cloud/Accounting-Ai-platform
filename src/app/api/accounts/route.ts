import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const accounts = await prisma.account.findMany({
    where: { businessId: session.user.businessId },
    orderBy: [{ type: "asc" }, { code: "asc" }],
  });

  return NextResponse.json(accounts);
}

const createSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  nameAr: z.string().optional(),
  type: z.enum(["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"]),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { code, name, nameAr, type } = parsed.data;

  // منع تكرار الكود داخل نفس المنشأة
  const existing = await prisma.account.findUnique({
    where: { businessId_code: { businessId: session.user.businessId, code } },
  });
  if (existing) {
    return NextResponse.json({ error: "رمز الحساب مستخدم مسبقاً" }, { status: 409 });
  }

  const account = await prisma.account.create({
    data: {
      businessId: session.user.businessId,
      code,
      name,
      nameAr: nameAr ?? name,
      type,
      isSystem: false,
    },
  });

  return NextResponse.json(account, { status: 201 });
}
