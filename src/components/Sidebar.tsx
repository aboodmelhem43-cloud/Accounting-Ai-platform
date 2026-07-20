"use client";
import { useState } from "react";
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
  const { data: session, update } = useSession();
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [switcherOpen, setSwitcherOpen] = useState(false);

  // Check admin via session email — works client-side without server prop
  const adminEmails = (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS ?? "aboodmelhem43@gmail.com")
    .split(",").map((e) => e.trim().toLowerCase());
  const showAdmin = isAdmin || adminEmails.includes((session?.user?.email ?? "").toLowerCase());

  const clientBusinesses = session?.user?.clientBusinesses ?? [];
  const primaryBusinessId = session?.user?.primaryBusinessId ?? session?.user?.businessId;
  const activeBusinessId = session?.user?.businessId;
  const isViewingClientBiz = activeBusinessId !== primaryBusinessId;
  const isPractice = session?.user?.isPractice ?? clientBusinesses.some((b) => b.source === "practice");

  // Resolved display values (prefer session for active-business accuracy)
  const displayName = session?.user?.businessName ?? businessName;
  const displayCountry = session?.user?.country ?? country;
  const displayCurrency = session?.user?.currency ?? currency;

  async function switchBusiness(targetId: string) {
    setSwitchingId(targetId);
    try {
      await update({ activeBusinessId: targetId });
    } finally {
      setSwitchingId(null);
      setSwitcherOpen(false);
    }
  }

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
        { href: "/invoices/create", label: isAr ? "إنشاء فاتورة مبيعات" : "Create Sales Invoice", icon: "📝" },
        { href: "/invoices/create-purchase", label: isAr ? "إنشاء فاتورة شراء" : "Create Purchase Invoice", icon: "🛒" },
      ],
    },
    { href: "/accounts", label: isAr ? "دليل الحسابات" : "Chart of Accounts", icon: "📋" },
    { href: "/fixed-assets", label: isAr ? "الأصول الثابتة" : "Fixed Assets", icon: "🏗️" },
    {
      href: "/reports",
      label: isAr ? "التقارير" : "Reports",
      icon: "📊",
      children: [
        { href: "/vat-return", label: isAr ? "إقرار ضريبة القيمة المضافة" : "VAT Return", icon: "🧮" },
      ],
    },
    {
      href: "/journal",
      label: t("nav.journal"),
      icon: "📒",
      children: [
        { href: "/recurring", label: isAr ? "القيود المتكررة" : "Recurring Entries", icon: "🔁" },
        { href: "/periods", label: isAr ? "الفترات المحاسبية" : "Accounting Periods", icon: "🔒" },
        { href: "/opening-balances", label: isAr ? "الأرصدة الافتتاحية" : "Opening Balances", icon: "⚖️" },
      ],
    },
    { href: "/currency", label: isAr ? "محوّل العملات" : "Currency", icon: "💱" },
    { href: "/chat", label: t("nav.chat"), icon: "🤖" },
    { href: "/audit-log", label: isAr ? "سجل المراجعة" : "Audit Trail", icon: "🗂️" },
    {
      href: "/settings",
      label: isAr ? "الإعدادات" : "Settings",
      icon: "⚙️",
      children: (() => {
        if (isViewingClientBiz) return undefined;
        const sub = [];
        if (session?.user?.plan === "PRO" || session?.user?.plan === "BUSINESS") {
          sub.push({ href: "/settings/team", label: isAr ? "الفريق" : "Team", icon: "👤" });
        }
        if (isPractice) {
          sub.push({ href: "/settings/clients", label: isAr ? "عملاء المكتب" : "Clients", icon: "🏢" });
        }
        return sub.length > 0 ? sub : undefined;
      })(),
    },
    ...(!isViewingClientBiz ? [{ href: "/pricing", label: isAr ? "الخطط والأسعار" : "Pricing", icon: "💎" }] : []),
    ...(showAdmin && !isViewingClientBiz ? [{ href: "/admin", label: isAr ? "لوحة الإدارة" : "Admin", icon: "🛡️" }] : []),
  ];

  return (
    <aside className="hidden md:flex w-64 bg-white border-l border-gray-200 flex-col h-screen sticky top-0">
      {/* الشعار وبيانات المنشأة */}
      <div className="p-6 border-b border-gray-100">
        <div className="text-xl font-bold text-blue-700">{t("app.name")}</div>

        {/* Business switcher — shown when user has client businesses */}
        {clientBusinesses.length > 0 ? (
          <div className="mt-2 relative">
            <button
              onClick={() => setSwitcherOpen((o) => !o)}
              className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors text-left"
            >
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-blue-800 truncate">{displayName}</div>
                <div className="text-xs text-blue-600">{displayCountry} · {displayCurrency}</div>
              </div>
              <span className="text-blue-500 flex-shrink-0 text-xs">{switcherOpen ? "▲" : "▼"}</span>
            </button>

            {switcherOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                {/* Own business */}
                <button
                  onClick={() => switchBusiness(primaryBusinessId!)}
                  disabled={switchingId === primaryBusinessId}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors ${activeBusinessId === primaryBusinessId ? "bg-blue-50" : ""}`}
                >
                  <span className="text-base">🏢</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-gray-900 truncate">
                      {isAr ? "منشأتي" : "My Business"}
                    </div>
                    {switchingId === primaryBusinessId && (
                      <div className="text-xs text-gray-400">{isAr ? "جارٍ التبديل..." : "Switching..."}</div>
                    )}
                  </div>
                  {activeBusinessId === primaryBusinessId && <span className="text-blue-600 text-xs">✓</span>}
                </button>

                {clientBusinesses.length > 0 && (
                  <div className="border-t border-gray-100">
                    <div className="px-3 py-1.5 text-xs font-medium text-gray-400 uppercase tracking-wide">
                      {isAr ? "عملاء" : "Clients"}
                    </div>
                    {clientBusinesses.map((biz) => (
                      <button
                        key={biz.id}
                        onClick={() => switchBusiness(biz.id)}
                        disabled={switchingId === biz.id}
                        className={`w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors ${activeBusinessId === biz.id ? "bg-blue-50" : ""}`}
                      >
                        <span className="text-base">{biz.source === "practice" ? "🏢" : "👔"}</span>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium text-gray-900 truncate">{biz.name}</div>
                          <div className="text-xs text-gray-400">{biz.country} · {biz.currency}</div>
                        </div>
                        {switchingId === biz.id
                          ? <span className="text-gray-400 text-xs">...</span>
                          : activeBusinessId === biz.id
                          ? <span className="text-blue-600 text-xs">✓</span>
                          : null}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="text-sm text-gray-500 mt-1 truncate">{displayName}</div>
            <div className="text-xs text-gray-400 mt-0.5">{displayCountry} · {displayCurrency}</div>
          </>
        )}

        {/* Client-mode banner */}
        {isViewingClientBiz && (
          <div className="mt-2 flex items-center justify-between bg-purple-50 border border-purple-200 rounded-lg px-2 py-1">
            <span className="text-xs text-purple-700 font-medium">
              {isAr ? "وضع العميل" : "Client mode"}
            </span>
            <button
              onClick={() => switchBusiness(primaryBusinessId!)}
              className="text-xs text-purple-600 hover:text-purple-800 font-medium"
            >
              {isAr ? "رجوع للمكتب" : "Back to practice"}
            </button>
          </div>
        )}
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
