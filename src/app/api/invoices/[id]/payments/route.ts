import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createJournalEntry } from "@/lib/ledger";

const paymentSchema = z.object({
  amount: z.number().positive(),
  date: z.string().min(1),
  accountId: z.string().min(1), // حساب النقدية أو البنك المُستلم منه
  note: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { id } = await params;

  const invoice = await prisma.invoice.findFirst({
    where: { id, businessId: session.user.businessId },
    include: {
      payments: true,
    },
  });

  if (!invoice) return NextResponse.json({ error: "الفاتورة غير موجودة" }, { status: 404 });
  if (invoice.status !== "CONFIRMED") {
    return NextResponse.json({ error: "يمكن تسجيل الدفعات للفواتير المؤكدة فقط" }, { status: 400 });
  }
  if (invoice.paymentStatus === "PAID") {
    return NextResponse.json({ error: "الفاتورة مدفوعة بالكامل بالفعل" }, { status: 400 });
  }

  const body = await req.json();
  const data = paymentSchema.parse(body);

  // Validate accountId belongs to this business
  const account = await prisma.account.findFirst({
    where: { id: data.accountId, businessId: session.user.businessId, type: "ASSET" },
  });
  if (!account) return NextResponse.json({ error: "حساب النقدية غير صالح" }, { status: 400 });

  // استخرج المبلغ الإجمالي من بيانات الفاتورة
  const extracted = invoice.extractedData as { totalAmount?: number } | null;
  const totalAmount = extracted?.totalAmount ?? 0;

  const alreadyPaid = invoice.payments.reduce((s, p) => s + Number(p.amount), 0);
  const remaining = totalAmount - alreadyPaid;

  if (data.amount > remaining + 0.001) {
    return NextResponse.json(
      { error: `المبلغ المدفوع (${data.amount}) يتجاوز المبلغ المتبقي (${remaining.toFixed(2)})` },
      { status: 400 }
    );
  }

  // ابحث عن حساب المدينين (AR) لفاتورة المبيعات أو الدائنين (AP) للمشتريات
  const counterpartCode = invoice.invoiceType === "SALES" ? "1200" : "2100";
  const counterpartAcc = await prisma.account.findFirst({
    where: { businessId: session.user.businessId, code: counterpartCode },
  });
  if (!counterpartAcc) {
    return NextResponse.json({ error: "لم يتم العثور على حساب المدينين/الدائنين" }, { status: 400 });
  }

  // قيد الدفع: نقدية مدين / مدينون دائن (للمبيعات) أو دائنون مدين / نقدية دائن (للمشتريات)
  let lines: { accountId: string; debit: number; credit: number; description?: string }[];
  if (invoice.invoiceType === "SALES") {
    lines = [
      { accountId: data.accountId, debit: data.amount, credit: 0, description: "استلام دفعة" },
      { accountId: counterpartAcc.id, debit: 0, credit: data.amount, description: "تسوية مدينين" },
    ];
  } else {
    lines = [
      { accountId: counterpartAcc.id, debit: data.amount, credit: 0, description: "تسوية دائنين" },
      { accountId: data.accountId, debit: 0, credit: data.amount, description: "صرف دفعة" },
    ];
  }

  const journalEntry = await createJournalEntry({
    businessId: session.user.businessId,
    userId: session.user.id,
    date: new Date(data.date),
    description: data.note ?? `دفعة فاتورة ${invoice.id}`,
    sourceType: "MANUAL",
    lines,
  });

  const payment = await prisma.invoicePayment.create({
    data: {
      invoiceId: invoice.id,
      amount: data.amount,
      date: new Date(data.date),
      note: data.note,
      journalEntryId: journalEntry.id,
    },
  });

  // تحديث حالة الدفع
  const newTotalPaid = alreadyPaid + data.amount;
  const newStatus =
    Math.abs(newTotalPaid - totalAmount) < 0.01
      ? "PAID"
      : newTotalPaid > 0
        ? "PARTIALLY_PAID"
        : "UNPAID";

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: { paymentStatus: newStatus },
  });

  return NextResponse.json({ payment, journalEntryId: journalEntry.id, paymentStatus: newStatus });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { id } = await params;

  const invoice = await prisma.invoice.findFirst({
    where: { id, businessId: session.user.businessId },
    include: { payments: { orderBy: { date: "desc" } } },
  });

  if (!invoice) return NextResponse.json({ error: "الفاتورة غير موجودة" }, { status: 404 });

  return NextResponse.json({ payments: invoice.payments, paymentStatus: invoice.paymentStatus });
}
