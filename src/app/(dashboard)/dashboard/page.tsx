import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeIncomeStatement } from "@/lib/ledger";
import { getComplianceModule } from "@/compliance";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const { businessId, country, currency } = session.user;
  const compliance = getComplianceModule(country);

  // بيانات الشهر الحالي
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [statement, invoiceCount, pendingCount, recentInvoices] = await Promise.all([
    computeIncomeStatement(businessId, from, to),
    prisma.invoice.count({ where: { businessId, status: "CONFIRMED" } }),
    prisma.invoice.count({ where: { businessId, status: "PENDING_REVIEW" } }),
    prisma.invoice.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const fmt = (n: number) =>
    n.toLocaleString("ar", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const monthName = now.toLocaleDateString("ar", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      {/* الترحيب */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">لوحة التحكم</h1>
        <p className="text-gray-500 text-sm mt-1">
          {session.user.businessName} · {compliance.countryNameAr} · {monthName}
        </p>
      </div>

      {/* تحذير فاتورة إلكترونية */}
      {compliance.eInvoiceRequired && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          <span className="font-semibold">⚠️ تنبيه الفاتورة الإلكترونية:</span>{" "}
          {compliance.eInvoiceNote}
        </div>
      )}

      {/* بطاقات الملخص */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="إجمالي الإيرادات"
          value={`${fmt(statement.totalRevenue)} ${compliance.currencySymbol}`}
          sub={monthName}
          color="green"
          icon="📈"
        />
        <SummaryCard
          title="إجمالي المصروفات"
          value={`${fmt(statement.totalExpenses)} ${compliance.currencySymbol}`}
          sub={monthName}
          color="red"
          icon="📉"
        />
        <SummaryCard
          title="صافي الربح"
          value={`${fmt(statement.netProfit)} ${compliance.currencySymbol}`}
          sub={monthName}
          color={statement.netProfit >= 0 ? "blue" : "red"}
          icon="💰"
        />
        <SummaryCard
          title="الفواتير المعلّقة"
          value={String(pendingCount)}
          sub={`من ${invoiceCount} فاتورة مؤكدة`}
          color="yellow"
          icon="🧾"
          href="/invoices"
        />
      </div>

      {/* الإجراءات السريعة */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">إجراءات سريعة</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/invoices/upload" className="btn-primary">⬆️ رفع فاتورة جديدة</Link>
          <Link href="/reports/income" className="btn-secondary">📊 عرض قائمة الدخل</Link>
          <Link href="/chat" className="btn-secondary">🤖 اسأل المساعد الذكي</Link>
          <Link href="/journal" className="btn-secondary">📒 دفتر اليومية</Link>
        </div>
      </div>

      {/* آخر الفواتير */}
      {recentInvoices.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">آخر الفواتير</h2>
            <Link href="/invoices" className="text-sm text-blue-600 hover:underline">عرض الكل</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentInvoices.map((inv) => {
              const extracted = inv.extractedData as { vendorName?: string; totalAmount?: number } | null;
              return (
                <div key={inv.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {extracted?.vendorName ?? "فاتورة"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(inv.createdAt).toLocaleDateString("ar")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {extracted?.totalAmount && (
                      <span className="text-sm font-medium">
                        {fmt(extracted.totalAmount)} {compliance.currencySymbol}
                      </span>
                    )}
                    <StatusBadge status={inv.status} />
                    {inv.status === "PENDING_REVIEW" && (
                      <Link
                        href={`/invoices/${inv.id}/review`}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        مراجعة
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  title, value, sub, color, icon, href,
}: {
  title: string; value: string; sub: string; color: string; icon: string; href?: string;
}) {
  const colors: Record<string, string> = {
    green: "bg-green-50 border-green-200",
    red: "bg-red-50 border-red-200",
    blue: "bg-blue-50 border-blue-200",
    yellow: "bg-yellow-50 border-yellow-200",
  };

  const content = (
    <div className={`rounded-xl border p-5 ${colors[color] ?? colors.blue}`}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-sm font-medium text-gray-600">{title}</div>
      <div className="text-xl font-bold text-gray-900 mt-1 truncate">{value}</div>
      <div className="text-xs text-gray-400 mt-1">{sub}</div>
    </div>
  );

  if (href) return <Link href={href} className="block hover:opacity-90 transition-opacity">{content}</Link>;
  return content;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    PENDING_REVIEW: { label: "بانتظار المراجعة", cls: "bg-yellow-100 text-yellow-700" },
    CONFIRMED: { label: "مؤكدة", cls: "bg-green-100 text-green-700" },
    REJECTED: { label: "مرفوضة", cls: "bg-red-100 text-red-700" },
  };
  const s = map[status] ?? { label: status, cls: "bg-gray-100 text-gray-600" };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.cls}`}>{s.label}</span>;
}
