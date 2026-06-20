"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useLang } from "./LanguageProvider";

interface SidebarProps {
  businessName: string;
  country: string;
  currency: string;
}

export default function Sidebar({ businessName, country, currency }: SidebarProps) {
  const pathname = usePathname();
  const { t, toggleLang } = useLang();

  const NAV_ITEMS = [
    { href: "/dashboard", label: t("nav.dashboard"), icon: "🏠" },
    { href: "/invoices", label: t("nav.invoices"), icon: "🧾" },
    { href: "/invoices/upload", label: t("nav.upload"), icon: "⬆️" },
    { href: "/reports/income", label: t("nav.income"), icon: "📊" },
    { href: "/journal", label: t("nav.journal"), icon: "📒" },
    { href: "/chat", label: t("nav.chat"), icon: "🤖" },
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
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
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
