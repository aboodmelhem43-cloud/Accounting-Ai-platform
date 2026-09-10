import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchMediaInsights, GraphError } from "@/lib/instagram-graph";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { id } = await params;

  const post = await prisma.instagramPost.findFirst({
    where: { id, businessId: session.user.businessId },
    select: { instagramMediaId: true, status: true, insights: true },
  });
  if (!post) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (post.status !== "PUBLISHED" || !post.instagramMediaId) {
    return NextResponse.json({ error: "not_published" }, { status: 400 });
  }

  // Return cached insights if fresh (< 1 hour)
  if (post.insights) {
    const cached = post.insights as { _fetchedAt?: number };
    if (cached._fetchedAt && Date.now() - cached._fetchedAt < 3_600_000) {
      return NextResponse.json({ insights: post.insights, cached: true });
    }
  }

  const profile = await prisma.instagramProfile.findUnique({
    where: { businessId: session.user.businessId },
    select: { accessToken: true },
  });
  if (!profile) return NextResponse.json({ error: "no_profile" }, { status: 400 });

  try {
    const insights = await fetchMediaInsights(post.instagramMediaId, profile.accessToken);
    const data = { ...insights, _fetchedAt: Date.now() };

    await prisma.instagramPost.update({
      where: { id },
      data:  { insights: data },
    });

    return NextResponse.json({ insights: data, cached: false });
  } catch (err) {
    console.error("Insights error:", err);
    const message = err instanceof GraphError ? err.detail : "فشل جلب الإحصاءات";
    return NextResponse.json({ error: "insights_failed", message }, { status: 500 });
  }
}
