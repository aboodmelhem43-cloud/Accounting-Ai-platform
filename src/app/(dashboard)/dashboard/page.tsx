import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeIncomeStatement } from "@/lib/ledger";
import { getComplianceModule } from "@/compliance";
import { getServerT } from "@/lib/i18n/server";
import Link from "next/link";
import { Suspense } from "react";
import DashboardCharts from "@/components/DashboardCharts";
import UpgradedToast from "@/components/UpgradedToast";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const { t, lang } = await getServerT();
  const { businessId, country, currency } = session.user;
  const compliance = getComplianceModule(country);
  const locale = lang === "ar" ? "ar" : "en";

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
    n.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const monthName = now.toLocaleDateString(locale, { month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      <Suspense><UpgradedToast /></Suspense>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("dashboard.title")}</h1>
        <p className="text-gray-500 text-sm mt-1">
          {session.user.businessName} · {lang === "ar" ? compliance.countryNameAr : compliance.countryNameEn} · {monthName}
        </p>
      </div>

      {compliance.eInvoiceRequired && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          <span className="font-semibold">⚠️ {lang === "ar" ? "تنبيه الفاتورة الإلكترونية:" : "E-Invoice Notice:"}</span>{" "}
          {compliance.eInvoiceNote}
        </div>
      )}

      {recentInvoices.length === 0 ? (
        <div className="card border-2 border-dashed border-blue-200 bg-blue-50/40 text-center py-12 px-6">
          <div className="text-5xl mb-4">🚀</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            {lang === "ar" ? "مرحباً بك في محاسب اي!" : "Welcome to MohasabAi!"}
          </h2>
          <p className="text-gray-500 text-sm mb-8 max-w-md mx-auto">
            {lang === "ar"
              ? "ابدأ بإضافة أول فاتورة لك — سواء بإنشائها يدوياً أو برفع صورة/PDF، وسيُنشئ النظام القيود المحاسبية تلقائياً."
              : "Start by adding your first invoice — create it manually or upload a photo/PDF, and the system will post the journal entries automatically."}
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/invoices/create" className="btn-primary">
              📝 {lang === "ar" ? "إنشاء فاتورة" : "Create Invoice"}
            </Link>
            <Link href="/invoices/upload" className="btn-secondary">
              ⬆️ {lang === "ar" ? "رفع فاتورة" : "Upload Invoice"}
            </Link>
            <Link href="/chat" className="btn-secondary">
              🤖 {lang === "ar" ? "اسأل المساعد الذكي" : "Ask AI Assistant"}
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-right">
            {[
              { step: "1", icon: "🧾", title: lang === "ar" ? "أضف فاتورتك الأولى" : "Add your first invoice", desc: lang === "ar" ? "أنشئ أو ارفع فاتورة مبيعات أو مشتريات" : "Create or upload a sales or purchase invoice" },
              { step: "2", icon: "📒", title: lang === "ar" ? "راجع القيود التلقائية" : "Review auto-posted entries", desc: lang === "ar" ? "يُنشئ النظام قيود مزدوجة القيد تلقائياً" : "The system creates double-entry journal entries automatically" },
              { step: "3", icon: "📊", title: lang === "ar" ? "استعرض التقارير" : "View your reports", desc: lang === "ar" ? "قائمة الدخل والميزانية العمومية جاهزة فوراً" : "Income statement and balance sheet ready instantly" },
            ].map(({ step, icon, title, desc }) => (
              <div key={step} className="bg-white rounded-xl border border-gray-100 p-4 text-start">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">{step}</span>
                  <span className="text-lg">{icon}</span>
                </div>
                <p className="text-sm font-semibold text-gray-800">{title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard
              title={t("dashboard.total_revenue")}
              value={`${fmt(statement.totalRevenue)} ${lang === "ar" ? compliance.currencySymbol : compliance.currencySymbolEn}`}
              sub={monthName}
              color="green"
              icon="📈"
            />
            <SummaryCard
              title={t("dashboard.total_expenses")}
              value={`${fmt(statement.totalExpenses)} ${lang === "ar" ? compliance.currencySymbol : compliance.currencySymbolEn}`}
              sub={monthName}
              color="red"
              icon="📉"
            />
            <SummaryCard
              title={t("dashboard.net_income")}
              value={`${fmt(statement.netProfit)} ${lang === "ar" ? compliance.currencySymbol : compliance.currencySymbolEn}`}
              sub={monthName}
              color={statement.netProfit >= 0 ? "blue" : "red"}
              icon="💰"
            />
            <SummaryCard
              title={lang === "ar" ? "الفواتير المعلّقة" : "Pending Invoices"}
              value={String(pendingCount)}
              sub={lang === "ar" ? `من ${invoiceCount} فاتورة مؤكدة` : `of ${invoiceCount} confirmed`}
              color="yellow"
              icon="🧾"
              href="/invoices"
            />
          </div>

          <div className="card">
            <h2 className="font-semibold text-gray-800 mb-4">{t("dashboard.quick_actions")}</h2>
            <div className="flex flex-wrap gap-3">
              <Link href="/invoices/upload" className="btn-primary">⬆️ {t("dashboard.upload_invoice")}</Link>
              <Link href="/reports/income" className="btn-secondary">📊 {t("nav.income")}</Link>
              <Link href="/chat" className="btn-secondary">🤖 {t("dashboard.ask_ai")}</Link>
              <Link href="/journal" className="btn-secondary">📒 {t("nav.journal")}</Link>
            </div>
          </div>

          <DashboardCharts />
        </>
      )}

      {recentInvoices.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">{t("dashboard.recent_invoices")}</h2>
            <Link href="/invoices" className="text-sm text-blue-600 hover:underline">{t("dashboard.view_all")}</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentInvoices.map((inv) => {
              const extracted = inv.extractedData as { vendorName?: string; totalAmount?: number } | null;
              const statusMap: Record<string, { label: string; cls: string }> = {
                PENDING_REVIEW: { label: t("invoices.status.pending"), cls: "bg-yellow-100 text-yellow-700" },
                CONFIRMED: { label: t("invoices.status.confirmed"), cls: "bg-green-100 text-green-700" },
                REJECTED: { label: t("invoices.status.rejected"), cls: "bg-red-100 text-red-700" },
              };
              const s = statusMap[inv.status] ?? { label: inv.status, cls: "bg-gray-100 text-gray-600" };
              return (
                <div key={inv.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {extracted?.vendorName ?? (lang === "ar" ? "فاتورة" : "Invoice")}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(inv.createdAt).toLocaleDateString(locale)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {extracted?.totalAmount && (
                      <span className="text-sm font-medium">
                        {fmt(extracted.totalAmount)} {lang === "ar" ? compliance.currencySymbol : compliance.currencySymbolEn}
                      </span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.cls}`}>{s.label}</span>
                    {inv.status === "PENDING_REVIEW" && (
                      <Link href={`/invoices/${inv.id}/review`} className="text-xs text-blue-600 hover:underline">
                        {t("invoices.review")}
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
