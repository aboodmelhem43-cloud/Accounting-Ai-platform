import Link from "next/link";

const REPORTS = [
  {
    href: "/reports/income",
    icon: "📈",
    titleAr: "قائمة الدخل",
    titleEn: "Income Statement",
    descAr: "الإيرادات والمصروفات وصافي الربح لفترة زمنية",
    descEn: "Revenue, expenses, and net profit for a period",
    color: "blue",
  },
  {
    href: "/reports/balance-sheet",
    icon: "⚖️",
    titleAr: "الميزانية العمومية",
    titleEn: "Balance Sheet",
    descAr: "الأصول والخصوم وحقوق الملكية في تاريخ محدد",
    descEn: "Assets, liabilities and equity as of a specific date",
    color: "green",
  },
  {
    href: "/reports/cashflow",
    icon: "💧",
    titleAr: "قائمة التدفقات النقدية",
    titleEn: "Cash Flow Statement",
    descAr: "التدفقات النقدية التشغيلية والاستثمارية والتمويلية",
    descEn: "Operating, investing and financing cash flows",
    color: "purple",
  },
  {
    href: "/reports/ledger",
    icon: "📋",
    titleAr: "دفتر الأستاذ العام",
    titleEn: "General Ledger",
    descAr: "تفاصيل حركات كل حساب مع الرصيد التراكمي",
    descEn: "Detailed movements for each account with running balance",
    color: "orange",
  },
  {
    href: "/reports/trial-balance",
    icon: "⚖️",
    titleAr: "ميزان المراجعة",
    titleEn: "Trial Balance",
    descAr: "أرصدة جميع الحسابات في تاريخ محدد للتحقق من توازن القيود",
    descEn: "All account balances as of a date to verify double-entry balance",
    color: "teal",
  },
  {
    href: "/reports/aging",
    icon: "📅",
    titleAr: "تقرير تقادم الذمم",
    titleEn: "AR / AP Aging",
    descAr: "تصنيف مديونيات العملاء ومستحقات الموردين حسب عمر الفاتورة",
    descEn: "Receivables and payables grouped by invoice age buckets",
    color: "red",
  },
];

const colorMap: Record<string, string> = {
  blue: "bg-blue-100 text-blue-600",
  green: "bg-green-100 text-green-600",
  purple: "bg-purple-100 text-purple-600",
  orange: "bg-orange-100 text-orange-600",
  teal: "bg-teal-100 text-teal-600",
  red: "bg-red-100 text-red-600",
};

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">التقارير المالية / Financial Reports</h1>
        <p className="text-gray-500 text-sm mt-1">
          اختر التقرير الذي تريده — Select a report to view
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {REPORTS.map((r) => (
          <Link
            key={r.href}
            href={r.href}
            className="card hover:shadow-md transition-all hover:-translate-y-0.5 group"
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${colorMap[r.color]}`}>
                {r.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                  {r.titleAr}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">{r.titleEn}</p>
                <p className="text-xs text-gray-400 mt-2">{r.descAr}</p>
                <p className="text-xs text-gray-400">{r.descEn}</p>
              </div>
              <span className="text-gray-300 group-hover:text-blue-400 transition-colors text-xl flex-shrink-0">→</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
