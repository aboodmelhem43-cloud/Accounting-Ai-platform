import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const sets = await prisma.instagramHashtagSet.findMany({
    where: { businessId: session.user.businessId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ sets });
}

const schema = z.object({
  name:     z.string().min(1).max(80),
  hashtags: z.array(z.string().min(1)).min(1).max(30),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const set = await prisma.instagramHashtagSet.create({
    data: {
      businessId: session.user.businessId,
      name:       parsed.data.name,
      hashtags:   parsed.data.hashtags,
    },
  });

  return NextResponse.json({ set }, { status: 201 });
}
