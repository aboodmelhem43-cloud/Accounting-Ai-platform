import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { checkActivePlan } from "@/lib/plans";

const createContactSchema = z.object({
  type: z.enum(["CUSTOMER", "VENDOR"]),
  name: z.string().min(1),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  taxNumber: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const typeParam = searchParams.get("type");
  const VALID_TYPES = ["CUSTOMER", "VENDOR"] as const;
  const type = VALID_TYPES.includes(typeParam as (typeof VALID_TYPES)[number])
    ? (typeParam as "CUSTOMER" | "VENDOR")
    : null;

  const contacts = await prisma.contact.findMany({
    where: {
      businessId: session.user.businessId,
      ...(type ? { type } : {}),
    },
    orderBy: { name: "asc" },
    take: 1000,
  });

  return NextResponse.json(contacts);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  if (!await checkActivePlan(session.user.businessId)) {
    return NextResponse.json({ error: "plan_expired", message: "انتهت فترة التجربة المجانية. يرجى الترقية للاستمرار." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const parsed = createContactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة", details: parsed.error.flatten() }, { status: 400 });
  }

  const contact = await prisma.contact.create({
    data: {
      businessId: session.user.businessId,
      ...parsed.data,
    },
  });

  return NextResponse.json(contact, { status: 201 });
}
