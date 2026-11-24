import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { checkActivePlan } from "@/lib/plans";
import { Prisma } from "@prisma/client";

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
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(100),
  nameAr: z.string().max(100).optional(),
  type: z.enum(["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"]),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  if (!await checkActivePlan(session.user.businessId)) {
    return NextResponse.json({ error: "plan_expired", message: "انتهت فترة التجربة المجانية. يرجى الترقية للاستمرار." }, { status: 403 });
  }

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 }); }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { code, name, nameAr, type } = parsed.data;

  try {
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
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "رمز الحساب مستخدم مسبقاً" }, { status: 409 });
    }
    throw err;
  }
}
