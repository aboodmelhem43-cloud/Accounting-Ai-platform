"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useLang } from "./LanguageProvider";

interface SidebarProps {
  businessName: string;
  country: string;
  currency: string;
  isAdmin?: boolean;
}

interface NavItem {
  href: string;
  label: string;
  icon: string;
  children?: { href: string; label: string; icon: string }[];
}

export default function Sidebar({ businessName, country, currency, isAdmin }: SidebarProps) {
  const pathname = usePathname();
  const { t, lang, toggleLang } = useLang();
  const isAr = lang === "ar";
  const { data: session } = useSession();

  // Check admin via session email — works client-side without server prop
  const adminEmails = (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS ?? "aboodmelhem43@gmail.com")
    .split(",").map((e) => e.trim().toLowerCase());
  const showAdmin = isAdmin || adminEmails.includes((session?.user?.email ?? "").toLowerCase());
  const NAV_ITEMS: NavItem[] = [
    { href: "/dashboard", label: t("nav.dashboard"), icon: "🏠" },
    { href: "/contacts", label: isAr ? "العملاء والموردون" : "Contacts", icon: "👥" },
    { href: "/bank-accounts", label: isAr ? "الحسابات البنكية" : "Bank Accounts", icon: "🏦" },
    { href: "/bank-reconciliation", label: isAr ? "تسوية بنكية" : "Reconciliation", icon: "🔄" },
    {
      href: "/invoices",
      label: t("nav.invoices"),
      icon: "🧾",
      children: [
        { href: "/invoices/upload", label: t("nav.upload"), icon: "⬆️" },
        { href: "/invoices/create", label: isAr ? "إنشاء فاتورة" : "Create Invoice", icon: "📝" },
      ],
    },
    { href: "/reports", label: isAr ? "التقارير" : "Reports", icon: "📊" },
    { href: "/journal", label: t("nav.journal"), icon: "📒" },
    { href: "/currency", label: isAr ? "محوّل العملات" : "Currency", icon: "💱" },
    { href: "/chat", label: t("nav.chat"), icon: "🤖" },
    { href: "/settings", label: isAr ? "الإعدادات" : "Settings", icon: "⚙️" },
    { href: "/pricing", label: isAr ? "الخطط والأسعار" : "Pricing", icon: "💎" },
    ...(showAdmin ? [{ href: "/admin", label: isAr ? "لوحة الإدارة" : "Admin", icon: "🛡️" }] : []),
  ];

  return (
    <aside className="w-64 bg-white border-l border-gray-200 flex flex-col h-screen sticky top-0">
      {/* الشعار */}
      <div className="p-6 border-b border-gray-100">
        <div className="text-xl font-bold text-blue-700">{t("app.name")}</div>
        <div className="text-sm text-gray-500 mt-1 truncate">{businessName}</div>
        <div className="text-xs text-gray-400 mt-0.5">{country} · {currency}</div>
      </div>

      {/* القائمة */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const isParentActive = item.children
            ? pathname.startsWith(item.href + "/")
            : pathname.startsWith(item.href + "/");
          return (
            <div key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive || (!item.children && isParentActive)
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
              {item.children && (
                <div className={`mt-0.5 mb-0.5 ${isAr ? "mr-4 border-r-2" : "ml-4 border-l-2"} border-gray-100 space-y-0.5`}>
                  {item.children.map((child) => {
                    const childActive = pathname === child.href;
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`flex items-center gap-2 ${isAr ? "pr-3" : "pl-3"} py-2 rounded-lg text-xs font-medium transition-colors ${
                          childActive
                            ? "bg-blue-50 text-blue-700"
                            : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                        }`}
                      >
                        <span className="text-sm">{child.icon}</span>
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* الأسفل: تبديل اللغة + تسجيل الخروج */}
      <div className="p-4 border-t border-gray-100 space-y-1">
        <button
          onClick={toggleLang}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-blue-50 hover:text-blue-700 transition-colors"
        >
          <span>🌐</span>
          {t("nav.lang_toggle")}
        </button>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <span>🚪</span>
          {t("nav.signout")}
        </button>
      </div>
    </aside>
  );
}
