import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getComplianceModule } from "@/compliance";
import Link from "next/link";

export default async function InvoicesPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const compliance = getComplianceModule(session.user.country);
  const invoices = await prisma.invoice.findMany({
    where: { businessId: session.user.businessId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const fmt = (n: number) =>
    `${n.toLocaleString("ar", { minimumFractionDigits: 2 })} ${compliance.currencySymbol}`;

  const statusMap: Record<string, { label: string; cls: string }> = {
    PENDING_REVIEW: { label: "بانتظار المراجعة", cls: "bg-yellow-100 text-yellow-700" },
    CONFIRMED: { label: "مؤكدة", cls: "bg-green-100 text-green-700" },
    REJECTED: { label: "مرفوضة", cls: "bg-red-100 text-red-700" },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">الفواتير</h1>
          <p className="text-gray-500 text-sm mt-1">{invoices.length} فاتورة</p>
        </div>
        <Link href="/invoices/upload" className="btn-primary">⬆️ رفع فاتورة جديدة</Link>
      </div>

      {invoices.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-5xl mb-4">🧾</div>
          <p className="text-gray-500">لا توجد فواتير بعد.</p>
          <Link href="/invoices/upload" className="btn-primary mt-4 inline-flex">رفع أول فاتورة</Link>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-right px-4 py-3 font-medium text-gray-600">المورد / العميل</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">النوع</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">المبلغ</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">التاريخ</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">الحالة</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.map((inv) => {
                const d = inv.extractedData as { vendorName?: string; customerName?: string; totalAmount?: number } | null;
                const party = d?.vendorName ?? d?.customerName ?? "—";
                const status = statusMap[inv.status] ?? { label: inv.status, cls: "bg-gray-100 text-gray-600" };
                return (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{party}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {inv.invoiceType === "PURCHASE" ? "مشتريات" : "مبيعات"}
                    </td>
                    <td className="px-4 py-3">{d?.totalAmount ? fmt(d.totalAmount) : "—"}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(inv.createdAt).toLocaleDateString("ar")}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${status.cls}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {inv.status === "PENDING_REVIEW" && (
                        <Link href={`/invoices/${inv.id}/review`} className="text-blue-600 text-xs hover:underline">
                          مراجعة وتأكيد
                        </Link>
                      )}
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
