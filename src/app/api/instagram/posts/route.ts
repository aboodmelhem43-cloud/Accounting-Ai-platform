import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PostStatus } from "@prisma/client";

const PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as PostStatus | null;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10) || 20));
  const scheduledFrom = searchParams.get("scheduledFrom");
  const scheduledTo   = searchParams.get("scheduledTo");

  const where: Record<string, unknown> = {
    businessId: session.user.businessId,
    ...(status && Object.values(PostStatus).includes(status) ? { status } : {}),
    ...(scheduledFrom || scheduledTo ? {
      scheduledAt: {
        ...(scheduledFrom ? { gte: new Date(scheduledFrom) } : {}),
        ...(scheduledTo   ? { lte: new Date(scheduledTo)   } : {}),
      },
    } : {}),
  };

  const [posts, total] = await Promise.all([
    prisma.instagramPost.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.instagramPost.count({ where }),
  ]);

  return NextResponse.json({ posts, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
}

const createSchema = z.object({
  mediaUrls:   z.array(z.string().url()).min(0).max(10),
  caption:     z.string().max(2200).optional(),
  hashtags:    z.array(z.string()).max(30).optional().default([]),
  status:      z.enum(["DRAFT", "SCHEDULED"]).optional().default("DRAFT"),
  scheduledAt: z.string().datetime().optional().nullable(),
  notes:       z.string().max(500).optional().nullable(),
  aiGenerated: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { mediaUrls, caption, hashtags, status, scheduledAt, notes, aiGenerated } = parsed.data;

  if (status === "SCHEDULED" && !scheduledAt) {
    return NextResponse.json({ error: "scheduledAt required for SCHEDULED status" }, { status: 400 });
  }

  const post = await prisma.instagramPost.create({
    data: {
      businessId:  session.user.businessId,
      mediaUrls,
      caption:     caption ?? null,
      hashtags:    hashtags ?? [],
      status,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      notes:       notes ?? null,
      aiGenerated,
    },
  });

  return NextResponse.json({ post }, { status: 201 });
}
