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

interface NavChild {
  href: string;
  label: string;
  icon: string;
}

interface NavItem {
  href: string;
  label: string;
  icon: string;
  children?: NavChild[];
}

interface NavSection {
  label?: string; // undefined = no header (top section)
  items: NavItem[];
}

export default function Sidebar({ businessName, country, currency, isAdmin }: SidebarProps) {
  const pathname = usePathname();
  const { t, lang, toggleLang } = useLang();
  const isAr = lang === "ar";
  const { data: session, update } = useSession();
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  // Track which parent items are manually expanded
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const adminEmails = (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS ?? "aboodmelhem43@gmail.com")
    .split(",").map((e) => e.trim().toLowerCase());
  const showAdmin = isAdmin || adminEmails.includes((session?.user?.email ?? "").toLowerCase());

  const clientBusinesses = session?.user?.clientBusinesses ?? [];
  const primaryBusinessId = session?.user?.primaryBusinessId ?? session?.user?.businessId;
  const activeBusinessId = session?.user?.businessId;
  const isViewingClientBiz = activeBusinessId !== primaryBusinessId;
  const isPractice = session?.user?.isPractice ?? clientBusinesses.some((b) => b.source === "practice");

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

  function toggleExpand(href: string) {
    setExpanded((prev) => ({ ...prev, [href]: !prev[href] }));
  }

  // Sections with grouped nav items
  const sections: NavSection[] = [
    {
      items: [
        { href: "/dashboard", label: t("nav.dashboard"), icon: "🏠" },
        { href: "/chat", label: isAr ? "المساعد الذكي" : "AI Assistant", icon: "🤖" },
      ],
    },
    {
      label: isAr ? "العمليات" : "Operations",
      items: [
        {
          href: "/invoices",
          label: t("nav.invoices"),
          icon: "🧾",
          children: [
            { href: "/invoices/upload", label: t("nav.upload"), icon: "⬆️" },
            { href: "/invoices/create", label: isAr ? "فاتورة مبيعات" : "Sales Invoice", icon: "📝" },
            { href: "/invoices/create-purchase", label: isAr ? "فاتورة شراء" : "Purchase Invoice", icon: "🛒" },
          ],
        },
        {
          href: "/sales-sync",
          label: isAr ? "مزامنة المبيعات" : "Sales Sync",
          icon: "🛍️",
          children: [
            { href: "/settings/integrations", label: isAr ? "ربط المتاجر" : "Integrations", icon: "🔌" },
          ],
        },
        { href: "/expenses", label: isAr ? "مصروف سريع" : "Quick Expense", icon: "💸" },
        { href: "/contacts", label: isAr ? "العملاء والموردون" : "Contacts", icon: "👥" },
      ],
    },
    {
      label: isAr ? "المحاسبة" : "Accounting",
      items: [
        {
          href: "/journal",
          label: t("nav.journal"),
          icon: "📒",
          children: [
            { href: "/recurring", label: isAr ? "القيود المتكررة" : "Recurring Entries", icon: "🔁" },
            { href: "/opening-balances", label: isAr ? "الأرصدة الافتتاحية" : "Opening Balances", icon: "⚖️" },
            { href: "/periods", label: isAr ? "الفترات المحاسبية" : "Accounting Periods", icon: "🔒" },
          ],
        },
        { href: "/accounts", label: isAr ? "دليل الحسابات" : "Chart of Accounts", icon: "📋" },
        {
          href: "/bank-accounts",
          label: isAr ? "الحسابات البنكية" : "Bank Accounts",
          icon: "🏦",
          children: [
            { href: "/bank-reconciliation", label: isAr ? "تسوية بنكية" : "Reconciliation", icon: "🔄" },
          ],
        },
        { href: "/fixed-assets", label: isAr ? "الأصول الثابتة" : "Fixed Assets", icon: "🏗️" },
      ],
    },
    {
      label: isAr ? "التقارير" : "Reports",
      items: [
        {
          href: "/reports",
          label: isAr ? "التقارير المالية" : "Financial Reports",
          icon: "📊",
          children: [
            { href: "/vat-return", label: isAr ? "إقرار ضريبة القيمة المضافة" : "VAT Return", icon: "🧮" },
          ],
        },
      ],
    },
    {
      label: isAr ? "أدوات" : "Tools",
      items: [
        { href: "/currency", label: isAr ? "محوّل العملات" : "Currency", icon: "💱" },
        { href: "/documents", label: isAr ? "المستندات" : "Documents", icon: "📄" },
        { href: "/import", label: isAr ? "استيراد البيانات" : "Data Import", icon: "📥" },
        { href: "/audit-log", label: isAr ? "سجل المراجعة" : "Audit Trail", icon: "🗂️" },
      ],
    },
    {
      label: isAr ? "الحساب" : "Account",
      items: [
        {
          href: "/settings",
          label: isAr ? "الإعدادات" : "Settings",
          icon: "⚙️",
          children: (() => {
            if (isViewingClientBiz) return undefined;
            const sub: NavChild[] = [];
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
      ],
    },
  ];

  function isItemActive(item: NavItem) {
    if (pathname === item.href) return true;
    if (item.children) return item.children.some((c) => pathname === c.href || pathname.startsWith(c.href + "/"));
    return pathname.startsWith(item.href + "/");
  }

  function isOpen(item: NavItem) {
    return isItemActive(item) || !!expanded[item.href];
  }

  return (
    <aside className="hidden md:flex w-60 bg-white border-e border-gray-200 flex-col h-screen sticky top-0">
      {/* Header: logo + business */}
      <div className="px-4 py-4 border-b border-gray-100">
        <Link href="/" className="text-lg font-bold text-blue-700 hover:text-blue-800 transition-colors block">
          {t("app.name")}
        </Link>

        {clientBusinesses.length > 0 ? (
          <div className="mt-2 relative">
            <button
              onClick={() => setSwitcherOpen((o) => !o)}
              className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              <div className="min-w-0 flex-1 text-start">
                <div className="text-xs font-semibold text-blue-800 truncate">{displayName}</div>
                <div className="text-xs text-blue-500">{displayCountry} · {displayCurrency}</div>
              </div>
              <span className="text-blue-400 flex-shrink-0 text-xs">{switcherOpen ? "▲" : "▼"}</span>
            </button>

            {switcherOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                <button
                  onClick={() => switchBusiness(primaryBusinessId!)}
                  disabled={switchingId === primaryBusinessId}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 text-start hover:bg-gray-50 transition-colors ${activeBusinessId === primaryBusinessId ? "bg-blue-50" : ""}`}
                >
                  <span>🏢</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-gray-900 truncate">
                      {isAr ? "منشأتي" : "My Business"}
                    </div>
                  </div>
                  {activeBusinessId === primaryBusinessId && <span className="text-blue-600 text-xs">✓</span>}
                </button>
                {clientBusinesses.length > 0 && (
                  <div className="border-t border-gray-100">
                    <div className="px-3 py-1 text-xs font-medium text-gray-400 uppercase tracking-wide">
                      {isAr ? "عملاء" : "Clients"}
                    </div>
                    {clientBusinesses.map((biz) => (
                      <button
                        key={biz.id}
                        onClick={() => switchBusiness(biz.id)}
                        disabled={switchingId === biz.id}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-start hover:bg-gray-50 transition-colors ${activeBusinessId === biz.id ? "bg-blue-50" : ""}`}
                      >
                        <span className="text-sm">{biz.source === "practice" ? "🏢" : "👔"}</span>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium text-gray-900 truncate">{biz.name}</div>
                          <div className="text-xs text-gray-400">{biz.country} · {biz.currency}</div>
                        </div>
                        {activeBusinessId === biz.id && <span className="text-blue-600 text-xs">✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-1.5">
            <div className="text-xs font-medium text-gray-700 truncate">{displayName}</div>
            <div className="text-xs text-gray-400">{displayCountry} · {displayCurrency}</div>
          </div>
        )}

        {isViewingClientBiz && (
          <div className="mt-2 flex items-center justify-between bg-purple-50 border border-purple-200 rounded-lg px-2 py-1">
            <span className="text-xs text-purple-700 font-medium">
              {isAr ? "وضع العميل" : "Client mode"}
            </span>
            <button
              onClick={() => switchBusiness(primaryBusinessId!)}
              className="text-xs text-purple-600 hover:text-purple-800 font-medium"
            >
              {isAr ? "رجوع" : "Back"}
            </button>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3">
        {sections.map((section, si) => (
          <div key={si} className={si > 0 ? "mt-2" : ""}>
            {section.label && (
              <div className="px-4 pt-1 pb-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {section.label}
                </span>
              </div>
            )}
            <div className="px-2 space-y-0.5">
              {section.items.map((item) => {
                const active = isItemActive(item);
                const open = isOpen(item);
                const hasChildren = item.children && item.children.length > 0;

                return (
                  <div key={item.href}>
                    <div className="flex items-center">
                      <Link
                        href={item.href}
                        className={`flex-1 flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                          active
                            ? "bg-blue-50 text-blue-700"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                      >
                        <span className="text-base leading-none">{item.icon}</span>
                        <span className="truncate">{item.label}</span>
                      </Link>
                      {hasChildren && (
                        <button
                          onClick={() => toggleExpand(item.href)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors flex-shrink-0"
                          aria-label="toggle submenu"
                        >
                          <svg className={`w-3 h-3 transition-transform ${open ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      )}
                    </div>

                    {hasChildren && open && (
                      <div className={`mt-0.5 mb-0.5 ${isAr ? "mr-3 border-r-2" : "ml-3 border-l-2"} border-gray-100 space-y-0.5 py-0.5`}>
                        {item.children!.map((child) => {
                          const childActive = pathname === child.href || pathname.startsWith(child.href + "/");
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              className={`flex items-center gap-2 ${isAr ? "pr-3" : "pl-3"} py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                childActive
                                  ? "bg-blue-50 text-blue-700"
                                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                              }`}
                            >
                              <span className="text-sm leading-none">{child.icon}</span>
                              <span className="truncate">{child.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {si < sections.length - 1 && (
              <div className="mx-4 mt-3 border-t border-gray-100" />
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-2 py-2 border-t border-gray-100 space-y-0.5">
        <button
          onClick={toggleLang}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-blue-50 hover:text-blue-700 transition-colors"
        >
          <span>🌐</span>
          {t("nav.lang_toggle")}
        </button>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <span>🚪</span>
          {t("nav.signout")}
        </button>
      </div>
    </aside>
  );
}
