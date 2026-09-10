// Meta Graph API v20 helpers for Instagram Business publishing

const GRAPH = "https://graph.facebook.com/v20.0";
const APP_ID     = process.env.FACEBOOK_APP_ID!;
const APP_SECRET = process.env.FACEBOOK_APP_SECRET!;
const REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI!;

export const REQUIRED_SCOPES = [
  "instagram_basic",
  "instagram_content_publish",
  "pages_show_list",
  "pages_read_engagement",
].join(",");

/* ---- OAuth ---- */

export function buildOAuthURL(state: string): string {
  const p = new URLSearchParams({
    client_id:    APP_ID,
    redirect_uri: REDIRECT_URI,
    scope:        REQUIRED_SCOPES,
    response_type: "code",
    state,
  });
  return `https://www.facebook.com/v20.0/dialog/oauth?${p}`;
}

export async function exchangeCodeForToken(code: string): Promise<{
  access_token: string;
  token_type: string;
}> {
  const p = new URLSearchParams({
    client_id:     APP_ID,
    client_secret: APP_SECRET,
    redirect_uri:  REDIRECT_URI,
    code,
  });
  const res = await fetch(`${GRAPH}/oauth/access_token?${p}`);
  if (!res.ok) throw new GraphError("token_exchange", await res.text());
  return res.json() as Promise<{ access_token: string; token_type: string }>;
}

export async function getLongLivedToken(shortToken: string): Promise<{
  access_token: string;
  expires_in: number;
}> {
  const p = new URLSearchParams({
    grant_type:        "fb_exchange_token",
    client_id:         APP_ID,
    client_secret:     APP_SECRET,
    fb_exchange_token: shortToken,
  });
  const res = await fetch(`${GRAPH}/oauth/access_token?${p}`);
  if (!res.ok) throw new GraphError("long_lived_token", await res.text());
  return res.json() as Promise<{ access_token: string; expires_in: number }>;
}

/* ---- Page / IG Account Discovery ---- */

interface FbPage {
  id:           string;
  name:         string;
  access_token: string;
}

export async function getUserPages(userToken: string): Promise<FbPage[]> {
  const res = await fetch(
    `${GRAPH}/me/accounts?fields=id,name,access_token&access_token=${userToken}`
  );
  if (!res.ok) throw new GraphError("get_pages", await res.text());
  const data = await res.json() as { data: FbPage[] };
  return data.data ?? [];
}

export async function getIgAccountForPage(
  pageId:      string,
  pageToken:   string,
): Promise<{ id: string; username: string; profile_picture_url?: string; followers_count?: number } | null> {
  const res = await fetch(
    `${GRAPH}/${pageId}?fields=instagram_business_account{id,username,profile_picture_url,followers_count}&access_token=${pageToken}`
  );
  if (!res.ok) return null;
  const data = await res.json() as { instagram_business_account?: { id: string; username: string; profile_picture_url?: string; followers_count?: number } };
  return data.instagram_business_account ?? null;
}

/* ---- Publishing ---- */

// Single image
export async function createImageContainer(
  igUserId:    string,
  token:       string,
  imageUrl:    string,
  caption:     string,
  isCarousel?: boolean,
): Promise<string> {
  const body: Record<string, string> = {
    image_url:    imageUrl,
    caption:      isCarousel ? "" : caption,
    access_token: token,
  };
  if (isCarousel) body.is_carousel_item = "true";

  const res = await fetch(`${GRAPH}/${igUserId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new GraphError("create_image_container", await res.text());
  const data = await res.json() as { id: string };
  return data.id;
}

// Single video
export async function createVideoContainer(
  igUserId:  string,
  token:     string,
  videoUrl:  string,
  caption:   string,
): Promise<string> {
  const res = await fetch(`${GRAPH}/${igUserId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      media_type:   "REELS",
      video_url:    videoUrl,
      caption,
      access_token: token,
    }),
  });
  if (!res.ok) throw new GraphError("create_video_container", await res.text());
  const data = await res.json() as { id: string };
  return data.id;
}

// Carousel
export async function createCarouselContainer(
  igUserId:    string,
  token:       string,
  childrenIds: string[],
  caption:     string,
): Promise<string> {
  const res = await fetch(`${GRAPH}/${igUserId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      media_type:   "CAROUSEL",
      children:     childrenIds.join(","),
      caption,
      access_token: token,
    }),
  });
  if (!res.ok) throw new GraphError("create_carousel_container", await res.text());
  const data = await res.json() as { id: string };
  return data.id;
}

// Wait for container to be ready (video containers need processing time)
export async function waitForContainer(
  containerId: string,
  token:       string,
  maxRetries   = 12,
  delayMs      = 5000,
): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    const res = await fetch(
      `${GRAPH}/${containerId}?fields=status_code&access_token=${token}`
    );
    if (res.ok) {
      const data = await res.json() as { status_code?: string };
      if (data.status_code === "FINISHED") return;
      if (data.status_code === "ERROR") throw new GraphError("container_error", "Container processing failed");
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }
  throw new GraphError("container_timeout", "Container not ready after retries");
}

// Publish a ready container
export async function publishContainer(
  igUserId:    string,
  token:       string,
  containerId: string,
): Promise<string> {
  const res = await fetch(`${GRAPH}/${igUserId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: containerId, access_token: token }),
  });
  if (!res.ok) throw new GraphError("publish", await res.text());
  const data = await res.json() as { id: string };
  return data.id;
}

/* ---- Insights ---- */

const INSIGHT_METRICS = ["engagement", "impressions", "reach", "saved", "video_views"].join(",");

export interface PostInsights {
  engagement:   number;
  impressions:  number;
  reach:        number;
  saved:        number;
  video_views?: number;
}

export async function fetchMediaInsights(
  mediaId: string,
  token:   string,
): Promise<PostInsights> {
  const res = await fetch(
    `${GRAPH}/${mediaId}/insights?metric=${INSIGHT_METRICS}&access_token=${token}`
  );
  if (!res.ok) throw new GraphError("insights", await res.text());
  const data = await res.json() as { data: { name: string; values: { value: number }[] }[] };
  const out: Record<string, number> = {};
  for (const m of data.data) {
    out[m.name] = m.values?.[0]?.value ?? 0;
  }
  return out as unknown as PostInsights;
}

/* ---- Helpers ---- */

export class GraphError extends Error {
  constructor(public code: string, public detail: string) {
    super(`Graph API error [${code}]: ${detail}`);
  }
}

export function isVideoUrl(url: string): boolean {
  return url.toLowerCase().endsWith(".mp4");
}
