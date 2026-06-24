import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getComplianceModule } from "@/compliance";
import { getServerT } from "@/lib/i18n/server";
import Link from "next/link";

type ExtractedData = {
  vendorName?: string;
  customerName?: string;
  totalAmount?: number;
  invoiceNumber?: string;
  invoiceDate?: string;
};

export default async function InvoicesPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const { t, lang } = await getServerT();
  const locale = lang === "ar" ? "ar" : "en";
  const isAr = lang === "ar";
  const compliance = getComplianceModule(session.user.country);

  const invoices = await prisma.invoice.findMany({
    where: { businessId: session.user.businessId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const fmt = (n: number) =>
    `${n.toLocaleString(locale, { minimumFractionDigits: 2 })} ${isAr ? compliance.currencySymbol : compliance.currencySymbolEn}`;

  const statusMap: Record<string, { label: string; cls: string }> = {
    PENDING_REVIEW: { label: t("invoices.status.pending"), cls: "bg-yellow-100 text-yellow-700" },
    CONFIRMED: { label: t("invoices.status.confirmed"), cls: "bg-green-100 text-green-700" },
    REJECTED: { label: t("invoices.status.rejected"), cls: "bg-red-100 text-red-700" },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("invoices.title")}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {invoices.length} {isAr ? "فاتورة" : "invoices"}
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

      {invoices.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-5xl mb-4">🧾</div>
          <p className="text-gray-500">{t("invoices.empty")}</p>
          <div className="flex gap-3 justify-center mt-4">
            <Link href="/invoices/create" className="btn-primary inline-flex">
              ✏️ {isAr ? "إنشاء فاتورة" : "Create Invoice"}
            </Link>
            <Link href="/invoices/upload" className="btn-secondary inline-flex">
              {t("invoices.upload")}
            </Link>
          </div>
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
                const status = statusMap[inv.status] ?? { label: inv.status, cls: "bg-gray-100 text-gray-600" };
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
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${status.cls}`}>
                        {status.label}
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
