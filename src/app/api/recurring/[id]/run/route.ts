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
  const template = await prisma.recurringTemplate.findFirst({ where: { id, businessId: session.user.businessId } });
  if (!template) return NextResponse.json({ error: "القالب غير موجود" }, { status: 404 });
  if (!template.isActive) return NextResponse.json({ error: "القالب غير نشط" }, { status: 400 });
  if (template.endDate && template.nextRunDate > template.endDate) {
    return NextResponse.json({ error: "انتهت صلاحية القالب" }, { status: 400 });
  }

  type TemplateLine = { accountId: string; debit: number; credit: number; description?: string };
  const lines = template.lines as TemplateLine[];

  // Validate that all accountIds in the template belong to this business
  const accountIds = [...new Set(lines.map((l) => l.accountId))];
  const validAccounts = await prisma.account.findMany({
    where: { id: { in: accountIds }, businessId: session.user.businessId },
    select: { id: true },
  });
  if (validAccounts.length !== accountIds.length) {
    return NextResponse.json({ error: "بعض الحسابات في القالب غير مصرح بها" }, { status: 403 });
  }

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
    const name = err instanceof Error ? err.constructor.name : "";
    const isDbError = name.includes("Prisma") || (err instanceof Error && (err.message.includes("prisma") || /^P\d{4}/.test(err.message)));
    const message = isDbError ? "خطأ في الخادم" : (err instanceof Error ? err.message : "خطأ في الخادم");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
