"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useLang } from "./LanguageProvider";

interface Props {
  businessName: string;
  country: string;
  currency: string;
  isAdmin?: boolean;
}

export default function MobileHeader({ businessName, country, currency, isAdmin }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { t, lang, toggleLang } = useLang();
  const isAr = lang === "ar";
  const { data: session } = useSession();

  const adminEmails = (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS ?? "aboodmelhem43@gmail.com")
    .split(",").map((e) => e.trim().toLowerCase());
  const showAdmin = isAdmin || adminEmails.includes((session?.user?.email ?? "").toLowerCase());

  const NAV = [
    { href: "/dashboard", label: t("nav.dashboard"), icon: "🏠" },
    { href: "/contacts", label: isAr ? "العملاء والموردون" : "Contacts", icon: "👥" },
    { href: "/bank-accounts", label: isAr ? "الحسابات البنكية" : "Bank Accounts", icon: "🏦" },
    { href: "/bank-reconciliation", label: isAr ? "تسوية بنكية" : "Reconciliation", icon: "🔄" },
    { href: "/invoices", label: t("nav.invoices"), icon: "🧾" },
    { href: "/invoices/upload", label: t("nav.upload"), icon: "⬆️", indent: true },
    { href: "/invoices/create", label: isAr ? "إنشاء فاتورة" : "Create Invoice", icon: "📝", indent: true },
    { href: "/accounts", label: isAr ? "دليل الحسابات" : "Chart of Accounts", icon: "📋" },
    { href: "/reports", label: isAr ? "التقارير" : "Reports", icon: "📊" },
    { href: "/journal", label: t("nav.journal"), icon: "📒" },
    { href: "/currency", label: isAr ? "محوّل العملات" : "Currency", icon: "💱" },
    { href: "/chat", label: t("nav.chat"), icon: "🤖" },
    { href: "/settings", label: isAr ? "الإعدادات" : "Settings", icon: "⚙️" },
    { href: "/pricing", label: isAr ? "الخطط والأسعار" : "Pricing", icon: "💎" },
    ...(showAdmin ? [{ href: "/admin", label: isAr ? "لوحة الإدارة" : "Admin", icon: "🛡️" }] : []),
  ];

  return (
    <>
      {/* Mobile topbar */}
      <header className="md:hidden sticky top-0 z-30 bg-white border-b border-gray-200 px-4 h-14 flex items-center justify-between">
        <div className="text-base font-bold text-blue-700">Mohasabai · محاسباي</div>
        <button
          onClick={() => setOpen(true)}
          aria-label="فتح القائمة"
          className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors text-xl"
        >
          ☰
        </button>
      </header>

      {/* Drawer overlay */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden" dir={isAr ? "rtl" : "ltr"}>
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Drawer panel */}
          <div
            className={`absolute top-0 ${isAr ? "right-0" : "left-0"} h-full w-72 bg-white shadow-2xl flex flex-col`}
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <div className="font-bold text-blue-700 text-sm">Mohasabai · محاسباي</div>
                <div className="text-xs text-gray-400 mt-0.5 truncate">{businessName}</div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 text-base"
              >
                ✕
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
              {NAV.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      "indent" in item ? "mr-4" : ""
                    } ${
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

            {/* Footer */}
            <div className="p-3 border-t border-gray-100 space-y-1">
              <button
                onClick={() => { toggleLang(); setOpen(false); }}
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
          </div>
        </div>
      )}
    </>
  );
}
