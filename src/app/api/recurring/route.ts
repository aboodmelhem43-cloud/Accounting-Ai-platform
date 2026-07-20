import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const lineSchema = z.object({
  accountId: z.string().min(1),
  accountCode: z.string(),
  accountName: z.string(),
  debit: z.number().min(0),
  credit: z.number().min(0),
  description: z.string().optional(),
});

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  frequency: z.enum(["MONTHLY", "WEEKLY", "QUARTERLY", "YEARLY"]),
  dayOfMonth: z.number().int().min(1).max(28).optional(),
  nextRunDate: z.string().min(1),
  endDate: z.string().optional(),
  lines: z.array(lineSchema).min(2),
});

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const templates = await prisma.recurringTemplate.findMany({
    where: { businessId: session.user.businessId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ templates });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 }); }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "بيانات غير صالحة", details: parsed.error.flatten() }, { status: 400 });

  const { name, description, frequency, dayOfMonth, nextRunDate, endDate, lines } = parsed.data;

  // Validate account IDs belong to this business
  const accountIds = [...new Set(lines.map((l) => l.accountId))];
  const validAccounts = await prisma.account.findMany({
    where: { id: { in: accountIds }, businessId: session.user.businessId },
    select: { id: true },
  });
  if (validAccounts.length !== accountIds.length) {
    return NextResponse.json({ error: "حساب غير صالح" }, { status: 400 });
  }

  // Validate balance
  const totalDebit = lines.reduce((s, l) => s + l.debit, 0);
  const totalCredit = lines.reduce((s, l) => s + l.credit, 0);
  if (Math.abs(totalDebit - totalCredit) > 0.001) {
    return NextResponse.json({ error: "القيد غير متوازن" }, { status: 400 });
  }

  const template = await prisma.recurringTemplate.create({
    data: {
      businessId: session.user.businessId,
      createdById: session.user.id,
      name,
      description,
      frequency,
      dayOfMonth,
      nextRunDate: new Date(nextRunDate),
      endDate: endDate ? new Date(endDate) : null,
      lines,
    },
  });

  return NextResponse.json({ template }, { status: 201 });
}
