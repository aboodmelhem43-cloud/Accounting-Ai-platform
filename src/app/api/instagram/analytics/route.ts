import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface PostInsightsCached {
  engagement:   number;
  impressions:  number;
  reach:        number;
  saved:        number;
  video_views?: number;
  _fetchedAt?:  number;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { businessId } = session.user;

  const publishedPosts = await prisma.instagramPost.findMany({
    where: { businessId, status: "PUBLISHED" },
    select: {
      id:              true,
      mediaUrls:       true,
      caption:         true,
      hashtags:        true,
      publishedAt:     true,
      instagramMediaId: true,
      insights:        true,
      aiGenerated:     true,
    },
    orderBy: { publishedAt: "desc" },
  });

  const total = publishedPosts.length;
  const withInsights = publishedPosts.filter((p) => p.insights !== null);
  const withoutInsights = total - withInsights.length;

  // Aggregate totals
  let totalReach = 0, totalEngagement = 0, totalImpressions = 0, totalSaved = 0;

  for (const p of withInsights) {
    const ins = p.insights as unknown as PostInsightsCached;
    totalReach       += ins.reach       ?? 0;
    totalEngagement  += ins.engagement  ?? 0;
    totalImpressions += ins.impressions ?? 0;
    totalSaved       += ins.saved       ?? 0;
  }

  const avgEngagementRate = totalReach > 0
    ? Math.round((totalEngagement / totalReach) * 10000) / 100
    : 0;

  // Top posts by engagement
  const topPosts = withInsights
    .map((p) => {
      const ins = p.insights as unknown as PostInsightsCached;
      return {
        id:          p.id,
        mediaUrls:   p.mediaUrls,
        caption:     p.caption,
        publishedAt: p.publishedAt,
        engagement:  ins.engagement  ?? 0,
        reach:       ins.reach       ?? 0,
        impressions: ins.impressions ?? 0,
        saved:       ins.saved       ?? 0,
        engagementRate: ins.reach > 0
          ? Math.round((ins.engagement / ins.reach) * 10000) / 100
          : 0,
      };
    })
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, 9);

  // Reach by day — last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const reachByDay: Record<string, number> = {};

  for (const p of withInsights) {
    if (!p.publishedAt || p.publishedAt < thirtyDaysAgo) continue;
    const ins = p.insights as unknown as PostInsightsCached;
    const day = p.publishedAt.toISOString().slice(0, 10);
    reachByDay[day] = (reachByDay[day] ?? 0) + (ins.reach ?? 0);
  }

  // Fill zeros for last 30 days
  const reachTrend: { date: string; reach: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    reachTrend.push({ date: key, reach: reachByDay[key] ?? 0 });
  }

  // Best day of week (0=Sun)
  const byDow: number[] = Array(7).fill(0);
  const byDowCount: number[] = Array(7).fill(0);
  for (const p of withInsights) {
    if (!p.publishedAt) continue;
    const ins = p.insights as unknown as PostInsightsCached;
    const dow = new Date(p.publishedAt).getDay();
    byDow[dow]      += ins.engagement ?? 0;
    byDowCount[dow] += 1;
  }
  const avgByDow = byDow.map((total, i) =>
    byDowCount[i] > 0 ? Math.round(total / byDowCount[i]) : 0
  );

  return NextResponse.json({
    summary: {
      totalPublished:     total,
      withInsights:       withInsights.length,
      withoutInsights,
      totalReach,
      totalEngagement,
      totalImpressions,
      totalSaved,
      avgEngagementRate,
    },
    topPosts,
    reachTrend,
    avgEngagementByDow: avgByDow, // index 0-6 = Sun-Sat
  });
}
