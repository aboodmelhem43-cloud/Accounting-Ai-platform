import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { getServerT } from "@/lib/i18n/server";
import PrintButton from "./PrintButton";
import Link from "next/link";

type LineItem = { description: string; quantity: number; unitPrice: number };

type ExtractedData = {
  invoiceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;
  sellerName?: string;
  sellerTaxNumber?: string;
  sellerAddress?: string;
  customerName?: string;
  customerTaxNumber?: string;
  customerAddress?: string;
  customerPhone?: string;
  customerEmail?: string;
  lineItems?: LineItem[];
  subtotal?: number;
  taxRate?: number;
  taxAmount?: number;
  grandTotal?: number;
  currency?: string;
  currencySymbol?: string;
  notes?: string;
  eInvoiceSystem?: string | null;
};

export default async function InvoiceViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { id } = await params;
  const { lang } = await getServerT();
  const isAr = lang === "ar";
  const locale = isAr ? "ar" : "en";

  const invoice = await prisma.invoice.findUnique({ where: { id } });

  if (!invoice) notFound();
  if (invoice.businessId !== session.user.businessId) notFound();
  if (invoice.fileType !== "created") redirect(`/invoices/${id}/review`);

  const d = invoice.extractedData as ExtractedData | null;
  const lineItems: LineItem[] = d?.lineItems ?? [];
  const currencySymbol = d?.currencySymbol ?? "";

  const fmt = (n: number) =>
    `${n.toLocaleString(locale, { minimumFractionDigits: 2 })} ${currencySymbol}`;

  const fmtDate = (s?: string) =>
    s ? new Date(s).toLocaleDateString(locale) : "—";

  return (
    <div className="space-y-4">
      {/* Toolbar — hidden when printing */}
      <div className="flex items-center justify-between print:hidden">
        <Link href="/invoices" className="text-sm text-gray-500 hover:text-gray-700">
          ← {isAr ? "العودة للفواتير" : "Back to Invoices"}
        </Link>
        <PrintButton label={isAr ? "🖨️ طباعة" : "🖨️ Print"} />
      </div>

      {/* Invoice document */}
      <div
        id="invoice-print"
        className="card max-w-3xl mx-auto p-8 print:shadow-none print:border-none"
        dir={isAr ? "rtl" : "ltr"}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isAr ? "فاتورة ضريبية" : "Tax Invoice"}
            </h1>
            {d?.eInvoiceSystem && (
              <p className="text-xs text-gray-400 mt-1">{d.eInvoiceSystem}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">{isAr ? "رقم الفاتورة" : "Invoice #"}</p>
            <p className="text-lg font-mono font-semibold text-gray-800">
              {d?.invoiceNumber ?? "—"}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {isAr ? "تاريخ الإصدار:" : "Date:"} {fmtDate(d?.invoiceDate)}
            </p>
            {d?.dueDate && (
              <p className="text-sm text-gray-500">
                {isAr ? "تاريخ الاستحقاق:" : "Due:"} {fmtDate(d.dueDate)}
              </p>
            )}
          </div>
        </div>

        {/* Parties */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase mb-2">
              {isAr ? "البائع" : "Seller"}
            </p>
            <p className="font-semibold text-gray-800">{d?.sellerName ?? "—"}</p>
            {d?.sellerTaxNumber && (
              <p className="text-sm text-gray-500">
                {isAr ? "الرقم الضريبي:" : "Tax #:"} {d.sellerTaxNumber}
              </p>
            )}
            {d?.sellerAddress && (
              <p className="text-sm text-gray-500 mt-1">{d.sellerAddress}</p>
            )}
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase mb-2">
              {isAr ? "العميل" : "Customer"}
            </p>
            <p className="font-semibold text-gray-800">{d?.customerName ?? "—"}</p>
            {d?.customerTaxNumber && (
              <p className="text-sm text-gray-500">
                {isAr ? "الرقم الضريبي:" : "Tax #:"} {d.customerTaxNumber}
              </p>
            )}
            {d?.customerAddress && (
              <p className="text-sm text-gray-500 mt-1">{d.customerAddress}</p>
            )}
            {d?.customerPhone && (
              <p className="text-sm text-gray-500">{d.customerPhone}</p>
            )}
            {d?.customerEmail && (
              <p className="text-sm text-gray-500">{d.customerEmail}</p>
            )}
          </div>
        </div>

        {/* Line items */}
        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-right py-2 font-semibold text-gray-600">
                {isAr ? "الوصف" : "Description"}
              </th>
              <th className="text-center py-2 font-semibold text-gray-600 w-20">
                {isAr ? "الكمية" : "Qty"}
              </th>
              <th className="text-right py-2 font-semibold text-gray-600 w-32">
                {isAr ? "سعر الوحدة" : "Unit Price"}
              </th>
              <th className="text-right py-2 font-semibold text-gray-600 w-32">
                {isAr ? "الإجمالي" : "Total"}
              </th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, i) => (
              <tr key={i} className="border-b border-gray-100">
                <td className="py-2 text-gray-800">{item.description}</td>
                <td className="py-2 text-center text-gray-600">{item.quantity}</td>
                <td className="py-2 text-gray-600">{fmt(item.unitPrice)}</td>
                <td className="py-2 font-medium text-gray-800">
                  {fmt(item.quantity * item.unitPrice)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>{isAr ? "المجموع قبل الضريبة" : "Subtotal"}</span>
              <span>{d?.subtotal != null ? fmt(d.subtotal) : "—"}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>
                {isAr ? "الضريبة" : "Tax"} ({d?.taxRate ?? 0}%)
              </span>
              <span>{d?.taxAmount != null ? fmt(d.taxAmount) : "—"}</span>
            </div>
            <div className="flex justify-between font-bold text-base text-gray-900 border-t border-gray-200 pt-2">
              <span>{isAr ? "الإجمالي" : "Grand Total"}</span>
              <span>{d?.grandTotal != null ? fmt(d.grandTotal) : "—"}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {d?.notes && (
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-400 uppercase mb-1">
              {isAr ? "ملاحظات" : "Notes"}
            </p>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{d.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
