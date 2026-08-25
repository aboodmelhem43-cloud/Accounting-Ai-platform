import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const rejectSchema = z.object({
  reason: z.string().max(500).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { id } = await params;

  const event = await prisma.salesEvent.findFirst({
    where: { id, businessId: session.user.businessId },
  });
  if (!event) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  if (event.status !== "PENDING") {
    return NextResponse.json({ error: "تم معالجة هذا الحدث مسبقًا" }, { status: 409 });
  }

  let body: { reason?: string } = {};
  try {
    const raw = await req.text();
    if (raw) body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = rejectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await prisma.salesEvent.update({
    where: { id },
    data: { status: "REJECTED", rejectionReason: parsed.data.reason ?? null },
  });

  return NextResponse.json({ ok: true });
}
