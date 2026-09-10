import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchMediaInsights } from "@/lib/instagram-graph";

// Runs hourly — fetches insights for PUBLISHED posts that are at least 24h old
// and either have no insights or have stale insights (> 24h old).
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await runInsightsFetch();
  return NextResponse.json({ ok: true });
}

// Also callable via POST from the analytics page (session-authenticated, no cron secret needed)
export async function POST() {
  await runInsightsFetch();
  return NextResponse.json({ ok: true });
}

async function runInsightsFetch() {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const oneHourAgo = Date.now() - 60 * 60 * 1000;

  // Find PUBLISHED posts older than 24h that are missing or have stale insights
  const posts = await prisma.instagramPost.findMany({
    where: {
      status: "PUBLISHED",
      instagramMediaId: { not: null },
      publishedAt: { lte: oneDayAgo },
    },
    select: {
      id: true,
      instagramMediaId: true,
      insights: true,
      business: { select: { instagramProfile: { select: { accessToken: true } } } },
    },
    take: 30,
  });

  let updated = 0;
  for (const post of posts) {
    const token = post.business.instagramProfile?.accessToken;
    if (!token || !post.instagramMediaId) continue;

    // Skip if insights were fetched within the last hour
    const cached = post.insights as { _fetchedAt?: number } | null;
    if (cached?._fetchedAt && cached._fetchedAt > oneHourAgo) continue;

    try {
      const ins = await fetchMediaInsights(post.instagramMediaId, token);
      await prisma.instagramPost.update({
        where: { id: post.id },
        data: { insights: { ...ins, _fetchedAt: Date.now() } },
      });
      updated++;
    } catch {
      // Ignore individual fetch failures
    }
  }

  return updated;
}
