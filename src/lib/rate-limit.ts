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

/** Extract the real client IP from Next.js request headers. */
export function getClientIp(req: Request): string {
  const forwarded = (req.headers as Headers).get("x-forwarded-for");
  return (forwarded?.split(",")[0] ?? "unknown").trim();
}
