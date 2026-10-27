"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

interface DashboardStatCardProps {
  title: string;
  /** Raw numeric value — animated via CountUp */
  rawValue: number;
  /** Unit appended after the number, e.g. currency symbol or empty string */
  suffix: string;
  /** Whether to show decimal places (true for money, false for counts) */
  isDecimal?: boolean;
  /** Locale for number formatting */
  locale?: string;
  sub: string;
  color: "green" | "red" | "blue" | "yellow";
  icon: string;
  href?: string;
  /** Show a pulsing alert dot (e.g. overdue invoices) */
  pulse?: boolean;
  /** Highlight with an animated shimmer border (e.g. net profit) */
  featured?: boolean;
}

const BG: Record<string, string> = {
  green:  "bg-green-50  border-green-200",
  red:    "bg-red-50    border-red-200",
  blue:   "bg-blue-50   border-blue-200",
  yellow: "bg-yellow-50 border-yellow-200",
};

export function DashboardStatCard({
  title, rawValue, suffix, isDecimal = false, locale = "en",
  sub, color, icon, href, pulse = false, featured = false,
}: DashboardStatCardProps) {
  const [display, setDisplay] = useState("0");
  const started = useRef(false);
  const ref = useRef<HTMLDivElement>(null);

  const fmt = useCallback(
    (n: number) =>
      isDecimal
        ? n.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : String(Math.round(n)),
    [isDecimal, locale]
  );

  // CountUp triggered once on intersection
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1400;
          const startTime = performance.now();
          const step = (now: number) => {
            const t = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            setDisplay(fmt(eased * rawValue));
            if (t < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [rawValue, fmt]);

  // Spotlight mouse tracking
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
  }, []);

  const inner = (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      className={[
        "spotlight-card rounded-xl border p-5 h-full transition-shadow hover:shadow-md",
        BG[color],
        featured ? "gsap-stat-card featured-card" : "gsap-stat-card",
      ].join(" ")}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="text-2xl">{icon}</div>
        {pulse && rawValue > 0 && (
          <span className="relative flex h-2.5 w-2.5 mt-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
          </span>
        )}
      </div>
      <div className="text-sm font-medium text-gray-600">{title}</div>
      <div className="text-xl font-bold text-gray-900 mt-1 leading-tight gsap-stat-value tabular-nums">
        {display}{suffix ? ` ${suffix}` : ""}
      </div>
      <div className="text-xs text-gray-500 mt-1">{sub}</div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block hover:opacity-90 transition-opacity">
        {inner}
      </Link>
    );
  }
  return inner;
}
