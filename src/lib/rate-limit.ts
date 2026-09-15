import { prisma } from "./prisma";

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 10;

/**
 * DB-backed IP rate limiter (survives serverless cold-starts).
 * Returns true when the limit is exceeded — caller should return 429.
 */
export async function isIpRateLimited(ip: string, action: string): Promise<boolean> {
  const key = `${action}:${ip}`;
  const now = new Date();

  try {
    const existing = await prisma.rateLimitEntry.findUnique({ where: { key } });

    if (!existing || existing.resetAt < now) {
      // Window expired or no entry — start a fresh window
      await prisma.rateLimitEntry.upsert({
        where: { key },
        create: { key, count: 1, resetAt: new Date(Date.now() + WINDOW_MS) },
        update: { count: 1, resetAt: new Date(Date.now() + WINDOW_MS) },
      });
      return false;
    }

    // Within the current window — increment
    const updated = await prisma.rateLimitEntry.update({
      where: { key },
      data: { count: { increment: 1 } },
    });

    return updated.count > MAX_REQUESTS;
  } catch {
    // On DB error, fail open (don't block legitimate traffic)
    return false;
  }
}

/** Extract the real client IP from Next.js request headers.
 *  Use x-real-ip first (set by Vercel/Nginx and not spoofable by the client),
 *  then fall back to the RIGHTMOST hop in x-forwarded-for (the last CDN-appended
 *  value), which is also not client-controlled. Never take the leftmost hop —
 *  that comes from the client itself and can be trivially spoofed.
 */
export function getClientIp(req: Request): string {
  const headers = req.headers as Headers;
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const hops = forwarded.split(",");
    return hops[hops.length - 1].trim();
  }
  return "unknown";
}
