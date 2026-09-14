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
    const entry = await prisma.rateLimitEntry.upsert({
      where: { key },
      create: { key, count: 1, resetAt: new Date(Date.now() + WINDOW_MS) },
      update: {
        count: {
          // If window has expired, reset; otherwise increment
          increment: 1,
        },
        resetAt: now,
      },
    });

    // If the stored resetAt is in the past, this window has expired — reset
    if (entry.resetAt < now) {
      await prisma.rateLimitEntry.update({
        where: { key },
        data: { count: 1, resetAt: new Date(Date.now() + WINDOW_MS) },
      });
      return false;
    }

    return entry.count > MAX_REQUESTS;
  } catch {
    // On DB error, fail open (don't block legitimate traffic)
    return false;
  }
}

/** Extract the real client IP from Next.js request headers. */
export function getClientIp(req: Request): string {
  const forwarded = (req.headers as Headers).get("x-forwarded-for");
  return (forwarded?.split(",")[0] ?? "unknown").trim();
}
