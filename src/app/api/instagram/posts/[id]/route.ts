import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getOwnedPost(id: string, businessId: string) {
  return prisma.instagramPost.findFirst({ where: { id, businessId } });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { id } = await params;
  const post = await getOwnedPost(id, session.user.businessId);
  if (!post) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json({ post });
}

const updateSchema = z.object({
  mediaUrls:   z.array(z.string()).max(10).optional(),
  caption:     z.string().max(2200).nullable().optional(),
  hashtags:    z.array(z.string()).max(30).optional(),
  status:      z.enum(["DRAFT", "SCHEDULED"]).optional(),
  scheduledAt: z.string().datetime().nullable().optional(),
  notes:       z.string().max(500).nullable().optional(),
  aiGenerated: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { id } = await params;
  const existing = await getOwnedPost(id, session.user.businessId);
  if (!existing) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // Prevent editing published / failed posts
  if (existing.status === "PUBLISHED" || existing.status === "FAILED") {
    return NextResponse.json({ error: "cannot_edit_published" }, { status: 400 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { scheduledAt, ...rest } = parsed.data;

  const post = await prisma.instagramPost.update({
    where: { id },
    data: {
      ...rest,
      ...(scheduledAt !== undefined ? { scheduledAt: scheduledAt ? new Date(scheduledAt) : null } : {}),
    },
  });

  return NextResponse.json({ post });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { id } = await params;
  const existing = await getOwnedPost(id, session.user.businessId);
  if (!existing) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (existing.status === "PUBLISHED") {
    return NextResponse.json({ error: "cannot_delete_published" }, { status: 400 });
  }

  await prisma.instagramPost.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
