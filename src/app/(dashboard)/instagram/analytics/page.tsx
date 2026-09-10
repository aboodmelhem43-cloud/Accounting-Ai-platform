"use client";

import { useState, useEffect, useCallback } from "react";
import { useLang } from "@/components/LanguageProvider";
import Image from "next/image";

interface Summary {
  totalPublished: number;
  withInsights: number;
  withoutInsights: number;
  totalReach: number;
  totalEngagement: number;
  totalImpressions: number;
  totalSaved: number;
  avgEngagementRate: number;
}

interface TopPost {
  id: string;
  mediaUrls: string[];
  caption: string | null;
  publishedAt: string | null;
  engagement: number;
  reach: number;
  impressions: number;
  saved: number;
  engagementRate: number;
}

interface ReachPoint {
  date: string;
  reach: number;
}

interface AnalyticsData {
  summary: Summary;
  topPosts: TopPost[];
  reachTrend: ReachPoint[];
  avgEngagementByDow: number[];
}

const DOW_LABELS_AR = ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];
const DOW_LABELS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

function ReachChart({ data }: { data: ReachPoint[] }) {
  if (!data.length) return null;
  const max = Math.max(...data.map((d) => d.reach), 1);
  const W = 600;
  const H = 140;
  const PAD = { top: 10, right: 10, bottom: 28, left: 42 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const pts = data.map((d, i) => {
    const x = PAD.left + (i / (data.length - 1)) * chartW;
    const y = PAD.top + chartH - (d.reach / max) * chartH;
    return `${x},${y}`;
  });
  const polyline = pts.join(" ");

  // area
  const first = pts[0];
  const last = pts[pts.length - 1];
  const areaPath = `M ${first} L ${pts.slice(1).join(" L ")} L ${last.split(",")[0]},${PAD.top + chartH} L ${PAD.left},${PAD.top + chartH} Z`;

  // x-axis labels every 5 days
  const xLabels = data.filter((_, i) => i % 5 === 0 || i === data.length - 1);

  // y-axis
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
    value: Math.round(max * t),
    y: PAD.top + chartH - t * chartH,
  }));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* grid */}
      {yTicks.map((t) => (
        <g key={t.value}>
          <line x1={PAD.left} y1={t.y} x2={W - PAD.right} y2={t.y} stroke="#e5e7eb" strokeWidth="1" />
          <text x={PAD.left - 4} y={t.y + 4} textAnchor="end" fontSize="9" fill="#9ca3af">
            {formatNum(t.value)}
          </text>
        </g>
      ))}
      {/* area fill */}
      <path d={areaPath} fill="url(#areaGrad)" />
      {/* line */}
      <polyline points={polyline} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {/* x labels */}
      {xLabels.map((d) => {
        const i = data.indexOf(d);
        const x = PAD.left + (i / (data.length - 1)) * chartW;
        return (
          <text key={d.date} x={x} y={H - 6} textAnchor="middle" fontSize="9" fill="#9ca3af">
            {d.date.slice(5)}
          </text>
        );
      })}
    </svg>
  );
}

function DowChart({ data, isAr }: { data: number[]; isAr: boolean }) {
  const max = Math.max(...data, 1);
  const labels = isAr ? DOW_LABELS_AR : DOW_LABELS_EN;
  return (
    <div className="flex items-end gap-2 h-28">
      {data.map((val, i) => {
        const pct = (val / max) * 100;
        const isMax = val === max;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-xs text-gray-500" style={{ fontSize: 10 }}>
              {val > 0 ? formatNum(val) : ""}
            </span>
            <div className="w-full flex items-end" style={{ height: 72 }}>
              <div
                className={`w-full rounded-t-sm transition-all ${isMax ? "bg-blue-500" : "bg-blue-200"}`}
                style={{ height: `${Math.max(pct, 2)}%` }}
              />
            </div>
            <span className="text-xs text-gray-500" style={{ fontSize: 10 }}>
              {labels[i]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function AnalyticsPage() {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/instagram/analytics");
      if (!res.ok) throw new Error(await res.text());
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function refreshInsights() {
    setRefreshing(true);
    try {
      const res = await fetch("/api/cron/instagram-insights", { method: "POST" });
      if (res.ok) await load();
    } finally {
      setRefreshing(false);
    }
  }

  async function getAiAnalysis() {
    if (!data) return;
    setAiLoading(true);
    setAiAnalysis(null);
    try {
      const res = await fetch("/api/instagram/ai/performance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary: data.summary, topPosts: data.topPosts, avgEngagementByDow: data.avgEngagementByDow }),
      });
      if (!res.ok) throw new Error(await res.text());
      const reader = res.body?.getReader();
      if (!reader) return;
      const decoder = new TextDecoder();
      let text = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setAiAnalysis(text);
      }
    } catch (e) {
      setAiAnalysis(isAr ? "تعذر الحصول على التحليل" : "Failed to get analysis");
    } finally {
      setAiLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse" dir={isAr ? "rtl" : "ltr"}>
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-48 bg-gray-200 rounded-xl" />
          <div className="h-48 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 text-red-600" dir={isAr ? "rtl" : "ltr"}>
        {isAr ? "خطأ في تحميل التحليلات:" : "Error loading analytics:"} {error}
      </div>
    );
  }

  if (!data) return null;

  const { summary, topPosts, reachTrend, avgEngagementByDow } = data;
  const bestDow = avgEngagementByDow.indexOf(Math.max(...avgEngagementByDow));
  const dowLabels = isAr ? DOW_LABELS_AR : DOW_LABELS_EN;

  return (
    <div className="space-y-6" dir={isAr ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isAr ? "تحليلات إنستغرام" : "Instagram Analytics"}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isAr ? "أداء منشوراتك ومقاييس التفاعل" : "Post performance and engagement metrics"}
          </p>
        </div>
        <div className="flex gap-2">
          {summary.withoutInsights > 0 && (
            <button
              onClick={refreshInsights}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              {refreshing ? "⟳" : "🔄"}{" "}
              {isAr ? `تحديث (${summary.withoutInsights} بدون بيانات)` : `Refresh (${summary.withoutInsights} missing data)`}
            </button>
          )}
          <button
            onClick={getAiAnalysis}
            disabled={aiLoading || summary.withInsights === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm font-medium hover:opacity-90 disabled:opacity-60"
          >
            🤖 {isAr ? "تحليل AI" : "AI Analysis"}
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: isAr ? "المنشورات" : "Published", value: formatNum(summary.totalPublished), icon: "📸", color: "text-blue-600 bg-blue-50" },
          { label: isAr ? "الوصول الكلي" : "Total Reach", value: formatNum(summary.totalReach), icon: "👁️", color: "text-green-600 bg-green-50" },
          { label: isAr ? "التفاعل الكلي" : "Total Engagement", value: formatNum(summary.totalEngagement), icon: "❤️", color: "text-pink-600 bg-pink-50" },
          { label: isAr ? "معدل التفاعل" : "Avg Eng. Rate", value: `${summary.avgEngagementRate}%`, icon: "📊", color: "text-purple-600 bg-purple-50" },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-2">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg ${card.color}`}>
              {card.icon}
            </div>
            <div className="text-2xl font-bold text-gray-900 tabular-nums">{card.value}</div>
            <div className="text-sm text-gray-500">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: isAr ? "الانطباعات" : "Impressions", value: formatNum(summary.totalImpressions), icon: "📺" },
          { label: isAr ? "المحفوظات" : "Saved", value: formatNum(summary.totalSaved), icon: "🔖" },
          { label: isAr ? "لديها بيانات" : "With Insights", value: `${summary.withInsights}/${summary.totalPublished}`, icon: "✅" },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <span className="text-2xl">{card.icon}</span>
            <div>
              <div className="text-xl font-bold text-gray-900 tabular-nums">{card.value}</div>
              <div className="text-sm text-gray-500">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reach trend */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            {isAr ? "الوصول — آخر 30 يوم" : "Reach — Last 30 Days"}
          </h2>
          {reachTrend.every((d) => d.reach === 0) ? (
            <div className="h-28 flex items-center justify-center text-gray-400 text-sm">
              {isAr ? "لا توجد بيانات وصول بعد" : "No reach data yet"}
            </div>
          ) : (
            <ReachChart data={reachTrend} />
          )}
        </div>

        {/* Best day */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">
            {isAr ? "أفضل أيام النشر" : "Best Publishing Days"}
          </h2>
          {avgEngagementByDow.every((v) => v === 0) ? (
            <div className="h-28 flex items-center justify-center text-gray-400 text-sm">
              {isAr ? "لا توجد بيانات كافية" : "Not enough data"}
            </div>
          ) : (
            <>
              <p className="text-xs text-gray-400 mb-3">
                {isAr ? `أعلى تفاعل: ${dowLabels[bestDow]}` : `Peak: ${dowLabels[bestDow]}`}
              </p>
              <DowChart data={avgEngagementByDow} isAr={isAr} />
            </>
          )}
        </div>
      </div>

      {/* AI Analysis panel */}
      {(aiLoading || aiAnalysis) && (
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🤖</span>
            <h2 className="text-sm font-semibold text-purple-800">
              {isAr ? "تحليل الذكاء الاصطناعي" : "AI Performance Analysis"}
            </h2>
            {aiLoading && (
              <span className="inline-block w-2 h-4 bg-purple-400 animate-pulse rounded-sm" />
            )}
          </div>
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
            {aiAnalysis || (isAr ? "جارٍ التحليل..." : "Analyzing...")}
          </p>
        </div>
      )}

      {/* Top posts grid */}
      {topPosts.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            {isAr ? "أفضل المنشورات تفاعلاً" : "Top Posts by Engagement"}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {topPosts.slice(0, 9).map((post) => (
              <a
                key={post.id}
                href={`/instagram/posts/${post.id}`}
                className="group relative rounded-xl overflow-hidden bg-gray-100 aspect-square block"
              >
                {post.mediaUrls[0] ? (
                  <Image
                    src={post.mediaUrls[0]}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="180px"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-3xl">
                    📝
                  </div>
                )}
                {/* overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                  <div className="text-white text-xs font-semibold tabular-nums">
                    ❤️ {formatNum(post.engagement)}
                  </div>
                  <div className="text-white/80 text-xs tabular-nums">
                    👁️ {formatNum(post.reach)}
                  </div>
                  <div className="text-white/70 text-xs tabular-nums">
                    {post.engagementRate}% eng.
                  </div>
                </div>
                {/* always-visible badge */}
                <div className="absolute top-1.5 end-1.5 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded-full tabular-nums">
                  {post.engagementRate}%
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {summary.totalPublished === 0 && (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-4">📊</div>
          <p className="text-lg font-medium text-gray-600">
            {isAr ? "لا توجد منشورات منشورة بعد" : "No published posts yet"}
          </p>
          <p className="text-sm mt-1">
            {isAr ? "انشر منشوراتك لترى التحليلات هنا" : "Publish posts to see analytics here"}
          </p>
          <a
            href="/instagram/posts/create"
            className="inline-block mt-4 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            {isAr ? "إنشاء منشور" : "Create Post"}
          </a>
        </div>
      )}
    </div>
  );
}
