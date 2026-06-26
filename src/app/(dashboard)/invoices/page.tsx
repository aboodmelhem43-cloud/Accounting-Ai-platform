import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getComplianceModule } from "@/compliance";
import { getServerT } from "@/lib/i18n/server";
import Link from "next/link";
import { Suspense } from "react";
import InvoiceFilters from "./InvoiceFilters";

type ExtractedData = {
  vendorName?: string;
  customerName?: string;
  totalAmount?: number;
  invoiceNumber?: string;
  invoiceDate?: string;
};

function getPeriodRange(period: string): { from: Date; to: Date } | null {
  const now = new Date();
  if (period === "this_month") {
    return {
      from: new Date(now.getFullYear(), now.getMonth(), 1),
      to: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
    };
  }
  if (period === "last_month") {
    return {
      from: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      to: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59),
    };
  }
  if (period === "this_year") {
    return {
      from: new Date(now.getFullYear(), 0, 1),
      to: new Date(now.getFullYear(), 11, 31, 23, 59, 59),
    };
  }
  return null;
}

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; period?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const { t, lang } = await getServerT();
  const locale = lang === "ar" ? "ar" : "en";
  const isAr = lang === "ar";
  const compliance = getComplianceModule(session.user.country);
  const { businessId } = session.user;

  const { q = "", status = "", period = "" } = await searchParams;
  const periodRange = getPeriodRange(period);

  const allInvoices = await prisma.invoice.findMany({
    where: {
      businessId,
      ...(status ? { status: status as "PENDING_REVIEW" | "CONFIRMED" | "REJECTED" } : {}),
      ...(periodRange ? { createdAt: { gte: periodRange.from, lte: periodRange.to } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  // Text search over JSON fields in memory
  const needle = q.trim().toLowerCase();
  const invoices = needle
    ? allInvoices.filter((inv) => {
        const d = inv.extractedData as ExtractedData | null;
        const haystack = [
          d?.invoiceNumber,
          d?.vendorName,
          d?.customerName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(needle);
      })
    : allInvoices;

  const fmt = (n: number) =>
    `${n.toLocaleString(locale, { minimumFractionDigits: 2 })} ${isAr ? compliance.currencySymbol : compliance.currencySymbolEn}`;

  const statusMap: Record<string, { label: string; cls: string }> = {
    PENDING_REVIEW: { label: t("invoices.status.pending"), cls: "bg-yellow-100 text-yellow-700" },
    CONFIRMED: { label: t("invoices.status.confirmed"), cls: "bg-green-100 text-green-700" },
    REJECTED: { label: t("invoices.status.rejected"), cls: "bg-red-100 text-red-700" },
  };

  const hasFilters = !!(q || status || period);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("invoices.title")}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {invoices.length}{hasFilters ? ` ${isAr ? "نتيجة" : "results"}` : ` ${isAr ? "فاتورة" : "invoices"}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/invoices/create" className="btn-primary">
            ✏️ {isAr ? "إنشاء فاتورة" : "Create Invoice"}
          </Link>
          <Link href="/invoices/upload" className="btn-secondary">
            ⬆️ {t("invoices.upload")}
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Suspense fallback={null}>
        <InvoiceFilters />
      </Suspense>

      {invoices.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-5xl mb-4">{hasFilters ? "🔍" : "🧾"}</div>
          <p className="text-gray-500">
            {hasFilters
              ? (isAr ? "لا توجد فواتير تطابق البحث" : "No invoices match your search")
              : t("invoices.empty")}
          </p>
          {hasFilters ? (
            <Link href="/invoices" className="btn-secondary inline-flex mt-4">
              {isAr ? "إلغاء الفلتر" : "Clear filters"}
            </Link>
          ) : (
            <div className="flex gap-3 justify-center mt-4">
              <Link href="/invoices/create" className="btn-primary inline-flex">
                ✏️ {isAr ? "إنشاء فاتورة" : "Create Invoice"}
              </Link>
              <Link href="/invoices/upload" className="btn-secondary inline-flex">
                {t("invoices.upload")}
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-right px-4 py-3 font-medium text-gray-600">
                  {isAr ? "رقم الفاتورة" : "Invoice #"}
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">{t("invoices.vendor")}</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">{t("invoices.type")}</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">{t("invoices.amount")}</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">{t("invoices.date")}</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">{t("invoices.status")}</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.map((inv) => {
                const d = inv.extractedData as ExtractedData | null;
                const isCreated = inv.fileType === "created";
                const party = isCreated
                  ? (d?.customerName ?? "—")
                  : (d?.vendorName ?? d?.customerName ?? "—");
                const invoiceNum = d?.invoiceNumber ?? "—";
                const invoiceDate = d?.invoiceDate
                  ? new Date(d.invoiceDate).toLocaleDateString(locale)
                  : new Date(inv.createdAt).toLocaleDateString(locale);
                const s = statusMap[inv.status] ?? { label: inv.status, cls: "bg-gray-100 text-gray-600" };
                return (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-gray-700 text-xs">{invoiceNum}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{party}</td>
                    <td className="px-4 py-3 text-gray-500">
                      <span className="flex items-center gap-1">
                        {isCreated && (
                          <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                            {isAr ? "يدوية" : "Manual"}
                          </span>
                        )}
                        {inv.invoiceType === "PURCHASE" ? t("invoices.type.purchase") : t("invoices.type.sales")}
                      </span>
                    </td>
                    <td className="px-4 py-3">{d?.totalAmount ? fmt(d.totalAmount) : "—"}</td>
                    <td className="px-4 py-3 text-gray-500">{invoiceDate}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${s.cls}`}>
                        {s.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {isCreated ? (
                        <Link href={`/invoices/${inv.id}/view`} className="text-blue-600 text-xs hover:underline">
                          {isAr ? "عرض / طباعة" : "View / Print"}
                        </Link>
                      ) : inv.status === "PENDING_REVIEW" ? (
                        <Link href={`/invoices/${inv.id}/review`} className="text-blue-600 text-xs hover:underline">
                          {t("invoices.review")}
                        </Link>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
