"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useRef } from "react";
import { useLang } from "@/components/LanguageProvider";

export default function InvoiceFilters() {
  const router = useRouter();
  const sp = useSearchParams();
  const { lang } = useLang();
  const isAr = lang === "ar";
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const push = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(sp.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      router.push(`/invoices?${params.toString()}`);
    },
    [router, sp]
  );

  const onSearch = (val: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => push("q", val.trim()), 350);
  };

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <span className="absolute inset-y-0 right-3 flex items-center text-gray-400 pointer-events-none">
          🔍
        </span>
        <input
          type="search"
          defaultValue={sp.get("q") ?? ""}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={isAr ? "بحث بالاسم أو رقم الفاتورة…" : "Search by name or invoice #…"}
          className="input pr-9 text-sm"
        />
      </div>

      {/* Status */}
      <select
        value={sp.get("status") ?? ""}
        onChange={(e) => push("status", e.target.value)}
        className="input text-sm w-auto min-w-[140px]"
      >
        <option value="">{isAr ? "كل الحالات" : "All statuses"}</option>
        <option value="PENDING_REVIEW">{isAr ? "بانتظار المراجعة" : "Pending review"}</option>
        <option value="CONFIRMED">{isAr ? "مؤكدة" : "Confirmed"}</option>
        <option value="REJECTED">{isAr ? "مرفوضة" : "Rejected"}</option>
      </select>

      {/* Period */}
      <select
        value={sp.get("period") ?? ""}
        onChange={(e) => push("period", e.target.value)}
        className="input text-sm w-auto min-w-[140px]"
      >
        <option value="">{isAr ? "كل الفترات" : "All time"}</option>
        <option value="this_month">{isAr ? "هذا الشهر" : "This month"}</option>
        <option value="last_month">{isAr ? "الشهر الماضي" : "Last month"}</option>
        <option value="this_year">{isAr ? "هذه السنة" : "This year"}</option>
      </select>
    </div>
  );
}
