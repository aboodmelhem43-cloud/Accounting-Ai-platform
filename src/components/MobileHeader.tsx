"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useLang } from "./LanguageProvider";
import type { SvgIcon } from "./icons";
import {
  IcoDashboard, IcoSparkles, IcoBuilding, IcoFileText, IcoUpload, IcoFilePlus,
  IcoShoppingCart, IcoStore, IcoPlug, IcoZap, IcoUsers, IcoBookOpen, IcoRepeat,
  IcoScale, IcoLock, IcoLayoutList, IcoCreditCard, IcoCheckCircle, IcoPackage,
  IcoBarChart, IcoPercent, IcoArrowLeftRight, IcoFolderOpen, IcoDownload,
  IcoClipboardList, IcoSettings, IcoGem, IcoCpu, IcoShield, IcoGlobe, IcoLogOut,
  IcoMenu, IcoX,
} from "./icons";

interface Props {
  businessName: string;
  country: string;
  currency: string;
  isAdmin?: boolean;
}

interface NavEntry {
  href: string;
  label: string;
  icon: SvgIcon;
  indent?: boolean;
}

export default function MobileHeader({ businessName, country, currency, isAdmin }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { t, lang, toggleLang } = useLang();
  const isAr = lang === "ar";

  const showAdmin = isAdmin;

  const NAV: NavEntry[] = [
    { href: "/dashboard", label: t("nav.dashboard"), icon: IcoDashboard },
    { href: "/chat", label: isAr ? "المساعد الذكي" : "AI Assistant", icon: IcoSparkles },
    { href: "/hq", label: isAr ? "مقر الوكلاء" : "AI HQ", icon: IcoBuilding },
    { href: "/invoices", label: t("nav.invoices"), icon: IcoFileText },
    { href: "/invoices/upload", label: t("nav.upload"), icon: IcoUpload, indent: true },
    { href: "/invoices/create", label: isAr ? "إنشاء فاتورة مبيعات" : "Create Sales Invoice", icon: IcoFilePlus, indent: true },
    { href: "/invoices/create-purchase", label: isAr ? "إنشاء فاتورة شراء" : "Create Purchase Invoice", icon: IcoShoppingCart, indent: true },
    { href: "/sales-sync", label: isAr ? "مزامنة المبيعات" : "Sales Sync", icon: IcoStore },
    { href: "/settings/integrations", label: isAr ? "ربط المتاجر" : "Integrations", icon: IcoPlug, indent: true },
    { href: "/expenses", label: isAr ? "مصروف سريع" : "Quick Expense", icon: IcoZap },
    { href: "/contacts", label: isAr ? "العملاء والموردون" : "Contacts", icon: IcoUsers },
    { href: "/journal", label: t("nav.journal"), icon: IcoBookOpen },
    { href: "/recurring", label: isAr ? "القيود المتكررة" : "Recurring Entries", icon: IcoRepeat, indent: true },
    { href: "/opening-balances", label: isAr ? "الأرصدة الافتتاحية" : "Opening Balances", icon: IcoScale, indent: true },
    { href: "/periods", label: isAr ? "الفترات المحاسبية" : "Accounting Periods", icon: IcoLock, indent: true },
    { href: "/accounts", label: isAr ? "دليل الحسابات" : "Chart of Accounts", icon: IcoLayoutList },
    { href: "/bank-accounts", label: isAr ? "الحسابات البنكية" : "Bank Accounts", icon: IcoCreditCard },
    { href: "/bank-reconciliation", label: isAr ? "تسوية بنكية" : "Reconciliation", icon: IcoCheckCircle, indent: true },
    { href: "/fixed-assets", label: isAr ? "الأصول الثابتة" : "Fixed Assets", icon: IcoPackage },
    { href: "/reports", label: isAr ? "التقارير المالية" : "Financial Reports", icon: IcoBarChart },
    { href: "/vat-return", label: isAr ? "إقرار ضريبة القيمة المضافة" : "VAT Return", icon: IcoPercent, indent: true },
    { href: "/currency", label: isAr ? "محوّل العملات" : "Currency", icon: IcoArrowLeftRight },
    { href: "/documents", label: isAr ? "المستندات" : "Documents", icon: IcoFolderOpen },
    { href: "/import", label: isAr ? "استيراد البيانات" : "Data Import", icon: IcoDownload },
    { href: "/audit-log", label: isAr ? "سجل المراجعة" : "Audit Trail", icon: IcoClipboardList },
    { href: "/settings", label: isAr ? "الإعدادات" : "Settings", icon: IcoSettings },
    { href: "/pricing", label: isAr ? "الخطط والأسعار" : "Pricing", icon: IcoGem },
    ...(showAdmin ? [
      { href: "/agents", label: isAr ? "الفريق التنفيذي" : "AI Executive", icon: IcoCpu },
      { href: "/admin", label: isAr ? "لوحة الإدارة" : "Admin", icon: IcoShield },
    ] : []),
  ];

  return (
    <>
      {/* Mobile topbar */}
      <header className="md:hidden sticky top-0 z-30 bg-[#0f172a] border-b border-slate-700/40 px-4 h-14 flex items-center justify-between">
        <div className="text-base font-bold text-blue-400">MohasabAi · محاسب Ai</div>
        <button
          onClick={() => setOpen(true)}
          aria-label="فتح القائمة"
          className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 transition-colors"
        >
          <IcoMenu size={20} />
        </button>
      </header>

      {/* Drawer overlay */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden" dir={isAr ? "rtl" : "ltr"}>
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Drawer panel */}
          <div
            className={`absolute top-0 ${isAr ? "right-0" : "left-0"} h-full w-72 bg-[#0f172a] shadow-2xl flex flex-col`}
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-700/40 flex items-center justify-between">
              <div>
                <div className="font-bold text-blue-400 text-sm">MohasabAi · محاسب Ai</div>
                <div className="text-xs text-slate-400 mt-0.5 truncate">{businessName}</div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-800 transition-colors"
              >
                <IcoX size={16} />
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
              {NAV.map((item) => {
                const isActive = pathname === item.href;
                const NavIcon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      item.indent ? "ms-4" : ""
                    } ${
                      isActive
                        ? "bg-blue-600/15 text-blue-400 font-semibold"
                        : "text-slate-100 font-semibold hover:bg-slate-800/60 hover:text-white"
                    }`}
                  >
                    <NavIcon
                      size={18}
                      strokeWidth={1.75}
                      className={isActive ? "text-blue-400" : "text-slate-300"}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="p-3 border-t border-slate-700/40 space-y-1">
              <button
                onClick={() => { toggleLang(); setOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-100 hover:bg-slate-800/60 hover:text-blue-400 transition-colors"
              >
                <IcoGlobe size={18} strokeWidth={1.75} className="text-slate-300" />
                {t("nav.lang_toggle")}
              </button>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-100 hover:bg-red-900/20 hover:text-red-400 transition-colors"
              >
                <IcoLogOut size={18} strokeWidth={1.75} className="text-red-400" />
                {t("nav.signout")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
