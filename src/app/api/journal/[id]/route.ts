import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logAudit } from "@/lib/audit";

const journalLineSchema = z.object({
  accountId: z.string().min(1),
  debit: z.number().min(0),
  credit: z.number().min(0),
  description: z.string().optional(),
});

const updateJournalSchema = z.object({
  date: z.string().min(1),
  description: z.string().min(1),
  lines: z.array(journalLineSchema).min(2),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { id } = await params;

  const entry = await prisma.journalEntry.findUnique({
    where: { id },
    include: {
      lines: {
        include: {
          account: { select: { code: true, name: true, nameAr: true } },
        },
      },
      creator:   { select: { name: true, email: true } },
      updater:   { select: { name: true, email: true } },
      submitter: { select: { name: true, email: true } },
      reviewer:  { select: { name: true, email: true } },
      invoice:   { select: { id: true, invoiceType: true } },
    },
  });

  if (!entry) return NextResponse.json({ error: "القيد غير موجود" }, { status: 404 });
  if (entry.businessId !== session.user.businessId) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  return NextResponse.json({ entry });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { id } = await params;

  const entry = await prisma.journalEntry.findUnique({
    where: { id },
    select: { id: true, businessId: true, status: true, isLocked: true, description: true },
  });

  if (!entry) return NextResponse.json({ error: "القيد غير موجود" }, { status: 404 });
  if (entry.businessId !== session.user.businessId) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  if (!["DRAFT", "REJECTED"].includes(entry.status)) {
    return NextResponse.json({ error: "لا يمكن تعديل هذا القيد بحالته الحالية" }, { status: 400 });
  }
  if (entry.isLocked) {
    return NextResponse.json({ error: "القيد مقفل ولا يمكن تعديله" }, { status: 409 });
  }

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 }); }

  const parsed = updateJournalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة", details: parsed.error.flatten() }, { status: 400 });
  }

  const { date, description, lines } = parsed.data;

  const totalDebit = lines.reduce((s, l) => s + l.debit, 0);
  const totalCredit = lines.reduce((s, l) => s + l.credit, 0);
  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    return NextResponse.json({ error: "القيد غير متوازن — مجموع المدين يجب أن يساوي مجموع الدائن" }, { status: 400 });
  }
  if (totalDebit === 0) {
    return NextResponse.json({ error: "مجموع القيد لا يمكن أن يكون صفراً" }, { status: 400 });
  }

  const accountIds = [...new Set(lines.map((l) => l.accountId))];
  const validAccounts = await prisma.account.findMany({
    where: { id: { in: accountIds }, businessId: session.user.businessId },
    select: { id: true },
  });
  if (validAccounts.length !== accountIds.length) {
    return NextResponse.json({ error: "أحد الحسابات غير صالح" }, { status: 400 });
  }

  const entryDate = new Date(date);
  const year = entryDate.getFullYear();
  const month = entryDate.getMonth() + 1;
  const closedPeriod = await prisma.accountingPeriod.findUnique({
    where: { businessId_year_month: { businessId: session.user.businessId, year, month } },
    select: { status: true },
  });
  if (closedPeriod?.status === "CLOSED") {
    return NextResponse.json({ error: "الفترة المحاسبية مقفلة — لا يمكن تعديل قيودها" }, { status: 409 });
  }

  // Reset REJECTED → DRAFT so accountant can re-submit fresh
  const newStatus = entry.status === "REJECTED" ? "DRAFT" : entry.status;

  await prisma.$transaction([
    prisma.journalLine.deleteMany({ where: { journalEntryId: id } }),
    prisma.journalEntry.update({
      where: { id },
      data: {
        date: entryDate,
        description,
        status: newStatus,
        rejectionReason: entry.status === "REJECTED" ? null : undefined,
        updatedById: session.user.id,
      },
    }),
    prisma.journalLine.createMany({
      data: lines.map((l) => ({
        journalEntryId: id,
        accountId: l.accountId,
        debit: l.debit,
        credit: l.credit,
        description: l.description ?? null,
      })),
    }),
  ]);

  await logAudit({
    businessId: session.user.businessId,
    userId: session.user.id,
    userName: session.user.name ?? undefined,
    userEmail: session.user.email,
    action: "UPDATE",
    entity: "JournalEntry",
    entityId: id,
    description: `تعديل القيد: ${description}`,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { id } = await params;

  const entry = await prisma.journalEntry.findUnique({
    where: { id },
    select: { id: true, businessId: true, status: true, isLocked: true, date: true },
  });

  if (!entry) return NextResponse.json({ error: "القيد غير موجود" }, { status: 404 });
  if (entry.businessId !== session.user.businessId) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  if (entry.status === "POSTED") {
    return NextResponse.json({ error: "لا يمكن حذف قيد مُرحَّل — أنشئ قيداً عكسياً بدلاً من ذلك" }, { status: 409 });
  }
  if (entry.isLocked) {
    return NextResponse.json({ error: "القيد مقفل ولا يمكن حذفه" }, { status: 409 });
  }

  const year = entry.date.getFullYear();
  const month = entry.date.getMonth() + 1;
  const closedPeriod = await prisma.accountingPeriod.findUnique({
    where: { businessId_year_month: { businessId: session.user.businessId, year, month } },
    select: { status: true },
  });
  if (closedPeriod?.status === "CLOSED") {
    return NextResponse.json({ error: "الفترة المحاسبية مقفلة — لا يمكن حذف قيودها" }, { status: 409 });
  }

  await prisma.journalEntry.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
