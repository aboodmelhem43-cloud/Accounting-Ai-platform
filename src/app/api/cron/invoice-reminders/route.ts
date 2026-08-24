import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendInvoiceOverdueEmail } from "@/lib/email";

// Runs daily at 09:00 UTC. Sends overdue reminder to contacts for invoices
// that became overdue within the last 25 hours.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const now = new Date();
  const since = new Date(now.getTime() - 25 * 60 * 60 * 1000);

  // Invoices that became overdue in the last 25 hours and are still unpaid
  const overdueInvoices = await prisma.invoice.findMany({
    where: {
      status: "CONFIRMED",
      paymentStatus: { in: ["UNPAID", "PARTIALLY_PAID"] },
      dueDate: { gte: since, lte: now },
      contact: { email: { not: null } },
    },
    select: {
      id: true,
      dueDate: true,
      extractedData: true,
      invoiceType: true,
      contact: { select: { name: true, email: true } },
      business: { select: { name: true, baseCurrency: true } },
    },
  });

  let sent = 0;
  let failed = 0;

  for (const inv of overdueInvoices) {
    const contact = inv.contact;
    if (!contact?.email) continue;

    const extracted = inv.extractedData as {
      invoiceNumber?: string;
      totalAmount?: number;
      vendorName?: string;
    } | null;

    try {
      await sendInvoiceOverdueEmail({
        email: contact.email,
        contactName: contact.name,
        businessName: inv.business.name,
        invoiceNumber: extracted?.invoiceNumber ?? inv.id.slice(-6).toUpperCase(),
        amount: extracted?.totalAmount ?? 0,
        currency: inv.business.baseCurrency,
        dueDate: inv.dueDate!,
      });
      sent++;
    } catch (e) {
      failed++;
      console.error(`[cron/invoice-reminders] failed for ${contact.email}:`, e);
    }
  }

  console.log(`[cron/invoice-reminders] sent=${sent} failed=${failed}`);
  return NextResponse.json({ ok: true, total: overdueInvoices.length, sent, failed });
}
