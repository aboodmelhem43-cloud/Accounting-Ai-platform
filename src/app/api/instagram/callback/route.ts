import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  exchangeCodeForToken,
  getLongLivedToken,
  getUserPages,
  getIgAccountForPage,
  GraphError,
} from "@/lib/instagram-graph";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.redirect(new URL("/login", req.url));

  const { searchParams } = new URL(req.url);
  const code  = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(
      new URL("/instagram/connect?error=denied", req.url)
    );
  }

  // Validate state matches session's businessId
  let stateBusinessId: string;
  try {
    stateBusinessId = Buffer.from(state ?? "", "base64url").toString("utf-8");
  } catch {
    return NextResponse.redirect(new URL("/instagram/connect?error=state", req.url));
  }

  if (stateBusinessId !== session.user.businessId) {
    return NextResponse.redirect(new URL("/instagram/connect?error=state", req.url));
  }

  try {
    // 1. Short-lived token
    const { access_token: shortToken } = await exchangeCodeForToken(code);

    // 2. Long-lived token (60-day)
    const { access_token: longToken, expires_in } = await getLongLivedToken(shortToken);
    const expiresAt = new Date(Date.now() + expires_in * 1000);

    // 3. Find pages the user manages
    const pages = await getUserPages(longToken);
    if (pages.length === 0) {
      return NextResponse.redirect(
        new URL("/instagram/connect?error=no_pages", req.url)
      );
    }

    // 4. Find first page with a linked IG Business Account
    let igAccount: Awaited<ReturnType<typeof getIgAccountForPage>> = null;
    let linkedPage = pages[0];

    for (const page of pages) {
      const ig = await getIgAccountForPage(page.id, page.access_token);
      if (ig) { igAccount = ig; linkedPage = page; break; }
    }

    if (!igAccount) {
      return NextResponse.redirect(
        new URL("/instagram/connect?error=no_ig_account", req.url)
      );
    }

    // 5. Upsert profile
    await prisma.instagramProfile.upsert({
      where:  { businessId: session.user.businessId },
      create: {
        businessId:    session.user.businessId,
        instagramId:   igAccount.id,
        username:      igAccount.username,
        accessToken:   linkedPage.access_token, // page token for publishing
        tokenExpiresAt: expiresAt,
        profilePicUrl:  igAccount.profile_picture_url ?? null,
        followersCount: igAccount.followers_count ?? 0,
        pageId:         linkedPage.id,
      },
      update: {
        instagramId:    igAccount.id,
        username:       igAccount.username,
        accessToken:    linkedPage.access_token,
        tokenExpiresAt: expiresAt,
        profilePicUrl:  igAccount.profile_picture_url ?? null,
        followersCount: igAccount.followers_count ?? 0,
        pageId:         linkedPage.id,
      },
    });

    return NextResponse.redirect(
      new URL("/instagram/connect?success=1", req.url)
    );
  } catch (err) {
    console.error("Instagram OAuth error:", err);
    const code = err instanceof GraphError ? err.code : "unknown";
    return NextResponse.redirect(
      new URL(`/instagram/connect?error=${code}`, req.url)
    );
  }
}
