import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTrialWarningEmail, sendTrialExpiredEmail } from "@/lib/email";

// Vercel calls this daily at 08:00 UTC (configured in vercel.json).
// Secured with CRON_SECRET so only Vercel's scheduler can trigger it.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const now = new Date();

  // Window for "3 days left" warning: trial ends between 2 and 4 days from now
  const warningFrom = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  const warningTo   = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);

  // Window for "expired": trial ended in the last 25 hours
  const expiredFrom = new Date(now.getTime() - 25 * 60 * 60 * 1000);

  const [warningBusinesses, expiredBusinesses] = await Promise.all([
    prisma.business.findMany({
      where: { plan: "FREE_TRIAL", trialEndsAt: { gte: warningFrom, lte: warningTo } },
      select: { id: true, trialEndsAt: true, users: { where: { role: "OWNER" }, select: { email: true, name: true }, take: 1 } },
    }),
    prisma.business.findMany({
      where: { plan: "FREE_TRIAL", trialEndsAt: { gte: expiredFrom, lte: now } },
      select: { id: true, users: { where: { role: "OWNER" }, select: { email: true, name: true }, take: 1 } },
    }),
  ]);

  let warningSent = 0;
  let expiredSent = 0;

  for (const biz of warningBusinesses) {
    const owner = biz.users[0];
    if (!owner) continue;
    const daysLeft = biz.trialEndsAt
      ? Math.ceil((new Date(biz.trialEndsAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 3;
    await sendTrialWarningEmail({ email: owner.email, name: owner.name ?? owner.email, daysLeft }).catch(
      (e) => console.error(`[cron] warning email failed for ${owner.email}:`, e)
    );
    warningSent++;
  }

  for (const biz of expiredBusinesses) {
    const owner = biz.users[0];
    if (!owner) continue;
    await sendTrialExpiredEmail({ email: owner.email, name: owner.name ?? owner.email }).catch(
      (e) => console.error(`[cron] expired email failed for ${owner.email}:`, e)
    );
    expiredSent++;
  }

  console.log(`[cron/trial-reminders] warnings=${warningSent} expired=${expiredSent}`);
  return NextResponse.json({ ok: true, warningSent, expiredSent });
}
