import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import type { ExtractedInvoiceData } from "@/types";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.FROM_EMAIL ?? "onboarding@resend.dev";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const sendSchema = z.object({
  to: z.string().email(),
  subject: z.string().optional(),
  message: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { id } = await params;

  const invoice = await prisma.invoice.findFirst({
    where: { id, businessId: session.user.businessId },
    include: { contact: true },
  });

  if (!invoice) return NextResponse.json({ error: "الفاتورة غير موجودة" }, { status: 404 });
  if (invoice.status === "PENDING_REVIEW") {
    return NextResponse.json({ error: "لا يمكن إرسال فاتورة لم تتم مراجعتها بعد" }, { status: 400 });
  }

  const body = await req.json();
  const { to, subject, message } = sendSchema.parse(body);

  const extracted = invoice.extractedData as ExtractedInvoiceData | null;
  const businessName = session.user.businessName;
  const invoiceNumber = extracted?.invoiceNumber ?? id.slice(-8).toUpperCase();
  const totalAmount = extracted?.totalAmount ?? 0;
  const currency = session.user.currency;
  const invoiceDate = extracted?.invoiceDate ?? new Date().toISOString().split("T")[0];
  const dueDate = invoice.dueDate?.toISOString().split("T")[0] ?? "";

  const emailSubject = subject ?? `فاتورة رقم ${invoiceNumber} من ${businessName}`;
  const viewUrl = `${APP_URL}/invoices/${id}/view`;

  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f5;padding:40px 0;margin:0">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <div style="background:#1d4ed8;padding:24px 32px">
      <div style="color:#fff;font-size:20px;font-weight:bold">${businessName}</div>
      <div style="color:#bfdbfe;font-size:14px;margin-top:4px">فاتورة رقم: ${invoiceNumber}</div>
    </div>
    <div style="padding:32px">
      ${message ? `<p style="color:#374151;font-size:15px;margin:0 0 24px;line-height:1.6">${message}</p>` : ""}
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:14px">تاريخ الفاتورة</td>
          <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;color:#111827;font-size:14px;text-align:left">${invoiceDate}</td>
        </tr>
        ${dueDate ? `<tr>
          <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:14px">تاريخ الاستحقاق</td>
          <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;color:#111827;font-size:14px;text-align:left">${dueDate}</td>
        </tr>` : ""}
        <tr>
          <td style="padding:12px 0;color:#111827;font-size:16px;font-weight:bold">المبلغ الإجمالي</td>
          <td style="padding:12px 0;color:#1d4ed8;font-size:20px;font-weight:bold;text-align:left">${totalAmount.toLocaleString("ar-EG")} ${currency}</td>
        </tr>
      </table>
      <a href="${viewUrl}" style="display:inline-block;background:#1d4ed8;color:#fff;font-weight:bold;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none;margin-bottom:24px">
        عرض الفاتورة
      </a>
      <p style="color:#9ca3af;font-size:12px;margin:16px 0 0">
        هذه رسالة تلقائية من منصة محاسب اي — يرجى عدم الرد على هذا البريد.
      </p>
    </div>
  </div>
</body>
</html>`;

  if (!resend) {
    console.log(`[INVOICE-EMAIL] to=${to} invoiceId=${id}`);
    return NextResponse.json({ sent: true, preview: true });
  }

  const result = await resend.emails.send({ from: FROM_EMAIL, to, subject: emailSubject, html });
  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  return NextResponse.json({ sent: true, messageId: result.data?.id });
}
