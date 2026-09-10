import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createImageContainer,
  createVideoContainer,
  createCarouselContainer,
  waitForContainer,
  publishContainer,
  isVideoUrl,
} from "@/lib/instagram-graph";

// Vercel Cron calls this with the Authorization header containing CRON_SECRET
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // Find all due scheduled posts whose businesses have connected IG profiles
  const duePosts = await prisma.instagramPost.findMany({
    where: {
      status:      "SCHEDULED",
      scheduledAt: { lte: now },
    },
    include: {
      business: {
        include: { instagramProfile: true },
      },
    },
    take: 20, // process up to 20 per run to stay within function timeout
  });

  const results: { id: string; status: "published" | "failed" | "skipped"; reason?: string }[] = [];

  for (const post of duePosts) {
    const profile = post.business.instagramProfile;

    if (!profile) {
      results.push({ id: post.id, status: "skipped", reason: "no_profile" });
      continue;
    }

    if (post.mediaUrls.length === 0) {
      await prisma.instagramPost.update({ where: { id: post.id }, data: { status: "FAILED" } });
      results.push({ id: post.id, status: "failed", reason: "no_media" });
      continue;
    }

    const { instagramId: igId, accessToken: token } = profile;
    const fullCaption = [
      post.caption ?? "",
      post.hashtags.length ? post.hashtags.map((h) => `#${h}`).join(" ") : "",
    ].filter(Boolean).join("\n\n");

    try {
      let containerId: string;

      if (post.mediaUrls.length === 1) {
        const url = post.mediaUrls[0];
        if (isVideoUrl(url)) {
          containerId = await createVideoContainer(igId, token, url, fullCaption);
          await waitForContainer(containerId, token);
        } else {
          containerId = await createImageContainer(igId, token, url, fullCaption);
        }
      } else {
        const childIds = await Promise.all(
          post.mediaUrls.map((url) =>
            createImageContainer(igId, token, url, fullCaption, true)
          )
        );
        containerId = await createCarouselContainer(igId, token, childIds, fullCaption);
      }

      const mediaId = await publishContainer(igId, token, containerId);

      await prisma.instagramPost.update({
        where: { id: post.id },
        data: {
          status:           "PUBLISHED",
          publishedAt:      new Date(),
          instagramMediaId: mediaId,
        },
      });

      results.push({ id: post.id, status: "published" });
    } catch (err) {
      console.error(`Failed to publish post ${post.id}:`, err);

      await prisma.instagramPost.update({
        where: { id: post.id },
        data: { status: "FAILED" },
      });

      results.push({
        id: post.id,
        status: "failed",
        reason: err instanceof Error ? err.message : "unknown",
      });
    }
  }

  return NextResponse.json({ processed: duePosts.length, results });
}
