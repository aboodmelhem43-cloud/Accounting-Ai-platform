"use client";
import { useRouter, useSearchParams } from "next/navigation";

export default function PeriodPicker() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const monthParam = searchParams.get("month");
  const now = new Date();

  let year = now.getFullYear();
  let month = now.getMonth(); // 0-indexed
  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [y, m] = monthParam.split("-").map(Number);
    year = y;
    month = m - 1;
  }

  const current = new Date(year, month, 1);

  const navigate = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    router.push(`?month=${y}-${m}`);
  };

  const isCurrentMonth =
    year === now.getFullYear() && month === now.getMonth();

  const label = current.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => navigate(-1)}
        className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors text-sm"
        aria-label="Previous month"
      >
        ‹
      </button>
      <span className="text-sm font-medium text-gray-700 min-w-[130px] text-center">
        {label}
      </span>
      <button
        onClick={() => navigate(1)}
        disabled={isCurrentMonth}
        className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors text-sm disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Next month"
      >
        ›
      </button>
      {!isCurrentMonth && (
        <button
          onClick={() => router.push("?")}
          className="text-xs text-blue-600 hover:underline"
        >
          Today
        </button>
      )}
    </div>
  );
}
