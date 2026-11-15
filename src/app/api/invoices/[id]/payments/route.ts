import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createJournalEntry } from "@/lib/ledger";

const paymentSchema = z.object({
  amount: z.number().positive().max(1_000_000_000),
  date: z.string().min(1).refine((s) => !isNaN(new Date(s).getTime()), { message: "تاريخ الدفع غير صالح" }),
  accountId: z.string().min(1), // حساب النقدية أو البنك المُستلم منه
  note: z.string().max(500).optional(),
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

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 }); }
  const parsed = paymentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  const data = parsed.data;

  // Validate accountId belongs to this business
  const account = await prisma.account.findFirst({
    where: { id: data.accountId, businessId: session.user.businessId, type: "ASSET" },
  });
  if (!account) return NextResponse.json({ error: "حساب النقدية غير صالح" }, { status: 400 });

  // ابحث عن حساب المدينين (AR) لفاتورة المبيعات أو الدائنين (AP) للمشتريات
  const counterpartCode = invoice.invoiceType === "SALES" ? "1200" : "2100";
  const counterpartAcc = await prisma.account.findFirst({
    where: { businessId: session.user.businessId, code: counterpartCode },
  });
  if (!counterpartAcc) {
    return NextResponse.json({ error: "لم يتم العثور على حساب المدينين/الدائنين" }, { status: 400 });
  }

  // تنفيذ الدفع داخل معاملة واحدة لتفادي تعارض الطلبات المتزامنة
  let result: Awaited<ReturnType<typeof prisma.$transaction>>;
  try {
    result = await prisma.$transaction(async (tx) => {
      // إعادة قراءة الدفعات داخل المعاملة لضمان الدقة
      const freshInvoice = await tx.invoice.findUnique({
        where: { id: invoice.id },
        include: { payments: true },
      });
      if (!freshInvoice) throw new Error("الفاتورة غير موجودة");

      const freshExtracted = freshInvoice.extractedData as { totalAmount?: number; grandTotal?: number } | null;
      const totalAmount = freshExtracted?.totalAmount ?? freshExtracted?.grandTotal ?? 0;
      const alreadyPaid = freshInvoice.payments.reduce((s, p) => s + Number(p.amount), 0);
      const remaining = totalAmount - alreadyPaid;

      if (data.amount > remaining + 0.001) {
        throw new Error(`المبلغ المدفوع (${data.amount}) يتجاوز المبلغ المتبقي (${remaining.toFixed(2)})`);
      }

      // قيد الدفع: نقدية مدين / مدينون دائن (للمبيعات) أو دائنون مدين / نقدية دائن (للمشتريات)
      const lines: { accountId: string; debit: number; credit: number; description?: string }[] =
        invoice.invoiceType === "SALES"
          ? [
              { accountId: data.accountId, debit: data.amount, credit: 0, description: "استلام دفعة" },
              { accountId: counterpartAcc.id, debit: 0, credit: data.amount, description: "تسوية مدينين" },
            ]
          : [
              { accountId: counterpartAcc.id, debit: data.amount, credit: 0, description: "تسوية دائنين" },
              { accountId: data.accountId, debit: 0, credit: data.amount, description: "صرف دفعة" },
            ];

      const journalEntry = await createJournalEntry(
        {
          businessId: session.user.businessId,
          userId: session.user.id,
          date: new Date(data.date),
          description: data.note ?? `دفعة فاتورة ${invoice.id}`,
          sourceType: "MANUAL",
          lines,
        },
        tx
      );

      const payment = await tx.invoicePayment.create({
        data: {
          invoiceId: invoice.id,
          amount: data.amount,
          date: new Date(data.date),
          note: data.note,
          journalEntryId: journalEntry.id,
        },
      });

      const newTotalPaid = alreadyPaid + data.amount;
      const newStatus =
        Math.abs(newTotalPaid - totalAmount) < 0.01
          ? "PAID"
          : newTotalPaid > 0
            ? "PARTIALLY_PAID"
            : "UNPAID";

      await tx.invoice.update({
        where: { id: invoice.id },
        data: { paymentStatus: newStatus },
      });

      return { payment, journalEntryId: journalEntry.id, paymentStatus: newStatus };
    });
  } catch (err) {
    const name = err instanceof Error ? err.constructor.name : "";
    const isDbError = name.includes("Prisma") || (err instanceof Error && (err.message.includes("prisma") || /^P\d{4}/.test(err.message)));
    const message = isDbError ? "خطأ في الخادم" : (err instanceof Error ? err.message : "خطأ في الخادم");
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json(result);
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
