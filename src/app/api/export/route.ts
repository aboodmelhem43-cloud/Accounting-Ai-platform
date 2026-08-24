import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const businessId = session.user.businessId;

  const [accounts, journalEntries, invoices, contacts, bankAccounts] = await Promise.all([
    prisma.account.findMany({
      where: { businessId },
      orderBy: { code: "asc" },
      select: { code: true, name: true, nameAr: true, type: true, isSystem: true, createdAt: true },
    }),
    prisma.journalEntry.findMany({
      where: { businessId },
      orderBy: { date: "desc" },
      take: 5000,
      select: {
        date: true,
        description: true,
        status: true,
        sourceType: true,
        lines: {
          select: {
            debit: true,
            credit: true,
            account: { select: { code: true, name: true } },
          },
        },
      },
    }),
    prisma.invoice.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      take: 5000,
      select: {
        invoiceType: true,
        status: true,
        paymentStatus: true,
        dueDate: true,
        createdAt: true,
        extractedData: true,
        contact: { select: { name: true } },
      },
    }),
    prisma.contact.findMany({
      where: { businessId },
      orderBy: { name: "asc" },
      select: { name: true, type: true, email: true, phone: true, address: true, taxNumber: true, notes: true },
    }),
    prisma.bankAccount.findMany({
      where: { businessId },
      select: { name: true, bankName: true, accountNumber: true, iban: true, currency: true, openingBalance: true },
    }),
  ]);

  const wb = XLSX.utils.book_new();

  // Sheet 1: Chart of Accounts
  const accountRows = accounts.map((a) => ({
    Code: a.code,
    Name: a.name,
    "Name (AR)": a.nameAr ?? "",
    Type: a.type,
    "System Account": a.isSystem ? "Yes" : "No",
    "Created At": new Date(a.createdAt).toLocaleDateString(),
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(accountRows), "Chart of Accounts");

  // Sheet 2: Journal Entries (flattened lines)
  const jeRows: Record<string, string | number>[] = [];
  for (const je of journalEntries) {
    for (const line of je.lines) {
      jeRows.push({
        Date: new Date(je.date).toLocaleDateString(),
        Description: je.description,
        Status: je.status,
        Source: je.sourceType,
        "Account Code": line.account.code,
        "Account Name": line.account.name,
        Debit: Number(line.debit),
        Credit: Number(line.credit),
      });
    }
  }
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(jeRows.length ? jeRows : [{}]), "Journal Entries");

  // Sheet 3: Invoices — use extractedData for numbers since Invoice stores data as JSON
  const invoiceRows = invoices.map((inv) => {
    const extracted = inv.extractedData as {
      invoiceNumber?: string;
      totalAmount?: number;
      vendorName?: string;
      invoiceDate?: string;
    } | null;
    return {
      "Invoice Number": extracted?.invoiceNumber ?? "",
      Type: inv.invoiceType,
      Status: inv.status,
      "Payment Status": inv.paymentStatus,
      "Invoice Date": extracted?.invoiceDate ?? new Date(inv.createdAt).toLocaleDateString(),
      "Due Date": inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "",
      Total: extracted?.totalAmount ?? "",
      Contact: inv.contact?.name ?? extracted?.vendorName ?? "",
      "Created At": new Date(inv.createdAt).toLocaleDateString(),
    };
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(invoiceRows.length ? invoiceRows : [{}]), "Invoices");

  // Sheet 4: Contacts
  const contactRows = contacts.map((c) => ({
    Name: c.name,
    Type: c.type,
    Email: c.email ?? "",
    Phone: c.phone ?? "",
    Address: c.address ?? "",
    "Tax Number": c.taxNumber ?? "",
    Notes: c.notes ?? "",
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(contactRows.length ? contactRows : [{}]), "Contacts");

  // Sheet 5: Bank Accounts
  const bankRows = bankAccounts.map((b) => ({
    Name: b.name,
    Bank: b.bankName,
    "Account Number": b.accountNumber ?? "",
    IBAN: b.iban ?? "",
    Currency: b.currency,
    "Opening Balance": Number(b.openingBalance),
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(bankRows.length ? bankRows : [{}]), "Bank Accounts");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="business-data-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
