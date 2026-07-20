import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  action: z.enum(["close", "open"]),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });

  const { year, month, action, notes } = parsed.data;
  const newStatus = action === "close" ? "CLOSED" : "OPEN";

  const period = await prisma.accountingPeriod.upsert({
    where: { businessId_year_month: { businessId: session.user.businessId, year, month } },
    create: {
      businessId: session.user.businessId,
      year,
      month,
      status: newStatus,
      closedAt: newStatus === "CLOSED" ? new Date() : null,
      closedById: session.user.id,
      notes,
    },
    update: {
      status: newStatus,
      closedAt: newStatus === "CLOSED" ? new Date() : null,
      closedById: session.user.id,
      notes,
    },
  });

  if (newStatus === "CLOSED") {
    // Lock all POSTED journal entries in this period
    await prisma.journalEntry.updateMany({
      where: {
        businessId: session.user.businessId,
        status: "POSTED",
        date: {
          gte: new Date(year, month - 1, 1),
          lt: new Date(year, month, 1),
        },
      },
      data: { isLocked: true, lockedAt: new Date() },
    });
  } else {
    // Unlock entries when period reopened
    await prisma.journalEntry.updateMany({
      where: {
        businessId: session.user.businessId,
        date: {
          gte: new Date(year, month - 1, 1),
          lt: new Date(year, month, 1),
        },
      },
      data: { isLocked: false, lockedAt: null },
    });
  }

  await logAudit({
    businessId: session.user.businessId,
    userId: session.user.id,
    userName: session.user.name ?? undefined,
    userEmail: session.user.email,
    action: newStatus === "CLOSED" ? "CLOSE" : "OPEN",
    entity: "Period",
    entityId: period.id,
    description: `${newStatus === "CLOSED" ? "إقفال" : "فتح"} الفترة ${year}/${String(month).padStart(2, "0")}`,
  });

  return NextResponse.json({ period });
}
