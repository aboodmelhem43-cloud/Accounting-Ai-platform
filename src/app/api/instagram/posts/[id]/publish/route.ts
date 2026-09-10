import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createImageContainer,
  createVideoContainer,
  createCarouselContainer,
  waitForContainer,
  publishContainer,
  isVideoUrl,
  GraphError,
} from "@/lib/instagram-graph";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { id } = await params;

  // Load post with ownership check
  const post = await prisma.instagramPost.findFirst({
    where: { id, businessId: session.user.businessId },
  });
  if (!post) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (post.status === "PUBLISHED") {
    return NextResponse.json({ error: "already_published" }, { status: 400 });
  }

  if (post.mediaUrls.length === 0) {
    return NextResponse.json({ error: "وسائط مطلوبة للنشر" }, { status: 400 });
  }

  // Load connected IG profile
  const profile = await prisma.instagramProfile.findUnique({
    where: { businessId: session.user.businessId },
  });
  if (!profile) {
    return NextResponse.json({ error: "no_profile", message: "ربط حساب إنستغرام أولاً" }, { status: 400 });
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
        // Videos need processing time
        await waitForContainer(containerId, token);
      } else {
        containerId = await createImageContainer(igId, token, url, fullCaption);
      }
    } else {
      // Carousel — create a child container per image then a carousel container
      const childIds = await Promise.all(
        post.mediaUrls.map((url) =>
          createImageContainer(igId, token, url, fullCaption, true)
        )
      );
      containerId = await createCarouselContainer(igId, token, childIds, fullCaption);
    }

    const mediaId = await publishContainer(igId, token, containerId);

    await prisma.instagramPost.update({
      where: { id },
      data: {
        status:          "PUBLISHED",
        publishedAt:     new Date(),
        instagramMediaId: mediaId,
      },
    });

    return NextResponse.json({ ok: true, mediaId });
  } catch (err) {
    console.error("Instagram publish error:", err);

    // Mark post as FAILED
    await prisma.instagramPost.update({
      where: { id },
      data: { status: "FAILED" },
    });

    const message = err instanceof GraphError
      ? err.detail
      : "فشل النشر، حاول مجدداً";

    return NextResponse.json({ error: "publish_failed", message }, { status: 500 });
  }
}
