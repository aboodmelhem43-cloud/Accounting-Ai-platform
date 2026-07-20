import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createJournalEntry } from "@/lib/ledger";

function advanceDate(date: Date, frequency: string, dayOfMonth?: number | null): Date {
  const next = new Date(date);
  switch (frequency) {
    case "MONTHLY":
      next.setMonth(next.getMonth() + 1);
      break;
    case "WEEKLY":
      next.setDate(next.getDate() + 7);
      break;
    case "QUARTERLY":
      next.setMonth(next.getMonth() + 3);
      break;
    case "YEARLY":
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  if (dayOfMonth && frequency !== "WEEKLY") {
    next.setDate(Math.min(dayOfMonth, new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()));
  }
  return next;
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { id } = await params;
  const template = await prisma.recurringTemplate.findUnique({ where: { id } });
  if (!template) return NextResponse.json({ error: "القالب غير موجود" }, { status: 404 });
  if (template.businessId !== session.user.businessId) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  if (!template.isActive) return NextResponse.json({ error: "القالب غير نشط" }, { status: 400 });
  if (template.endDate && template.nextRunDate > template.endDate) {
    return NextResponse.json({ error: "انتهت صلاحية القالب" }, { status: 400 });
  }

  type TemplateLine = { accountId: string; debit: number; credit: number; description?: string };
  const lines = template.lines as TemplateLine[];

  try {
    const entry = await createJournalEntry({
      businessId: session.user.businessId,
      userId: session.user.id,
      date: template.nextRunDate,
      description: template.description,
      sourceType: "MANUAL",
      status: "POSTED",
      lines,
    });

    // Advance next run date
    const nextRun = advanceDate(template.nextRunDate, template.frequency, template.dayOfMonth);
    const shouldDeactivate = template.endDate && nextRun > template.endDate;

    await prisma.recurringTemplate.update({
      where: { id },
      data: {
        nextRunDate: nextRun,
        ...(shouldDeactivate ? { isActive: false } : {}),
      },
    });

    return NextResponse.json({ entryId: entry.id, nextRunDate: nextRun });
  } catch (err) {
    const message = err instanceof Error ? err.message : "خطأ في الخادم";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
